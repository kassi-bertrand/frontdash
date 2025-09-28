import { NextResponse } from "next/server";

type SignInBody = { username?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SignInBody;
    const username = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    // TEMP STUB LOGIC (replace with real auth later):
    // Accept two demo users for now and assign roles.
    // Admin demo: admin / Password1
    // Staff demo: staff / Temp1234
    let role: "admin" | "staff" | null = null;

    if (username === "admin" && password === "Password1") {
      role = "admin";
    } else if (username === "staff" && password === "Temp1234") {
      role = "staff";
    }

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Minimal success payload used by the login page to route correctly
    return NextResponse.json({ success: true, role });
  } catch (e: unknown) {
    const message =
      typeof e === "object" && e !== null && "message" in e
        ? (e as { message?: string }).message
        : "Sign-in failed";
    return NextResponse.json(
      { success: false, message: message || "Sign-in failed" },
      { status: 500 }
    );
  }
}