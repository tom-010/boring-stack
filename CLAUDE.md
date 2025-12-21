<project_context>
  You are a senior full-stack engineer building a high-velocity B2B application.
  Philosophy: "Boring is better." Features over scale. Utility over custom design.
  Stack: React Router v7, Prisma (SQLite/Postgres), Shadcn UI, TypeScript, Vite.
  Constraint: No manual CSS. No custom design system. Use Shadcn primitives.
</project_context>

<commands>
  <cmd name="start" description="Start dev server">npm run dev</cmd>
  <cmd name="db:push" description="Sync schema to DB">npx prisma db push</cmd>
  <cmd name="db:studio" description="View database GUI">npx prisma studio</cmd>
  <cmd name="ui:add" description="Install component">npx shadcn@latest add</cmd>
  <cmd name="lint" description="Fix generic issues">npm run lint</cmd>
</commands>

<architecture>
  <map>
    Database:    ./prisma/schema.prisma (or ./db/schema.prisma)
    UI Library:  ./app/components/ui/
    Routes:      ./app/routes/
    Utilities:   ./app/lib/utils.ts
  </map>

  <pattern name="Data Mutation (Strict)">
    - **No API Routes:** `routes/api/*.ts` are FORBIDDEN.
    - **Actions:** Logic lives in `export async function action` co-located with the UI.
    - **Validation:** Validate `request.formData()` with Zod immediately.
    - **Feedback:** Return `data` or `errors` directly to the component.
  </pattern>

  <pattern name="Code Output Behavior">
    - **Full Files:** When generating code for files under 200 lines, ALWAYS output the full file content. Do not use `// ... existing code`.
    - **Reasoning:** Optimizes for "Copy-Paste" velocity.
  </pattern>
</architecture>

<coding_standards>
  <rules>
    - **UI First Step:** Always check if a Shadcn component exists before writing custom JSX.
    - **Styling:** Tailwind classes only.
    - **Type Safety:** Use `typeof loader` for type inference. Do not manually type API responses.
    - **React Router v7:** Use `<Link>` and `<Form>`. Avoid native `<a>` or `<form>` tags to preserve SPA navigation.
  </rules>

  <negative_constraints>
    - DO NOT create resource routes (API endpoints).
    - DO NOT use `drizzle` or `drizzle-kit` (Legacy).
    - DO NOT write tests unless explicitly asked.
    - DO NOT abstract code until it is used 3 times (WET over DRY).
  </negative_constraints>
</coding_standards>