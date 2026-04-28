import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

// Silent wake-up call for Render free tier — no auth required
export async function GET() {
  try {
    await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(10000) });
  } catch {
    // Intentionally silent — this is best-effort only
  }
  return NextResponse.json({ ok: true });
}
