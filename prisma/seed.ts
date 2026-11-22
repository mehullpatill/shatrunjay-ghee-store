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
    create: { id: "default", siteContentJson: {} },
  });

  // Exact 11-SKU catalogue from ghee.zip (deploy/catalogue.py)
  const products = [
    { sku: "CG500ML", name: "Pure Cow Ghee 500 ml", slug: "cow-ghee-500ml", pack: "500 ml", price: 51000, img: "/brand/photos/pack-cow.jpg", feat: false, most: false, fresh: false, active: true, sort: 1 },
    { sku: "CG1L", name: "Pure Cow Ghee 1 Litre", slug: "cow-ghee-1l", pack: "1 Litre", price: 100000, img: "/brand/photos/pack-cow.jpg", feat: true, most: false, fresh: false, active: true, sort: 2 },
    { sku: "CG5L", name: "Pure Cow Ghee 5 Litres", slug: "cow-ghee-5l", pack: "5 Litres", price: 480000, img: "/brand/photos/pack-cow.jpg", feat: true, most: true, fresh: false, active: true, sort: 3 },
    { sku: "CG15KG", name: "Pure Cow Ghee 15 Kg (16.5 Litres)", slug: "cow-ghee-15kg", pack: "15 Kg (16.5 Litres)", price: 1500000, img: "/brand/photos/pack-cow.jpg", feat: false, most: true, fresh: false, active: true, sort: 4 },
    { sku: "BG500ML", name: "Pure Buffalo Ghee 500 ml", slug: "buffalo-ghee-500ml", pack: "500 ml", price: 51000, img: "/brand/photos/pack-buffalo.jpg", feat: false, most: false, fresh: false, active: true, sort: 5 },
    { sku: "BG1L", name: "Pure Buffalo Ghee 1 Litre", slug: "buffalo-ghee-1l", pack: "1 Litre", price: 100000, img: "/brand/photos/pack-buffalo.jpg", feat: false, most: false, fresh: false, active: true, sort: 6 },
    { sku: "BG5L", name: "Pure Buffalo Ghee 5 Litres", slug: "buffalo-ghee-5l", pack: "5 Litres", price: 480000, img: "/brand/photos/pack-buffalo.jpg", feat: false, most: true, fresh: false, active: true, sort: 7 },
    { sku: "BG15KG", name: "Pure Buffalo Ghee 15 Kg (16.5 Litres)", slug: "buffalo-ghee-15kg", pack: "15 Kg (16.5 Litres)", price: 1500000, img: "/brand/photos/pack-buffalo.jpg", feat: false, most: false, fresh: false, active: true, sort: 8 },
    { sku: "A2500ML", name: "A2 Desi Cow Ghee 500 ml - Bilona Method", slug: "a2-desi-cow-ghee-500ml", pack: "500 ml", price: 110000, img: "/brand/photos/pack-a2.jpg", feat: true, most: true, fresh: true, active: true, sort: 9 },
    { sku: "A21L", name: "A2 Desi Cow Ghee 1 Litre - Bilona Method", slug: "a2-desi-cow-ghee-1l", pack: "1 Litre", price: 200000, img: "/brand/photos/pack-a2.jpg", feat: false, most: true, fresh: true, active: true, sort: 10 },
    { sku: "A25L", name: "A2 Desi Cow Ghee 5 Litres - Bilona Method", slug: "a2-desi-cow-ghee-5l", pack: "5 Litres", price: 950000, img: "/brand/photos/pack-a2.jpg", feat: false, most: false, fresh: true, active: true, sort: 11 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        pricePaise: p.price,
        packLabel: p.pack,
        imageUrl: p.img,
        sortOrder: p.sort,
      },
      create: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: "Crafted by Shatrunjay Foodstuffs Private Limited with batch-level lab testing.",
        pricePaise: p.price,
        imageUrl: p.img,
        packLabel: p.pack,
        isFeatured: p.feat,
        isMostBought: p.most,
        isFreshArrival: p.fresh,
        isActive: p.active,
        sortOrder: p.sort,
      },
    });
  }

  // Sample Mumbai COD pincodes (admin can upload/edit full CSV in /admin/pincodes)
  const sampleMumbaiPins = ["400001", "400002", "400003", "400004", "400005", "400006", "400007", "400008", "400009", "400010"];
  for (const pin of sampleMumbaiPins) {
    await prisma.codPincode.upsert({
      where: { pincode: pin },
      update: {},
      create: { pincode: pin, city: "Mumbai", state: "Maharashtra", isMumbai: true, isActive: true },
    });
  }

  console.log("Shatrunjay Ghee seed completed (11 SKUs from ghee.zip + sample COD pincodes).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
