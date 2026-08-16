import * as Sentry from "@sentry/nextjs";
import { DataError } from "@/lib/errors";

/**
 * Report a database-layer failure to Sentry with the operation name attached.
 * Safe to call when Sentry is disabled (no DSN configured).
 */
export function captureDataError(op: string, cause: unknown): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  const error = new DataError(op, cause);

  Sentry.withScope((scope) => {
    scope.setTag("data.op", op);
    scope.setLevel("error");
    Sentry.captureException(error);
  });
}
