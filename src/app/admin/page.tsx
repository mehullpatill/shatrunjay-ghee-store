"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { S3UploadButton } from "@/components/S3UploadButton";
import { LogOut, Plus, Trash2, Save } from "lucide-react";

type TabKey =
  | "products"
  | "orders"
  | "carts"
  | "pincodes"
  | "discounts"
  | "cms"
  | "archives"
  | "reports"
  | "settings";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("products");
  const [msg, setMsg] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [carts, setCarts] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [cms, setCms] = useState<any>({});
  const [archives, setArchives] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    slug: "",
    categoryId: "",
    priceInr: 0,
    mrpInr: 0,
    volumeLabel: "",
    stockQty: 100,
    imageUrl: "",
    isFeatured: false,
    isMostBought: false,
    isFreshArrival: false,
  });
  const [csvPincodes, setCsvPincodes] = useState("");
  const [newCode, setNewCode] = useState({
    code: "",
    kind: "PROMO",
    discountType: "PERCENT",
    value: 10,
    maxDiscountInr: "",
    minOrderInr: 0,
    showOnSite: false,
  });
  const [newArchive, setNewArchive] = useState({
    archiveType: "DERASAR_JINALAY",
    title: "",
    location: "",
    imageUrl: "",
  });
  const [newReport, setNewReport] = useState({
    batchNo: "",
    reportDate: "",
    labName: "",
    fileUrl: "",
    thumbnailUrl: "",
    fileType: "PDF",
  });
  const [newMovingText, setNewMovingText] = useState("");
  const [newLicense, setNewLicense] = useState({ name: "", number: "" });

  const notify = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 4000);
  };

  const loadAll = async () => {
    const [p, o, c, pin, d, cm, ar, rep, st] = await Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/orders").then((r) => r.json()),
      fetch("/api/admin/abandoned-carts").then((r) => r.json()),
      fetch("/api/admin/pincodes").then((r) => r.json()),
      fetch("/api/admin/discounts").then((r) => r.json()),
      fetch("/api/admin/cms").then((r) => r.json()),
      fetch("/api/admin/archives").then((r) => r.json()),
      fetch("/api/admin/lab-reports").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setProducts(p.products || []);
    setCategories(p.categories || []);
    if (p.categories?.[0] && !newProduct.categoryId) {
      setNewProduct((prev) => ({ ...prev, categoryId: p.categories[0].id }));
    }
    setOrders(o.orders || []);
    setCarts(c.carts || []);
    setPincodes(pin.pincodes || []);
    setCodes(d.codes || []);
    setCms(cm || {});
    setArchives(ar.archives || []);
    setReports(rep.reports || []);
    setSettings(st.settings || null);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const TABS: Array<{ key: TabKey; label: string }> = [
    { key: "products", label: "Products" },
    { key: "orders", label: "Orders & Tracking" },
    { key: "carts", label: "Abandoned & Locked Carts" },
    { key: "pincodes", label: "COD Pincodes" },
    { key: "discounts", label: "Promo / Coupon / Referral" },
    { key: "cms", label: "CMS & Making Process" },
    { key: "archives", label: "Archives" },
    { key: "reports", label: "Lab Reports" },
    { key: "settings", label: "Site Settings & All Links" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-espresso p-5 text-cream">
        <div>
          <h1 className="font-serif text-2xl font-bold">Shatrunjay Admin Panel</h1>
          <p className="text-xs text-cream/75">Manage products, COD pincodes, orders, CMS, links, S3 media & discounts</p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cream/10 px-4 py-2 text-xs font-semibold text-cream hover:bg-cream/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>

      {msg && <div className="rounded-xl bg-leaf/15 px-4 py-2.5 text-xs font-semibold text-leaf">{msg}</div>}

      <div className="flex flex-wrap gap-2 border-b border-espresso/10 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              tab === t.key ? "bg-espresso text-cream" : "bg-white text-espresso border border-espresso/10 hover:bg-cream-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...newProduct,
                  imagesJson: newProduct.imageUrl ? [newProduct.imageUrl] : [],
                }),
              });
              if (res.ok) {
                notify("Product created");
                loadAll();
              }
            }}
            className="rounded-2xl border border-espresso/10 bg-white p-5 space-y-4"
          >
            <h2 className="font-serif text-lg font-bold">Add New Product</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <input required placeholder="SKU (e.g. CG1L)" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <input required placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <input required placeholder="Slug (e.g. cow-ghee-1l)" value={newProduct.slug} onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <select value={newProduct.categoryId} onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })} className="rounded-lg border px-3 py-2 text-xs">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" required placeholder="Price INR" value={newProduct.priceInr} onChange={(e) => setNewProduct({ ...newProduct, priceInr: Number(e.target.value) })} className="rounded-lg border px-3 py-2 text-xs" />
              <input type="number" placeholder="MRP INR" value={newProduct.mrpInr} onChange={(e) => setNewProduct({ ...newProduct, mrpInr: Number(e.target.value) })} className="rounded-lg border px-3 py-2 text-xs" />
              <input type="number" placeholder="Stock Qty" value={newProduct.stockQty} onChange={(e) => setNewProduct({ ...newProduct, stockQty: Number(e.target.value) })} className="rounded-lg border px-3 py-2 text-xs" />
              <div className="flex items-center gap-2">
                <S3UploadButton folder="products" label="Upload Image" onUploaded={(url) => setNewProduct({ ...newProduct, imageUrl: url })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={newProduct.isFeatured} onChange={(e) => setNewProduct({ ...newProduct, isFeatured: e.target.checked })} /> Featured</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={newProduct.isMostBought} onChange={(e) => setNewProduct({ ...newProduct, isMostBought: e.target.checked })} /> Most Bought</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={newProduct.isFreshArrival} onChange={(e) => setNewProduct({ ...newProduct, isFreshArrival: e.target.checked })} /> Fresh Arrival</label>
            </div>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-espresso px-4 py-2 text-xs font-semibold text-cream">
              <Plus className="h-3.5 w-3.5" /> Save Product
            </button>
          </form>

          <div className="overflow-x-auto rounded-2xl border border-espresso/10 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-soft text-espresso">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Price (₹)</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-espresso/10">
                    <td className="p-3 font-mono font-bold">{p.sku}</td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        defaultValue={p.priceInr}
                        onBlur={async (e) => {
                          await fetch("/api/admin/products", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: p.id, priceInr: Number(e.target.value) }),
                          });
                          notify(`Updated ${p.sku} price`);
                        }}
                        className="w-24 rounded border px-2 py-1"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        defaultValue={p.stockQty}
                        onBlur={async (e) => {
                          await fetch("/api/admin/products", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: p.id, stockQty: Number(e.target.value) }),
                          });
                          notify(`Updated ${p.sku} stock`);
                        }}
                        className="w-20 rounded border px-2 py-1"
                      />
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      <S3UploadButton
                        folder="products"
                        label="Set Img"
                        onUploaded={async (url) => {
                          await fetch("/api/admin/products", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: p.id, imagesJson: [url] }),
                          });
                          notify(`Updated ${p.sku} image`);
                          loadAll();
                        }}
                      />
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" });
                          loadAll();
                        }}
                        className="text-red-600 hover:underline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-espresso/10 bg-white p-5 space-y-3 text-xs">
              <div className="flex flex-wrap justify-between gap-2 border-b pb-2">
                <div>
                  <span className="font-mono text-sm font-bold">#{o.orderNumber}</span> — {o.customerName} ({o.customerEmail}, {o.customerPhone})
                  <p className="text-taupe">{o.shippingAddress}, {o.city}, {o.state} - {o.pincode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">₹{o.totalInr}</p>
                  <p className="text-taupe">{o.paymentMethod} • {o.paymentStatus}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-5 items-center">
                <select
                  defaultValue={o.orderStatus}
                  onChange={async (e) => {
                    await fetch("/api/admin/orders", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: o.id, orderStatus: e.target.value }),
                    });
                    notify(`Order #${o.orderNumber} status updated`);
                    loadAll();
                  }}
                  className="rounded-lg border px-2.5 py-1.5"
                >
                  {["PLACED", "CONFIRMED", "PACKED", "DISPATCHED", "DELIVERED", "CANCELLED"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  placeholder="Courier Name"
                  defaultValue={o.courierName || ""}
                  onBlur={async (e) => {
                    await fetch("/api/admin/orders", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: o.id, courierName: e.target.value }),
                    });
                    notify("Courier saved");
                  }}
                  className="rounded-lg border px-2.5 py-1.5"
                />
                <input
                  placeholder="Tracking Number"
                  defaultValue={o.trackingNumber || ""}
                  onBlur={async (e) => {
                    await fetch("/api/admin/orders", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: o.id, trackingNumber: e.target.value }),
                    });
                    notify("Tracking number saved");
                  }}
                  className="rounded-lg border px-2.5 py-1.5"
                />
                <input
                  type="date"
                  defaultValue={o.courierDispatchDate ? o.courierDispatchDate.slice(0, 10) : ""}
                  onChange={async (e) => {
                    await fetch("/api/admin/orders", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: o.id, courierDispatchDate: e.target.value }),
                    });
                    notify("Dispatch date saved");
                  }}
                  className="rounded-lg border px-2.5 py-1.5"
                />
                <S3UploadButton
                  folder="dispatch"
                  label="Attach Dispatch Img"
                  onUploaded={async (url) => {
                    await fetch("/api/admin/orders", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: o.id, courierImageUrl: url }),
                    });
                    notify("Dispatch image attached");
                    loadAll();
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "carts" && (
        <div className="space-y-3">
          {carts.map((c) => (
            <div key={c.id} className="rounded-2xl border border-espresso/10 bg-white p-4 text-xs flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-bold text-espresso">Status: {c.status} • {c.emailForRecovery || "Guest (no email yet)"}</p>
                <p className="text-taupe">Last activity: {new Date(c.lastActivityAt).toLocaleString()}</p>
                {c.lockedUntil && <p className="text-ghee-dark font-semibold">Locked until: {new Date(c.lockedUntil).toLocaleTimeString()}</p>}
              </div>
              <div>
                {c.items.map((i: any) => (
                  <p key={i.id}>{i.product.name} ({i.product.sku}) × {i.quantity}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "pincodes" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-espresso/10 bg-white p-5 space-y-3">
            <h2 className="font-serif text-lg font-bold">Bulk Import COD Pincodes (CSV format)</h2>
            <p className="text-xs text-taupe">Paste lines as: <code className="bg-cream-soft px-1">400001,Mumbai,Maharashtra,true</code></p>
            <textarea
              rows={4}
              value={csvPincodes}
              onChange={(e) => setCsvPincodes(e.target.value)}
              placeholder={"400001,Mumbai,Maharashtra,true\n400002,Mumbai,Maharashtra,true"}
              className="w-full rounded-xl border p-3 text-xs font-mono"
            />
            <button
              onClick={async () => {
                const entries = csvPincodes
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [pincode, city, state, isMumbai] = line.split(",").map((s) => s.trim());
                    return { pincode, city, state, isMumbai: isMumbai === "true" || pincode?.startsWith("400") };
                  });
                const res = await fetch("/api/admin/pincodes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ entries }),
                });
                const d = await res.json();
                notify(`Imported ${d.imported} COD pincodes`);
                setCsvPincodes("");
                loadAll();
              }}
              className="rounded-xl bg-espresso px-5 py-2 text-xs font-semibold text-cream"
            >
              Import Pincodes
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 md:grid-cols-6">
            {pincodes.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs">
                <span><strong>{p.pincode}</strong> {p.isMumbai ? "(Mumbai)" : ""}</span>
                <button
                  onClick={async () => {
                    await fetch(`/api/admin/pincodes?id=${p.id}`, { method: "DELETE" });
                    loadAll();
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "discounts" && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/admin/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...newCode,
                  maxDiscountInr: newCode.maxDiscountInr ? Number(newCode.maxDiscountInr) : null,
                }),
              });
              notify("Discount code created");
              loadAll();
            }}
            className="rounded-2xl border border-espresso/10 bg-white p-5 space-y-3"
          >
            <h2 className="font-serif text-lg font-bold">Create Promo / Coupon Code</h2>
            <div className="grid gap-3 sm:grid-cols-5">
              <input required placeholder="CODE (e.g. SHUDDH10)" value={newCode.code} onChange={(e) => setNewCode({ ...newCode, code: e.target.value })} className="rounded-lg border px-3 py-2 text-xs uppercase" />
              <select value={newCode.kind} onChange={(e) => setNewCode({ ...newCode, kind: e.target.value })} className="rounded-lg border px-3 py-2 text-xs">
                <option value="PROMO">PROMO (Public)</option>
                <option value="COUPON">COUPON (Exclusive)</option>
              </select>
              <select value={newCode.discountType} onChange={(e) => setNewCode({ ...newCode, discountType: e.target.value })} className="rounded-lg border px-3 py-2 text-xs">
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
              <input type="number" required placeholder="Value" value={newCode.value} onChange={(e) => setNewCode({ ...newCode, value: Number(e.target.value) })} className="rounded-lg border px-3 py-2 text-xs" />
              <input type="number" placeholder="Upper Limit ₹ (opt)" value={newCode.maxDiscountInr} onChange={(e) => setNewCode({ ...newCode, maxDiscountInr: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
            </div>
            <button type="submit" className="rounded-xl bg-espresso px-5 py-2 text-xs font-semibold text-cream">Create Code</button>
          </form>

          <div className="space-y-2">
            {codes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-xs">
                <div>
                  <span className="font-mono font-bold">{c.code}</span> ({c.kind}) — {c.discountType === "PERCENT" ? `${c.value}%` : `₹${c.value}`}
                  {c.maxDiscountInr && ` (Max ₹${c.maxDiscountInr})`} • Used: {c.usedCount}
                </div>
                <button onClick={async () => { await fetch(`/api/admin/discounts?id=${c.id}`, { method: "DELETE" }); loadAll(); }} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "cms" && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 space-y-3">
            <h2 className="font-serif text-lg font-bold">Moving Header Lines (with Emojis)</h2>
            <div className="flex gap-2">
              <input value={newMovingText} onChange={(e) => setNewMovingText(e.target.value)} placeholder="✨ Add announcement with emojis..." className="flex-1 rounded-lg border px-3 py-2 text-xs" />
              <button
                onClick={async () => {
                  await fetch("/api/admin/cms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ resource: "movingHeader", data: { textWithEmoji: newMovingText, sortOrder: 1 } }),
                  });
                  setNewMovingText("");
                  loadAll();
                }}
                className="rounded-lg bg-espresso px-4 py-2 text-xs font-semibold text-cream"
              >
                Add
              </button>
            </div>
            {(cms.movingHeader || []).map((m: any) => (
              <div key={m.id} className="flex justify-between text-xs border-t pt-2">
                <span>{m.textWithEmoji}</span>
                <button onClick={async () => { await fetch("/api/admin/cms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "movingHeader", action: "delete", data: { id: m.id } }) }); loadAll(); }} className="text-red-600">Delete</button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-3">
            <h2 className="font-serif text-lg font-bold">Licenses (Our Story & Footer)</h2>
            <div className="flex gap-2">
              <input placeholder="License Name (e.g. ISO)" value={newLicense.name} onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <input placeholder="Number" value={newLicense.number} onChange={(e) => setNewLicense({ ...newLicense, number: e.target.value })} className="flex-1 rounded-lg border px-3 py-2 text-xs" />
              <button
                onClick={async () => {
                  await fetch("/api/admin/cms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ resource: "license", data: newLicense }),
                  });
                  setNewLicense({ name: "", number: "" });
                  loadAll();
                }}
                className="rounded-lg bg-espresso px-4 py-2 text-xs font-semibold text-cream"
              >
                Add License
              </button>
            </div>
            {(cms.licenses || []).map((lic: any) => (
              <div key={lic.id} className="flex justify-between text-xs border-t pt-2">
                <span><strong>{lic.name}:</strong> {lic.number}</span>
                <button onClick={async () => { await fetch("/api/admin/cms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: "license", action: "delete", data: { id: lic.id } }) }); loadAll(); }} className="text-red-600">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "archives" && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/admin/archives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newArchive),
              });
              notify("Archive entry added");
              setNewArchive({ archiveType: "DERASAR_JINALAY", title: "", location: "", imageUrl: "" });
              loadAll();
            }}
            className="rounded-2xl border bg-white p-5 space-y-3"
          >
            <h2 className="font-serif text-lg font-bold">Add Archive (Derasar / Ghee Laabh Yojna / Wholesale)</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <select value={newArchive.archiveType} onChange={(e) => setNewArchive({ ...newArchive, archiveType: e.target.value })} className="rounded-lg border px-3 py-2 text-xs">
                <option value="DERASAR_JINALAY">Derasar Jinalay</option>
                <option value="GHEE_LAABH_YOJNA">Ghee Laabh Yojna</option>
                <option value="WHOLESALE">Wholesale Supply</option>
              </select>
              <input required placeholder="Name / Jinalay" value={newArchive.title} onChange={(e) => setNewArchive({ ...newArchive, title: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <input placeholder="Location" value={newArchive.location} onChange={(e) => setNewArchive({ ...newArchive, location: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <S3UploadButton folder="archives" label="Upload Photo" onUploaded={(url) => setNewArchive({ ...newArchive, imageUrl: url })} />
            </div>
            <button type="submit" className="rounded-xl bg-espresso px-4 py-2 text-xs font-semibold text-cream">Add Entry</button>
          </form>
          <div className="grid gap-3 sm:grid-cols-3">
            {archives.map((a) => (
              <div key={a.id} className="flex justify-between rounded-xl border bg-white p-3 text-xs">
                <div><strong>{a.title}</strong> ({a.archiveType})<p className="text-taupe">{a.location}</p></div>
                <button onClick={async () => { await fetch(`/api/admin/archives?id=${a.id}`, { method: "DELETE" }); loadAll(); }} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/admin/lab-reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newReport),
              });
              notify("Lab report added");
              loadAll();
            }}
            className="rounded-2xl border bg-white p-5 space-y-3"
          >
            <h2 className="font-serif text-lg font-bold">Upload Lab Report (PDF / Image)</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              <input required placeholder="Batch No" value={newReport.batchNo} onChange={(e) => setNewReport({ ...newReport, batchNo: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <input type="date" required value={newReport.reportDate} onChange={(e) => setNewReport({ ...newReport, reportDate: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <input required placeholder="Laboratory Name" value={newReport.labName} onChange={(e) => setNewReport({ ...newReport, labName: e.target.value })} className="rounded-lg border px-3 py-2 text-xs" />
              <S3UploadButton folder="lab-reports" accept="application/pdf,image/*" label="Upload PDF/Img" onUploaded={(url) => setNewReport({ ...newReport, fileUrl: url })} />
            </div>
            <button type="submit" className="rounded-xl bg-espresso px-4 py-2 text-xs font-semibold text-cream">Save Lab Report</button>
          </form>
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex justify-between rounded-xl border bg-white p-3 text-xs">
                <span><strong>Batch {r.batchNo}</strong> — {r.labName} ({new Date(r.reportDate).toLocaleDateString()})</span>
                <button onClick={async () => { await fetch(`/api/admin/lab-reports?id=${r.id}`, { method: "DELETE" }); loadAll(); }} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && settings && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/admin/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(settings),
            });
            notify("All site settings & links saved!");
          }}
          className="rounded-2xl border border-espresso/10 bg-white p-6 space-y-4 text-xs"
        >
          <h2 className="font-serif text-lg font-bold">Site Settings, Logos & All Links</h2>
          <div className="flex flex-wrap gap-4">
            <S3UploadButton folder="branding" accept="image/*" label="Upload Hindi Logo (S3)" onUploaded={(url) => setSettings({ ...settings, hindiLogoUrl: url })} />
            <S3UploadButton folder="branding" accept="image/*" label="Upload English Logo (S3)" onUploaded={(url) => setSettings({ ...settings, englishLogoUrl: url })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="font-semibold">WhatsApp Number</label><input value={settings.whatsappNumber || ""} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></div>
            <div><label className="font-semibold">Support Email</label><input value={settings.supportEmail || ""} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></div>
            <div><label className="font-semibold">Store Address</label><input value={settings.storeAddress || ""} onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></div>
            <div><label className="font-semibold">Google Maps URL</label><input value={settings.storeMapUrl || ""} onChange={(e) => setSettings({ ...settings, storeMapUrl: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></div>
            <div><label className="font-semibold">Instagram URL</label><input value={settings.instagramUrl || ""} onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></div>
            <div><label className="font-semibold">LinkedIn URL</label><input value={settings.linkedinUrl || ""} onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></div>
            <div><label className="font-semibold">Facebook URL</label><input value={settings.facebookUrl || ""} onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></div>
            <div><label className="font-semibold">YouTube Shorts URL</label><input value={settings.youtubeUrl || ""} onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></div>
          </div>
          <div>
            <label className="font-semibold">Gujarati Footer Tagline</label>
            <input value={settings.footerTaglineGujarati || ""} onChange={(e) => setSettings({ ...settings, footerTaglineGujarati: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={Boolean(settings.referralSystemEnabled)} onChange={(e) => setSettings({ ...settings, referralSystemEnabled: e.target.checked })} />
            Enable Customer Referral Code Discounts Live
          </label>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-espresso px-5 py-2.5 font-semibold text-cream">
            <Save className="h-3.5 w-3.5" /> Save Settings
          </button>
        </form>
      )}
    </div>
  );
}
