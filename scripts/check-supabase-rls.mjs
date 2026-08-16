#!/usr/bin/env node
/**
 * Fail when any public table lacks row-level security.
 * Regression guard for prompt 01 — run in CI after migrations apply.
 */

import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

async function main() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl:
      DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
  });

  await client.connect();

  const { rows } = await client.query(`
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not c.relrowsecurity
    order by c.relname
  `);

  await client.end();

  if (rows.length > 0) {
    const names = rows.map((row) => row.table_name).join(", ");
    console.error(
      `RLS advisor failed: ${rows.length} public table(s) without row level security enabled: ${names}`
    );
    process.exit(1);
  }

  console.log("RLS advisor passed: every public table has row level security enabled.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
