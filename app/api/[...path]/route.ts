import { cookies } from "next/headers";
import { ACCESS_COOKIE_OPTIONS } from "@/lib/authCookies";
import { DEFAULT_BACKEND_URL, proxyToBackend } from "@/lib/proxy";

const BACKEND_URL = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;

async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const subPath = path.join("/");

  // HttpOnly 쿠키에서 토큰을 읽어 서버 사이드에서만 주입한다.
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  return proxyToBackend(request, subPath, accessToken, BACKEND_URL, {
    refreshToken,
    // access가 만료돼 갱신했으면 쿠키도 새 값으로 바꾼다 (set-cookie 라우트와 같은 옵션).
    onRefreshed: (access) =>
      cookieStore.set("access_token", access, ACCESS_COOKIE_OPTIONS),
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
