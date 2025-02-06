import { IStorage } from "./types";
import { User, InsertUser, MissedCall, ScheduledMessage, Lead } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getMissedCallsByUserId(userId: number): Promise<MissedCall[]>;
  createMissedCall(call: Omit<MissedCall, "id">): Promise<MissedCall>;
  getScheduledMessagesByUserId(userId: number): Promise<ScheduledMessage[]>;
  createScheduledMessage(message: Omit<ScheduledMessage, "id">): Promise<ScheduledMessage>;
  getLeadsByUserId(userId: number): Promise<Lead[]>;
  createLead(lead: Omit<Lead, "id">): Promise<Lead>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateMissedCall(
    id: number,
    updates: Partial<MissedCall>
  ): Promise<MissedCall>;
  getScheduledMessage(
    id: number
  ): Promise<ScheduledMessage | undefined>;
  updateScheduledMessage(
    id: number,
    updates: Partial<ScheduledMessage>
  ): Promise<ScheduledMessage>;
  getAllUsers(): Promise<User[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private missedCalls: Map<number, MissedCall>;
  private scheduledMessages: Map<number, ScheduledMessage>;
  private leads: Map<number, Lead>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.missedCalls = new Map();
    this.scheduledMessages = new Map();
    this.leads = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async initializeTestUser(hasher: (pwd: string) => Promise<string>) {
    const testUser: User = {
      id: this.currentId++,
      username: "test",
      password: await hasher("password"),
      businessName: "Test Business",
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || null,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || null,
      twilioPhoneNumber: "+1234567890",
      autoResponseMessage: "Hi! We missed your call. How can we help?",
      subscriptionPlan: null,
      stripeCustomerId: null,
    };
    this.users.set(testUser.id, testUser);
    return testUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      twilioAccountSid: null,
      twilioAuthToken: null,
      twilioPhoneNumber: null,
      autoResponseMessage: "Hi! We missed your call. How can we help?",
      subscriptionPlan: null,
      stripeCustomerId: null,
    };
    this.users.set(id, user);
    return user;
  }

  async getMissedCallsByUserId(userId: number): Promise<MissedCall[]> {
    return Array.from(this.missedCalls.values()).filter(
      (call) => call.userId === userId,
    );
  }

  async createMissedCall(call: Omit<MissedCall, "id">): Promise<MissedCall> {
    const id = this.currentId++;
    const missedCall = { ...call, id };
    this.missedCalls.set(id, missedCall);
    return missedCall;
  }

  async getScheduledMessagesByUserId(userId: number): Promise<ScheduledMessage[]> {
    return Array.from(this.scheduledMessages.values()).filter(
      (msg) => msg.userId === userId,
    );
  }

  async createScheduledMessage(message: Omit<ScheduledMessage, "id">): Promise<ScheduledMessage> {
    const id = this.currentId++;
    const scheduledMessage = { ...message, id };
    this.scheduledMessages.set(id, scheduledMessage);
    return scheduledMessage;
  }

  async getLeadsByUserId(userId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.userId === userId,
    );
  }

  async createLead(lead: Omit<Lead, "id">): Promise<Lead> {
    const id = this.currentId++;
    const newLead = { ...lead, id };
    this.leads.set(id, newLead);
    return newLead;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateMissedCall(
    id: number,
    updates: Partial<MissedCall>
  ): Promise<MissedCall> {
    const call = this.missedCalls.get(id);
    if (!call) throw new Error("Missed call not found");

    const updatedCall = { ...call, ...updates };
    this.missedCalls.set(id, updatedCall);
    return updatedCall;
  }

  async getScheduledMessage(
    id: number
  ): Promise<ScheduledMessage | undefined> {
    return this.scheduledMessages.get(id);
  }

  async updateScheduledMessage(
    id: number,
    updates: Partial<ScheduledMessage>
  ): Promise<ScheduledMessage> {
    const message = this.scheduledMessages.get(id);
    if (!message) throw new Error("Scheduled message not found");

    const updatedMessage = { ...message, ...updates };
    this.scheduledMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const storage = new MemStorage();