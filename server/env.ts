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
  try {
    return envSchema.parse({
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      console.error(`Required environment variables missing: ${missingVars}`);
      throw new Error('Missing required environment variables for Stripe integration');
    }
    throw error;
  }
};

export const env = parseEnvVars();