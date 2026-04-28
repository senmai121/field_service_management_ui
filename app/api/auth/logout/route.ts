import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("fsm_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("fsm_last_active", "", { sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
