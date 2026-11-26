import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { getEnv } from "./env";
import { getLeadrSite } from "./leadr";

export interface FooterLink {
  label: string;
  href: string;
}

export interface SiteSettingsMap {
  whatsappEnabled: boolean;
  whatsappNumber: string;
  businessEmail: string;
  googlePlaceId: string;
  referralEnabled: boolean;
  referralDiscountType: "FIXED" | "PERCENT";
  referralDiscountValue: number;
  referralMaxDiscountPaise: number | null;
  tickerEnabled: boolean;
  tickerMessages: string[];
  checkoutNotes: {
    mumbai: string;
    outsideMumbai: string;
  };
  policyVersion: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  socialLinks: {
    instagram: string;
    linkedin: string;
    facebook: string;
    youtube: string;
  };
  footerBrandName: string;
  footerLogoUrl: string;
  footerTagline: string;
  footerDescription: string;
  footerShopLinks: FooterLink[];
  footerDerasarLinks: FooterLink[];
  footerWholesaleLinks: FooterLink[];
  footerLegalLinks: FooterLink[];
  footerShopHeading: string;
  footerDerasarHeading: string;
  footerWholesaleHeading: string;
  footerContactHeading: string;
  footerCopyrightText: string;
  footerComplianceText: string;
  botWelcomeImageUrl: string;
  botReels: {
    cow: string;
    buffalo: string;
    a2: string;
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsMap = {
  whatsappEnabled: false, // Disabled by default per spec
  whatsappNumber: "+91 81696 29908",
  businessEmail: "info@shatrunjayghee.com",
  googlePlaceId: "",
  referralEnabled: false, // Not live at launch per spec
  referralDiscountType: "PERCENT",
  referralDiscountValue: 5,
  referralMaxDiscountPaise: 20000,
  tickerEnabled: true,
  tickerMessages: [
    "🐄 Pure A2 Desi Cow Bilona Ghee — Made in Small Batches",
    "🚚 Free Home Delivery • 2–3 Days in Mumbai • 5–7 Working Days Outside Mumbai",
    "🙏 Bulk Supply Available for Derasars, Temples & Bhojanshalas",
  ],
  checkoutNotes: {
    mumbai: "Deliveries in Mumbai will be done by Shatrunjay Team or Porter. All communication will be done by Shatrunjay Team.",
    outsideMumbai: "Deliveries outside Mumbai will be done by courier. Courier details will be shared by email and in your account.",
  },
  policyVersion: "2026-01",
  contactInfo: {
    phone: "+91 81696 29908",
    email: "info@shatrunjayghee.com",
    address: "Shop no 7, Ground Floor, Shubham Lifescapes Amrut, V. P. Road, Girgaon, Charni Road East, Mumbai 400004",
  },
  socialLinks: {
    instagram: "https://www.instagram.com/shatrunjayghee",
    linkedin: "https://www.linkedin.com",
    facebook: "https://www.facebook.com/share/1DSKgP2jVJ/",
    youtube: "https://youtube.com/@shatrunjayghee",
  },
  footerBrandName: "Shatrunjay",
  footerLogoUrl: "/brand/logo.png",
  footerTagline: "શુદ્ધ ઘી અને સમયસર ડિલિવરી એજ શત્રુંજય ઘી",
  footerDescription: "Pure Cow Ghee, Buffalo Ghee, and Bilona A2 Desi Cow Ghee crafted in small batches by Shatrunjay Foodstuffs Private Limited.",
  footerShopLinks: [
    { label: "All Products", href: "/shop" },
    { label: "Cow Ghee", href: "/ghee#cow-ghee" },
    { label: "Buffalo Ghee", href: "/ghee#buffalo-ghee" },
    { label: "A2 Desi Cow Ghee", href: "/ghee#a2-desi-cow-ghee" },
    { label: "Groundnut Oil", href: "/groundnut-oil" },
  ],
  footerDerasarLinks: [
    { label: "Jinalay", href: "/derasar#jinalay" },
    { label: "Bhojanshala", href: "/derasar#bhojanshala" },
    { label: "Pratishtha Mahostav", href: "/derasar#pratishtha_mahostav" },
    { label: "Chaturmas", href: "/derasar#chaturmas" },
    { label: "Varshitap", href: "/derasar#varshitap" },
    { label: "Navanu Yatra", href: "/derasar#navanu_yatra" },
    { label: "Ghee Laabh Yojna", href: "/ghee-laabh-yojna" },
    { label: "Other Religious Functions", href: "/derasar#other_religious_functions" },
  ],
  footerWholesaleLinks: [
    { label: "Temples", href: "/wholesale#temples" },
    { label: "Social Events", href: "/wholesale#social_events" },
    { label: "Restaurants & Clubs", href: "/wholesale#restaurants_clubs" },
    { label: "Reseller", href: "/wholesale#reseller" },
  ],
  footerLegalLinks: [
    { label: "Privacy Policy", href: "/legal/privacy-policy" },
    { label: "Shipping Policy", href: "/legal/shipping-policy" },
    { label: "Refund Policy", href: "/legal/refund-policy" },
    { label: "Terms of Service", href: "/legal/terms-of-service" },
  ],
  footerShopHeading: "Shop",
  footerDerasarHeading: "Derasar",
  footerWholesaleHeading: "Wholesale & Legal",
  footerContactHeading: "Talk to us",
  footerCopyrightText: "© 2026 Shatrunjay Ghee by Shatrunjay Foodstuffs Private Limited. All rights reserved.",
  footerComplianceText: "",
  botWelcomeImageUrl: "",
  botReels: { cow: "", buffalo: "", a2: "" },
};

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsMap> => {
    try {
      if (getEnv().COMMERCE_BACKEND === "leadr") {
        const site = await getLeadrSite();
        const content = site?.site_content ?? {};
        return {
          ...DEFAULT_SITE_SETTINGS,
          contactInfo: {
            ...DEFAULT_SITE_SETTINGS.contactInfo,
            phone: typeof content.phone === "string" ? content.phone : DEFAULT_SITE_SETTINGS.contactInfo.phone,
            email: typeof content.email === "string" ? content.email : DEFAULT_SITE_SETTINGS.contactInfo.email,
            address: typeof content.address === "string" ? content.address : DEFAULT_SITE_SETTINGS.contactInfo.address,
          },
          businessEmail: typeof content.email === "string" ? content.email : DEFAULT_SITE_SETTINGS.businessEmail,
          tickerMessages: typeof content.announcement === "string" && content.announcement ? [content.announcement] : DEFAULT_SITE_SETTINGS.tickerMessages,
        };
      }
      const rows = await prisma.siteSetting.findMany();
      const map = new Map<string, unknown>(rows.map((r) => [r.key, r.value]));
      return {
        whatsappEnabled: (map.get("whatsappEnabled") as boolean) ?? DEFAULT_SITE_SETTINGS.whatsappEnabled,
        whatsappNumber: (map.get("whatsappNumber") as string) ?? DEFAULT_SITE_SETTINGS.whatsappNumber,
        businessEmail: (map.get("businessEmail") as string) ?? DEFAULT_SITE_SETTINGS.businessEmail,
        googlePlaceId: (map.get("googlePlaceId") as string) ?? DEFAULT_SITE_SETTINGS.googlePlaceId,
        referralEnabled: (map.get("referralEnabled") as boolean) ?? DEFAULT_SITE_SETTINGS.referralEnabled,
        referralDiscountType:
          (map.get("referralDiscountType") as "FIXED" | "PERCENT") ?? DEFAULT_SITE_SETTINGS.referralDiscountType,
        referralDiscountValue:
          (map.get("referralDiscountValue") as number) ?? DEFAULT_SITE_SETTINGS.referralDiscountValue,
        referralMaxDiscountPaise:
          (map.get("referralMaxDiscountPaise") as number | null) ?? DEFAULT_SITE_SETTINGS.referralMaxDiscountPaise,
        tickerEnabled: (map.get("tickerEnabled") as boolean) ?? DEFAULT_SITE_SETTINGS.tickerEnabled,
        tickerMessages: (map.get("tickerMessages") as string[]) ?? DEFAULT_SITE_SETTINGS.tickerMessages,
        checkoutNotes:
          (map.get("checkoutNotes") as SiteSettingsMap["checkoutNotes"]) ?? DEFAULT_SITE_SETTINGS.checkoutNotes,
        policyVersion: (map.get("policyVersion") as string) ?? DEFAULT_SITE_SETTINGS.policyVersion,
        contactInfo:
          (map.get("contactInfo") as SiteSettingsMap["contactInfo"]) ?? DEFAULT_SITE_SETTINGS.contactInfo,
        socialLinks:
          (map.get("socialLinks") as SiteSettingsMap["socialLinks"]) ?? DEFAULT_SITE_SETTINGS.socialLinks,
        footerBrandName: (map.get("footerBrandName") as string) ?? DEFAULT_SITE_SETTINGS.footerBrandName,
        footerLogoUrl: (map.get("footerLogoUrl") as string) ?? DEFAULT_SITE_SETTINGS.footerLogoUrl,
        footerTagline: (map.get("footerTagline") as string) ?? DEFAULT_SITE_SETTINGS.footerTagline,
        footerDescription: (map.get("footerDescription") as string) ?? DEFAULT_SITE_SETTINGS.footerDescription,
        footerShopLinks: (map.get("footerShopLinks") as FooterLink[]) ?? DEFAULT_SITE_SETTINGS.footerShopLinks,
        footerDerasarLinks: (map.get("footerDerasarLinks") as FooterLink[]) ?? DEFAULT_SITE_SETTINGS.footerDerasarLinks,
        footerWholesaleLinks: (map.get("footerWholesaleLinks") as FooterLink[]) ?? DEFAULT_SITE_SETTINGS.footerWholesaleLinks,
        footerLegalLinks: (map.get("footerLegalLinks") as FooterLink[]) ?? DEFAULT_SITE_SETTINGS.footerLegalLinks,
        footerShopHeading: (map.get("footerShopHeading") as string) ?? DEFAULT_SITE_SETTINGS.footerShopHeading,
        footerDerasarHeading: (map.get("footerDerasarHeading") as string) ?? DEFAULT_SITE_SETTINGS.footerDerasarHeading,
        footerWholesaleHeading: (map.get("footerWholesaleHeading") as string) ?? DEFAULT_SITE_SETTINGS.footerWholesaleHeading,
        footerContactHeading: (map.get("footerContactHeading") as string) ?? DEFAULT_SITE_SETTINGS.footerContactHeading,
        footerCopyrightText: (map.get("footerCopyrightText") as string) ?? DEFAULT_SITE_SETTINGS.footerCopyrightText,
        footerComplianceText: (map.get("footerComplianceText") as string) ?? DEFAULT_SITE_SETTINGS.footerComplianceText,
        botWelcomeImageUrl: (map.get("botWelcomeImageUrl") as string) ?? DEFAULT_SITE_SETTINGS.botWelcomeImageUrl,
        botReels: (map.get("botReels") as SiteSettingsMap["botReels"]) ?? DEFAULT_SITE_SETTINGS.botReels,
      };
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  },
  ["site-settings"],
  { revalidate: 300, tags: ["cms", "site-settings"] }
);

export interface GoogleReviewItem {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
}

const FALLBACK_REVIEWS: GoogleReviewItem[] = [
  {
    author_name: "Meera Shah",
    rating: 5,
    text: "Authentic aroma and danedar texture. We order the 5L Pure Cow Ghee regularly for our home and pooja.",
    relative_time_description: "2 months ago",
  },
  {
    author_name: "Rajesh Jain",
    rating: 5,
    text: "Timely delivery in Mumbai and very clean packaging. The A2 Desi Cow Bilona Ghee tastes just like homemade.",
    relative_time_description: "1 month ago",
  },
  {
    author_name: "Kiran Patel",
    rating: 5,
    text: "We ordered bulk tins for our derasar bhojanshala. Consistent purity and helpful team.",
    relative_time_description: "3 weeks ago",
  },
];

export const getGoogleReviews = unstable_cache(
  async (): Promise<{ rating: number; total: number; reviews: GoogleReviewItem[]; isFallback: boolean }> => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const settings = await getSiteSettings();
    const placeId = settings.googlePlaceId || process.env.GOOGLE_PLACES_ID;
    if (!apiKey || !placeId) {
      return { rating: 4.9, total: 120, reviews: FALLBACK_REVIEWS, isFallback: true };
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        placeId
      )}&fields=rating,user_ratings_total,reviews&key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error("Places API HTTP error");
      const data = (await res.json()) as {
        result?: { rating?: number; user_ratings_total?: number; reviews?: GoogleReviewItem[] };
      };
      const reviews = data.result?.reviews ?? [];
      if (!reviews.length) {
        return { rating: 4.9, total: 120, reviews: FALLBACK_REVIEWS, isFallback: true };
      }
      return {
        rating: data.result?.rating ?? 4.9,
        total: data.result?.user_ratings_total ?? reviews.length,
        reviews: reviews.slice(0, 6),
        isFallback: false,
      };
    } catch {
      return { rating: 4.9, total: 120, reviews: FALLBACK_REVIEWS, isFallback: true };
    }
  },
  ["google-reviews"],
  { revalidate: 3600 }
);
