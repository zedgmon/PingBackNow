import { z } from 'zod';

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PUBLISHABLE_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
}).transform((env) => ({
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
}));

const parseEnvVars = () => {
    console.log("Checking environment variables...");
    console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ Loaded" : "❌ Missing");
    console.log("STRIPE_PUBLISHABLE_KEY:", process.env.STRIPE_PUBLISHABLE_KEY ? "✅ Loaded" : "❌ Missing");
    console.log("STRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET ? "✅ Loaded" : "❌ Missing");
  
    try {
      const parsedEnv = envSchema.safeParse({
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      });
  
      if (!parsedEnv.success) {
        console.error("⚠️ Missing required environment variables:", parsedEnv.error.format());
        return {}; // Return an empty object instead of crashing
      }
  
      return parsedEnv.data;
    } catch (error) {
      console.error("Unexpected error parsing environment variables:", error);
      return {}; // Ensure the app does not crash
    }
};

export const env = parseEnvVars();
