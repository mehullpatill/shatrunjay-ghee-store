import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { createPresignedUploadUrl } from "@/lib/s3";
import { assertSameOrigin } from "@/lib/security";

const presignSchema = z.object({
  folder: z.enum(["products", "banners", "videos", "lab-reports", "archives", "couriers", "reels"]),
  kind: z.enum(["image", "video", "lab_report"]),
  mime: z.string().min(3).max(100),
  ext: z.string().min(2).max(10),
  sizeBytes: z.number().int().positive(),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid upload request" }, { status: 400 });
  }

  try {
    const result = await createPresignedUploadUrl(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate upload URL";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
