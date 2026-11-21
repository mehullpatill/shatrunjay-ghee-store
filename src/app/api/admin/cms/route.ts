import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const [movingHeader, banners, makingProcesses, whyItems, cmsSections, licenses, legalPages, reels] =
      await Promise.all([
        prisma.movingHeaderItem.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.banner.findMany({ orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }] }),
        prisma.makingProcessSection.findMany(),
        prisma.whyShatrunjayItem.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.cmsSection.findMany({ orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }] }),
        prisma.license.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.legalPage.findMany({ orderBy: { slug: "asc" } }),
        prisma.instagramReel.findMany({ orderBy: { sortOrder: "asc" } }),
      ]);

    return NextResponse.json({
      movingHeader,
      banners,
      makingProcesses,
      whyItems,
      cmsSections,
      licenses,
      legalPages,
      reels,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to load CMS data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { resource, action, data } = await req.json();

    if (resource === "movingHeader") {
      if (action === "delete") {
        await prisma.movingHeaderItem.delete({ where: { id: data.id } });
        return NextResponse.json({ ok: true });
      }
      const item = data.id
        ? await prisma.movingHeaderItem.update({ where: { id: data.id }, data })
        : await prisma.movingHeaderItem.create({ data });
      return NextResponse.json({ item });
    }

    if (resource === "banner") {
      if (action === "delete") {
        await prisma.banner.delete({ where: { id: data.id } });
        return NextResponse.json({ ok: true });
      }
      const item = data.id
        ? await prisma.banner.update({ where: { id: data.id }, data })
        : await prisma.banner.create({ data });
      return NextResponse.json({ item });
    }

    if (resource === "makingProcess") {
      const steps = Array.isArray(data.stepsJson) ? data.stepsJson.slice(0, 9) : [];
      const item = await prisma.makingProcessSection.upsert({
        where: { sectionKey: data.sectionKey },
        update: {
          title: data.title,
          subtitle: data.subtitle || null,
          videoUrl: data.videoUrl || null,
          stepsJson: steps,
          isActive: data.isActive !== false,
        },
        create: {
          sectionKey: data.sectionKey,
          title: data.title,
          subtitle: data.subtitle || null,
          videoUrl: data.videoUrl || null,
          stepsJson: steps,
          isActive: data.isActive !== false,
        },
      });
      return NextResponse.json({ item });
    }

    if (resource === "whyItem") {
      if (action === "delete") {
        await prisma.whyShatrunjayItem.delete({ where: { id: data.id } });
        return NextResponse.json({ ok: true });
      }
      const item = data.id
        ? await prisma.whyShatrunjayItem.update({ where: { id: data.id }, data })
        : await prisma.whyShatrunjayItem.create({ data });
      return NextResponse.json({ item });
    }

    if (resource === "cmsSection") {
      const item = await prisma.cmsSection.upsert({
        where: { pageKey_sectionKey: { pageKey: data.pageKey, sectionKey: data.sectionKey } },
        update: {
          heading: data.heading,
          subheading: data.subheading || null,
          content: data.content || null,
          isActive: data.isActive !== false,
        },
        create: data,
      });
      return NextResponse.json({ item });
    }

    if (resource === "license") {
      if (action === "delete") {
        await prisma.license.delete({ where: { id: data.id } });
        return NextResponse.json({ ok: true });
      }
      const item = data.id
        ? await prisma.license.update({ where: { id: data.id }, data })
        : await prisma.license.create({ data });
      return NextResponse.json({ item });
    }

    if (resource === "legalPage") {
      const item = await prisma.legalPage.upsert({
        where: { slug: data.slug },
        update: { title: data.title, content: data.content },
        create: data,
      });
      return NextResponse.json({ item });
    }

    if (resource === "reel") {
      if (action === "delete") {
        await prisma.instagramReel.delete({ where: { id: data.id } });
        return NextResponse.json({ ok: true });
      }
      const item = data.id
        ? await prisma.instagramReel.update({ where: { id: data.id }, data })
        : await prisma.instagramReel.create({ data });
      return NextResponse.json({ item });
    }

    return NextResponse.json({ error: "Unknown CMS resource" }, { status: 400 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("CMS update error:", err);
    return NextResponse.json({ error: "Failed to update CMS" }, { status: 500 });
  }
}
