import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv, requireEnvValue } from "./env";

let cachedS3: S3Client | null = null;

function getS3Client(): S3Client {
  if (cachedS3) return cachedS3;
  const env = getEnv();
  cachedS3 = new S3Client({
    region: requireEnvValue(env.AWS_REGION, "AWS_REGION"),
    credentials: {
      accessKeyId: requireEnvValue(env.AWS_ACCESS_KEY_ID, "AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnvValue(env.AWS_SECRET_ACCESS_KEY, "AWS_SECRET_ACCESS_KEY"),
    },
  });
  return cachedS3;
}

export const UPLOAD_POLICIES: Record<
  "image" | "video" | "lab_report",
  { mimes: string[]; exts: string[]; maxBytes: number }
> = {
  image: {
    mimes: ["image/jpeg", "image/png", "image/webp"],
    exts: ["jpg", "jpeg", "png", "webp"],
    maxBytes: 10 * 1024 * 1024, // 10 MB
  },
  video: {
    mimes: ["video/mp4", "video/webm"],
    exts: ["mp4", "webm"],
    maxBytes: 100 * 1024 * 1024, // 100 MB
  },
  lab_report: {
    mimes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    exts: ["pdf", "jpg", "jpeg", "png", "webp"],
    maxBytes: 20 * 1024 * 1024, // 20 MB
  },
};

export function validateMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 4) return false;
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === "image/png") {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (mime === "image/webp") {
    return (
      buf.length >= 12 &&
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mime === "application/pdf") {
    return buf.subarray(0, 4).toString("ascii") === "%PDF";
  }
  if (mime === "video/mp4") {
    return buf.length >= 8 && buf.subarray(4, 8).toString("ascii") === "ftyp";
  }
  if (mime === "video/webm") {
    return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  }
  return false;
}

export async function createPresignedUploadUrl(params: {
  folder: string;
  kind: "image" | "video" | "lab_report";
  mime: string;
  ext: string;
  sizeBytes: number;
}): Promise<{ uploadUrl: string; s3Key: string; publicUrl: string }> {
  const policy = UPLOAD_POLICIES[params.kind];
  const cleanExt = params.ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!policy.mimes.includes(params.mime) || !policy.exts.includes(cleanExt)) {
    throw new Error("Unsupported file type.");
  }
  if (params.sizeBytes <= 0 || params.sizeBytes > policy.maxBytes) {
    throw new Error(`File exceeds maximum size of ${Math.round(policy.maxBytes / 1024 / 1024)} MB.`);
  }

  const env = getEnv();
  requireEnvValue(env.S3_BUCKET_NAME, "S3_BUCKET_NAME");
  requireEnvValue(env.S3_PUBLIC_BASE_URL, "S3_PUBLIC_BASE_URL");
  const safeFolder = params.folder.replace(/[^a-zA-Z0-9/_-]/g, "");
  const randomId = crypto.randomBytes(16).toString("hex");
  const s3Key = `${safeFolder}/${randomId}.${cleanExt}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: params.mime,
    ContentLength: params.sizeBytes,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });
  const base = env.S3_PUBLIC_BASE_URL.replace(/\/$/, "");
  return {
    uploadUrl,
    s3Key,
    publicUrl: `${base}/${s3Key}`,
  };
}

export async function verifyUploadedObjectMagicBytes(s3Key: string, expectedMime: string): Promise<boolean> {
  try {
    const env = getEnv();
    const res = await getS3Client().send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
        Range: "bytes=0-31",
      })
    );
    if (!res.Body) return false;
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buf = Buffer.concat(chunks);
    return validateMagicBytes(buf, expectedMime);
  } catch {
    return false;
  }
}

export async function uploadBufferToS3(params: {
  s3Key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const env = getEnv();
  requireEnvValue(env.S3_BUCKET_NAME, "S3_BUCKET_NAME");
  requireEnvValue(env.S3_PUBLIC_BASE_URL, "S3_PUBLIC_BASE_URL");
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: params.s3Key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
  const base = env.S3_PUBLIC_BASE_URL.replace(/\/$/, "");
  return `${base}/${params.s3Key}`;
}
