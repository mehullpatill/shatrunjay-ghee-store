import type { Product } from "./leadr";

export type Family = "a2" | "cow" | "buffalo";
export const FAMILIES: Record<Family, { name: string; short: string; line: string; pack: string; tone: string; ink: string }> = {
  a2: { name: "A2 Gir Cow Ghee", short: "A2 Gir Cow", line: "Bilona made from desi cow curd. Rich aroma, granular texture.", pack: "/brand/photos/pack-a2.jpg", tone: "#1d4a2f", ink: "#fff" },
  cow: { name: "Pure Cow Ghee", short: "Pure Cow", line: "Rich aroma for everyday cooking, pooja and festive sweets.", pack: "/brand/photos/pack-cow.jpg", tone: "#f2c230", ink: "#2a1a14" },
  buffalo: { name: "Pure Buffalo Ghee", short: "Pure Buffalo", line: "Naturally milky white, thicker and fuller for traditional recipes.", pack: "/brand/photos/pack-buffalo.jpg", tone: "#efe6d2", ink: "#2a1a14" },
};

export const familyOf = (name: string): Family => (/a2|gir/i.test(name) ? "a2" : /buffalo/i.test(name) ? "buffalo" : "cow");

export function sizeOf(p: Pick<Product, "name" | "pack_label">) {
  if (p.pack_label) return p.pack_label;
  const m = p.name.match(/(\d+(?:\.\d+)?\s*(?:ml|litres?|kg|g)\b(?:\s*\([^)]*\))?)/i);
  return m ? m[1] : "";
}

export const litres = (p: Pick<Product, "name" | "pack_label">) => {
  const m = sizeOf(p).match(/(\d+(?:\.\d+)?)\s*(ml|litres?|kg|g)/i);
  if (!m) return 0;
  return /ml|^g$/i.test(m[2]) ? Number(m[1]) / 1000 : Number(m[1]);
};
