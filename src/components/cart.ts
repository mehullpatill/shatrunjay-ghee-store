"use client";
import { useSyncExternalStore } from "react";

const KEY = "sg-cart";
const listeners = new Set<() => void>();
const read = () => { try { return localStorage.getItem(KEY) ?? "{}"; } catch { return "{}"; } };
export const getCart = (): Record<string, number> => JSON.parse(read());
export function setCart(c: Record<string, number>) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
  listeners.forEach((l) => l());
}
export const addToCart = (id: string, n = 1) => setCart({ ...getCart(), [id]: Math.min((getCart()[id] ?? 0) + n, 100) });
export function useCart(): Record<string, number> {
  const raw = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, read, () => "{}");
  return JSON.parse(raw);
}
