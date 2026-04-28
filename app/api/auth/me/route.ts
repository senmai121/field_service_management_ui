import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("fsm_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    // JWT format: header.payload.signature — base64url decode the payload
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT");

    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      "="
    );
    const payloadJson = Buffer.from(padded, "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    return NextResponse.json({
      id: payload.id ?? payload.sub,
      email: payload.email,
      username: payload.username,
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
