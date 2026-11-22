import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-maroon">404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-kadhai md:text-4xl">Page not found</h1>
      <p className="mt-3 text-muted">The page you are looking for might have been moved or does not exist.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn">Go to Homepage</Link>
        <Link href="/shop" className="btn-ghost">Shop All Ghee</Link>
      </div>
    </div>
  );
}
