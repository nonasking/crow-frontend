import { cookies } from "next/headers";
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

  return proxyToBackend(request, subPath, accessToken, BACKEND_URL);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
