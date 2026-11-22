"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupees } from "@/lib/pricing";

interface VariantRow {
  id: string;
  label: string;
  sku: string | null;
  pricePaise: number;
  mrpPaise: number;
  stockQty: number;
  isPlaceholderPrice: boolean;
  active: boolean;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  category: { id: string; name: string };
  isFeatured: boolean;
  isMostBought: boolean;
  isFreshArrival: boolean;
  active: boolean;
  variants: VariantRow[];
  images: Array<{ id: string; url: string; alt: string | null; sortOrder: number }>;
}

export default function AdminProductsClient({
  categories,
  products,
}: {
  categories: Array<{ id: string; name: string; slug: string }>;
  products: ProductRow[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  // New Product Form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [shortDescription, setShortDescription] = useState("");
  const [imageEditors, setImageEditors] = useState<Record<string, string>>({});

  // Edit Variant Price/SKU
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [vPriceRupees, setVPriceRupees] = useState("");
  const [vMrpRupees, setVMrpRupees] = useState("");
  const [vSku, setVSku] = useState("");
  const [vStock, setVStock] = useState("");

  const callApi = async (payload: Record<string, unknown>) => {
    setMsg("");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = (await res.json()) as { error?: string };
    if (!res.ok) setMsg(d.error || "Action failed");
    else {
      setMsg("Saved successfully.");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-kadhai">Products &amp; Catalogue</h1>
        <button
          type="button"
          onClick={() => callApi({ action: "confirm_all_prices" })}
          className="btn-ghost text-xs"
        >
          Confirm All Placeholder Prices
        </button>
      </div>

      {msg && <p className="rounded-lg bg-butter px-4 py-2 text-sm font-medium text-kadhai">{msg}</p>}

      {/* Add Product */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          callApi({
            action: "upsert_product",
            categoryId,
            name,
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            shortDescription,
            active: true,
          });
          setName("");
          setSlug("");
          setShortDescription("");
        }}
        className="panel p-5 space-y-3"
      >
        <h2 className="text-lg font-bold text-kadhai">Add New Product</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" className="field" />
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="SEO Slug (optional)" className="field" />
        </div>
        <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Short description" className="field" />
        <button type="submit" className="btn">Create Product</button>
      </form>

      {/* Product & Variant List */}
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.id} className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-kadhai">{p.name}</h3>
                <p className="text-xs text-muted">
                  Category: {p.category.name} • Slug: {p.slug}
                  {p.isFeatured && " • Featured"}
                  {p.isMostBought && " • Most Bought"}
                  {p.isFreshArrival && " • Fresh Arrival"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-line bg-butter p-4">
              <p className="text-sm font-bold text-kadhai">Product images</p>
              <p className="mt-1 text-xs text-muted">Add one image URL per line. The first image becomes the main product image.</p>
              <textarea rows={4} value={imageEditors[p.id] ?? p.images.map((img) => img.url).join("\n")} onChange={(e) => setImageEditors((prev) => ({ ...prev, [p.id]: e.target.value }))} placeholder="https://.../product-image.jpg" className="field mt-2 w-full" />
              <button type="button" onClick={() => { const imageUrls = (imageEditors[p.id] ?? p.images.map((img) => img.url).join("\n")).split("\n").map((url) => url.trim()).filter(Boolean); callApi({ action: "update_product_images", id: p.id, imageUrls }); }} className="btn mt-2 text-xs">Save product images</button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th className="py-1.5">Variant</th>
                    <th className="py-1.5">SKU</th>
                    <th className="py-1.5">Price</th>
                    <th className="py-1.5">MRP</th>
                    <th className="py-1.5">Stock</th>
                    <th className="py-1.5">Status</th>
                    <th className="py-1.5 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {p.variants.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2 font-medium">{v.label}</td>
                      <td className="py-2 font-mono text-xs">{v.sku || "— (unset)"}</td>
                      <td className="py-2 font-bold">
                        {formatRupees(v.pricePaise)}
                        {v.isPlaceholderPrice && (
                          <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                            Placeholder
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-muted">{formatRupees(v.mrpPaise)}</td>
                      <td className="py-2">{v.stockQty}</td>
                      <td className="py-2 text-xs">{v.active ? "Active" : "Hidden"}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVariantId(v.id);
                            setVPriceRupees(String(v.pricePaise / 100));
                            setVMrpRupees(String(v.mrpPaise / 100));
                            setVSku(v.sku || "");
                            setVStock(String(v.stockQty));
                          }}
                          className="text-xs font-semibold text-maroon hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editingVariantId && p.variants.some((v) => v.id === editingVariantId) && (
              <div className="mt-4 rounded-xl bg-butter p-4">
                <p className="text-xs font-bold text-kadhai">Edit Variant</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  <input type="text" value={vSku} onChange={(e) => setVSku(e.target.value)} placeholder="SKU (optional)" className="field" />
                  <input type="number" step="1" value={vPriceRupees} onChange={(e) => setVPriceRupees(e.target.value)} placeholder="Price (₹)" className="field" />
                  <input type="number" step="1" value={vMrpRupees} onChange={(e) => setVMrpRupees(e.target.value)} placeholder="MRP (₹)" className="field" />
                  <input type="number" value={vStock} onChange={(e) => setVStock(e.target.value)} placeholder="Stock" className="field" />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = p.variants.find((v) => v.id === editingVariantId)!;
                      callApi({
                        action: "upsert_variant",
                        id: target.id,
                        productId: p.id,
                        label: target.label,
                        sku: vSku || null,
                        pricePaise: Math.round(Number(vPriceRupees) * 100),
                        mrpPaise: Math.round(Number(vMrpRupees) * 100),
                        stockQty: Number(vStock),
                        isPlaceholderPrice: false,
                        active: target.active,
                      });
                      setEditingVariantId(null);
                    }}
                    className="btn text-xs"
                  >
                    Save &amp; Confirm Price
                  </button>
                  <button type="button" onClick={() => setEditingVariantId(null)} className="btn-ghost text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
