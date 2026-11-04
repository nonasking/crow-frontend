import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEFAULT_BACKEND_URL, revokeRefreshToken } from "@/lib/proxy";

const BACKEND_URL = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;

/**
 * 로그아웃: refresh 토큰을 백엔드에서 무효화(blacklist)한 뒤 쿠키를 지운다.
 * refresh 쿠키는 HttpOnly라 브라우저 코드가 백엔드에 직접 보낼 수 없으므로 여기서 처리한다.
 * 무효화에 실패해도(백엔드 장애 등) 쿠키는 지운다.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (refreshToken) {
    await revokeRefreshToken(BACKEND_URL, refreshToken);
  }
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  return NextResponse.json({ ok: true });
}
