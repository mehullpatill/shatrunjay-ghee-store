import { cache } from "react";
import { getEnv, requireEnvValue } from "./env";

/** Server-only client for the shared Leadr commerce backend. */
export type LeadrProduct = {
  id: string;
  name: string;
  description: string;
  price_paise: number;
  image_url: string | null;
  video_url: string | null;
  in_stock: boolean;
  stock_qty: number | null;
  parent_product_id: string | null;
  pack_label: string | null;
};

export type LeadrSite = {
  site_content: Record<string, unknown>;
  shipping_charge_paise: number;
  min_order_amount_paise: number;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
  delivery_time_text: string;
  otp_required?: boolean;
};

export function isLeadrCommerce(): boolean {
  return getEnv().COMMERCE_BACKEND === "leadr";
}

function getBaseUrl(): string {
  const env = getEnv();
  return requireEnvValue(env.LEADR_API_URL, "LEADR_API_URL").replace(/\/$/, "");
}

export async function leadr(path: string, init: RequestInit = {}): Promise<Response> {
  const env = getEnv();
  const apiKey = requireEnvValue(env.LEADR_API_KEY, "LEADR_API_KEY");
  return fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...init.headers,
    },
    cache: "no-store",
  });
}

export const getLeadrProducts = cache(async (): Promise<LeadrProduct[]> => {
  const response = await leadr("/storefront/products").catch(() => null);
  if (!response?.ok) return [];
  return (await response.json()) as LeadrProduct[];
});

export const getLeadrSite = cache(async (): Promise<LeadrSite | null> => {
  const response = await leadr("/storefront/site").catch(() => null);
  if (!response?.ok) return null;
  return (await response.json()) as LeadrSite;
});

// Compatibility names used by the client-delivered storefront/admin modules.
export const getProducts = getLeadrProducts;
export const getSite = getLeadrSite;
