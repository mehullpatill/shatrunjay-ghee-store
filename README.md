# Shatrunjay Ghee — Full-Stack Next.js E-Commerce Store

Built with **Next.js (App Router + API Routes)**, **Prisma (PostgreSQL)**, **Tailwind CSS**, **AWS S3**, **Razorpay**, and **Nodemailer (SMTP)**.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your `DATABASE_URL`, `AUTH_SECRET`, `AWS_S3_*`, `RAZORPAY_*`, `SMTP_*`, and `GOOGLE_PLACES_*` keys.
3. **Run Prisma migration & seed:**
   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```
   *(The seed script creates the initial admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, the 13 SKUs, categories, default CMS sections, licenses, and legal pages — all of which can then be edited in `/admin`.)*
4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Key Features

- **100% Admin-Manageable Storefront (`/admin`):** Edit moving header, Hindi/English logos, navigation & social links, floating & static banners, products, making-process steps (max 9), Why Shatrunjay cards, Derasar / Ghee Laabh Yojna / Wholesale archives, Lab Reports (PDF/image + Batch No + Date + Lab Name), Our Story & Licenses (GSTIN, FSSAI, MSME, COI + custom), Contact/Store info, Legal policies, COD pincode list (single + CSV bulk import), and Promo/Coupon/Referral codes.
- **Production-Grade Checkout & Inventory Locking:**
  - Atomic cart inventory reservation (`CartLock` with 15-minute TTL) inside Prisma `$transaction` so concurrent buyers cannot oversell stock.
  - Automated abandoned-cart detection, lock release, and recovery email trigger via `/api/cron/abandoned-carts` (protected by `CRON_SECRET`).
  - Pincode-based COD eligibility check (`2–3 days` Mumbai via Shatrunjay Team/Porter; `5–7 working days` outside Mumbai via courier).
  - Razorpay order creation, HMAC-SHA256 payment verification, and idempotent webhook handler.
- **Security Hardening:**
  - HMAC-SHA256 signed HTTP-only `SameSite=Lax` session cookies, `scrypt` per-user salted password hashing, Edge Middleware + server-side `requireAdmin()` RBAC on every `/admin` and `/api/admin/*` route, Zod input validation, and security response headers.
