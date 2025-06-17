import { NextResponse } from "next/server";

export async function GET() {
  // Mock data: last 7 days AQI
  const data = [
    { date: "2024-06-01", aqi: 80 },
    { date: "2024-06-02", aqi: 120 },
    { date: "2024-06-03", aqi: 150 },
    { date: "2024-06-04", aqi: 200 },
    { date: "2024-06-05", aqi: 170 },
    { date: "2024-06-06", aqi: 90 },
    { date: "2024-06-07", aqi: 60 },
  ];
  return NextResponse.json({ data });
} 