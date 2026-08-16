import * as Sentry from "@sentry/nextjs";
import { createSentryOptions } from "@/lib/monitoring/sentryOptions";

Sentry.init(createSentryOptions("client"));
