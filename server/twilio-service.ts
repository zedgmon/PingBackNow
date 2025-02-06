import twilio from "twilio";
import { storage } from "./storage";
import { MissedCall } from "@shared/schema";

// Initialize Twilio client with environment variables
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function handleMissedCall(
  userId: number,
  callData: {
    from: string;
    to: string;
    callerName?: string;
  }
): Promise<MissedCall> {
  console.log("Handling missed call for user:", userId, "call data:", callData);

  try {
    // Create missed call record
    const missedCall = await storage.createMissedCall({
      userId,
      callerNumber: callData.from,
      callerName: callData.callerName || null,
      timestamp: new Date(),
      responded: false,
    });

    console.log("Created missed call record:", missedCall);

    // Get user's Twilio settings
    const user = await storage.getUser(userId);
    if (!user?.autoResponseMessage || !user.twilioPhoneNumber || !user.twilioAccountSid || !user.twilioAuthToken) {
      console.log("User missing required Twilio settings:", userId);
      return missedCall;
    }

    try {
      // Send auto-response SMS
      const message = await twilioClient.messages.create({
        body: user.autoResponseMessage,
        to: callData.from,
        from: user.twilioPhoneNumber,
      });

      console.log("Sent auto-response message:", message.sid);

      // Update missed call record to mark as responded
      const updatedCall = await storage.updateMissedCall(missedCall.id, {
        responded: true,
      });

      return updatedCall;
    } catch (error) {
      console.error("Error sending auto-response SMS:", error);
      return missedCall;
    }
  } catch (error) {
    console.error("Error handling missed call:", error);
    throw error;
  }
}

export async function sendScheduledMessage(
  userId: number,
  messageId: number
): Promise<boolean> {
  try {
    const message = await storage.getScheduledMessage(messageId);
    if (!message || message.userId !== userId || message.sent) {
      return false;
    }

    const user = await storage.getUser(userId);
    if (!user?.twilioPhoneNumber) {
      return false;
    }

    await twilioClient.messages.create({
      body: message.message,
      to: message.recipientNumber,
      from: user.twilioPhoneNumber,
    });

    await storage.updateScheduledMessage(messageId, { sent: true });
    return true;
  } catch (error) {
    console.error("Error sending scheduled message:", error);
    return false;
  }
}