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
  // Create missed call record
  const missedCall = await storage.createMissedCall({
    userId,
    callerNumber: callData.from,
    callerName: callData.callerName || null,
    timestamp: new Date(),
    responded: false,
  });

  // Get user's Twilio settings
  const user = await storage.getUser(userId);
  if (!user?.autoResponseMessage) {
    console.log(`No auto-response message set for user ${userId}`);
    return missedCall;
  }

  try {
    // Send auto-response SMS
    await twilioClient.messages.create({
      body: user.autoResponseMessage,
      to: callData.from,
      from: user.twilioPhoneNumber!,
    });

    // Update missed call record to mark as responded
    const updatedCall = await storage.updateMissedCall(missedCall.id, {
      responded: true,
    });

    return updatedCall;
  } catch (error) {
    console.error("Error sending auto-response SMS:", error);
    return missedCall;
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