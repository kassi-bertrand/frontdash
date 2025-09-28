import { NextResponse } from "next/server";

export async function POST() {
  // If you set cookies/sessions, clear them here.
  return NextResponse.json({ success: true });
}