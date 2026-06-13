import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"];

async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  for (const name of COOKIE_NAMES) {
    const value = store.get(name)?.value;
    if (value) return value;
  }
  return null;
}

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado" } },
      { status: 401 },
    );
  }

  const { path } = await params;
  const url = new URL(
    `/api/v1/${path.join("/")}${req.nextUrl.search}`,
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL,
  );
  const hasBody = !["GET", "HEAD", "DELETE"].includes(req.method);

  const res = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { "content-type": req.headers.get("content-type") ?? "application/json" } : {}),
    },
    body: hasBody ? await req.text() : undefined,
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
