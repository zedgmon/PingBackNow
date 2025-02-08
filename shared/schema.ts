import { pgTable, text, serial, integer, timestamp, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Existing users table with subscription-related fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  businessName: text("business_name").notNull(),
  email: text("email"),  // Add email field
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: text("twilio_phone_number"),
  autoResponseMessage: text("auto_response_message"),
  subscriptionPlan: text("subscription_plan"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  trialEndsAt: timestamp("trial_ends_at"),
  creditBalance: decimal("credit_balance").notNull().default("0"),
  lowBalanceNotificationSent: boolean("low_balance_notification_sent").notNull().default(false),
  lastBalanceNotificationAt: timestamp("last_balance_notification_at"),
});

// New table for subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  features: jsonb("features").notNull(),
  pricePerMonth: decimal("price_per_month").notNull(),
  messageCredits: integer("message_credits").notNull(),
  active: boolean("active").notNull().default(true),
});

// New table for payment history
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  amount: decimal("amount").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'low_balance', 'critical_balance', etc.
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  missedCalls: many(missedCalls),
  conversations: many(conversations),
  scheduledMessages: many(scheduledMessages),
  leads: many(leads),
  messageUsage: many(messageUsage),
  notifications: many(notifications),
  payments: many(payments),
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
  subscriptionPlan: true,
});

export const insertMissedCallSchema = createInsertSchema(missedCalls);
export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages);
export const insertLeadSchema = createInsertSchema(leads);
export const insertConversationSchema = createInsertSchema(conversations);
export const insertMessageSchema = createInsertSchema(messages);
export const insertMessageUsageSchema = createInsertSchema(messageUsage);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertPaymentSchema = createInsertSchema(payments);


// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MissedCall = typeof missedCalls.$inferSelect;
export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type MessageUsage = typeof messageUsage.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Payment = typeof payments.$inferSelect;

// Admin specific types
export const adminStatsSchema = z.object({
  activeCustomers: z.number(),
  newCustomersThisMonth: z.number(),
  totalSmsSent: z.number(),
  monthlyRevenue: z.number(),
  revenueGrowth: z.number(),
});

export const adminCustomerSchema = z.object({
  id: z.number(),
  businessName: z.string(),
  subscriptionPlan: z.string(),
  smsSent: z.number(),
  creditBalance: z.number(),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;
export type AdminCustomer = z.infer<typeof adminCustomerSchema>;

export const subscriptionStatusSchema = z.enum([
  "trialing",
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "unpaid",
  "paused"
]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;