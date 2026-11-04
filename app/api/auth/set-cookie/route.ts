import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "@/lib/authCookies";
import { isJsonRequest } from "@/lib/proxy";

export async function POST(request: Request) {
  // 로그인 CSRF 방지: 다른 사이트의 폼 제출(text/plain 등)은 받지 않는다.
  if (!isJsonRequest(request)) {
    return NextResponse.json({ error: "application/json only" }, { status: 415 });
  }
  const { access_token, refresh_token } = await request.json();
  const cookieStore = await cookies();

  cookieStore.set("access_token", access_token, ACCESS_COOKIE_OPTIONS);
  cookieStore.set("refresh_token", refresh_token, REFRESH_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true });
}