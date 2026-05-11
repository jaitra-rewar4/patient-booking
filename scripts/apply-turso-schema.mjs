// Apply a Prisma-generated SQL file to a Turso (libSQL) database.
// Usage: node scripts/apply-turso-schema.mjs <path-to-sql>
// Requires env: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-turso-schema.mjs <sql-file>");
  process.exit(1);
}
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL is required");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");

// Strip comments, then split on semicolons that aren't inside strings.
const cleaned = sql
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n");

const statements = cleaned
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const client = createClient({ url, authToken: token });

let applied = 0;
for (const stmt of statements) {
  await client.execute(stmt);
  applied++;
  const preview = stmt.replace(/\s+/g, " ").slice(0, 70);
  console.log(`  ✓ ${preview}${stmt.length > 70 ? "…" : ""}`);
}
console.log(`\nApplied ${applied} statement(s) to ${url}`);
