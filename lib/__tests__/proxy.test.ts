import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildBackendUrl,
  buildProxyHeaders,
  proxyToBackend,
  shouldSkipAuth,
} from "@/lib/proxy";

const BACKEND = "http://backend:8000";

describe("shouldSkipAuth", () => {
  it("로그인 엔드포인트는 인증을 건너뛴다", () => {
    expect(shouldSkipAuth("auth/login/")).toBe(true);
  });

  it("라우트가 넘기는 형태(끝 슬래시 없음)도 인식한다", () => {
    // path.join("/") 결과에는 끝 슬래시가 없다 — 정규화가 없으면 허용 목록이 무력화된다
    expect(shouldSkipAuth("auth/login")).toBe(true);
  });

  it("허용 목록 접두사로 시작하면 건너뛴다", () => {
    expect(shouldSkipAuth("auth/login/refresh/")).toBe(true);
  });

  it("그 외 경로는 인증이 필요하다", () => {
    expect(shouldSkipAuth("expenses/expenses/")).toBe(false);
    expect(shouldSkipAuth("auth/me/")).toBe(false);
    // 접두사 일치이므로 중간에 끼어 있는 경로는 제외되지 않는다
    expect(shouldSkipAuth("expenses/auth/login/")).toBe(false);
  });
});

describe("buildBackendUrl", () => {
  it("항상 끝에 슬래시를 붙인다", () => {
    expect(buildBackendUrl(BACKEND, "expenses/expenses", "")).toBe(
      "http://backend:8000/expenses/expenses/"
    );
  });

  it("쿼리스트링이 있으면 뒤에 붙인다", () => {
    expect(buildBackendUrl(BACKEND, "expenses/expenses", "page=2&ordering=-spent_at")).toBe(
      "http://backend:8000/expenses/expenses/?page=2&ordering=-spent_at"
    );
  });
});

describe("buildProxyHeaders", () => {
  it("토큰이 있으면 Bearer로 주입한다", () => {
    expect(buildProxyHeaders("expenses/expenses/", "tok123")).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer tok123",
    });
  });

  it("토큰이 없으면 Authorization을 붙이지 않는다", () => {
    expect(buildProxyHeaders("expenses/expenses/", undefined)).toEqual({
      "Content-Type": "application/json",
    });
  });

  it("인증 제외 경로에는 토큰이 있어도 붙이지 않는다", () => {
    expect(buildProxyHeaders("auth/login/", "tok123")).toEqual({
      "Content-Type": "application/json",
    });
  });
});

describe("proxyToBackend", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(impl: typeof fetch) {
    const spy = vi.fn(impl);
    vi.stubGlobal("fetch", spy);
    return spy;
  }

  it("쿼리를 보존한 URL과 Bearer 헤더로 백엔드를 호출한다", async () => {
    const spy = stubFetch(async () => Response.json({ count: 0 }));

    const req = new Request("http://localhost:3000/api/expenses/expenses/?page=2");
    const res = await proxyToBackend(req, "expenses/expenses", "tok123", BACKEND);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ count: 0 });

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("http://backend:8000/expenses/expenses/?page=2");
    expect(init?.method).toBe("GET");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer tok123" });
    expect(init?.body).toBeUndefined();
  });

  it("로그인 요청은 토큰이 있어도 Authorization 없이 본문과 함께 전달한다", async () => {
    const spy = stubFetch(async () => Response.json({ access: "a" }));

    const req = new Request("http://localhost:3000/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username: "crow", password: "pw" }),
    });
    await proxyToBackend(req, "auth/login", "tok123", BACKEND);

    const [, init] = spy.mock.calls[0];
    expect(init?.headers).not.toHaveProperty("Authorization");
    expect(init?.body).toBe('{"username":"crow","password":"pw"}');
  });

  it("백엔드 에러는 상태 코드와 본문을 그대로 전달한다", async () => {
    stubFetch(async () => Response.json({ detail: "Not found." }, { status: 404 }));

    const req = new Request("http://localhost:3000/api/expenses/expenses/999/");
    const res = await proxyToBackend(req, "expenses/expenses/999", "tok", BACKEND);

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ detail: "Not found." });
  });

  it("본문이 JSON이 아닌 에러 응답은 대체 메시지로 감싼다", async () => {
    stubFetch(async () => new Response("<html>boom</html>", { status: 500 }));

    const req = new Request("http://localhost:3000/api/expenses/expenses/");
    const res = await proxyToBackend(req, "expenses/expenses", "tok", BACKEND);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Backend error: 500" });
  });

  it("204는 본문 없이 그대로 돌려준다", async () => {
    stubFetch(async () => new Response(null, { status: 204 }));

    const req = new Request("http://localhost:3000/api/expenses/expenses/1/", {
      method: "DELETE",
    });
    const res = await proxyToBackend(req, "expenses/expenses/1", "tok", BACKEND);

    expect(res.status).toBe(204);
    await expect(res.text()).resolves.toBe("");
  });

  it("백엔드에 닿지 못하면 502로 응답한다", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });

    const req = new Request("http://localhost:3000/api/expenses/expenses/");
    const res = await proxyToBackend(req, "expenses/expenses", "tok", BACKEND);

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "Backend unreachable" });
  });
});
