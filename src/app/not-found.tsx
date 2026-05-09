import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";

export default function NotFound() {
  return (
    <>
      <DemoBanner />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="font-mono text-[13px] tracking-wider text-forest-300">
          404
        </p>
        <h1 className="mt-4 font-display text-5xl tracking-tight text-ink-300">
          We couldn't find that.
        </h1>
        <p className="mt-4 max-w-md text-[15px] text-ink-100">
          The page you're looking for doesn't exist, or the booking ID may have
          been mistyped.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center rounded bg-forest-400 px-6 text-[14px] font-medium text-cream-50 hover:bg-forest-500"
        >
          Back to home
        </Link>
      </main>
    </>
  );
}
