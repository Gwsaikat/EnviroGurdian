import { NextResponse } from "next/server";

export async function GET() {
  // Mock forecast data
  const forecast = [
    { date: "2024-06-08", aqi: 110 },
    { date: "2024-06-09", aqi: 130 },
    { date: "2024-06-10", aqi: 95 },
  ];
  return NextResponse.json({ forecast });
} 