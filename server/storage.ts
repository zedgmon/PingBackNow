import { IStorage } from "./types";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { users, missedCalls, scheduledMessages, leads, conversations, messages, messageUsage, notifications } from "@shared/schema";
import type { User, InsertUser, MissedCall, ScheduledMessage, Lead, Conversation, Message, MessageUsage, Notification } from "@shared/schema";
import { GoogleSheetsService, initGoogleSheetsService, getGoogleSheetsService } from './google-sheets-service';

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return user;
  }

  // Keep this for backward compatibility with IStorage interface
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getUserByEmail(username);
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser & { 
    verificationToken: string;
    verificationTokenExpiry: Date;
    emailVerified: boolean;
  }): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email.toLowerCase(),
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyEmail(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      })
      .where(eq(users.id, userId));
  }

  async updateVerificationToken(
    userId: number,
    token: string,
    expiry: Date
  ): Promise<void> {
    await db
      .update(users)
      .set({
        verificationToken: token,
        verificationTokenExpiry: expiry,
      })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getMissedCallsByUserId(userId: number): Promise<MissedCall[]> {
    return await db.select().from(missedCalls).where(eq(missedCalls.userId, userId));
  }

  async createMissedCall(call: Omit<MissedCall, "id">): Promise<MissedCall> {
    const [missedCall] = await db.insert(missedCalls).values(call).returning();
    return missedCall;
  }

  async updateMissedCall(id: number, updates: Partial<MissedCall>): Promise<MissedCall> {
    const [updatedCall] = await db
      .update(missedCalls)
      .set(updates)
      .where(eq(missedCalls.id, id))
      .returning();
    return updatedCall;
  }

  async getScheduledMessagesByUserId(userId: number): Promise<ScheduledMessage[]> {
    return await db
      .select()
      .from(scheduledMessages)
      .where(eq(scheduledMessages.userId, userId));
  }

  async getScheduledMessage(id: number): Promise<ScheduledMessage | undefined> {
    const [message] = await db
      .select()
      .from(scheduledMessages)
      .where(eq(scheduledMessages.id, id));
    return message;
  }

  async createScheduledMessage(message: Omit<ScheduledMessage, "id">): Promise<ScheduledMessage> {
    const [scheduledMessage] = await db
      .insert(scheduledMessages)
      .values(message)
      .returning();
    return scheduledMessage;
  }

  async updateScheduledMessage(
    id: number,
    updates: Partial<ScheduledMessage>
  ): Promise<ScheduledMessage> {
    const [updatedMessage] = await db
      .update(scheduledMessages)
      .set(updates)
      .where(eq(scheduledMessages.id, id))
      .returning();
    return updatedMessage;
  }

  async getLeadsByUserId(userId: number): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.userId, userId));
  }

  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads);
  }

  async createLead(lead: Omit<Lead, "id">): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();

    try {
      const sheetsService = getGoogleSheetsService();
      await sheetsService.addLead(newLead);
    } catch (error) {
      console.error('Error syncing new lead to Google Sheets:', error);
    }

    return newLead;
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: Omit<Conversation, "id">): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async createMessage(message: Omit<Message, "id">): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: message.timestamp })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async trackMessageUsage(usage: Omit<MessageUsage, "id">): Promise<MessageUsage> {
    const [tracked] = await db.insert(messageUsage).values(usage).returning();
    return tracked;
  }

  // Google Sheets integration methods
  async initializeGoogleSheets(): Promise<string> {
    try {
      const sheetsService = getGoogleSheetsService();
      const spreadsheetId = await sheetsService.initializeSpreadsheet();
      return spreadsheetId;
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      throw error;
    }
  }

  async syncLeadsToSheets(): Promise<void> {
    try {
      const sheetsService = getGoogleSheetsService();
      const leads = await this.getAllLeads();
      await sheetsService.syncLeads(leads);
    } catch (error) {
      console.error('Error syncing leads to Google Sheets:', error);
      throw error;
    }
  }

  async getSpreadsheetId(): Promise<string> {
    try {
      const sheetsService = getGoogleSheetsService();
      const id = sheetsService.getSpreadsheetId();
      if (!id) throw new Error('Spreadsheet ID not found');
      return id;
    } catch (error) {
      console.error('Error getting spreadsheet ID:', error);
      throw error;
    }
  }

  // Notifications
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        createdAt: new Date(),
      })
      .returning();
    return newNotification;
  }

  async updateNotification(id: number, updates: Partial<Notification>): Promise<Notification> {
    const [updatedNotification] = await db
      .update(notifications)
      .set(updates)
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
}

export const storage = new DatabaseStorage();