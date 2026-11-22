import { z } from "zod";

/**
 * Only DATABASE_URL is required to boot the storefront.
 * Payment, email, storage and optional integrations are validated at the
 * point where those features are used, so an unconfigured integration does
 * not take down public pages.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Core site/auth settings. The custom cookie-session implementation does
  // not need AUTH_SECRET to render public pages.
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("https://shatrunjay-ghee-store.vercel.app"),
  AUTH_SECRET: z.string().optional().default(""),

  // Optional integrations. Feature modules must check these before use.
  RAZORPAY_KEY_ID: z.string().optional().default(""),
  RAZORPAY_KEY_SECRET: z.string().optional().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(""),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional().default(""),

  AWS_REGION: z.string().optional().default(""),
  AWS_ACCESS_KEY_ID: z.string().optional().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),
  S3_BUCKET_NAME: z.string().optional().default(""),
  S3_PUBLIC_BASE_URL: z.string().optional().default(""),

  SES_FROM_EMAIL: z.string().optional().default(""),
  SES_BUSINESS_INBOX_EMAIL: z.string().email().optional().default("info@shatrunjayghee.com"),

  GOOGLE_PLACES_API_KEY: z.string().optional().default(""),
  GOOGLE_PLACES_ID: z.string().optional().default(""),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional().default(""),
  SENTRY_DSN: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  // Skip validation during build only when explicitly requested.
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return process.env as unknown as Env;
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function requireEnvValue(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`${name} is required to use this feature. Configure it in your deployment environment.`);
  }
  return value;
}
