import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Shatrunjay Ghee database...");

  // 1. Admin user
  const adminEmail = (process.env.ADMIN_SEED_EMAIL || "admin@shatrunjayghee.com").toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("ADMIN_SEED_PASSWORD must be set and at least 12 characters long.");
  }
  const adminHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Shatrunjay Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      referralCode: `SJ-ADMN-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    },
  });

  // 2. Categories (4 categories; Groundnut Oil kept empty until owner adds products)
  const categoriesData = [
    {
      slug: "a2-desi-cow-ghee",
      name: "A2 Desi Cow Ghee",
      description: "Bilona-churned from desi Gir cow curd. Rich aroma and granular danedar texture.",
      bannerImageUrl: "/brand/photos/pack-a2.jpg",
      sortOrder: 1,
    },
    {
      slug: "cow-ghee",
      name: "Cow Ghee",
      description: "Pure Cow Ghee for everyday cooking, pooja, and festive sweets.",
      bannerImageUrl: "/brand/photos/pack-cow.jpg",
      sortOrder: 2,
    },
    {
      slug: "buffalo-ghee",
      name: "Buffalo Ghee",
      description: "Naturally milky white, rich and full-bodied Pure Buffalo Ghee for traditional sweets and parathas.",
      bannerImageUrl: "/brand/photos/pack-buffalo.jpg",
      sortOrder: 3,
    },
    {
      slug: "groundnut-oil",
      name: "Groundnut Oil",
      description: "Wood-pressed / cold-pressed pure groundnut oil for traditional Indian kitchens.",
      bannerImageUrl: "/brand/photos/kitchen.jpg",
      sortOrder: 4,
    },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
    categories[cat.slug] = saved.id;
  }

  // 3. Products & Variants (Inferred from catalogue photos in ZIP; SKUs intentionally null; isPlaceholderPrice = true)
  const productsData = [
    {
      slug: "a2-desi-cow-ghee-bilona",
      categoryId: categories["a2-desi-cow-ghee"]!,
      name: "A2 Desi Cow Ghee - Bilona Method",
      shortDescription: "Traditional Bilona-churned A2 Desi Gir Cow Ghee made in small batches.",
      richContent:
        "<p>Prepared using the traditional <strong>Bilona method</strong>: whole desi Gir cow milk is set into curd, hand-churned into makkhan, and slowly simmered on a low flame for a golden, granular (danedar) texture and rich aroma.</p><ul><li>100% pure A2 Gir cow milk fat</li><li>No preservatives, no added colour or flavour</li><li>Ideal for daily nutrition, rotis, babies, and pooja</li></ul>",
      isFeatured: true,
      featuredOrder: 1,
      isMostBought: true,
      mostBoughtOrder: 1,
      isFreshArrival: true,
      freshArrivalOrder: 1,
      images: [
        { url: "/brand/photos/pack-a2.jpg", alt: "A2 Desi Cow Ghee jar", sortOrder: 0 },
        { url: "/brand/photos/a2-benefits.jpg", alt: "A2 Desi Cow Ghee benefits", sortOrder: 1 },
        { url: "/brand/photos/bilona-process.jpg", alt: "Bilona ghee process", sortOrder: 2 },
      ],
      variants: [
        { label: "500 ml", pricePaise: 110000, mrpPaise: 125000, sortOrder: 1 },
        { label: "1 Litre", pricePaise: 200000, mrpPaise: 225000, sortOrder: 2 },
        { label: "5 Litres", pricePaise: 950000, mrpPaise: 1050000, sortOrder: 3 },
      ],
    },
    {
      slug: "pure-cow-ghee",
      categoryId: categories["cow-ghee"]!,
      name: "Pure Cow Ghee",
      shortDescription: "Golden, aromatic Pure Cow Ghee for daily meals, pooja, and festive mithai.",
      richContent:
        "<p>Crafted in small batches for consistent purity, golden hue, and authentic aroma. Suitable for everyday tadka, parathas, diyas, and prasad.</p><ul><li>Pure cow milk fat, FSSAI licensed kitchen</li><li>Hygienically packed to seal freshness</li></ul>",
      isFeatured: true,
      featuredOrder: 2,
      isMostBought: true,
      mostBoughtOrder: 2,
      isFreshArrival: false,
      freshArrivalOrder: 0,
      images: [
        { url: "/brand/photos/pack-cow.jpg", alt: "Pure Cow Ghee pack", sortOrder: 0 },
        { url: "/brand/photos/paratha.jpg", alt: "Hot paratha with cow ghee", sortOrder: 1 },
      ],
      variants: [
        { label: "500 ml", pricePaise: 51000, mrpPaise: 57500, sortOrder: 1 },
        { label: "1 Litre", pricePaise: 100000, mrpPaise: 115000, sortOrder: 2 },
        { label: "5 Litres", pricePaise: 480000, mrpPaise: 540000, sortOrder: 3 },
        { label: "15 Kg (16.5 Litres)", pricePaise: 1500000, mrpPaise: 1650000, sortOrder: 4 },
      ],
    },
    {
      slug: "pure-buffalo-ghee",
      categoryId: categories["buffalo-ghee"]!,
      name: "Pure Buffalo Ghee",
      shortDescription: "Naturally milky white, thick and rich Pure Buffalo Ghee for halwa, laddoo, and winter nutrition.",
      richContent:
        "<p>Thick, creamy, and naturally milky white Pure Buffalo Ghee prized for traditional Indian sweets like mohanthal, gajar halwa, and dry-fruit laddoos.</p><ul><li>Rich body and high smoke point</li><li>Packed fresh in Mumbai</li></ul>",
      isFeatured: false,
      featuredOrder: 0,
      isMostBought: true,
      mostBoughtOrder: 3,
      isFreshArrival: false,
      freshArrivalOrder: 0,
      images: [
        { url: "/brand/photos/pack-buffalo.jpg", alt: "Pure Buffalo Ghee pack", sortOrder: 0 },
        { url: "/brand/photos/buffalo-spoon.jpg", alt: "Buffalo ghee spoon", sortOrder: 1 },
      ],
      variants: [
        { label: "500 ml", pricePaise: 51000, mrpPaise: 57500, sortOrder: 1 },
        { label: "1 Litre", pricePaise: 100000, mrpPaise: 115000, sortOrder: 2 },
        { label: "5 Litres", pricePaise: 480000, mrpPaise: 540000, sortOrder: 3 },
        { label: "15 Kg (16.5 Litres)", pricePaise: 1500000, mrpPaise: 1650000, sortOrder: 4 },
      ],
    },
  ];

  for (const p of productsData) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.product.create({
        data: {
          slug: p.slug,
          categoryId: p.categoryId,
          name: p.name,
          shortDescription: p.shortDescription,
          richContent: p.richContent,
          isFeatured: p.isFeatured,
          featuredOrder: p.featuredOrder,
          isMostBought: p.isMostBought,
          mostBoughtOrder: p.mostBoughtOrder,
          isFreshArrival: p.isFreshArrival,
          freshArrivalOrder: p.freshArrivalOrder,
          images: { create: p.images },
          variants: {
            create: p.variants.map((v) => ({
              label: v.label,
              sku: null,
              pricePaise: v.pricePaise,
              mrpPaise: v.mrpPaise,
              stockQty: 100,
              isPlaceholderPrice: true,
              sortOrder: v.sortOrder,
              active: true,
            })),
          },
        },
      });
    }
  }

  // 4. Site Settings
  const settings: Array<{ key: string; value: unknown }> = [
    { key: "whatsappEnabled", value: false },
    { key: "whatsappNumber", value: "+91 81696 29908" },
    { key: "businessEmail", value: "info@shatrunjayghee.com" },
    { key: "googlePlaceId", value: "" },
    { key: "referralEnabled", value: false },
    { key: "referralDiscountType", value: "PERCENT" },
    { key: "referralDiscountValue", value: 5 },
    { key: "referralMaxDiscountPaise", value: 20000 },
    { key: "tickerEnabled", value: true },
    {
      key: "tickerMessages",
      value: [
        "🐄 Pure A2 Desi Cow Bilona Ghee — Made in Small Batches",
        "🚚 Free Home Delivery • 2–3 Days in Mumbai • 5–7 Working Days Outside Mumbai",
        "🙏 Bulk Supply Available for Derasars, Temples & Bhojanshalas",
      ],
    },
    {
      key: "checkoutNotes",
      value: {
        mumbai:
          "Deliveries in Mumbai will be done by Shatrunjay Team or Porter. All communication will be done by Shatrunjay Team.",
        outsideMumbai:
          "Deliveries outside Mumbai will be done by courier. Courier details will be shared by email and in your account.",
      },
    },
    { key: "policyVersion", value: "2026-01" },
    {
      key: "contactInfo",
      value: {
        phone: "+91 81696 29908",
        email: "info@shatrunjayghee.com",
        address: "Shop no 7, Ground Floor, Shubham Lifescapes Amrut, V. P. Road, Girgaon, Charni Road East, Mumbai 400004",
      },
    },
    {
      key: "socialLinks",
      value: {
        instagram: "https://www.instagram.com/shatrunjayghee",
        linkedin: "https://www.linkedin.com",
        facebook: "https://www.facebook.com/share/1DSKgP2jVJ/",
        youtube: "https://youtube.com/@shatrunjayghee",
      },
    },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value as object },
    });
  }

  // 5. Banners
  const existingBanners = await prisma.banner.count();
  if (existingBanners === 0) {
    await prisma.banner.createMany({
      data: [
        {
          placement: "HOME_FLOATING",
          title: "Ghee the way your grandmother made it",
          subtitle: "Desi cow milk, set into curd, churned by bilona and slowly simmered into golden, granular ghee.",
          imageUrl: "/brand/photos/gir-cows.jpg",
          ctaText: "Shop A2 Desi Cow Ghee",
          ctaLink: "/ghee#a2-desi-cow-ghee",
          sortOrder: 1,
        },
        {
          placement: "HOME_FLOATING",
          title: "Pure Cow & Buffalo Ghee for Every Kitchen",
          subtitle: "Small-batch purity with free home delivery across India.",
          imageUrl: "/brand/photos/paratha.jpg",
          ctaText: "Explore All Products",
          ctaLink: "/shop",
          sortOrder: 2,
        },
        {
          placement: "GHEE_A2",
          title: "A2 Desi Cow Ghee",
          subtitle: "Bilona churned from Gir cow curd.",
          imageUrl: "/brand/photos/pack-a2.jpg",
          ctaText: "View A2 Ghee",
          ctaLink: "#a2-desi-cow-ghee",
          sortOrder: 1,
        },
        {
          placement: "GHEE_COW",
          title: "Pure Cow Ghee",
          subtitle: "Golden aroma for daily cooking & pooja.",
          imageUrl: "/brand/photos/pack-cow.jpg",
          ctaText: "View Cow Ghee",
          ctaLink: "#cow-ghee",
          sortOrder: 2,
        },
        {
          placement: "GHEE_BUFFALO",
          title: "Pure Buffalo Ghee",
          subtitle: "Milky white, rich & thick for traditional sweets.",
          imageUrl: "/brand/photos/pack-buffalo.jpg",
          ctaText: "View Buffalo Ghee",
          ctaLink: "#buffalo-ghee",
          sortOrder: 3,
        },
        {
          placement: "GROUNDNUT_STATIC",
          title: "Pure Groundnut Oil",
          subtitle: "Traditionally pressed groundnut oil for wholesome everyday cooking.",
          imageUrl: "/brand/photos/kitchen.jpg",
          sortOrder: 1,
        },
        {
          placement: "DERASAR_STATIC",
          title: "Ghee for Derasars & Dharmik Anushthans",
          subtitle: "Dedicated pure ghee supply for Jinalays, Bhojanshalas, Pratishtha Mahostav, Chaturmas, Varshitap & Navanu Yatra.",
          imageUrl: "/brand/photos/pack-cow.jpg",
          sortOrder: 1,
        },
        {
          placement: "GHEE_LAABH_STATIC",
          title: "Ghee Laabh Yojna",
          subtitle: "Offer pure ghee seva to Jinalays on auspicious occasions, birthdays, and anniversaries.",
          imageUrl: "/brand/photos/pack-cow.jpg",
          sortOrder: 1,
        },
        {
          placement: "LAB_REPORTS_STATIC",
          title: "Lab Reports & Batch Testing",
          subtitle: "Transparent quality assurance — view batch-wise laboratory test reports.",
          imageUrl: "/brand/photos/a2-benefits.jpg",
          sortOrder: 1,
        },
        {
          placement: "OUR_STORY_STATIC",
          title: "Our Story",
          subtitle: "Shatrunjay Foodstuffs Private Limited — rooted in purity, trust, and timely delivery.",
          imageUrl: "/brand/photos/gir-cows.jpg",
          sortOrder: 1,
        },
        {
          placement: "OUR_STORY_JOURNEY",
          title: "Our Journey",
          subtitle: "From a family kitchen in Mumbai to serving households, derasars, and institutions across India.",
          imageUrl: "/brand/photos/bilona-process.jpg",
          sortOrder: 1,
        },
        {
          placement: "WHOLESALE_STATIC",
          title: "Wholesale & Bulk Ghee Supply",
          subtitle: "Reliable bulk tins and custom packaging for temples, social events, restaurants, clubs, and resellers.",
          imageUrl: "/brand/photos/kitchen.jpg",
          ctaText: "Enquire for Bulk Order",
          ctaLink: "/bulk-order",
          sortOrder: 1,
        },
      ],
    });
  }

  // 6. Process Blocks (Home + 3 Ghee categories + Groundnut Oil, max 9 steps each)
  const processBlocks = [
    {
      key: "home_ghee_making",
      title: "Ghee Making",
      subtitle: "From farm-fresh milk to golden granular ghee in 9 careful steps.",
      steps: [
        { stepOrder: 1, heading: "Fresh Milk Sourcing", subheading: null },
        { stepOrder: 2, heading: "Slow Boiling in Vessels", subheading: null },
        { stepOrder: 3, heading: "Setting Whole Milk into Curd", subheading: null },
        { stepOrder: 4, heading: "Traditional Bilona Churning", subheading: null },
        { stepOrder: 5, heading: "Separating Pure Makkhan", subheading: null },
        { stepOrder: 6, heading: "Low-Flame Slow Simmering", subheading: null },
        { stepOrder: 7, heading: "Fine Filtration & Cooling", subheading: null },
        { stepOrder: 8, heading: "Batch Lab Quality Testing", subheading: null },
        { stepOrder: 9, heading: "Hygienic Sealing & Dispatch", subheading: null },
      ],
    },
    {
      key: "ghee_cow_making",
      title: "Cow Ghee Making Process",
      subtitle: "Small-batch preparation preserving natural golden colour and aroma.",
      steps: [
        { stepOrder: 1, heading: "Quality Milk Selection", subheading: "Fresh cow milk tested for purity before processing." },
        { stepOrder: 2, heading: "Gentle Heating & Clarification", subheading: "Slow heating to develop authentic nutty aroma." },
        { stepOrder: 3, heading: "Filtration & Hygienic Packing", subheading: "Multi-stage filtration and airtight sealing." },
      ],
    },
    {
      key: "ghee_buffalo_making",
      title: "Buffalo Ghee Making Process",
      subtitle: "Rich, creamy, milky-white texture for traditional Indian recipes.",
      steps: [
        { stepOrder: 1, heading: "Pure Buffalo Milk Sourcing", subheading: "High-fat buffalo milk sourced from trusted dairies." },
        { stepOrder: 2, heading: "Controlled Slow Simmering", subheading: "Careful temperature control for thick danedar texture." },
        { stepOrder: 3, heading: "Batch Testing & Packing", subheading: "Packed fresh in food-grade jars and tins." },
      ],
    },
    {
      key: "ghee_a2_making",
      title: "A2 Desi Cow Ghee Making Process",
      subtitle: "Authentic Bilona method from desi Gir cow curd.",
      steps: [
        { stepOrder: 1, heading: "A2 Gir Cow Milk Collection", subheading: "Pure A2 milk from free-grazing Gir cows." },
        { stepOrder: 2, heading: "Overnight Curd Setting", subheading: "Whole milk is boiled and cultured into curd in earthen/steel vessels." },
        { stepOrder: 3, heading: "Bilona Churning & Slow Simmer", subheading: "Churned to extract makkhan, then simmered on low heat into golden ghee." },
      ],
    },
    {
      key: "groundnut_oil_making",
      title: "Groundnut Oil Making Process",
      subtitle: "Clean, unrefined extraction retaining natural groundnut flavour.",
      steps: [
        { stepOrder: 1, heading: "Handpicked Groundnut Kernels", subheading: "Cleaned and sun-dried bold groundnut seeds." },
        { stepOrder: 2, heading: "Cold / Wood Pressing", subheading: "Pressed at low temperature to preserve natural nutrients." },
        { stepOrder: 3, heading: "Natural Settling & Packing", subheading: "Filtered without harsh chemicals and sealed fresh." },
      ],
    },
  ];

  for (const pb of processBlocks) {
    const existing = await prisma.processBlock.findUnique({ where: { key: pb.key } });
    if (!existing) {
      await prisma.processBlock.create({
        data: {
          key: pb.key,
          title: pb.title,
          subtitle: pb.subtitle,
          steps: { create: pb.steps },
        },
      });
    }
  }

  // 7. SiteSections (Home Why Shatrunjay, Bulk Order, Derasar, Ghee Laabh, Our Story, Wholesale, Contact, Legal)
  const sections: Array<{
    pageKey: string;
    sectionKey: string;
    heading: string;
    subheading?: string;
    content?: string;
    sortOrder: number;
  }> = [
    {
      pageKey: "home",
      sectionKey: "why_shatrunjay",
      heading: "Why Shatrunjay?",
      subheading: "Purity you can smell the moment you open the jar.",
      content:
        "<ul><li><strong>100% Pure Milk Fat</strong> — Zero palm oil, zero vanaspati, zero artificial aroma.</li><li><strong>Small-Batch Craft</strong> — Freshly prepared and batch-tested with published lab reports.</li><li><strong>Timely Delivery</strong> — 2–3 days in Mumbai by our own team, and 5–7 working days pan-India.</li><li><strong>Trusted by Derasars</strong> — Preferred supplier for pooja, prasad, and bhojanshalas.</li></ul>",
      sortOrder: 1,
    },
    {
      pageKey: "home",
      sectionKey: "bulk_order",
      heading: "Need Ghee in Bulk for Events or Institutions?",
      subheading: "Special wholesale rates for Temples, Social Events, Restaurants & Clubs, and Resellers.",
      content: "Available in 5 Litre jars and 15 Kg (16.5 Litre) tins with dedicated Mumbai & pan-India dispatch.",
      sortOrder: 2,
    },
    // Derasar subsections
    { pageKey: "derasar", sectionKey: "jinalay", heading: "Jinalay", subheading: "Pure ghee for daily pooja, aarti, and deepak.", content: "We supply certified pure cow ghee for Jinalays with consistent aroma and zero adulteration.", sortOrder: 1 },
    { pageKey: "derasar", sectionKey: "bhojanshala", heading: "Bhojanshala", subheading: "Wholesome cooking ghee for community kitchens.", content: "15 Kg tins and bulk packs delivered directly to Bhojanshalas on schedule.", sortOrder: 2 },
    { pageKey: "derasar", sectionKey: "pratishtha_mahostav", heading: "Pratishtha Mahostav", subheading: "Dedicated bulk supply for grand celebrations.", content: "Planned multi-batch dispatches so your Pratishtha Mahostav never runs short of pure ghee.", sortOrder: 3 },
    { pageKey: "derasar", sectionKey: "chaturmas", heading: "Chaturmas", subheading: "4-month continuous supply for sanghs.", content: "Scheduled deliveries throughout Chaturmas at special institutional rates.", sortOrder: 4 },
    { pageKey: "derasar", sectionKey: "varshitap", heading: "Varshitap", subheading: "Pure ghee for Parna and Varshitap arrangements.", content: "Hygienically packed pure cow and A2 ghee for Varshitap occasions.", sortOrder: 5 },
    { pageKey: "derasar", sectionKey: "navanu_yatra", heading: "Navanu Yatra", subheading: "Reliable supply for yatra bhojanshalas.", content: "Timely bulk dispatch for Navanu Yatra camps and sanghs.", sortOrder: 6 },
    { pageKey: "derasar", sectionKey: "other_religious_functions", heading: "Other Religious Functions", subheading: "Havan, Poojan, and Dharmik Anushthan.", content: "Custom pack sizes and bulk tins for every dharmik event.", sortOrder: 7 },
    // Ghee Laabh Yojna
    {
      pageKey: "ghee_laabh_yojna",
      sectionKey: "intro",
      heading: "Ghee Laabh Yojna",
      subheading: "Share the blessing of pure ghee with a Jinalay on your special day.",
      content: "<p>Offer pure ghee seva on birthdays, anniversaries, or in memory of loved ones. Choose the quantity and Jinalay, and our team handles hygienic delivery directly to the derasar.</p>",
      sortOrder: 1,
    },
    // Lab Reports
    {
      pageKey: "lab_reports",
      sectionKey: "intro",
      heading: "Laboratory Test Reports",
      subheading: "Every batch verified for purity, Reichert-Meissl value, and FSSAI standards.",
      content: "<p>Click any report below to view the full laboratory certificate.</p>",
      sortOrder: 1,
    },
    // Our Story
    {
      pageKey: "our_story",
      sectionKey: "intro",
      heading: "Purity & Timely Delivery — The Shatrunjay Promise",
      subheading: "શુદ્ધ ઘી અને સમયસર ડિલિવરી એજ શત્રુંજય ઘી",
      content: "<p>Shatrunjay Foodstuffs Private Limited is a Mumbai-based family enterprise dedicated to making pure Cow Ghee, Buffalo Ghee, and Bilona A2 Desi Cow Ghee without shortcuts.</p>",
      sortOrder: 1,
    },
    // Wholesale subsections
    { pageKey: "wholesale", sectionKey: "temples", heading: "Temples", subheading: "Pure ghee for prasad, diya, and temple kitchens.", content: "Consistent quality and priority dispatch for temples across India.", sortOrder: 1 },
    { pageKey: "wholesale", sectionKey: "social_events", heading: "Social Events", subheading: "Weddings, receptions, and community feasts.", content: "Bulk 15 Kg tins delivered straight to your caterer or venue.", sortOrder: 2 },
    { pageKey: "wholesale", sectionKey: "restaurants_clubs", heading: "Restaurants & Clubs", subheading: "Authentic aroma for commercial kitchens.", content: "Reliable monthly supply with GST invoicing for hospitality partners.", sortOrder: 3 },
    { pageKey: "wholesale", sectionKey: "reseller", heading: "Reseller", subheading: "Partner with Shatrunjay Ghee in your city.", content: "Attractive wholesale margins for retail stores and regional distributors.", sortOrder: 4 },
    // Contact & Bulk Order
    { pageKey: "contact", sectionKey: "header", heading: "Get in touch", subheading: "Questions about orders, delivery, or bulk supply? Reach out to our team.", sortOrder: 1 },
    { pageKey: "bulk_order", sectionKey: "header", heading: "Bulk Order Enquiry", subheading: "Tell us your required quantity, pack size, and delivery location.", sortOrder: 1 },
    // Legal pages
    {
      pageKey: "legal",
      sectionKey: "privacy-policy",
      heading: "Privacy Policy",
      subheading: "Effective Date: 2026-01",
      content: "<p>Shatrunjay Foodstuffs Private Limited respects your privacy. We collect only the information necessary to process your orders, verify your account, and deliver your products.</p><p>We never sell your personal data. Payment processing is handled securely via Razorpay; we do not store your card or UPI PIN details.</p><p>To request data export or account deletion, email info@shatrunjayghee.com.</p>",
      sortOrder: 1,
    },
    {
      pageKey: "legal",
      sectionKey: "shipping-policy",
      heading: "Shipping Policy",
      subheading: "Free Home Delivery across serviceable pincodes",
      content: "<p><strong>Mumbai Orders:</strong> Delivered within 2 to 3 days by the Shatrunjay Team or Porter.</p><p><strong>Outside Mumbai:</strong> Delivered within 5 to 7 working days via trusted courier partners. Tracking details are sent via email and displayed in your account.</p>",
      sortOrder: 2,
    },
    {
      pageKey: "legal",
      sectionKey: "refund-policy",
      heading: "Refund & Cancellation Policy",
      subheading: "Customer satisfaction & damaged-in-transit support",
      content: "<p>Due to the perishable food nature of ghee and oil, opened jars cannot be returned. If your order arrives damaged, leaking, or incorrect, please raise a query in your account within 48 hours of delivery with photos for a prompt replacement or refund.</p><p>Approved refunds to Razorpay payments are processed back to the original payment method within 5–7 working days.</p>",
      sortOrder: 3,
    },
    {
      pageKey: "legal",
      sectionKey: "terms-of-service",
      heading: "Terms of Service",
      subheading: "Shatrunjay Foodstuffs Private Limited",
      content: "<p>By creating an account and placing an order on Shatrunjay Ghee, you agree to provide accurate delivery and contact details. Orders are subject to stock availability and serviceable pincode verification.</p><p>All disputes are subject to Mumbai, Maharashtra jurisdiction.</p>",
      sortOrder: 4,
    },
  ];

  for (const sec of sections) {
    await prisma.siteSection.upsert({
      where: { pageKey_sectionKey: { pageKey: sec.pageKey, sectionKey: sec.sectionKey } },
      update: {},
      create: sec,
    });
  }

  // 8. Licenses (Our Story + Footer)
  const existingLicenses = await prisma.license.count();
  if (existingLicenses === 0) {
    await prisma.license.createMany({
      data: [
        { name: "GSTIN", number: "27ABICS5067M1ZO", sortOrder: 1 },
        { name: "FSSAI", number: "11524002000134", sortOrder: 2 },
        { name: "MSME (Udyam)", number: "[PLACEHOLDER - UPDATE IN ADMIN]", sortOrder: 3 },
        { name: "Certificate of Incorporation (COI)", number: "[PLACEHOLDER - UPDATE IN ADMIN]", sortOrder: 4 },
      ],
    });
  }

  // 9. Approved Mumbai pincodes (COD + Mumbai delivery).
  // This is the business-provided 21-pincode whitelist; do not expand it
  // without confirmation from the business owner.
  const approvedMumbaiPincodes: Array<[string, string]> = [
    ["400001", "Mumbai G. P. O."], ["400002", "Kalbadevi"], ["400003", "Mandvi"],
    ["400004", "Girgaon"], ["400005", "Colaba"], ["400006", "Malbar Hill"],
    ["400007", "Grant Road"], ["400008", "Mumbai Central"], ["400009", "Chinch B’der"],
    ["400010", "Mazgaon"], ["400011", "Jacob Circle"], ["400012", "Parel"],
    ["400018", "Worli"], ["400020", "Marine Lines"], ["400021", "Nariman Point"],
    ["400023", "Fort"], ["400026", "Cumbala Hill"], ["400027", "Jijamata Udyan"],
    ["400032", "Mantralaya"], ["400036", "A. K. Marg"], ["400038", "Ballard pier"],
  ];
  for (const [pincode, area] of approvedMumbaiPincodes) {
    await prisma.serviceablePincode.upsert({
      where: { pincode },
      update: { isMumbai: true, isCodAllowed: true, city: "Mumbai", area },
      create: {
        pincode,
        isMumbai: true,
        isCodAllowed: true,
        city: "Mumbai",
        area,
      },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
