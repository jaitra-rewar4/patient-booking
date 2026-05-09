import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Lock } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { SESSION_COOKIE, SESSION_TTL_MS, signSession } from "@/lib/auth";

async function loginAction(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const fromRaw = String(formData.get("from") ?? "/admin");
  const from = fromRaw.startsWith("/") && !fromRaw.startsWith("//")
    ? fromRaw
    : "/admin";

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    redirect(`/admin/login?error=1&from=${encodeURIComponent(from)}`);
  }

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const value = await signSession(expiresAt);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });

  redirect(from);
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const fromPath = from && from.startsWith("/") && !from.startsWith("//")
    ? from
    : "/admin";

  return (
    <>
      <DemoBanner />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-16 md:py-24">
        <Link
          href="/"
          className="flex items-baseline gap-2 self-center"
          aria-label="Apex Health home"
        >
          <span className="font-display text-[20px] tracking-tight text-ink-300">
            Apex Health
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone-muted">
            Demo
          </span>
        </Link>

        <div className="mt-10 surface px-7 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-forest-400">
              <Lock size={16} />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-tight text-ink-300">
                Clinic admin
              </h1>
              <p className="text-[13px] text-ink-100">
                Sign in to review bookings.
              </p>
            </div>
          </div>

          <form action={loginAction} className="mt-7 space-y-4" noValidate>
            <input type="hidden" name="from" value={fromPath} />

            <div>
              <Label htmlFor="password">Staff password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                aria-invalid={!!error}
              />
              {error && (
                <FieldError>That password didn&rsquo;t match.</FieldError>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-[12px] leading-relaxed text-stone-muted">
            Single shared password gate, intentionally lightweight. In
            production this would be SSO with role-based access.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 self-center text-[13px] text-stone-muted hover:text-ink-200"
        >
          &larr; Back to patient site
        </Link>
      </main>
    </>
  );
}
