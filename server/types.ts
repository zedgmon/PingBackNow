import type { User, InsertUser, MissedCall, ScheduledMessage, Lead, Conversation, Message, MessageUsage, Notification } from "@shared/schema";
import type { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Notification operations
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification>;
  updateNotification(id: number, updates: Partial<Notification>): Promise<Notification>;

  // Other operations remain the same...
}
