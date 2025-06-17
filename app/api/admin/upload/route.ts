import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // In production, parse multipart/form-data and process CSV
  // Here, just simulate success
  return NextResponse.json({ success: true, message: "CSV uploaded (mocked)." });
} 