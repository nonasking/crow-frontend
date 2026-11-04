/**
 * 카탈올(catch-all) API 프록시의 순수 로직.
 * `app/api/[...path]/route.ts`에서 사용하며, 라우트 핸들러는 이 함수들의 얇은 래퍼다.
 */

/** 토큰 없이 호출해야 하는 엔드포인트만 제외 */
export const NO_AUTH_PATHS = ["auth/login/", "auth/refresh/"];

/** access 갱신에 쓰는 백엔드 경로 */
export const REFRESH_PATH = "auth/refresh";

export const DEFAULT_BACKEND_URL = "http://localhost:8000";

/**
 * NO_AUTH_PATHS에 해당하면 Authorization 헤더를 붙이지 않는다.
 * 라우트가 넘겨주는 subPath는 세그먼트를 join한 값이라 끝에 슬래시가 없다("auth/login").
 * NO_AUTH_PATHS는 슬래시로 끝나므로, 비교 전에 슬래시를 붙여 정규화한다.
 */
export function shouldSkipAuth(subPath: string): boolean {
  const normalized = subPath.endsWith("/") ? subPath : `${subPath}/`;
  return NO_AUTH_PATHS.some((p) => normalized.startsWith(p));
}

/** 백엔드로 보낼 URL을 만든다. DRF 규약에 맞춰 항상 끝에 슬래시를 붙인다. */
export function buildBackendUrl(
  backendUrl: string,
  subPath: string,
  query: string
): string {
  return `${backendUrl}/${subPath}/${query ? `?${query}` : ""}`;
}

/**
 * 프록시가 백엔드로 보낼 헤더.
 * 쿠키에 access_token이 있고 인증 제외 경로가 아닐 때만 Bearer 토큰을 주입한다.
 */
export function buildProxyHeaders(
  subPath: string,
  accessToken?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken && !shouldSkipAuth(subPath)) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

export type RefreshOptions = {
  /** 쿠키에 있는 refresh 토큰 */
  refreshToken?: string;
  /** 새 access를 받았을 때 호출 (라우트가 쿠키를 갱신한다) */
  onRefreshed?: (access: string) => void;
  /** refresh 토큰으로도 갱신하지 못했을 때 호출 (만료·로그아웃된 토큰이므로 라우트가 쿠키를 지운다) */
  onRefreshFailed?: () => void;
};

/** 로그아웃: refresh 토큰을 백엔드 blacklist에 넣는다. 실패해도 쿠키 삭제는 진행해야 하므로 예외를 삼킨다. */
export async function revokeRefreshToken(
  backendUrl: string,
  refreshToken: string
): Promise<boolean> {
  try {
    const res = await fetch(buildBackendUrl(backendUrl, "auth/logout", ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 토큰을 쿠키에 심는 라우트는 JSON 요청만 받는다.
 * 다른 사이트의 폼은 text/plain 등으로만 보낼 수 있고(application/json은 CORS
 * preflight가 필요해 막힌다), 그대로 받으면 공격자 계정의 토큰이 심어지는 로그인 CSRF가 된다.
 */
export function isJsonRequest(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return type.split(";")[0].trim().toLowerCase() === "application/json";
}

/**
 * refresh 토큰으로 새 access를 받는다. 실패하면 null.
 * 백엔드: POST /auth/refresh/ {"refresh"} → {"access"}
 */
export async function refreshAccessToken(
  backendUrl: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const res = await fetch(buildBackendUrl(backendUrl, REFRESH_PATH, ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.access === "string" ? data.access : null;
  } catch {
    return null;
  }
}

/**
 * 요청을 백엔드로 전달하고 응답을 그대로 돌려준다.
 * 백엔드가 401이고 refresh 토큰이 있으면, access를 한 번 갱신해 같은 요청을 다시 보낸다.
 * (access는 24시간, refresh는 7일이라 갱신 없이는 하루마다 로그인이 풀린다)
 * 백엔드에 닿지 못하면 502로 응답한다.
 */
export async function proxyToBackend(
  request: Request,
  subPath: string,
  accessToken?: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
  { refreshToken, onRefreshed, onRefreshFailed }: RefreshOptions = {}
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = buildBackendUrl(
    backendUrl,
    subPath,
    searchParams.toString()
  );

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    // 재시도할 때 다시 보내야 하므로 본문은 한 번만 읽어 둔다.
    // (클라이언트가 본문 전송 중 끊으면 여기서 실패한다 → 아래 catch에서 502)
    const body = hasBody ? await request.text() : undefined;
    const send = (token?: string) =>
      fetch(target, {
        method: request.method,
        headers: buildProxyHeaders(subPath, token),
        body,
        cache: "no-store",
      });

    let res = await send(accessToken);

    if (res.status === 401 && refreshToken && !shouldSkipAuth(subPath)) {
      const fresh = await refreshAccessToken(backendUrl, refreshToken);
      if (fresh) {
        onRefreshed?.(fresh);
        res = await send(fresh);
      } else {
        onRefreshFailed?.();
      }
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({
        error: `Backend error: ${res.status}`,
      }));
      return Response.json(errorBody, { status: res.status });
    }

    if (res.status === 204) {
      return new Response(null, { status: 204 });
    }

    return Response.json(await res.json());
  } catch {
    return Response.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
