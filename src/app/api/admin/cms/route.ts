import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processStepArraySchema } from "@/lib/validators";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp, sanitizeRichHtml } from "@/lib/security";

const cmsSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("upsert_section"),
    pageKey: z.string().min(1).max(60),
    sectionKey: z.string().min(1).max(60),
    heading: z.string().min(1).max(200),
    subheading: z.string().max(400).optional().nullable(),
    content: z.string().max(25000).optional().nullable(),
  }),
  z.object({
    action: z.literal("upsert_process_block"),
    key: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    subtitle: z.string().max(400).optional().nullable(),
    videoUrl: z.string().max(500).optional().nullable(),
    videoS3Key: z.string().max(300).optional().nullable(),
    steps: processStepArraySchema,
  }),
  z.object({
    action: z.literal("upsert_banner"),
    id: z.string().optional(),
    placement: z.string().min(1).max(60),
    title: z.string().min(1).max(200),
    subtitle: z.string().max(400).optional().nullable(),
    imageUrl: z.string().min(1).max(500),
    s3Key: z.string().max(300).optional().nullable(),
    ctaText: z.string().max(80).optional().nullable(),
    ctaLink: z.string().max(300).optional().nullable(),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("delete_banner"),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("upsert_archive"),
    id: z.string().optional(),
    sectionKey: z.string().min(1).max(80),
    name: z.string().min(1).max(160),
    location: z.string().max(200).optional().nullable(),
    imageUrl: z.string().min(1).max(500),
    s3Key: z.string().max(300).optional().nullable(),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("delete_archive"),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("upsert_license"),
    id: z.string().optional(),
    name: z.string().min(1).max(120),
    number: z.string().min(1).max(120),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("delete_license"),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("upsert_reel"),
    id: z.string().optional(),
    title: z.string().max(120).optional().nullable(),
    thumbnailUrl: z.string().min(1).max(500),
    s3Key: z.string().max(300).optional().nullable(),
    reelUrl: z.string().url().max(500),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("delete_reel"),
    id: z.string().min(1),
  }),
]);

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = cmsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid CMS input" }, { status: 400 });
  }

  const d = parsed.data;
  const ip = getClientIp(req);

  if (d.action === "upsert_section") {
    const cleanContent = d.content ? sanitizeRichHtml(d.content) : null;
    const section = await prisma.siteSection.upsert({
      where: { pageKey_sectionKey: { pageKey: d.pageKey, sectionKey: d.sectionKey } },
      create: { pageKey: d.pageKey, sectionKey: d.sectionKey, heading: d.heading, subheading: d.subheading || null, content: cleanContent },
      update: { heading: d.heading, subheading: d.subheading || null, content: cleanContent },
    });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_SITE_SECTION", entityType: "SiteSection", entityId: section.id, afterSummary: { pageKey: d.pageKey, sectionKey: d.sectionKey }, ip });
    revalidateTag("cms");
    revalidatePath("/", "layout");
    return NextResponse.json({ section });
  }

  if (d.action === "upsert_process_block") {
    const block = await prisma.$transaction(async (tx) => {
      const saved = await tx.processBlock.upsert({
        where: { key: d.key },
        create: { key: d.key, title: d.title, subtitle: d.subtitle || null, videoUrl: d.videoUrl || null, videoS3Key: d.videoS3Key || null },
        update: { title: d.title, subtitle: d.subtitle || null, videoUrl: d.videoUrl || null, videoS3Key: d.videoS3Key || null },
      });
      await tx.processStep.deleteMany({ where: { blockId: saved.id } });
      if (d.steps.length > 0) {
        await tx.processStep.createMany({
          data: d.steps.map((s, idx) => ({
            blockId: saved.id,
            stepOrder: idx + 1,
            heading: s.heading,
            subheading: s.subheading || null,
            imageUrl: s.imageUrl || null,
            imageS3Key: s.imageS3Key || null,
          })),
        });
      }
      return saved;
    });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_PROCESS_BLOCK", entityType: "ProcessBlock", entityId: block.id, afterSummary: { key: d.key, stepsCount: d.steps.length }, ip });
    revalidatePath("/");
    revalidatePath("/ghee");
    revalidatePath("/groundnut-oil");
    return NextResponse.json({ block });
  }

  if (d.action === "upsert_banner") {
    const banner = d.id
      ? await prisma.banner.update({
          where: { id: d.id },
          data: { placement: d.placement, title: d.title, subtitle: d.subtitle || null, imageUrl: d.imageUrl, s3Key: d.s3Key || null, ctaText: d.ctaText || null, ctaLink: d.ctaLink || null, sortOrder: d.sortOrder, active: d.active },
        })
      : await prisma.banner.create({
          data: { placement: d.placement, title: d.title, subtitle: d.subtitle || null, imageUrl: d.imageUrl, s3Key: d.s3Key || null, ctaText: d.ctaText || null, ctaLink: d.ctaLink || null, sortOrder: d.sortOrder, active: d.active },
        });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_BANNER", entityType: "Banner", entityId: banner.id, ip });
    revalidatePath("/", "layout");
    return NextResponse.json({ banner });
  }

  if (d.action === "delete_banner") {
    await prisma.banner.delete({ where: { id: d.id } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "DELETE_BANNER", entityType: "Banner", entityId: d.id, ip });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  }

  if (d.action === "upsert_archive") {
    const entry = d.id
      ? await prisma.archiveEntry.update({ where: { id: d.id }, data: { sectionKey: d.sectionKey, name: d.name, location: d.location || null, imageUrl: d.imageUrl, s3Key: d.s3Key || null, sortOrder: d.sortOrder, active: d.active } })
      : await prisma.archiveEntry.create({ data: { sectionKey: d.sectionKey, name: d.name, location: d.location || null, imageUrl: d.imageUrl, s3Key: d.s3Key || null, sortOrder: d.sortOrder, active: d.active } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_ARCHIVE", entityType: "ArchiveEntry", entityId: entry.id, ip });
    revalidatePath("/derasar");
    revalidatePath("/ghee-laabh-yojna");
    revalidatePath("/wholesale");
    return NextResponse.json({ entry });
  }

  if (d.action === "delete_archive") {
    await prisma.archiveEntry.delete({ where: { id: d.id } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "DELETE_ARCHIVE", entityType: "ArchiveEntry", entityId: d.id, ip });
    return NextResponse.json({ ok: true });
  }

  if (d.action === "upsert_license") {
    const license = d.id
      ? await prisma.license.update({ where: { id: d.id }, data: { name: d.name, number: d.number, sortOrder: d.sortOrder, active: d.active } })
      : await prisma.license.create({ data: { name: d.name, number: d.number, sortOrder: d.sortOrder, active: d.active } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_LICENSE", entityType: "License", entityId: license.id, ip });
    revalidatePath("/our-story");
    revalidatePath("/", "layout");
    return NextResponse.json({ license });
  }

  if (d.action === "delete_license") {
    await prisma.license.delete({ where: { id: d.id } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "DELETE_LICENSE", entityType: "License", entityId: d.id, ip });
    return NextResponse.json({ ok: true });
  }

  if (d.action === "upsert_reel") {
    const reel = d.id
      ? await prisma.instagramReel.update({ where: { id: d.id }, data: { title: d.title || null, thumbnailUrl: d.thumbnailUrl, s3Key: d.s3Key || null, reelUrl: d.reelUrl, sortOrder: d.sortOrder, active: d.active } })
      : await prisma.instagramReel.create({ data: { title: d.title || null, thumbnailUrl: d.thumbnailUrl, s3Key: d.s3Key || null, reelUrl: d.reelUrl, sortOrder: d.sortOrder, active: d.active } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_REEL", entityType: "InstagramReel", entityId: reel.id, ip });
    revalidatePath("/");
    return NextResponse.json({ reel });
  }

  if (d.action === "delete_reel") {
    await prisma.instagramReel.delete({ where: { id: d.id } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "DELETE_REEL", entityType: "InstagramReel", entityId: d.id, ip });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown CMS action" }, { status: 400 });
}
