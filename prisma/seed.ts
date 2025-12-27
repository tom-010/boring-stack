import "dotenv/config";
import { db } from "../app/db/client";
import { auth } from "../app/lib/auth.server";

const TEST_USER = {
  email: "admin@example.com",
  password: "admin",
  name: "Test User",
  roles: JSON.stringify(["admin"]),
};

async function main() {
  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(TEST_USER.password);

  const existing = await db.user.findUnique({
    where: { email: TEST_USER.email },
  });

  if (existing) {
    // Update password and roles to ensure they match expected values
    await db.user.update({
      where: { id: existing.id },
      data: { roles: TEST_USER.roles },
    });
    await db.account.updateMany({
      where: { userId: existing.id, providerId: "credential" },
      data: { password: hashedPassword },
    });
    console.log(`Updated test user: ${TEST_USER.email}`);
    return;
  }

  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();

  await db.user.create({
    data: {
      id: userId,
      email: TEST_USER.email,
      name: TEST_USER.name,
      emailVerified: true,
      roles: TEST_USER.roles,
    },
  });

  await db.account.create({
    data: {
      id: accountId,
      userId,
      accountId: userId,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  console.log(`Created test user: ${TEST_USER.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
