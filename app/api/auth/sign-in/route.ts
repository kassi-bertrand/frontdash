import { NextResponse } from "next/server";

type SignInBody = { username?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SignInBody;
    const username = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    let role: "admin" | "staff" | null = null;
    if (username === "admin" && password === "Password1") role = "admin";
    else if (username === "staff" && password === "Temp1234") role = "staff";

    if (!role) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    const redirect = role === "admin" ? "/admin/dashboard" : "/staff";
    const user = { role, username, email: `${username}@frontdash.app`, name: role === "admin" ? "Admin User" : "Staff User" };
    const token = `demo-${role}-token`;

    const res = NextResponse.json({ success: true, role, user, token, redirect });
    // Client-visible cookie for demo middleware/guards (BetterAuth will use httpOnly)
    res.cookies.set("fd_role", role, { path: "/", httpOnly: false });
    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Sign-in failed" }, { status: 500 });
  }
}