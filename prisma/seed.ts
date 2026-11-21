import { PrismaClient, UserRole } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@shatrunjayghee.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThisStrongAdminPassword!123";
  const adminName = process.env.ADMIN_NAME || "Shatrunjay Admin";

  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { role: UserRole.ADMIN },
    create: {
      name: adminName,
      email: adminEmail.toLowerCase(),
      passwordHash: hashPassword(adminPassword),
      role: UserRole.ADMIN,
      referralCode: "SHATRUNJAYADMIN",
    },
  });

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      navLinksJson: [
        { label: "Shop All", href: "/shop" },
        { label: "Ghee", href: "/ghee" },
        { label: "Groundnut Oil", href: "/groundnut-oil" },
        { label: "Derasar", href: "/derasar" },
        { label: "Ghee Laabh Yojna", href: "/ghee-laabh-yojna" },
        { label: "Lab Reports", href: "/lab-reports" },
        { label: "Our Story", href: "/our-story" },
        { label: "Contact", href: "/contact" },
      ],
      footerLinksJson: {
        shop: [
          { label: "All Products", href: "/shop" },
          { label: "Cow Ghee", href: "/ghee#cow-ghee" },
          { label: "Buffalo Ghee", href: "/ghee#buffalo-ghee" },
          { label: "A2 Desi Cow Ghee", href: "/ghee#a2-desi-cow-ghee" },
          { label: "Groundnut Oil", href: "/groundnut-oil" },
        ],
        derasar: [
          { label: "Jinalay", href: "/derasar#jinalay" },
          { label: "Bhojanshala", href: "/derasar#bhojanshala" },
          { label: "Pratishtha Mahotsav", href: "/derasar#pratishtha-mahotsav" },
          { label: "Chaturmas", href: "/derasar#chaturmas" },
          { label: "Varshitap", href: "/derasar#varshitap" },
          { label: "Navanu Yatra", href: "/derasar#navanu-yatra" },
          { label: "Ghee Laabh Yojna", href: "/ghee-laabh-yojna" },
          { label: "Other Religious Functions", href: "/derasar#other-religious-functions" },
        ],
        wholesale: [
          { label: "Temples", href: "/wholesale#temples" },
          { label: "Social Events", href: "/wholesale#social-events" },
          { label: "Restaurants & Clubs", href: "/wholesale#restaurants-clubs" },
          { label: "Reseller", href: "/wholesale#reseller" },
        ],
        legal: [
          { label: "Privacy Policy", href: "/legal/privacy-policy" },
          { label: "Shipping Policy", href: "/legal/shipping-policy" },
          { label: "Refund Policy", href: "/legal/refund-policy" },
          { label: "Terms of Service", href: "/legal/terms-of-service" },
        ],
      },
    },
  });

  const movingCount = await prisma.movingHeaderItem.count();
  if (movingCount === 0) {
    await prisma.movingHeaderItem.createMany({
      data: [
        { textWithEmoji: "✨ Pure Bilona & Traditional Ghee • Lab Tested Every Batch", linkUrl: "/lab-reports", sortOrder: 1 },
        { textWithEmoji: "🚚 Free Home Delivery • 2–3 Days in Mumbai", linkUrl: "/shop", sortOrder: 2 },
        { textWithEmoji: "🛕 Trusted by Derasars, Bhojanshalas & Households", linkUrl: "/derasar", sortOrder: 3 },
      ],
    });
  }

  const categoryDefs = [
    { name: "Cow Ghee", slug: "cow-ghee", sortOrder: 1 },
    { name: "Buffalo Ghee", slug: "buffalo-ghee", sortOrder: 2 },
    { name: "A2 Desi Cow Ghee", slug: "a2-desi-cow-ghee", sortOrder: 3 },
    { name: "Groundnut Oil", slug: "groundnut-oil", sortOrder: 4 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap[cat.slug] = saved.id;
  }

  const products = [
    { sku: "CG500ML", name: "Shatrunjay Cow Ghee — 500 ml", slug: "cow-ghee-500ml", cat: "cow-ghee", vol: "500 ml", feat: false, most: false, fresh: false, sort: 1 },
    { sku: "CG1L", name: "Shatrunjay Cow Ghee — 1 Litre", slug: "cow-ghee-1l", cat: "cow-ghee", vol: "1 Litre", feat: true, most: false, fresh: false, sort: 2 },
    { sku: "CG5L", name: "Shatrunjay Cow Ghee — 5 Litre", slug: "cow-ghee-5l", cat: "cow-ghee", vol: "5 Litre", feat: true, most: true, fresh: false, sort: 3 },
    { sku: "CG15KG", name: "Shatrunjay Cow Ghee — 15 Kg Tin", slug: "cow-ghee-15kg", cat: "cow-ghee", vol: "15 Kg", feat: false, most: true, fresh: false, sort: 4 },
    { sku: "BG1L", name: "Shatrunjay Buffalo Ghee — 1 Litre", slug: "buffalo-ghee-1l", cat: "buffalo-ghee", vol: "1 Litre", feat: false, most: false, fresh: false, sort: 5 },
    { sku: "BG5L", name: "Shatrunjay Buffalo Ghee — 5 Litre", slug: "buffalo-ghee-5l", cat: "buffalo-ghee", vol: "5 Litre", feat: false, most: true, fresh: false, sort: 6 },
    { sku: "BG15KG", name: "Shatrunjay Buffalo Ghee — 15 Kg Tin", slug: "buffalo-ghee-15kg", cat: "buffalo-ghee", vol: "15 Kg", feat: false, most: false, fresh: false, sort: 7 },
    { sku: "A2500ML", name: "Shatrunjay A2 Desi Cow Ghee — 500 ml", slug: "a2-desi-cow-ghee-500ml", cat: "a2-desi-cow-ghee", vol: "500 ml", feat: true, most: true, fresh: true, sort: 8 },
    { sku: "A21L", name: "Shatrunjay A2 Desi Cow Ghee — 1 Litre", slug: "a2-desi-cow-ghee-1l", cat: "a2-desi-cow-ghee", vol: "1 Litre", feat: false, most: true, fresh: true, sort: 9 },
    { sku: "A25L", name: "Shatrunjay A2 Desi Cow Ghee — 5 Litre", slug: "a2-desi-cow-ghee-5l", cat: "a2-desi-cow-ghee", vol: "5 Litre", feat: false, most: false, fresh: true, sort: 10 },
    { sku: "GN1L", name: "Shatrunjay Groundnut Oil — 1 Litre", slug: "groundnut-oil-1l", cat: "groundnut-oil", vol: "1 Litre", feat: false, most: false, fresh: false, sort: 11 },
    { sku: "GN5L", name: "Shatrunjay Groundnut Oil — 5 Litre", slug: "groundnut-oil-5l", cat: "groundnut-oil", vol: "5 Litre", feat: false, most: false, fresh: false, sort: 12 },
    { sku: "GN15L", name: "Shatrunjay Groundnut Oil — 15 Litre", slug: "groundnut-oil-15l", cat: "groundnut-oil", vol: "15 Litre", feat: false, most: false, fresh: false, sort: 13 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        categoryId: categoryMap[p.cat],
        priceInr: 999,
        mrpInr: 1199,
        volumeLabel: p.vol,
        shortDescription: "Update product description and pricing in the Admin Panel.",
        description: "Crafted by Shatrunjay Foodstuffs Private Limited with strict batch-level lab testing.",
        belowAmountNote: "Free Home Delivery • Safe & Secure Packaging",
        isFeatured: p.feat,
        isMostBought: p.most,
        isFreshArrival: p.fresh,
        sortOrder: p.sort,
      },
    });
  }

  const makingSections = [
    { sectionKey: "HOME_GHEE", title: "How Our Ghee Is Made", subtitle: "Factory Overview" },
    { sectionKey: "COW_GHEE", title: "Cow Ghee Making Process", subtitle: "Step-by-step preparation" },
    { sectionKey: "BUFFALO_GHEE", title: "Buffalo Ghee Making Process", subtitle: "Step-by-step preparation" },
    { sectionKey: "A2_GHEE", title: "A2 Desi Cow Ghee Making Process", subtitle: "Traditional Bilona craft" },
    { sectionKey: "GROUNDNUT_OIL", title: "Groundnut Oil Making Process", subtitle: "Cold-pressed purity" },
  ];

  for (const ms of makingSections) {
    await prisma.makingProcessSection.upsert({
      where: { sectionKey: ms.sectionKey },
      update: {},
      create: {
        sectionKey: ms.sectionKey,
        title: ms.title,
        subtitle: ms.subtitle,
        stepsJson: [
          { heading: "Sourcing Fresh Raw Milk / Peanuts", subheading: "Selected from trusted farms" },
          { heading: "Quality & Purity Screening", subheading: "Strict hygiene & fat checks" },
          { heading: "Traditional Churning / Pressing", subheading: "Slow-crafted for aroma & nutrition" },
          { heading: "Gentle Slow Simmering", subheading: "Locked-in golden granules" },
          { heading: "Batch Lab Testing & Hygienic Packing", subheading: "Sealed for freshness" },
        ],
      },
    });
  }

  if ((await prisma.whyShatrunjayItem.count()) === 0) {
    await prisma.whyShatrunjayItem.createMany({
      data: [
        { title: "100% Pure & Lab Tested", description: "Every batch is tested by accredited laboratories with downloadable reports.", iconName: "FlaskConical", sortOrder: 1 },
        { title: "Fast & Careful Delivery", description: "2–3 days in Mumbai via Shatrunjay Team or Porter; 5–7 working days pan-India.", iconName: "Truck", sortOrder: 2 },
        { title: "Trusted by Derasars", description: "Supplying Jinalays, Bhojanshalas, and religious functions across India.", iconName: "Sparkles", sortOrder: 3 },
        { title: "Safe & Secure Packaging", description: "Tamper-evident, food-grade containers built for zero-leakage transit.", iconName: "ShieldCheck", sortOrder: 4 },
      ],
    });
  }

  if ((await prisma.license.count()) === 0) {
    await prisma.license.createMany({
      data: [
        { name: "GSTIN", number: "Update in Admin Panel", sortOrder: 1 },
        { name: "FSSAI", number: "Update in Admin Panel", sortOrder: 2 },
        { name: "MSME", number: "Update in Admin Panel", sortOrder: 3 },
        { name: "COI", number: "Update in Admin Panel", sortOrder: 4 },
      ],
    });
  }

  const legalPages = [
    { slug: "privacy-policy", title: "Privacy Policy" },
    { slug: "shipping-policy", title: "Shipping Policy" },
    { slug: "refund-policy", title: "Refund Policy" },
    { slug: "terms-of-service", title: "Terms of Service" },
  ];
  for (const lp of legalPages) {
    await prisma.legalPage.upsert({
      where: { slug: lp.slug },
      update: {},
      create: {
        slug: lp.slug,
        title: lp.title,
        content: `This ${lp.title} for Shatrunjay Ghee (Shatrunjay Foodstuffs Private Limited) can be edited anytime from the Admin Panel.`,
      },
    });
  }

  if ((await prisma.banner.count()) === 0) {
    await prisma.banner.createMany({
      data: [
        { pageKey: "HOME_HERO", title: "Pure Ghee. Timeless Tradition.", subtitle: "Lab-tested A2 Desi Cow Ghee, Cow Ghee, Buffalo Ghee & Groundnut Oil.", ctaLabel: "Shop All", ctaUrl: "/shop", sortOrder: 1 },
        { pageKey: "GHEE_HERO", title: "Cow Ghee", subtitle: "Rich aroma & golden texture", ctaLabel: "Explore Cow Ghee", ctaUrl: "/ghee#cow-ghee", sortOrder: 1 },
        { pageKey: "GHEE_HERO", title: "Buffalo Ghee", subtitle: "Traditional white granular ghee", ctaLabel: "Explore Buffalo Ghee", ctaUrl: "/ghee#buffalo-ghee", sortOrder: 2 },
        { pageKey: "GHEE_HERO", title: "A2 Desi Cow Ghee", subtitle: "Bilona-crafted Gir cow ghee", ctaLabel: "Explore A2 Ghee", ctaUrl: "/ghee#a2-desi-cow-ghee", sortOrder: 3 },
        { pageKey: "GROUNDNUT_OIL", title: "Cold-Pressed Groundnut Oil", subtitle: "Pure, unrefined daily cooking essential", ctaLabel: "Shop Oil", ctaUrl: "/groundnut-oil#products", sortOrder: 1 },
        { pageKey: "DERASAR", title: "Derasar & Religious Supply", subtitle: "Pure ghee for Jinalays, Bhojanshalas & sacred ceremonies", sortOrder: 1 },
        { pageKey: "GHEE_LAABH_YOJNA", title: "Ghee Laabh Yojna", subtitle: "Facilitating sacred ghee offerings to Jinalays", sortOrder: 1 },
        { pageKey: "LAB_REPORTS", title: "Laboratory Test Reports", subtitle: "Batch-wise transparency & certified purity", sortOrder: 1 },
        { pageKey: "OUR_STORY", title: "Our Story", subtitle: "Shatrunjay Foodstuffs Private Limited", sortOrder: 1 },
        { pageKey: "OUR_STORY_JOURNEY", title: "Our Journey", subtitle: "From traditional roots to trusted households & temples", sortOrder: 1 },
        { pageKey: "WHOLESALE", title: "Wholesale & Institutional Supply", subtitle: "Temples, Social Events, Restaurants & Clubs, and Resellers", ctaLabel: "Enquire About Bulk Orders", ctaUrl: "/bulk-order", sortOrder: 1 },
      ],
    });
  }

  const cmsDefaults = [
    { pageKey: "DERASAR", sectionKey: "jinalay", heading: "Jinalay", subheading: "Pure ghee for daily temple rituals & lamp offerings", content: "Supplying certified pure ghee directly to Jinalays with strict adherence to purity standards.", sortOrder: 1 },
    { pageKey: "DERASAR", sectionKey: "bhojanshala", heading: "Bhojanshala", subheading: "Wholesome cooking ghee for community kitchens", content: "Bulk & regular packs tailored for Bhojanshala kitchens.", sortOrder: 2 },
    { pageKey: "DERASAR", sectionKey: "pratishtha-mahotsav", heading: "Pratishtha Mahotsav", subheading: "Dedicated ceremonial supply", content: "Timely, large-scale ghee deliveries for Pratishtha Mahotsav celebrations.", sortOrder: 3 },
    { pageKey: "DERASAR", sectionKey: "chaturmas", heading: "Chaturmas", subheading: "Four-month sacred season supply", content: "Consistent batch quality throughout Chaturmas.", sortOrder: 4 },
    { pageKey: "DERASAR", sectionKey: "varshitap", heading: "Varshitap", subheading: "Pure nourishment for parna & rituals", content: "Carefully packed pure ghee for Varshitap programmes.", sortOrder: 5 },
    { pageKey: "DERASAR", sectionKey: "navanu-yatra", heading: "Navanu Yatra", subheading: "Pilgrimage & yatra supply", content: "Reliable logistics for Navanu Yatra bhojanshalas.", sortOrder: 6 },
    { pageKey: "DERASAR", sectionKey: "other-religious-functions", heading: "Other Religious Functions", subheading: "Custom ceremonial quantities", content: "Flexible packaging from 500 ml to 15 Kg tins.", sortOrder: 7 },
    { pageKey: "WHOLESALE", sectionKey: "temples", heading: "Temples", subheading: "Dedicated institutional pricing & purity", content: "Consistent batch quality for temple kitchens and rituals.", sortOrder: 1 },
    { pageKey: "WHOLESALE", sectionKey: "social-events", heading: "Social Events", subheading: "Weddings, community feasts & gatherings", content: "Scheduled bulk deliveries with 15 Kg tins & 5 Litre packs.", sortOrder: 2 },
    { pageKey: "WHOLESALE", sectionKey: "restaurants-clubs", heading: "Restaurants & Clubs", subheading: "HORECA & catering supply", content: "Rich aroma and consistent granular quality for commercial kitchens.", sortOrder: 3 },
    { pageKey: "WHOLESALE", sectionKey: "reseller", heading: "Reseller", subheading: "Partner with Shatrunjay Ghee", content: "Authorized distributor & retail partner inquiries.", sortOrder: 4 },
    { pageKey: "GHEE_LAABH_YOJNA", sectionKey: "intro", heading: "Ghee Laabh Yojna", subheading: "Send pure ghee to Jinalays seamlessly", content: "Participate in Ghee Laabh Yojna and track Jinalays served through our archive below.", sortOrder: 1 },
    { pageKey: "LAB_REPORTS", sectionKey: "intro", heading: "Batch-Wise Lab Reports", subheading: "100% Transparency", content: "Inspect NABL/accredited laboratory test reports for every production batch.", sortOrder: 1 },
    { pageKey: "OUR_STORY", sectionKey: "intro", heading: "Purity You Can Verify", subheading: "Crafted by Shatrunjay Foodstuffs Private Limited", content: "Every drop of Shatrunjay Ghee reflects our commitment to purity, tradition, and timely delivery.", sortOrder: 1 },
    { pageKey: "CONTACT", sectionKey: "intro", heading: "Get in touch", subheading: "We'd love to hear from you for orders, queries, or feedback.", content: "", sortOrder: 1 },
    { pageKey: "BULK_ORDER", sectionKey: "intro", heading: "Bulk Order Enquiry", subheading: "Planning a temple supply, social event, or wholesale order? Reach out to our team.", content: "", sortOrder: 1 },
  ];

  for (const cms of cmsDefaults) {
    await prisma.cmsSection.upsert({
      where: { pageKey_sectionKey: { pageKey: cms.pageKey, sectionKey: cms.sectionKey } },
      update: {},
      create: cms,
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
