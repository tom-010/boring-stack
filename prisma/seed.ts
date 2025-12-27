import "dotenv/config";
import { db } from "../app/db/client";
import { auth } from "../app/lib/auth.server";

const USERS = [
  {
    email: "admin@example.com",
    password: "admin",
    name: "Admin User",
    roles: JSON.stringify(["admin", "user"]),
  },
  {
    email: "user@example.com",
    password: "user",
    name: "Regular User",
    roles: JSON.stringify(["user"]),
  },
];

async function createOrUpdateUser(
  ctx: { password: { hash: (password: string) => Promise<string> } },
  user: (typeof USERS)[number]
) {
  const hashedPassword = await ctx.password.hash(user.password);

  const existing = await db.user.findUnique({
    where: { email: user.email },
  });

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { roles: user.roles, name: user.name },
    });
    await db.account.updateMany({
      where: { userId: existing.id, providerId: "credential" },
      data: { password: hashedPassword },
    });
    console.log(`Updated user: ${user.email}`);
    return existing;
  }

  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();

  const created = await db.user.create({
    data: {
      id: userId,
      email: user.email,
      name: user.name,
      emailVerified: true,
      roles: user.roles,
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

  console.log(`Created user: ${user.email}`);
  return created;
}

async function main() {
  const ctx = await auth.$context;

  // Create users
  const [adminUser, regularUser] = await Promise.all(
    USERS.map((u) => createOrUpdateUser(ctx, u))
  );

  // Delete existing projects/todos for clean seed
  await db.project.deleteMany({
    where: { ownerId: adminUser.id },
  });

  // Create 2 projects for admin
  const project1 = await db.project.create({
    data: {
      name: "Website Redesign",
      description: "Redesign the company website with modern UI",
      color: "blue",
      ownerId: adminUser.id,
    },
  });

  const project2 = await db.project.create({
    data: {
      name: "Mobile App",
      description: "Build a mobile companion app",
      color: "green",
      ownerId: adminUser.id,
    },
  });

  console.log(`Created projects: ${project1.name}, ${project2.name}`);

  // Create 2 todos in project1
  // Todo 1: completed
  const todo1 = await db.todo.create({
    data: {
      title: "Design mockups",
      description: "Create initial design mockups for homepage",
      projectId: project1.id,
      userId: adminUser.id,
      completed: true,
      priority: "high",
    },
  });

  // Todo 2: not completed, assigned to both admin and regular user
  const todo2 = await db.todo.create({
    data: {
      title: "Implement responsive layout",
      description: "Make the layout work on mobile and desktop",
      projectId: project1.id,
      userId: adminUser.id,
      completed: false,
      priority: "medium",
    },
  });

  // Assign todo2 to regular user as well
  await db.todoAssignment.create({
    data: {
      todoId: todo2.id,
      userId: regularUser.id,
      assignedBy: adminUser.id,
    },
  });

  console.log(`Created todos: "${todo1.title}" (completed), "${todo2.title}" (assigned to ${regularUser.email})`);

  console.log("\nSeed complete!");
  console.log("  admin@example.com / admin");
  console.log("  user@example.com / user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
