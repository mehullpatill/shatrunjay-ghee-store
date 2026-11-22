import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

function getS3Client() {
  const region = process.env.AWS_REGION || "ap-south-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS S3 credentials are not configured in .env");
  }
  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
}

const ALLOWED_MIME_PREFIXES = ["image/", "video/", "application/pdf"];

export async function createPresignedUploadUrl(params: {
  folder: string;
  filename: string;
  contentType: string;
}) {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || "ap-south-1";
  if (!bucket) throw new Error("AWS_S3_BUCKET is not configured in .env");

  if (!ALLOWED_MIME_PREFIXES.some((p) => params.contentType.startsWith(p))) {
    throw new Error("Unsupported file type. Allowed: images, videos, and PDFs.");
  }

  const sanitizedName = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${params.folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${sanitizedName}`;

  const client = getS3Client();
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: params.contentType }),
    { expiresIn: 300 }
  );
  const publicBase =
    process.env.AWS_S3_PUBLIC_URL?.replace(/\/+$/, "") || `https://${bucket}.s3.${region}.amazonaws.com`;

  return { uploadUrl, key, publicUrl: `${publicBase}/${key}` };
}
