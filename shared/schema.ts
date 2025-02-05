import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  businessName: text("business_name").notNull(),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: text("twilio_phone_number"),
  autoResponseMessage: text("auto_response_message"),
  subscriptionPlan: text("subscription_plan"),
  stripeCustomerId: text("stripe_customer_id"),
});

export const missedCalls = pgTable("missed_calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  callerNumber: text("caller_number").notNull(),
  callerName: text("caller_name"),
  timestamp: timestamp("timestamp").notNull(),
  responded: boolean("responded").notNull().default(false),
});

export const scheduledMessages = pgTable("scheduled_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  recipientNumber: text("recipient_number").notNull(),
  message: text("message").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  sent: boolean("sent").notNull().default(false),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  name: text("name"),
  notes: text("notes"),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  businessName: true,
});

export const insertMissedCallSchema = createInsertSchema(missedCalls);
export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages);
export const insertLeadSchema = createInsertSchema(leads);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MissedCall = typeof missedCalls.$inferSelect;
export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type Lead = typeof leads.$inferSelect;
