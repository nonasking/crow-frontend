import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const { path } = await params;
  const subPath = path.join("/");

  const backendUrl = `${BACKEND_URL}/${subPath}/${query ? `?${query}` : ""}`;

  try {
    const res = await fetch(backendUrl, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.text()
          : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend error: ${res.status}` },
        { status: res.status }
      );
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