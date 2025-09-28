import { NextResponse } from "next/server";

type SignInBody = { username?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SignInBody;
    const username = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    // TEMP DEMO accounts — replace with real auth later:
    // Admin: admin / Password1
    // Staff: staff / Temp1234
    let role: "admin" | "staff" | null = null;

    if (username === "admin" && password === "Password1") role = "admin";
    else if (username === "staff" && password === "Temp1234") role = "staff";

    if (!role) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    return NextResponse.json({ success: true, role });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Sign-in failed" }, { status: 500 });
  }
}