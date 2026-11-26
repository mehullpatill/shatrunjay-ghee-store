export type Item = { id: string; product_id: string | null; product_name: string; quantity: number; unit_price_paise: number };
export type Order = {
  id: string; contact_id: string; order_number: string | null; source: string; status: string; payment_method: string | null;
  subtotal_paise: number; shipping_paise: number; discount_paise: number; total_paise: number; paid_paise: number;
  created_at: string; updated_at: string; vyapar_invoice_number: string | null; needs_human_help?: boolean;
  shipping_address: { name?: string; phone?: string; email?: string; address_line?: string; area?: string; city?: string; state?: string; pincode?: string };
  contact_name?: string | null; contact_phone?: string | null;
  items: Item[]; events: { at: string; by: string | null; action: string }[];
};
export type Product = {
  id: string; name: string; description: string; price_paise: number; image_url: string | null; in_stock: boolean;
  stock_qty: number | null; synced_from: string | null; pack_label: string | null; created_at: string;
};
export type Payment = { id: string; method: string; amount_paise: number; status: string; paid_on: string | null; note: string | null; source: string; created_at: string };
export type Promo = {
  // flat discount_value is paise; 0 in a limit means "no limit".
  id: string; code: string; description: string; discount_type: "percent" | "flat"; discount_value: number;
  min_order_paise: number; max_discount_paise: number; usage_limit: number; per_contact_limit: number;
  starts_at: string | null; expires_at: string | null; is_active: boolean; times_used: number; discount_given_paise: number;
};
export type Referral = { contact_id: string; name: string | null; phone: string | null; referral_code: string | null; orders_referred: number; revenue_paise: number; discount_given_paise: number };
export type Report = {
  total_orders: number; total_revenue_paise: number; collected_paise: number; outstanding_paise: number;
  daily: { date: string; orders: number; revenue_paise: number }[];
  by_status: Record<string, number>; by_payment_method: Record<string, number>;
  top_products: { name: string; quantity: number; revenue_paise: number }[];
  first_vs_repeat: { first: number; repeat: number };
};

