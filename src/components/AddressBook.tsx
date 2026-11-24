"use client";
import { useState, useCallback } from "react";

export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressFormData {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormData = {
  label: "Home",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function AddressForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: AddressFormData;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState<AddressFormData>(initial);
  const set = (k: keyof AddressFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Label (e.g. Home / Office) *</span>
          <input type="text" required maxLength={40} value={form.label} onChange={set("label")} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Recipient Name *</span>
          <input type="text" required maxLength={100} value={form.recipientName} onChange={set("recipientName")} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Phone *</span>
          <input type="tel" required minLength={10} maxLength={15} value={form.phone} onChange={set("phone")} className="field" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Address Line 1 *</span>
        <input type="text" required maxLength={200} value={form.line1} onChange={set("line1")} className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Address Line 2 (optional)</span>
        <input type="text" maxLength={200} value={form.line2} onChange={set("line2")} className="field" />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">City *</span>
          <input type="text" required maxLength={80} value={form.city} onChange={set("city")} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">State *</span>
          <input type="text" required maxLength={80} value={form.state} onChange={set("state")} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Pincode *</span>
          <input
            type="text"
            required
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "") }))}
            className="field"
            placeholder="400004"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={set("isDefault")}
          className="h-4 w-4 rounded border-line accent-maroon"
        />
        <span>Set as default address</span>
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="btn">
          {saving ? "Saving…" : "Save Address"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  deleting,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-4 transition-shadow ${
        address.isDefault ? "border-maroon bg-maroon/5 shadow-sm" : "border-line bg-white hover:shadow-sm"
      }`}
    >
      {address.isDefault && (
        <span className="absolute right-3 top-3 rounded-full bg-maroon px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Default
        </span>
      )}
      <p className="pr-16 font-bold text-kadhai">{address.label}</p>
      <p className="mt-1 text-sm text-ink">{address.recipientName}</p>
      <p className="text-sm text-muted">{address.phone}</p>
      <p className="mt-1 text-sm text-muted">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
      </p>
      <p className="text-sm text-muted">
        {address.city}, {address.state} – {address.pincode}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-maroon hover:underline"
        >
          Edit
        </button>
        {!address.isDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            className="text-xs font-semibold text-muted hover:text-kadhai hover:underline"
          >
            Set as Default
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default function AddressBook({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const refreshList = useCallback(async () => {
    const res = await fetch("/api/account/addresses");
    if (res.ok) {
      const data = (await res.json()) as { addresses: Address[] };
      setAddresses(data.addresses);
    }
  }, []);

  const handleSave = async (data: AddressFormData) => {
    setSaving(true);
    setFormError("");
    const isEdit = mode === "edit" && editing;
    const url = isEdit ? `/api/account/addresses?id=${editing.id}` : "/api/account/addresses";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, line2: data.line2 || null }),
    });
    const json = (await res.json()) as { address?: Address; error?: string };
    if (!res.ok) {
      setFormError(json.error || "Failed to save address.");
      setSaving(false);
      return;
    }
    await refreshList();
    setMode("list");
    setEditing(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
    setDeletingId(null);
  };

  const handleSetDefault = async (id: string) => {
    // Use PATCH with isDefault: true to flip default
    const addr = addresses.find((a) => a.id === id)!;
    const res = await fetch(`/api/account/addresses?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addr, line2: addr.line2 || null, isDefault: true }),
    });
    if (res.ok) {
      await refreshList();
    }
  };

  const startEdit = (addr: Address) => {
    setEditing(addr);
    setFormError("");
    setMode("edit");
  };

  const startAdd = () => {
    setEditing(null);
    setFormError("");
    setMode("add");
  };

  const cancel = () => {
    setMode("list");
    setEditing(null);
    setFormError("");
  };

  const formInitial: AddressFormData =
    mode === "edit" && editing
      ? { ...editing, line2: editing.line2 || "" }
      : EMPTY_FORM;

  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-kadhai">Saved Addresses</h2>
        {mode === "list" && addresses.length < 10 && (
          <button type="button" onClick={startAdd} className="btn text-sm px-4 py-2">
            + Add Address
          </button>
        )}
      </div>

      {mode !== "list" ? (
        <div className="mt-5">
          <h3 className="mb-4 text-base font-semibold text-kadhai">
            {mode === "add" ? "Add New Address" : "Edit Address"}
          </h3>
          <AddressForm
            initial={formInitial}
            onSave={handleSave}
            onCancel={cancel}
            saving={saving}
            error={formError}
          />
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-paper p-6 text-center">
          <p className="text-sm text-muted">No saved addresses yet.</p>
          <button type="button" onClick={startAdd} className="btn mt-3">
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => startEdit(addr)}
              onDelete={() => handleDelete(addr.id)}
              onSetDefault={() => handleSetDefault(addr.id)}
              deleting={deletingId === addr.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
