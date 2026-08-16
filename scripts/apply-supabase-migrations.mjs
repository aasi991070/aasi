#!/usr/bin/env node
/**
 * Apply numbered SQL files from supabase/migrations/ against the remote database.
 *
 * Requires SUPABASE_DB_PASSWORD in .env.local (Supabase Dashboard → Connect →
 * Session pooler). Uses the IPv4 pooler host so it works on networks without IPv6.
 *
 * Usage:
 *   node scripts/apply-supabase-migrations.mjs
 *   node scripts/apply-supabase-migrations.mjs 002 004   # run a subset
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function projectRefFromUrl(url) {
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1];
}

function migrationFiles(filterIds) {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => /^\d{3}_.+\.sql$/.test(name))
    .sort();

  if (!filterIds?.length) return files;

  const allowed = new Set(filterIds.map((id) => id.padStart(3, "0")));
  return files.filter((name) => allowed.has(name.slice(0, 3)));
}

async function findPoolerHost(ref, password) {
  const regions = [
    "ap-south-1",
    "ap-southeast-1",
    "ap-northeast-1",
    "ap-southeast-2",
    "us-east-1",
    "us-west-1",
    "eu-west-1",
    "eu-west-2",
    "eu-central-1",
    "sa-east-1",
  ];

  for (const region of regions) {
    for (const suffix of ["0-", ""]) {
      const host = `aws-${suffix}${region}.pooler.supabase.com`;
      const client = new pg.Client({
        host,
        port: 5432,
        user: `postgres.${ref}`,
        password,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });

      try {
        await client.connect();
        await client.end();
        return host;
      } catch (error) {
        const message = error.message ?? "";
        if (message.includes("password authentication failed")) {
          throw new Error(
            `Connected to ${host} but the database password was rejected. Reset it in Supabase Dashboard → Database → Settings.`
          );
        }
      }
    }
  }

  throw new Error(
    "Could not locate the Supabase pooler for this project. Paste supabase/migrations/_manual_000_to_004.sql into the SQL Editor instead."
  );
}

async function main() {
  const env = loadEnvLocal();
  const ref = projectRefFromUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  const password = env.SUPABASE_DB_PASSWORD;

  if (!ref) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is missing or invalid in .env.local");
    process.exit(1);
  }

  if (!password) {
    console.error(
      "SUPABASE_DB_PASSWORD is not set in .env.local.\n" +
        "Copy it from Supabase Dashboard → Connect → Session pooler,\n" +
        "or run supabase/migrations/_manual_000_to_004.sql in the SQL Editor."
    );
    process.exit(1);
  }

  const filterIds = process.argv.slice(2);
  const files = migrationFiles(filterIds);

  if (files.length === 0) {
    console.error("No migration files matched.");
    process.exit(1);
  }

  const host = await findPoolerHost(ref, password);
  const client = new pg.Client({
    host,
    port: 5432,
    user: `postgres.${ref}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(`Connected via ${host}`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`Applying ${file}… `);
    await client.query(sql);
    console.log("done");
  }

  await client.end();
  console.log("All migrations applied.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
