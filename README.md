# Shatrunjay Ghee — Production E-Commerce & Admin Platform

Full-stack e-commerce storefront and admin panel for **Shatrunjay Ghee** (by **Shatrunjay Foodstuffs Private Limited**), built with **Next.js App Router, TypeScript (strict), Prisma, PostgreSQL, Razorpay, Amazon S3, and Amazon SES**.

---

## 1. Quick Start (Local Development)

```bash
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, RAZORPAY_*, AWS_*, SES_FROM_EMAIL
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### Switching PostgreSQL Provider
The database connection is exclusively driven by `DATABASE_URL` in `.env` (`prisma/schema.prisma`). You can switch between local Postgres, RDS, Neon, Supabase, or Cloud SQL by updating `DATABASE_URL` and running `npx prisma migrate deploy` with zero code changes.

---

## 2. Environment Variables
See `.env.example` for every variable. The application validates environment variables at boot via Zod (`src/lib/env.ts`) and fails fast if any required key is missing or invalid.

The current project uses system font fallbacks so production builds do not depend
on Google Fonts network access. If brand fonts are supplied later, self-host
them under `public/` and update the CSS variables in `src/app/globals.css`.

---

## 3. Razorpay Setup & Webhook
1. Add `RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` from the Razorpay Dashboard.
2. Create a Webhook in **Razorpay Dashboard → Settings → Webhooks**:
   - **URL**: `https://<your-domain>/api/webhooks/razorpay`
   - **Secret**: Set `RAZORPAY_WEBHOOK_SECRET` in `.env`
   - **Events**: `payment.captured`, `payment.failed`
3. Webhook verification checks raw-body HMAC-SHA256 signature and records `PaymentWebhookEvent` for idempotency.

---

## 4. Amazon S3 Bucket Policy & CORS
All media (product images, banners, videos, lab reports, archives, courier images) are uploaded directly via short-lived presigned URLs (`/api/upload/presign`).

### S3 CORS Configuration
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["https://shatrunjayghee.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### S3 Bucket Policy (Public Read for Media Objects Only — No Bucket Listing)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadMediaObjects",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::shatrunjay-ghee-media/*"
    }
  ]
}
```

---

## 5. Amazon SES Setup
1. Verify your domain (`shatrunjayghee.com`) in Amazon SES (DKIM + SPF + DMARC).
2. Request **SES Production Access** (move out of Sandbox) in AWS Console so transactional emails can be delivered to any customer email address.
3. Set `SES_FROM_EMAIL` (e.g. `no-reply@shatrunjayghee.com`) and `SES_BUSINESS_INBOX_EMAIL=info@shatrunjayghee.com`.

---

## 6. Google Places API
- **Google Reviews**: Enable **Places API** in Google Cloud Console, set `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACES_ID` (or configure Place ID in `/admin/settings`). Falls back gracefully if API is unavailable.
- Contact and signup forms use same-origin checks, honeypot fields, input validation, and rate limiting.

---

## 7. Deployment, Backups & Pre-Launch Checklist
- **Docker**: `docker build -t shatrunjay-ghee . && docker run -p 3000:3000 --env-file .env shatrunjay-ghee`
- **Vercel / Node Host**: Run `npx prisma migrate deploy` during release, then `npm run start`.
- **Database Backups**: Schedule daily `pg_dump` snapshots (`pg_dump "$DATABASE_URL" > backup.sql`) and test `psql "$DATABASE_URL" < backup.sql` restores regularly.
- **Pre-Launch Checklist**:
  1. Log into `/admin` with `ADMIN_SEED_EMAIL` and immediately change password + enable 2FA (`/admin/settings`).
  2. Review and confirm all **Placeholder Prices** (`/admin/products`) and add real **SKUs**.
  3. Update placeholder **MSME** and **COI** license numbers (`/admin/cms`).
  4. Confirm the business-provided 21-code Mumbai & COD whitelist in `/admin/pincodes`.
  5. Switch Razorpay keys from `rzp_test_*` to `rzp_live_*` and verify live webhook delivery.
