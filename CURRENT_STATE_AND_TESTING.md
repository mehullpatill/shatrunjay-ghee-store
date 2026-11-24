# Shatrunjay Ghee Store

## Current Codebase and Testing Guide

This document describes the current implementation, what can be managed from the admin panel, how to configure a local testing environment, and the checks required before production launch.

## 1. Technology Stack

- Next.js App Router
- React and TypeScript
- Prisma ORM
- PostgreSQL
- Custom cookie-based authentication
- Amazon S3 presigned uploads
- Razorpay payments
- Amazon SES email delivery
- Upstash Redis rate limiting (optional but recommended)
- Vitest unit/integration tests
- Playwright end-to-end tests

## 2. Main Application Areas

### Storefront

The public storefront currently includes:

- Home page
- Shop and category pages
- Cow ghee, buffalo ghee, A2 desi cow ghee, and groundnut oil pages
- Product detail pages
- Product galleries
- Product variants and pack sizes
- Stock-aware quantity controls
- Guest cart using browser local storage
- Logged-in cart stored in PostgreSQL
- Cart merge after login
- Checkout
- Razorpay payment flow
- Cash on Delivery where the pincode allows it
- Pincode delivery and COD checks
- Customer account and saved addresses
- Order history and order details
- Customer order queries
- Lab reports page
- Contact form
- Bulk order enquiry form
- Login, signup, email verification, forgot password, and password reset
- Legal pages:
  - Privacy Policy
  - Shipping Policy
  - Refund Policy
  - Terms of Service
- Sitemap and robots.txt

### Product management

Products support:

- Categories
- Product name and SEO slug
- Short description
- Full rich description
- Multiple product images
- S3 image upload from the admin form
- Multiple variants or pack sizes
- SKU
- Selling price
- MRP
- Stock quantity
- Featured flag
- Most Bought flag
- Fresh Arrival flag
- Placeholder-price tracking

### Discounts and coupons

The existing discount system supports:

- Public promo codes
- Exclusive coupon codes
- Percentage discounts
- Fixed-amount discounts
- Maximum discount caps
- Minimum order value
- Start date and expiry date
- Total usage limits
- Per-user usage limits
- Referral-code discounts
- Checkout validation before order creation
- Atomic usage recording during checkout

Buy X Get Y and free-shipping coupons are not currently implemented.

### Shipment management

Shipment management currently supports:

- Shipment status:
  - Pending
  - Packed
  - Shipped
  - Out for Delivery
  - Delivered
  - Returned
- Courier name
- Tracking number
- Tracking URL
- Shipment notes
- Shipment event history
- Admin shipment updates from an order page
- Customer shipment status and tracking link on order details
- Existing customer email notification when the order status is changed

Automatic courier API synchronization is not currently implemented.

### Product reviews

The review system currently supports:

- Star ratings from 1 to 5
- Review title
- Review body
- Login-required review submission
- Verified-purchase detection
- Pending moderation state
- Admin approve/reject controls
- Approved reviews displayed on product pages

Review photo uploads and automated post-delivery review requests are not currently implemented.

### Footer and CMS management

The footer is managed from Admin → Settings. It supports editing:

- Brand name
- Logo URL
- Tagline
- Description
- Footer headings
- Phone number
- Contact email
- Address
- Instagram URL
- LinkedIn URL
- Facebook URL
- YouTube URL
- Shop links
- Derasar links
- Wholesale links
- Legal links
- Copyright text
- Compliance text

Link-list format:

```text
Display Label | /internal/path
```

### Homepage and CMS

Admin → CMS manages:

- Homepage and legal page sections
- Ghee-making process blocks
- Process titles and subtitles
- Process video URL
- Up to nine process steps per block
- Step headings and descriptions
- Step photos through S3 upload or image URL
- Banners
- Licenses
- Archive/gallery entries
- Instagram reels

The homepage process-step photo migration is already applied.

## 3. Admin Panel Controls

The admin navigation currently includes:

- Dashboard
- Products & Catalogue
- Orders
- Customers
- Discounts & Referrals
- Pincodes & COD
- CMS & Pages
- Lab Reports
- Product Reviews
- Inbox
- Settings & 2FA
- Audit Log

### Admin security

- Admin routes require an authenticated admin session.
- API routes validate the session and role independently.
- Admin mutations are protected by same-origin checks.
- Important admin actions are recorded in the audit log.
- TOTP-based admin 2FA is available from Admin → Settings.

### Mumbai serviceability and COD

The testing database and seed data contain the business-provided 21-code Mumbai
COD whitelist:

```text
400001, 400002, 400003, 400004, 400005, 400006, 400007, 400008, 400009,
400010, 400011, 400012, 400018, 400020, 400021, 400023, 400026, 400027,
400032, 400036, 400038
```

All 21 are marked Mumbai and COD eligible. Additional rows created by an
administrator may also enable COD when explicitly marked as COD allowed.
Pincodes not present in the local serviceability table are checked against the
India postal directory through `https://api.postalpincode.in/pincode/{pincode}`.
Valid postal pincodes allow Razorpay only; invalid pincodes are rejected. A
database row controls COD eligibility, so postal validation alone can never
enable COD. Mumbai ETA is 2–3 days; postal-validated pincodes without a local
Mumbai row use 5–7 working days.

## 4. Database Migrations

The database currently has these project migrations:

- `0001_init`
- `0002_process_step_images`
- `0003_shipments_reviews`

The latest migration adds:

- Process-step image fields
- Shipment records
- Shipment event history
- Product reviews
- Shipment and review status enums

Apply migrations with:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

## 5. Local Environment Configuration

Create a `.env` file in the project root. Never commit this file and never place real secrets in documentation.

For a safe starting point, copy `.env.example`; it contains variable names and
safe placeholders only.

### Required for database and application startup

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-long-random-production-secret
```

### Required for product, CMS, lab-report, and process-image uploads

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=replace-me
AWS_SECRET_ACCESS_KEY=replace-me
S3_BUCKET_NAME=replace-me
S3_PUBLIC_BASE_URL=https://your-public-media-domain.example.com
```

The S3 bucket must allow the application origin in its CORS configuration and must allow public reads for the intended media objects, or use a CDN/public media endpoint.

The current seed catalogue still marks prices as placeholders and leaves SKUs
unset because approved commercial data was not supplied. Do not publish those
values to production until the business owner confirms prices, SKUs, pack sizes,
product copy, Groundnut Oil catalogue data, and legal company identifiers.

### Required for online payments

```env
RAZORPAY_KEY_ID=replace-me
NEXT_PUBLIC_RAZORPAY_KEY_ID=replace-me
RAZORPAY_KEY_SECRET=replace-me
RAZORPAY_WEBHOOK_SECRET=replace-me
```

For local testing, use Razorpay test credentials. For production, use live credentials and configure the webhook URL:

```text
https://YOUR_DOMAIN/api/webhooks/razorpay
```

### Required for production email delivery

```env
SES_FROM_EMAIL=no-reply@your-domain.example
SES_BUSINESS_INBOX_EMAIL=info@your-domain.example
```

Also configure AWS SES domain verification, DKIM, SPF, DMARC, and production sending access.

### Signup and contact abuse protection

Signup and contact forms use same-origin validation, honeypot fields, strict
Zod input validation, and rate limiting. No CAPTCHA provider is required.

### Recommended shared rate limiting

```env
UPSTASH_REDIS_REST_URL=https://your-upstash-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=replace-me
```

Without Redis, the application uses its development-safe fallback behavior. Production should use a shared rate-limit store.

### Optional integrations

```env
GOOGLE_PLACES_API_KEY=replace-me
GOOGLE_PLACES_ID=replace-me
SENTRY_DSN=replace-me
```

## 6. Local Setup

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin
```

The admin account is created by the project seed process using:

```env
ADMIN_SEED_EMAIL=admin@your-domain.example
ADMIN_SEED_PASSWORD=replace-with-a-strong-password
```

Do not use a seed password in production without changing it immediately and enabling 2FA.

## 7. Recommended Test Sequence

### Basic application checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

TypeScript and lint checks are currently green. ESLint still reports 29
non-blocking `@next/next/no-img-element` warnings.

### Database and health check

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "db": "connected"
}
```

### Admin tests

1. Log in at `/login` using the admin account.
2. Open `/admin/products`.
3. Create a product with:
   - Name
   - Category
   - Description
   - At least one variant
   - Price, MRP, stock, and SKU
   - One or more images
4. Confirm the product appears on the storefront.
5. Confirm the product detail page displays the variants and images.
6. Edit the product and confirm the storefront updates.
7. Open Admin → CMS and upload a process-step photo.
8. Confirm it appears on the homepage.
9. Open Admin → Settings and change footer text/contact/link content.
10. Confirm the updated footer appears on the storefront.
11. Create a coupon and test it at checkout.
12. Open an order and update shipment status/tracking details.
13. Confirm the customer order page shows shipment details.
14. Submit a customer product review.
15. Approve the review from Admin → Product Reviews.
16. Confirm it appears on the product page.

### Checkout tests

Test both:

- Razorpay test payment
- COD on an allowed pincode

Also test:

- Invalid coupon
- Expired coupon
- Minimum-order failure
- Usage-limit failure
- Out-of-stock variant
- Quantity above stock
- Login-required checkout
- Payment cancellation
- Payment verification failure
- Webhook replay/idempotency

### Upload tests

Test S3 uploads for:

- Product images
- Lab reports
- CMS/process images

Confirm that:

- The upload succeeds
- The media URL loads publicly
- The record is stored in PostgreSQL
- A failed upload does not create an incomplete database record

## 8. Production Launch Blockers

Before accepting real orders:

1. Fix the existing TypeScript errors.
2. Fix the ESLint configuration.
3. Make the production build independent of unreliable Google Fonts network access, preferably by self-hosting the fonts.
4. Configure all production secrets and third-party integrations.
5. Configure Razorpay live keys and verify webhooks.
6. Configure S3 CORS and public media delivery.
7. Configure SES production access and domain authentication.
8. Configure shared Redis rate limiting.
9. Replace placeholder product prices and add real SKUs.
10. Replace placeholder license numbers.
11. Confirm India postal-directory lookup availability and monitor its rate limits.
12. Enable admin 2FA.
13. Configure database backups and test a restore.
14. Rotate any database or API credentials that were exposed during testing.
15. Run a complete production-like checkout, shipment, review, and email test.

## 9. Deferred Features

The following are intentionally not included yet:

- Coin/rewards wallet
- Invoice generation
- Buy X Get Y coupons
- Free-shipping coupons
- Courier API synchronization
- Automated shipment tracking updates
- Review photo uploads
- Automated post-delivery review requests
- Abandoned-cart recovery
