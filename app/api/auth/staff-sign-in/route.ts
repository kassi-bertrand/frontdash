import { NextResponse } from "next/server";

type SignInBody = { username?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SignInBody;
    const username = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const ok = username === "staff" && password === "Temp1234";
    if (!ok) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    return NextResponse.json({ success: true, role: "staff" as const });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Sign-in failed" }, { status: 500 });
  }
}