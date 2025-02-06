import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  businessName: text("business_name").notNull(),
  twilioPhoneNumber: text("twilio_phone_number"),
  autoResponseMessage: text("auto_response_message"),
  subscriptionPlan: text("subscription_plan"),
  stripeCustomerId: text("stripe_customer_id"),
});

export const messageUsage = pgTable("message_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  messageId: text("message_id").notNull(), // Twilio Message SID
  direction: text("direction").notNull(), // 'inbound' or 'outbound'
  timestamp: timestamp("timestamp").notNull(),
  status: text("status").notNull(), // 'sent', 'delivered', 'failed'
});

export const missedCalls = pgTable("missed_calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  callerNumber: text("caller_number").notNull(),
  callerName: text("caller_name"),
  timestamp: timestamp("timestamp").notNull(),
  responded: boolean("responded").notNull().default(false),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  missedCallId: integer("missed_call_id").references(() => missedCalls.id),
  phoneNumber: text("phone_number").notNull(),
  lastMessageAt: timestamp("last_message_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  content: text("content").notNull(),
  fromUser: boolean("from_user").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  delivered: boolean("delivered").notNull().default(false),
});

export const scheduledMessages = pgTable("scheduled_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  recipientNumber: text("recipient_number").notNull(),
  message: text("message").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  sent: boolean("sent").notNull().default(false),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  phoneNumber: text("phone_number").notNull(),
  name: text("name"),
  notes: text("notes"),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  missedCalls: many(missedCalls),
  conversations: many(conversations),
  scheduledMessages: many(scheduledMessages),
  leads: many(leads),
  messageUsage: many(messageUsage),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  missedCall: one(missedCalls, {
    fields: [conversations.missedCallId],
    references: [missedCalls.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  businessName: true,
});

export const insertMissedCallSchema = createInsertSchema(missedCalls);
export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages);
export const insertLeadSchema = createInsertSchema(leads);
export const insertConversationSchema = createInsertSchema(conversations);
export const insertMessageSchema = createInsertSchema(messages);
export const insertMessageUsageSchema = createInsertSchema(messageUsage);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MissedCall = typeof missedCalls.$inferSelect;
export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
import type { InferSelect } from "drizzle-orm";
export type Message = typeof messages.$inferSelect;
export type MessageUsage = typeof messageUsage.$inferSelect;