"use client";
import { useEffect, useState } from "react";
import { getIdToken, redirectToIdLogin } from "@/lib/rahtsaaId";

const messages: Record<string, string> = {
  no_subscription: "Your organisation has no active subscription for this app.",
  no_access: "Only members of this shop's organisation can open the admin panel.",
  not_configured: "SHOP_ORG_ID is not configured.",
  unavailable: "The shop backend is unreachable. Try again shortly.",
  wrong_host: "Admin sign-in must be completed on the configured Rahtsaa host.",
};

export default function AdminLogin() {
  const [message, setMessage] = useState("Signing you in with Rahtsaa ID…");
  useEffect(() => {
    (async () => {
      const token = await getIdToken();
      if ("error" in token) {
        if (token.error === "signed_out" && !new URLSearchParams(window.location.search).has("from_id")) return redirectToIdLogin();
        setMessage(messages[token.error] || "Sign-in was rejected.");
        return;
      }
      const response = await fetch("/admin/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.token }) });
      if (response.ok) window.location.assign("/admin");
      else setMessage(messages[(await response.json().catch(() => ({}))).error] || "Sign-in was rejected.");
    })();
  }, []);
  return <div className="flex min-h-screen items-center justify-center bg-kadhai px-4"><div className="w-full max-w-sm rounded-xl bg-[#fffaf0] px-8 py-10 text-center shadow-2xl"><img src="/brand/logo.png" alt="Shatrunjay" className="mx-auto h-24" /><h1 className="mt-5 text-lg font-bold text-kadhai">Shop admin</h1><p className="mt-2 text-sm text-ink/70" role="status">{message}</p></div></div>;
}
