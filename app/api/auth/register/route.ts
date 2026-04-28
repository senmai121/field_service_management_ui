import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const upstream = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const response = NextResponse.json({ user: data.user }, { status: 200 });

  response.cookies.set("fsm_token", data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
  });

  return response;
}
