# Shatrunjay Ghee Backend Ownership Report

Updated: 26 November 2026

## Summary

The application uses a hybrid backend:

- Leadr is the source of truth for commerce operations shared with the WhatsApp bot.
- PostgreSQL through Prisma stores the remaining website, customer-account, CMS, and operational data.
- The commerce backend is selected with `COMMERCE_BACKEND=leadr`.

## Leadr responsibilities

Leadr manages:

- Product catalogue
- Product prices and stock
- Website and WhatsApp orders
- Unified order numbering and order list
- Checkout and payment rules
- COD and online-payment availability
- Promo codes and referral codes
- OTP verification
- Customer records used by commerce
- Order tracking
- Admin reports
- Admin product management
- Admin order management
- Admin customer management
- Admin promo management
- Leadr commerce settings and website content
- Product image uploads
- Rahtsaa ID admin sign-in
- Sales Management/invoice synchronization, when enabled in Leadr

## PostgreSQL/Prisma responsibilities

PostgreSQL through Prisma manages:

- Customer signup, login, and local sessions
- Saved customer addresses
- Local customer carts when Prisma commerce mode is selected
- CMS sections and page content
- Footer settings and fallback site settings
- Legal pages
- Homepage process blocks and banners
- Lab reports
- Product reviews and moderation
- Shipment details and shipment history
- Contact submissions
- Bulk-order enquiries
- Local pincode and COD configuration
- Audit logs
- Email logs
- Local discount implementation fallback
- Local Razorpay checkout/webhook implementation fallback
- Local admin-auth fallback

## Application flows

### Public commerce flow

1. Storefront catalogue is loaded from Leadr.
2. Cart items use Leadr product IDs.
3. Checkout uses Leadr guest checkout.
4. OTP requests are forwarded to Leadr.
5. Leadr validates stock, shipping, promotions, and payment.
6. Order tracking is read from Leadr.

### Admin flow

1. Admin signs in through Rahtsaa ID.
2. The server exchanges the Rahtsaa token for a Leadr session.
3. The session is kept in an httpOnly cookie.
4. Commerce admin requests are proxied server-side to Leadr.
5. Remaining Prisma-backed admin features use the authenticated Leadr admin as the local admin identity.

### Prisma fallback flow

If `COMMERCE_BACKEND=prisma`, the original Prisma catalogue, cart, checkout, discounts, Razorpay, and local admin flow remain available.

## Required Vercel production variables

```env
COMMERCE_BACKEND=leadr
NEXT_PUBLIC_COMMERCE_BACKEND=leadr
LEADR_API_URL=https://leadr.rahtsaaai.com/api/v1
LEADR_API_KEY=<server-side Leadr API key>
SHOP_ORG_ID=<Shatrunjay Leadr organization ID>
NEXT_PUBLIC_SITE_URL=https://shatrunjay-ghee-store.vercel.app
```

`LEADR_API_KEY` must remain server-side. It must not use the `NEXT_PUBLIC_` prefix.

## Verification status

- PostgreSQL connection: verified
- Prisma migrations: up to date
- TypeScript: passed
- Tests: 9/9 passed
- Production build: passed
- GitHub commit: `25300ea`
- Vercel production deployment: Ready
- Production URL: https://shatrunjay-ghee-store.vercel.app

## Remaining blocker

The configured Leadr API key currently returns HTTP `401 Unauthorized` for:

- `/storefront/site`
- `/storefront/products`

The URL and organization ID are present, so the client must provide or activate a valid Leadr storefront API key with the required permissions. After changing the key in Vercel, redeploy the project.

## Out of scope for this repository

- The WhatsApp bot runtime itself is hosted by Leadr.
- Courier API synchronization is not implemented locally.
- Automatic post-delivery review requests are not implemented locally.
- Review photo uploads are not implemented locally.
