import { cache } from "react";
import { prisma } from "./prisma";
import { getAvailableStock } from "./cart-engine";

export type Product = {
  id: string;
  sku?: string;
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

export type SiteInfo = {
  site_content: Record<string, unknown>;
  shipping_charge_paise: number;
  min_order_amount_paise: number;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
  delivery_time_text: string;
  otp_required?: boolean;
};

export const getProducts = cache(async (): Promise<Product[]> => {
  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return Promise.all(
      rows.map(async (p) => {
        const available = await getAvailableStock(p.id);
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          description: p.description,
          price_paise: p.pricePaise,
          image_url: p.imageUrl,
          video_url: p.videoUrl,
          in_stock: p.inStock && available > 0,
          stock_qty: available,
          parent_product_id: null,
          pack_label: p.packLabel,
        };
      })
    );
  } catch {
    return [];
  }
});

export const getSite = cache(async (): Promise<SiteInfo | null> => {
  try {
    const s = await prisma.siteSetting.findUnique({ where: { id: "default" } });
    if (!s) return null;
    return {
      site_content: (s.siteContentJson ?? {}) as Record<string, unknown>,
      shipping_charge_paise: s.shippingChargePaise,
      min_order_amount_paise: s.minOrderAmountPaise,
      cod_enabled: s.codEnabled,
      online_payment_enabled: s.onlinePaymentEnabled,
      delivery_time_text: s.deliveryTimeText,
      otp_required: s.otpRequired,
    };
  } catch {
    return null;
  }
});
