#!/usr/bin/env node
/**
 * Fail when a server-only environment variable name appears in the client bundle.
 * Run after `next build` — scans `.next/static/**`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const staticDir = path.join(root, ".next", "static");

/** Names that must never ship in `.next/static/**`. */
const FORBIDDEN = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "REVALIDATE_SECRET",
  "REVIEW_IP_SALT",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_KEY_ID",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "SENTRY_AUTH_TOKEN",
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(js|mjs|cjs|json|txt|map)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  if (!fs.existsSync(staticDir)) {
    console.error("Missing .next/static — run `npm run build` first.");
    process.exit(1);
  }

  const hits = [];

  for (const file of walk(staticDir)) {
    const content = fs.readFileSync(file, "utf8");
    for (const name of FORBIDDEN) {
      if (content.includes(name)) {
        hits.push({ file: path.relative(root, file), name });
      }
    }
  }

  if (hits.length > 0) {
    console.error("Client bundle secret leak check failed:");
    for (const hit of hits) {
      console.error(`  ${hit.name} found in ${hit.file}`);
    }
    process.exit(1);
  }

  console.log(
    `Client bundle secret leak check passed (${FORBIDDEN.length} forbidden names absent from .next/static).`
  );
}

main();
