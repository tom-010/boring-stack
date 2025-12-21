<project_context>
  You are a senior full-stack engineer building a high-velocity B2B application.
  Philosophy: "Boring is better." Features over scale. Utility over custom design.
  Stack: React Router v7, Prisma (SQLite/Postgres), Shadcn UI, TypeScript, Vite.
  Constraint: No manual CSS. No custom design system. Use Shadcn primitives.
</project_context>

<commands>
  <cmd name="dev" description="Start dev server">npm run dev</cmd>
  <cmd name="build" description="Build for production">npm run build</cmd>
  <cmd name="typecheck" description="Run type checking">npm run typecheck</cmd>
  <cmd name="db:migrate" description="Sync schema to DB">npm run db:migrate</cmd>
  <cmd name="db:generate" description="Generate Prisma client">npm run db:generate</cmd>
  <cmd name="db:studio" description="View database GUI">npm run db:studio</cmd>
  <cmd name="ui:add" description="Install component">npx shadcn@latest add</cmd>
</commands>

<architecture>
  <map>
    Database:    ./prisma/schema.prisma
    DB Client:   ./app/db/client.ts (exports `db`)
    UI Library:  ./app/components/ui/
    Routes:      ./app/routes/
    Utilities:   ./app/lib/utils.ts
  </map>

  <pattern name="Data Mutation (Strict)">
    - **No API Routes:** `routes/api/*.ts` are normally not desired FORBIDDEN.
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
    - **Import Alias:** ALWAYS use `~/` alias for imports (e.g., `import { Button } from '~/components/ui/button'`). Never use relative paths like `../../`.
    - **DB Client:** Import as `import { db } from '~/db/client'`.
    - **Utilities:** Import `cn` from `~/lib/utils`.
    - **Zod Schemas:** Co-locate validation schemas in route files. Extract to `~/lib/schemas.ts` only after 3+ uses.
    - **UI First Step:** Always check if a Shadcn component exists before writing custom JSX.
    - **Styling:** Tailwind classes only.
    - **Type Safety:** Use `typeof loader` for type inference. Do not manually type API responses.
    - **React Router v7:** Use `<Link>` and `<Form>`. Avoid native `<a>` or `<form>` tags to preserve SPA navigation.
  </rules>

  <negative_constraints>
    - DO NOT create resource routes (API endpoints).
    - DO NOT write tests unless explicitly asked.
    - DO NOT abstract code until it is used 3 times (WET over DRY).
  </negative_constraints>

  <verification>
    - Run `npm run typecheck` after completing changes to catch errors early.
  </verification>
</coding_standards>

<orientation>
  When given a URL or asked about a feature, check these files first:
  - `./app/routes.ts` — maps URLs to route files
  - `./prisma/schema.prisma` — defines data models
</orientation>

<workflows>
  <workflow name="Add a new model">
    1. Add model to `prisma/schema.prisma`
    2. Run `npm run db:migrate` then `npm run db:generate`
    3. Create route file, add to `routes.ts`
  </workflow>
  <workflow name="Add a new page">
    1. Create route file in `app/routes/`
    2. Register in `app/routes.ts`
    3. Add loader/action as needed
  </workflow>
</workflows>