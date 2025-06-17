import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { feedback, email } = await req.json();
  if (!feedback) {
    return NextResponse.json({ error: "Feedback is required." }, { status: 400 });
  }
  // In production, store feedback in DB or send to email/Slack
  return NextResponse.json({ success: true });
} 