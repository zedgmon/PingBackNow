import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLeadSchema, insertScheduledMessageSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
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

  // Settings
  app.patch("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.updateUser(req.user.id, req.body);
    res.json(user);
  });

  const httpServer = createServer(app);
  return httpServer;
}
