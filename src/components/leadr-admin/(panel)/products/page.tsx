"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, refresh, setCached, useApi } from "@/lib/adminApi";
import { rupees } from "@/lib/format";
import type { Product } from "../types";
import { Empty, ErrorLine, PageHeader, Sheet, Skeleton, toast } from "../ui";

const LOW = 5;
const isLow = (p: Product) => !p.in_stock || (p.stock_qty !== null && p.stock_qty <= LOW);

export default function Products() {
  const { data: list, error } = useApi<Product[]>("products");
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(useSearchParams().get("filter") === "low");
  const [edit, setEdit] = useState<Product | "new" | null>(null);

  const shown = (list ?? []).filter((p) => (!lowOnly || isLow(p)) && p.name.toLowerCase().includes(q.trim().toLowerCase()));
  const synced = list?.some((p) => p.synced_from);

  return (
    <div>
      <PageHeader title="Products" sub="One catalogue for the website and the WhatsApp bot.">
        <button className="btn" onClick={() => setEdit("new")}>Add product</button>
      </PageHeader>
      <ErrorLine msg={error} />
      {synced && <p className="mb-4 rounded-md border border-line bg-white px-4 py-2.5 text-sm text-muted">Products marked <b className="text-ink">Sales Management</b> take their name, price and stock from there, so a sale or stock entry there shows up here and on WhatsApp within a minute. Photos and descriptions are edited here.</p>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className="field !w-72 max-w-full" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />Only out of stock or {LOW} and under</label>
      </div>

      {!list ? <div className="panel"><Skeleton /></div> : !shown.length ? (
        <div className="panel"><Empty title={list.length ? "No products match" : "No products yet"}>{!list.length && <button className="mt-2 font-medium text-maroon underline" onClick={() => setEdit("new")}>Add the first product</button>}</Empty></div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((p) => (
            <li key={p.id}>
              <button onClick={() => setEdit(p)} className="panel group flex h-full w-full flex-col overflow-hidden text-left transition-shadow hover:shadow-md">
                <div className="relative aspect-[4/3] w-full bg-paper">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted"><img src="/brand/logo.png" alt="" className="h-14 opacity-30 grayscale" />No photo yet</span>}
                  {p.synced_from && <span className="absolute left-2 top-2 rounded bg-white/95 px-1.5 py-0.5 text-[11px] font-medium text-kadhai-2 shadow-sm">Sales Management</span>}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <p className="font-semibold leading-snug group-hover:text-maroon">{p.name}</p>
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <span className="text-base font-semibold">{rupees(p.price_paise)}</span>
                    <Stock p={p} />
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Add product" : edit ? edit.name : ""}>
        {edit && <Editor key={edit === "new" ? "new" : edit.id} p={edit === "new" ? null : edit} onDone={() => setEdit(null)} />}
      </Sheet>
    </div>
  );
}

function Stock({ p }: { p: Product }) {
  if (!p.in_stock || p.stock_qty === 0) return <span className="rounded-full bg-[#f8eaea] px-2 py-0.5 text-xs font-medium text-maroon">Out of stock</span>;
  if (p.stock_qty === null) return <span className="text-xs text-muted">In stock</span>;
  return <span className={`text-xs ${p.stock_qty <= LOW ? "font-semibold text-[#8a5a00]" : "text-muted"}`}>{p.stock_qty} left</span>;
}

function Editor({ p, onDone }: { p: Product | null; onDone: () => void }) {
  const locked = p?.synced_from === "salesmanagement";
  const [f, setF] = useState({
    name: p?.name ?? "", price: p ? String(p.price_paise / 100) : "", stock: p?.stock_qty == null ? "" : String(p.stock_qty),
    in_stock: p?.in_stock ?? true, image_url: p?.image_url ?? "", description: p?.description ?? "",
  });
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy("upload"); setErr("");
    const form = new FormData();
    form.append("file", file);
    const r = await fetch("/admin/api/upload", { method: "POST", body: form });
    const body = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setErr(body.detail ?? "Upload failed");
    setF((cur) => ({ ...cur, image_url: body.url }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save"); setErr("");
    // Synced products: name, price and stock belong to Sales Management, so only send what this panel owns.
    const owned = { image_url: f.image_url || null, description: f.description };
    const body = locked ? owned : { ...owned, name: f.name.trim(), price_paise: Math.round(Number(f.price) * 100), stock_qty: f.stock === "" ? null : Number(f.stock), in_stock: f.in_stock };
    try {
      const saved = await api<Product>(p ? `products/${p.id}` : "products", { method: p ? "PATCH" : "POST", body: JSON.stringify(body) });
      setCached<Product[]>("products", (list) => (p ? (list ?? []).map((x) => (x.id === saved.id ? saved : x)) : [...(list ?? []), saved]));
      toast(p ? "Product saved" : "Product added");
      onDone();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }

  async function remove() {
    setBusy("delete");
    try {
      await api(`products/${p!.id}`, { method: "DELETE" });
      setCached<Product[]>("products", (list) => (list ?? []).filter((x) => x.id !== p!.id));
      refresh("products");
      toast("Product deleted"); onDone();
    } catch (e) { setErr((e as Error).message); setBusy(""); }
  }

  return (
    <form onSubmit={save} className="space-y-4 text-sm">
      {err && <p role="alert" className="rounded-md bg-[#f8eaea] px-3 py-2 text-maroon">{err}</p>}
      <div className="flex items-start gap-4">
        {f.image_url
          ? <img src={f.image_url} alt="Product photo" className="h-32 w-32 rounded-lg border border-line object-cover" />
          : <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted">No photo</div>}
        <div className="space-y-2">
          <label className="btn-ghost cursor-pointer">
            {busy === "upload" ? "Uploading…" : f.image_url ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {f.image_url && <button type="button" className="block text-maroon underline" onClick={() => setF({ ...f, image_url: "" })}>Remove photo</button>}
          <p className="text-xs text-muted">JPG, PNG or WebP, under 5 MB.<br />Square photos look best.</p>
        </div>
      </div>

      {locked && <p className="rounded-md bg-paper px-3 py-2 text-muted">Name, price and stock come from Sales Management. Change them there and they update here within a minute.</p>}
      <label className="block"><span className="lbl">Name</span><input className="field" required disabled={locked} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="A2 Gir Cow Ghee 500 ml" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="lbl">Price (₹)</span><input className="field" required disabled={locked} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
        <label><span className="lbl">Stock (leave empty to not count)</span><input className="field" disabled={locked} inputMode="numeric" pattern="[0-9]*" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></label>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" disabled={locked} checked={f.in_stock} onChange={(e) => setF({ ...f, in_stock: e.target.checked })} />Available to order (turns off by itself when stock reaches 0)</label>
      <label className="block"><span className="lbl">Description</span><textarea className="field" rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What it is, how it's made, pack size" /></label>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button className="btn" disabled={!!busy}>{busy === "save" ? "Saving…" : p ? "Save product" : "Add product"}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
        {p && !locked && (!confirmDelete
          ? <button type="button" className="ml-auto text-maroon hover:underline" onClick={() => setConfirmDelete(true)}>Delete</button>
          : <span className="ml-auto flex items-center gap-2 text-maroon">Delete for good? <button type="button" className="font-semibold underline" onClick={remove}>Yes, delete</button><button type="button" className="text-muted underline" onClick={() => setConfirmDelete(false)}>No</button></span>)}
      </div>
    </form>
  );
}

