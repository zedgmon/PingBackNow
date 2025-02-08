import { z } from 'zod';

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
}).transform((env) => ({
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY || process.env.NODE_ENV === 'development' ? 'sk_test_mock' : undefined,
  STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || process.env.NODE_ENV === 'development' ? 'pk_test_mock' : undefined,
  STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET || process.env.NODE_ENV === 'development' ? 'whsec_mock' : undefined,
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
      const missingVars = error.errors.map(err => err.message).join(', ');
      console.warn(`Environment warning: ${missingVars}`);
      return envSchema.parse({}); // Fall back to development defaults
    }
    throw error;
  }
};

export const env = parseEnvVars();