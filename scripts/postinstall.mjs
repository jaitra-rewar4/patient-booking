// Cross-platform postinstall. Always generates the Prisma client.
// Only sets up local SQLite (db push + seed) when running outside of
// CI / Vercel — production deployments use Turso and bring their own
// schema, applied separately.
import { execSync } from "node:child_process";

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

run("prisma generate");

if (process.env.VERCEL || process.env.CI) {
  console.log(
    "[postinstall] CI/Vercel detected — skipping local SQLite db push + seed.",
  );
  process.exit(0);
}

run("prisma db push --skip-generate --accept-data-loss");
run("tsx prisma/seed.ts");
