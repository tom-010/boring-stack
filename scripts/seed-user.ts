import { db } from "../app/db/client";
import { auth } from "../app/lib/auth.server";

async function seedUser() {
  const email = "admin@example.com";
  const password = "9gxP1DmYQ36x26VwWoXsjw6DbgCagO4ga6UJC";
  const name = "Admin";

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User ${email} already exists. Skipping...`);
    return;
  }

  // Use BetterAuth's internal context to hash password
  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(password);

  // Generate unique IDs
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();

  // Create user
  await db.user.create({
    data: {
      id: userId,
      email,
      name,
      emailVerified: true,
    },
  });

  // Create account with hashed password
  await db.account.create({
    data: {
      id: accountId,
      userId,
      accountId: userId,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  console.log(`Created user: ${email} with password: ${password}`);
}

seedUser()
  .catch(console.error)
  .finally(() => process.exit(0));
