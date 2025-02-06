import twilio from "twilio";
import { storage } from "./storage";
import { MissedCall } from "@shared/schema";

// Initialize Twilio client with environment variables for central account
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Central Twilio phone number for sending messages
const CENTRAL_TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

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

    // Get user's settings
    const user = await storage.getUser(userId);
    if (!user?.autoResponseMessage) {
      console.log("User has no auto-response message configured:", userId);
      return missedCall;
    }

    try {
      // Send auto-response SMS using central Twilio account
      const message = await twilioClient.messages.create({
        body: user.autoResponseMessage,
        to: callData.from,
        from: CENTRAL_TWILIO_NUMBER,
      });

      console.log("Sent auto-response message:", message.sid);

      // Track message usage for billing
      await storage.trackMessageUsage({
        userId,
        messageId: message.sid,
        direction: 'outbound',
        timestamp: new Date(),
        status: 'sent'
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
    if (!user) {
      return false;
    }

    const twilioMessage = await twilioClient.messages.create({
      body: message.message,
      to: message.recipientNumber,
      from: CENTRAL_TWILIO_NUMBER,
    });

    // Track message usage for billing
    await storage.trackMessageUsage({
      userId,
      messageId: twilioMessage.sid,
      direction: 'outbound',
      timestamp: new Date(),
      status: 'sent'
    });

    await storage.updateScheduledMessage(messageId, { sent: true });
    return true;
  } catch (error) {
    console.error("Error sending scheduled message:", error);
    return false;
  }
}