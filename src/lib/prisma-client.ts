import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Production / Vercel uses Turso (libSQL). Local dev falls back to the
// file-based SQLite configured in prisma/schema.prisma.
export function makePrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
  }
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}
