import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/monitoring/scrubSentryEvent";

export function getSentryRelease(): string | undefined {
  return (
    process.env.SENTRY_RELEASE ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA
  );
}

type SentryRuntimeOptions = BrowserOptions | NodeOptions | EdgeOptions;

export function createSentryOptions(
  runtime: "server" | "edge" | "client"
): SentryRuntimeOptions {
  const dsn =
    runtime === "client"
      ? process.env.NEXT_PUBLIC_SENTRY_DSN
      : (process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);

  return {
    dsn,
    enabled: Boolean(dsn),
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: getSentryRelease(),
    tracesSampleRate: 0.1,
    sampleRate: 1,
    beforeSend: scrubSentryEvent,
    ignoreErrors:
      runtime === "client" ? ["ResizeObserver loop limit exceeded"] : undefined,
  };
}
