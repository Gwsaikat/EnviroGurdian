import { NextResponse } from "next/server";

// Store tokens in memory for demo purposes
// In production, these would be stored in a database
const deviceTokens = new Set<string>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Case 1: Token registration
    if (body.token && !body.title) {
      deviceTokens.add(body.token);
      console.log(`Registered device token: ${body.token.substring(0, 10)}...`);
      console.log(`Total registered devices: ${deviceTokens.size}`);
      return NextResponse.json({ success: true, message: "Device token registered successfully." });
    }
    
    // Case 2: Send notification
    const { token, title = "EnviroGuardian Alert!", body: notificationBody = "This is a test notification.", type = "info" } = body;
    
    if (token) {
      // Send to a specific device
      console.log(`Sending notification to device: ${token.substring(0, 10)}...`);
      // In production, this would call the Firebase Admin SDK
      // For demo, we simulate success
      return NextResponse.json({ success: true, message: "Notification sent to specific device (simulated)." });
    } else if (deviceTokens.size > 0) {
      // Send to all registered devices
      console.log(`Sending notification to ${deviceTokens.size} devices`);
      // In production, this would call the Firebase Admin SDK
      // For demo, we simulate success
      return NextResponse.json({ 
        success: true, 
        message: `Notification sent to ${deviceTokens.size} devices (simulated).`,
        recipients: deviceTokens.size
      });
    } else {
      return NextResponse.json({ error: "No registered devices found." }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in notification API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}