import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLeadSchema, insertScheduledMessageSchema } from "@shared/schema";
import { handleMissedCall } from "./twilio-service";
import { z } from "zod";
import { initGoogleSheetsService } from './google-sheets-service';

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
    const data = insertScheduledMessageSchema.parse(req.body);
    const message = await storage.createScheduledMessage({
      ...data,
      userId: req.user.id,
      sent: false,
    });
    res.status(201).json(message);
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

  // Twilio Webhook for Missed Calls
  app.post("/api/twilio/call-status", async (req, res) => {
    console.log("Received call status webhook:", req.body);
    const callStatus = req.body.CallStatus;
    const to = req.body.To;
    const from = req.body.From;
    const callerName = req.body.CallerName;

    // Handle missed calls: no-answer, busy, failed, canceled
    if (["no-answer", "busy", "failed", "canceled"].includes(callStatus)) {
      console.log("Processing missed call for status:", callStatus);
      // Find user by Twilio phone number
      const users = await storage.getAllUsers();
      const user = users.find(u => u.twilioPhoneNumber === to);

      if (user) {
        console.log("Found user for phone number:", to);
        await handleMissedCall(user.id, {
          from,
          to,
          callerName,
        });
      } else {
        console.log("No user found for phone number:", to);
      }
    } else {
      console.log("Ignoring call status:", callStatus);
    }

    res.sendStatus(200);
  });

  // Settings
  const updateSettingsSchema = z.object({
    twilioAccountSid: z.string().optional(),
    twilioAuthToken: z.string().optional(),
    twilioPhoneNumber: z.string().optional(),
    autoResponseMessage: z.string().optional(),
  });

  app.patch("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const data = updateSettingsSchema.parse(req.body);

    // Validate Twilio credentials if provided
    if (data.twilioAccountSid || data.twilioAuthToken) {
      if (!data.twilioAccountSid || !data.twilioAuthToken || !data.twilioPhoneNumber) {
        return res.status(400).json({
          message: "All Twilio credentials (Account SID, Auth Token, and Phone Number) are required"
        });
      }
    }

    const user = await storage.updateUser(req.user.id, data);
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

  const httpServer = createServer(app);
  return httpServer;
}