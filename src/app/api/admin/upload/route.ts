import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/auth";
import { createPresignedUploadUrl } from "@/lib/s3";

const uploadSchema = z.object({
  folder: z.string().min(1).max(80).default("general"),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(3).max(100),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid upload metadata" }, { status: 400 });
    }

    const result = await createPresignedUploadUrl(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to generate S3 upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
