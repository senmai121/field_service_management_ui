import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8080";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

type Params = { path: string[] };

function clearSessionResponse(status = 401) {
  const res = NextResponse.json({ error: "Session expired" }, { status });
  res.cookies.set("fsm_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("fsm_last_active", "", { maxAge: 0, path: "/" });
  return res;
}

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const token = req.cookies.get("fsm_token")?.value;
  if (!token) return clearSessionResponse();

  // Inactivity check — expire session if no activity for 2 hours
  const lastActive = req.cookies.get("fsm_last_active")?.value;
  if (!lastActive || Date.now() - Number(lastActive) > TWO_HOURS_MS) {
    return clearSessionResponse();
  }

  const { path } = await params;
  const upstreamPath = path.join("/");
  const search = req.nextUrl.search;
  const upstreamUrl = `${API_URL}/${upstreamPath}${search}`;

  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.delete("host");

  const body =
    req.method === "GET" || req.method === "HEAD" ? undefined : req.body;

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers,
    body,
    // @ts-expect-error — needed for streaming body
    duplex: "half",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-encoding"); // body already decoded by fetch()

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  // Refresh inactivity timer on every successful request (session cookie — no maxAge)
  response.cookies.set("fsm_last_active", String(Date.now()), {
    sameSite: "lax",
    path: "/",
  });

  return response;
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
