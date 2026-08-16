/**
 * Data-layer error handling.
 *
 * Every query in `lib/queries/` used to end in a bare `catch { return [] }`.
 * That turned a Supabase outage into an empty catalogue served with HTTP 200,
 * and turned a transient network blip on a PDP into `notFound()` — a live
 * product returning 404 and getting deindexed.
 *
 * The rule now: a `null` or empty return means "not found" or "genuinely
 * empty". Failure throws.
 */

import { captureDataError } from "@/lib/monitoring/captureDataError";

/** Shape of a `postgrest-js` error, kept structural to avoid a type import. */
interface PostgrestLikeError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

function describeCause(cause: unknown): string {
  if (typeof cause === "string") return cause;

  if (cause && typeof cause === "object") {
    const err = cause as PostgrestLikeError;
    if (err.message) {
      return err.code ? `${err.message} (${err.code})` : err.message;
    }
  }

  return "Unknown error";
}

export class DataError extends Error {
  readonly op: string;

  constructor(op: string, cause: unknown) {
    super(`${op}: ${describeCause(cause)}`, { cause });
    this.name = "DataError";
    this.op = op;
  }
}

/**
 * Unwraps a Supabase response, throwing `DataError` if it failed.
 *
 * `data: null` with `error: null` is passed through untouched — that is what
 * `maybeSingle()` returns for "no such row", which is a real answer and not a
 * failure. Only a non-null `error` throws.
 */
export function assertOk<T>(op: string, res: { data: T; error: unknown | null }): T {
  if (res.error) {
    captureDataError(op, res.error);
    console.error(`[DataError] ${op}`, res.error);
    throw new DataError(op, res.error);
  }

  return res.data;
}
