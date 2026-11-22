import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.ADMIN_SEED_PASSWORD;
  const email = (process.env.ADMIN_SEED_EMAIL || "admin@shatrunjayghee.com").trim().toLowerCase();

  if (!password || password.length < 12) {
    throw new Error("ADMIN_SEED_PASSWORD must be set and at least 12 characters long.");
  }

  const admin = await prisma.user.findUnique({ where: { email } });
  if (!admin || admin.role !== "ADMIN") {
    throw new Error(`No ADMIN account found for ${email}; no account was changed.`);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    // Revoke all existing sessions so the password reset takes effect everywhere.
    prisma.session.deleteMany({ where: { userId: admin.id } }),
  ]);

  const updated = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await argon2.verify(updated.passwordHash, password))) {
    throw new Error("Password verification failed after update.");
  }

  console.log(`Admin password updated and existing sessions revoked for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Admin password reset failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
