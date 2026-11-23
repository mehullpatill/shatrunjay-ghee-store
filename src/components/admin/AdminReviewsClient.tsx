"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminReviewsClient({ reviews }: { reviews: Array<{ id: string; rating: number; title: string | null; body: string; status: string; verifiedPurchase: boolean; createdAt: string; product: { name: string }; user: { name: string; email: string } }> }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const moderate = async (id: string, status: "APPROVED" | "REJECTED") => {
    const res = await fetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setMsg(res.ok ? "Review updated." : "Could not update review.");
    router.refresh();
  };
  return <div className="space-y-6"><h1 className="text-3xl font-extrabold text-kadhai">Product Reviews</h1>{msg && <p className="rounded-lg bg-butter px-4 py-2 text-sm">{msg}</p>}<div className="space-y-3">{reviews.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}{reviews.map((review) => <div key={review.id} className="panel p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold text-kadhai">{review.product.name}</p><p className="text-xs text-muted">{review.user.name} ({review.user.email}) • {new Date(review.createdAt).toLocaleDateString("en-IN")}</p></div><span className="text-xs font-bold">{review.status} • {"★".repeat(review.rating)}</span></div><p className="mt-3 font-semibold">{review.title || "Review"}</p><p className="mt-1 text-sm">{review.body}</p>{review.verifiedPurchase && <p className="mt-2 text-xs font-semibold text-label">Verified purchase</p>}{review.status === "PENDING" && <div className="mt-4 flex gap-2"><button type="button" onClick={() => moderate(review.id, "APPROVED")} className="btn text-xs">Approve</button><button type="button" onClick={() => moderate(review.id, "REJECTED")} className="btn-ghost text-xs">Reject</button></div>}</div>)}</div></div>;
}
