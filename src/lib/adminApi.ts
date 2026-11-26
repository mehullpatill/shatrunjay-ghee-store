"use client";
import { useCallback, useEffect, useState } from "react";

// Calls the panel's own proxy; a 401 means the 8h session ended, so sign in again (silent when Rahtsaa ID is still signed in).
export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/admin/api/leadr/${path}`, { ...init, headers: { "Content-Type": "application/json" } });
  if (r.status === 401) { window.location.assign("/admin/login"); throw new Error("signed out"); }
  if (!r.ok) {
    const d = (await r.json().catch(() => ({}))).detail;
    throw new Error(typeof d === "string" ? d : Array.isArray(d) ? d.map((x: { msg: string }) => x.msg).join(", ") : `Error ${r.status}`);
  }
  return r.status === 204 ? (undefined as T) : r.json();
}

// Stale-while-revalidate cache shared by every page: switching tabs paints the last
// data instantly and refreshes in the background, instead of a blank "Loading…".
const cache = new Map<string, unknown>();
const errors = new Map<string, string>();
const subs = new Map<string, Set<() => void>>();
const notify = (path: string) => subs.get(path)?.forEach((f) => f());

export function setCached<T>(path: string, update: (cur: T | undefined) => T) {
  cache.set(path, update(cache.get(path) as T | undefined));
  notify(path);
}
// Re-fetch every cached view under a prefix, e.g. after an order changes refresh "orders" and "reports".
export function refresh(...prefixes: string[]) {
  for (const k of cache.keys()) {
    if (prefixes.some((p) => k.startsWith(p))) load(k);
  }
}

function load(path: string) {
  return api(path).then(
    (d) => { cache.set(path, d); errors.delete(path); notify(path); },
    (e: Error) => { errors.set(path, e.message); notify(path); },
  );
}

export function useApi<T>(path: string | null) {
  const [, tick] = useState(0);
  const reload = useCallback(() => (path ? load(path) : Promise.resolve()), [path]);
  useEffect(() => {
    if (!path) return;
    const fn = () => tick((n) => n + 1);
    if (!subs.has(path)) subs.set(path, new Set());
    subs.get(path)!.add(fn);
    load(path);
    return () => { subs.get(path)?.delete(fn); };
  }, [path]);
  return { data: path ? (cache.get(path) as T | undefined) : undefined, error: (path && errors.get(path)) || "", reload };
}

