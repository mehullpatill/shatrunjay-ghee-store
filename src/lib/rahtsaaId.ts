"use client";
// Browser side of Rahtsaa ID SSO (port of rahtsaa-id/sdk/js/rahtsaaId.ts for Next).
// The token is for Leadr ("whatsapp-auto"): the admin panel is a Leadr client, so one
// Rahtsaa ID login covers the suite and this panel.
const ID_URL = process.env.NEXT_PUBLIC_RAHTSAA_ID_URL ?? "https://id.rahtsaaai.com";
const AUDIENCE = "whatsapp-auto";

export type TokenResult = { token: string } | { error: "signed_out" | "no_subscription" };

export async function getIdToken(): Promise<TokenResult> {
  const res = await fetch(`${ID_URL}/api/auth/token`, {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audience: AUDIENCE }),
  }).catch(() => null);
  if (res?.status === 402) return { error: "no_subscription" };
  if (!res?.ok) return { error: "signed_out" };
  return { token: (await res.json()).access_token };
}

export const redirectToIdLogin = () => {
  const back = new URL(window.location.href);
  back.searchParams.set("from_id", "1"); // lets the login page stop after one round trip
  window.location.assign(`${ID_URL}/login?next=${encodeURIComponent(back.toString())}`);
};

