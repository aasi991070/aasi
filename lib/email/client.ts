import { Resend } from "resend";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function isResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.ORDER_FROM_EMAIL?.trim()
  );
}

export function getOrderFromEmail(): string {
  return requireEnv("ORDER_FROM_EMAIL");
}

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(requireEnv("RESEND_API_KEY"));
  }
  return client;
}
