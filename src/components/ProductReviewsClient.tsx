"use client";
import { useState } from "react";

type Review = { id: string; rating: number; title: string | null; body: string; verifiedPurchase: boolean; createdAt: string; user: { name: string } };

export default function ProductReviewsClient({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage("");
    const res = await fetch(`/api/products/${productId}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, title, body }) });
    const data = (await res.json()) as { error?: string; message?: string };
    setMessage(res.ok ? data.message || "Review submitted." : data.error || "Could not submit review.");
    if (res.ok) { setTitle(""); setBody(""); }
    setSaving(false);
  };

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-2xl font-bold text-kadhai">Customer Reviews</h2>
          {reviews.length === 0 ? <p className="mt-3 text-sm text-muted">No approved reviews yet.</p> : <div className="mt-4 space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-line bg-white p-4"><div className="flex justify-between gap-3"><p className="font-bold text-kadhai">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>{review.verifiedPurchase && <span className="text-xs font-semibold text-label">Verified purchase</span>}</div><p className="mt-1 font-semibold">{review.title || "Review"}</p><p className="mt-1 text-sm text-ink/80">{review.body}</p><p className="mt-2 text-xs text-muted">{review.user.name} • {new Date(review.createdAt).toLocaleDateString("en-IN")}</p></article>)}</div>}
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-line bg-butter p-5 space-y-3"><h3 className="font-bold text-kadhai">Write a review</h3><select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="field"><option value={5}>5 stars</option><option value={4}>4 stars</option><option value={3}>3 stars</option><option value={2}>2 stars</option><option value={1}>1 star</option></select><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title (optional)" className="field" /><textarea required minLength={5} rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience" className="field" /><button disabled={saving} className="btn">{saving ? "Submitting..." : "Submit review"}</button>{message && <p className="text-xs font-medium text-kadhai">{message}</p>}</form>
      </div>
    </section>
  );
}
