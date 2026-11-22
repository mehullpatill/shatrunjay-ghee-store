"use client";
import Link from "next/link";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-maroon">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-extrabold text-kadhai">We hit an unexpected snag</h1>
      <p className="mt-3 text-muted">Please try refreshing the page or return to the storefront.</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="btn">Try again</button>
        <Link href="/" className="btn-ghost">Homepage</Link>
      </div>
    </div>
  );
}
