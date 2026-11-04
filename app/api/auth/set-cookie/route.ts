import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "@/lib/authCookies";

export async function POST(request: Request) {
  const { access_token, refresh_token } = await request.json();
  const cookieStore = await cookies();

  cookieStore.set("access_token", access_token, ACCESS_COOKIE_OPTIONS);
  cookieStore.set("refresh_token", refresh_token, REFRESH_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true });
}