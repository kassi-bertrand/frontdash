import { NextResponse } from "next/server";

type SignInBody = { username?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SignInBody;
    const username = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const ok = username === "admin" && password === "Password1";
    if (!ok) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    return NextResponse.json({ success: true, role: "admin" as const });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : "Sign-in failed" }, { status: 500 });
  }
}