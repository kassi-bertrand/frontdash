import { NextResponse } from "next/server";

type SignInBody = { username?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SignInBody;
    const username = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const ok = (username === "staff" || username === "staff@frontdash.app" || username === "staff@example.com") && password === "Temp1234";
    if (!ok) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    const role = "staff" as const;
    const user = {
      role,
      username,
      email: username.includes("@") ? username : `${username}@frontdash.app`,
      name: "Staff User",
    };
    const token = "demo-staff-token";
    const redirect = "/staff";

    const res = NextResponse.json({ success: true, role, user, token, redirect });
    res.cookies.set("fd_role", role, { path: "/", httpOnly: false });

    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Sign-in failed" }, { status: 500 });
  }
}