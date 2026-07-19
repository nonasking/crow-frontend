/**
 * 카탈올(catch-all) API 프록시의 순수 로직.
 * `app/api/[...path]/route.ts`에서 사용하며, 라우트 핸들러는 이 함수들의 얇은 래퍼다.
 */

/** 토큰 없이 호출해야 하는 엔드포인트만 제외 */
export const NO_AUTH_PATHS = ["auth/login/"];

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

/**
 * 요청을 백엔드로 전달하고 응답을 그대로 돌려준다.
 * 백엔드에 닿지 못하면 502로 응답한다.
 */
export async function proxyToBackend(
  request: Request,
  subPath: string,
  accessToken?: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = buildBackendUrl(
    backendUrl,
    subPath,
    searchParams.toString()
  );

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const res = await fetch(target, {
      method: request.method,
      headers: buildProxyHeaders(subPath, accessToken),
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    });

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
