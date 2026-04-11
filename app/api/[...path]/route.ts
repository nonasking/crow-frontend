import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

// 토큰 없이 호출해야 하는 엔드포인트만 제외
const NO_AUTH_PATHS = ["auth/login/"];

async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const { path } = await params;
  const subPath = path.join("/");
  const backendUrl = `${BACKEND_URL}/${subPath}/${query ? `?${query}` : ""}`;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const skipAuth = NO_AUTH_PATHS.some((p) => subPath.startsWith(p));
  if (accessToken && !skipAuth) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(backendUrl, {
      method: request.method,
      headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.text()
          : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({
        error: `Backend error: ${res.status}`,
      }));
      return NextResponse.json(errorBody, { status: res.status });
    }

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;