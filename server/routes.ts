import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLeadSchema, insertScheduledMessageSchema } from "@shared/schema";
import { handleMissedCall } from "./twilio-service";
import { z } from "zod";
import { initGoogleSheetsService } from './google-sheets-service';
import twilio from 'twilio'; // Assuming this import is handled elsewhere

export function registerRoutes(app: Express): Server {
  // Initialize Google Sheets service with credentials
  if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
      initGoogleSheetsService(credentials);
      console.log('Google Sheets service initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Sheets service:', error);
    }
  }

  setupAuth(app);

  // Add the check balance middleware
  app.use(async (req, res, next) => {
    if (!req.isAuthenticated()) return next();

    const user = await storage.getUser(req.user.id);
    if (!user) return next();

    const LOW_BALANCE_THRESHOLD = 10; // $10
    const CRITICAL_BALANCE_THRESHOLD = 5; // $5

    // Only check once per day
    const shouldCheckBalance = !user.lastBalanceNotificationAt || 
      (new Date().getTime() - new Date(user.lastBalanceNotificationAt).getTime()) > 24 * 60 * 60 * 1000;

    if (shouldCheckBalance && user.creditBalance !== null) {
      const balance = parseFloat(user.creditBalance.toString());

      if (balance <= CRITICAL_BALANCE_THRESHOLD && !user.lowBalanceNotificationSent) {
        await storage.createNotification({
          userId: user.id,
          type: 'critical_balance',
          message: `Your credit balance is critically low (${balance.toFixed(2)}). Please add credits to avoid service interruption.`,
          read: false,
        });

        await storage.updateUser(user.id, {
          lowBalanceNotificationSent: true,
          lastBalanceNotificationAt: new Date(),
        });
      } else if (balance <= LOW_BALANCE_THRESHOLD && !user.lowBalanceNotificationSent) {
        await storage.createNotification({
          userId: user.id,
          type: 'low_balance',
          message: `Your credit balance is running low (${balance.toFixed(2)}). Consider adding more credits soon.`,
          read: false,
        });

        await storage.updateUser(user.id, {
          lowBalanceNotificationSent: true,
          lastBalanceNotificationAt: new Date(),
        });
      } else if (balance > LOW_BALANCE_THRESHOLD && user.lowBalanceNotificationSent) {
        // Reset notification flag when balance is restored
        await storage.updateUser(user.id, {
          lowBalanceNotificationSent: false,
          lastBalanceNotificationAt: null,
        });
      }
    }

    next();
  });


  // Missed Calls
  app.get("/api/missed-calls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const calls = await storage.getMissedCallsByUserId(req.user.id);
    res.json(calls);
  });

  // Scheduled Messages
  app.get("/api/scheduled-messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getScheduledMessagesByUserId(req.user.id);
    res.json(messages);
  });

  app.post("/api/scheduled-messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsedData = insertScheduledMessageSchema.omit({ userId: true }).parse({
        ...req.body,
        scheduledTime: new Date(req.body.scheduledTime),
      });

      const message = await storage.createScheduledMessage({
        ...parsedData,
        userId: req.user.id,
        sent: false,
      });
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating scheduled message:', error);
      res.status(400).json({ 
        message: 'Invalid message data',
        error: error.message 
      });
    }
  });

  // Leads
  app.get("/api/leads", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const leads = await storage.getLeadsByUserId(req.user.id);
    res.json(leads);
  });

  app.post("/api/leads", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertLeadSchema.parse(req.body);
    const lead = await storage.createLead({
      ...data,
      userId: req.user.id,
    });
    res.status(201).json(lead);
  });

  // Conversations
  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const conversations = await storage.getConversationsByUserId(req.user.id);
    res.json(conversations);
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const conversation = await storage.getConversation(parseInt(req.params.id));
    if (!conversation || conversation.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    const messages = await storage.getMessagesByConversationId(conversation.id);
    res.json(messages);
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const conversation = await storage.getConversation(parseInt(req.params.id));
    if (!conversation || conversation.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    const message = await storage.createMessage({
      conversationId: conversation.id,
      content: req.body.content,
      fromUser: true,
      timestamp: new Date(),
      delivered: false,
    });

    // Send the message via central Twilio account
    try {
      const twilioMessage = await twilioClient.messages.create({
        body: message.content,
        to: conversation.phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER!,
      });

      // Track message usage for billing
      await storage.trackMessageUsage({
        userId: req.user.id,
        messageId: twilioMessage.sid,
        direction: 'outbound',
        timestamp: new Date(),
        status: 'sent'
      });

      // Mark the message as delivered
      const updatedMessage = await storage.updateMessage(message.id, {
        delivered: true,
      });

      res.status(201).json(updatedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Twilio Webhook for Missed Calls
  app.post("/api/twilio/call-status", async (req, res) => {
    console.log("Received call status webhook:", req.body);
    const callStatus = req.body.CallStatus;
    const to = req.body.To;
    const from = req.body.From;
    const callerName = req.body.CallerName;

    if (["no-answer", "busy", "failed", "canceled"].includes(callStatus)) {
      console.log("Processing missed call for status:", callStatus);
      const users = await storage.getAllUsers();
      const user = users.find(u => u.twilioPhoneNumber === to);

      if (user) {
        console.log("Found user for phone number:", to);
        const missedCall = await handleMissedCall(user.id, {
          from,
          to,
          callerName,
        });

        // Create or find existing conversation
        let conversation = (await storage.getConversationsByUserId(user.id))
          .find(c => c.phoneNumber === from);

        if (!conversation) {
          conversation = await storage.createConversation({
            userId: user.id,
            missedCallId: missedCall.id,
            phoneNumber: from,
            lastMessageAt: new Date(),
            createdAt: new Date(),
          });
        }

        // Add the auto-response message to the conversation
        if (user.autoResponseMessage) {
          await storage.createMessage({
            conversationId: conversation.id,
            content: user.autoResponseMessage,
            fromUser: true,
            timestamp: new Date(),
            delivered: missedCall.responded,
          });
        }
      } else {
        console.log("No user found for phone number:", to);
      }
    }

    res.sendStatus(200);
  });

  // Settings
  const updateSettingsSchema = z.object({
    phoneNumber: z.string().min(1, "Phone number is required"),
    autoResponseMessage: z.string().optional(),
  });

  app.patch("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const data = updateSettingsSchema.parse(req.body);

    // Update user settings (phone number and auto-response message only)
    const user = await storage.updateUser(req.user.id, {
      twilioPhoneNumber: data.phoneNumber,
      autoResponseMessage: data.autoResponseMessage,
    });

    res.json(user);
  });

  // Add new routes for Google Sheets
  app.post('/api/sheets/initialize', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const spreadsheetId = await storage.initializeGoogleSheets();
      res.json({ spreadsheetId });
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      res.status(500).json({ 
        message: 'Failed to initialize Google Sheets',
        error: error.message 
      });
    }
  });

  app.post('/api/sheets/sync', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      await storage.syncLeadsToSheets();
      res.sendStatus(200);
    } catch (error) {
      console.error('Error syncing leads to Google Sheets:', error);
      res.status(500).json({ 
        message: 'Failed to sync leads to Google Sheets',
        error: error.message 
      });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notifications = await storage.getNotificationsByUserId(req.user.id);
    res.json(notifications);
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const notification = await storage.getNotification(parseInt(req.params.id));
    if (!notification || notification.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    await storage.updateNotification(notification.id, { read: true });
    res.sendStatus(200);
  });


  const httpServer = createServer(app);
  return httpServer;
}