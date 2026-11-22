import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User, UserRole } from "@prisma/client";
import { authenticator } from "otplib";
import { prisma } from "./prisma";
import { generateOpaqueToken, hashIp, hashToken } from "./security";

export const SESSION_COOKIE_NAME = "sj_session";
const SESSION_TTL_DAYS = 14;

export type SafeUser = Pick<
  User,
  "id" | "email" | "name" | "phone" | "role" | "emailVerifiedAt" | "totpEnabled" | "referralCode" | "createdAt"
>;

export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ip?: string | null }
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta?.userAgent?.slice(0, 250) ?? null,
      ipHash: hashIp(meta?.ip),
    },
  });

  return { rawToken, expiresAt };
}

export function attachSessionCookie(res: NextResponse, rawToken: string, expiresAt: Date): void {
  res.cookies.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function invalidateCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(raw) } });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          emailVerifiedAt: true,
          totpEnabled: true,
          referralCode: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session.user;
}

export async function requireRole(role?: UserRole): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required", 401);
  }
  if (role && user.role !== role) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireVerifiedCustomerOrAdmin(): Promise<SafeUser> {
  const user = await requireRole();
  if (!user.emailVerifiedAt) {
    throw new AuthError("Please verify your email address before placing an order.", 403);
  }
  return user;
}

export function generateTotpSetup(email: string): { secret: string; otpauthUrl: string } {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "Shatrunjay Ghee Admin", secret);
  return { secret, otpauthUrl };
}

export function verifyTotpCode(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s+/g, ""), secret });
  } catch {
    return false;
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
