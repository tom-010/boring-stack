# Project Architecture

Complete reference for reproducing this starter project. This is a high-velocity B2B application template with React Router v7, Prisma, BetterAuth, Shadcn UI, and optional Python for compute-heavy tasks.

## Philosophy

**"Boring is better."** Features over scale. Utility over custom design. Proven technology over novelty.

Core beliefs:
- Code is liability; every line creates maintenance debt
- Cognitive capacity is the bottleneck, not hardware
- Scale is a distraction; architect only for now (10 users)
- Value follows a power law; imperfection is economic
- URL is source of truth, database is state, client is just a view

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React Router v7 | 7.10.1 |
| Frontend | React 19 | 19.2.3 |
| Styling | Tailwind CSS v4 + Shadcn UI | 4.1.13 |
| ORM | Prisma v7 | 7.2.0 |
| Database | PostgreSQL | 18.1 |
| Auth | BetterAuth | 1.4.7 |
| Background Jobs | Graphile Worker | 0.16.6 |
| Python (optional) | FastAPI + Pillow | 0.127.0 |
| Build | Vite v7 | 7.1.7 |
| Testing | Playwright (E2E), Vitest (unit) | 1.57.0 / 4.0.16 |
| Package Manager | npm | - |
| Python Package Manager | uv | - |

---

## Directory Structure

```
├── app/
│   ├── routes.ts              # Route configuration (URL → file mapping)
│   ├── root.tsx               # Root layout with sidebar
│   ├── app.css                # Tailwind + CSS variables
│   ├── routes/                # Route files
│   ├── components/
│   │   ├── ui/                # Shadcn primitives
│   │   ├── app-sidebar.tsx    # Navigation sidebar
│   │   └── page-header.tsx    # Breadcrumb header
│   ├── db/
│   │   └── client.ts          # Prisma client export
│   └── lib/
│       ├── auth.server.ts     # BetterAuth config
│       ├── auth-client.ts     # Browser auth client
│       ├── config.server.ts   # Env validation
│       ├── forms.ts           # Form parsing helpers
│       ├── jobs.server.ts     # Job queue helpers
│       ├── logger.server.ts   # Pino logger
│       ├── roles.ts           # User role management
│       ├── schemas.ts         # Zod schemas
│       ├── utils.ts           # cn, parseForm, useFormValidation
│       └── py/                # Python SDK
│           ├── client.ts      # Entry point
│           └── gen/           # Generated types (auto)
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Test user seeder
├── scripts/
│   ├── worker.ts              # Graphile Worker runner
│   ├── manage-users.ts        # User CLI tool
│   └── sync-py.sh             # Python SDK generator
├── py/                        # Python service
│   ├── main.py                # FastAPI endpoints
│   ├── logger.py              # Python logging
│   └── pyproject.toml         # Python dependencies
├── tests/                     # Playwright tests
├── docs/                      # Documentation
└── public/
    └── uploads/               # File uploads
```

---

## Configuration Files

### package.json

Key scripts:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:worker\" \"npm run dev:py\"",
    "dev:vite": "react-router dev",
    "dev:worker": "npx tsx scripts/worker.ts",
    "dev:py": "cd py && uv run python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001",
    "build": "react-router build",
    "start": "react-router-serve ./build/server/index.js",
    "typecheck": "react-router typegen && tsc",
    "db:generate": "prisma generate",
    "db:migrate": "prisma db push",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:e2e": "npx tsx prisma/seed.ts && playwright test"
  }
}
```

Key dependencies:
- `@prisma/adapter-pg` + `pg` - PostgreSQL driver
- `better-auth` - Authentication
- `graphile-worker` - Background jobs
- `@hey-api/client-fetch` - Python SDK client
- `zod` - Schema validation
- `pino` + `pino-pretty` - Logging
- `sharp` - Image processing
- `lucide-react` - Icons
- Radix UI primitives for Shadcn components

Dev dependencies:
- `@hey-api/openapi-ts` - Python SDK codegen
- `concurrently` - Run multiple processes
- `shadcn` - Component CLI
- `tsx` - TypeScript execution
- `@playwright/test` - E2E testing

### tsconfig.json

```json
{
  "compilerOptions": {
    "paths": { "~/*": ["./app/*"] },
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

Path alias `~/` maps to `./app/`.

### vite.config.ts

```typescript
const featureFlags = {
  __ENABLE_DASHBOARD__: JSON.stringify(process.env.ENABLE_DASHBOARD !== "false"),
};

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), pythonSyncPlugin()],
  define: featureFlags,
});
```

- Feature flags injected at build time
- Python sync runs on dev start and watches `py/**/*.py`

### react-router.config.ts

```typescript
export default {
  ssr: true,
  future: { v8_middleware: true },
} satisfies Config;
```

SSR enabled, v8 middleware for auth gates.

### components.json

Shadcn config:
- Style: `new-york`
- Base color: `neutral`
- Icon library: `lucide`
- Aliases: `~/components`, `~/lib`, `~/components/ui`

### .env

Required environment variables:
```
DATABASE_URL="postgresql://app:app@localhost:5432/app"
BETTER_AUTH_SECRET="<random-32-byte-base64>"
BETTER_AUTH_URL="http://localhost:5173"
```

### .mcp.json

MCP (Model Context Protocol) server configuration for AI code assistants:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

Enables AI assistants to interact with Shadcn component registry.

### .gitignore

```
.DS_Store
.env
/node_modules/
/.react-router/
/build/
/generated/prisma
dev.log
playwright/.auth
test-results/
playwright-report/
```

### .dockerignore

```
.react-router
build
node_modules
README.md
```

### docker-compose.yml

```yaml
services:
  db:
    image: postgres:18.1-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
```

---

## Database Schema (prisma/schema.prisma)

### Application Models

```prisma
model Project {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  color       String?  @default("blue")
  createdAt   DateTime @default(now())
  todos       Todo[]
}

model Todo {
  id          Int              @id @default(autoincrement())
  projectId   Int
  userId      String
  title       String
  description String?
  completed   Boolean          @default(false)
  priority    String?          @default("medium")
  dueDate     String?
  createdAt   DateTime         @default(now())
  project     Project          @relation(...)
  user        User             @relation(...)
  attachments Attachment[]
  assignments TodoAssignment[]
}

model Attachment {
  id            Int      @id @default(autoincrement())
  todoId        Int
  userId        String
  filename      String
  filepath      String
  mimetype      String
  size          Int
  thumbnailPath String?
  createdAt     DateTime @default(now())
}

model TodoAssignment {
  id         Int      @id @default(autoincrement())
  todoId     Int
  userId     String
  assignedBy String
  createdAt  DateTime @default(now())
  @@unique([todoId, userId])
}
```

### BetterAuth Models

```prisma
model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  roles         String   @default("[\"user\"]")  // JSON array
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Session {
  id        String   @id
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
}

model Account {
  id                    String    @id
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
}
```

---

## Routing (app/routes.ts)

```typescript
export default [
  // Public
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("login", "routes/login.tsx"),

  // Protected (auth middleware)
  layout("routes/_protected.tsx", [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("projects", "routes/projects-list.tsx"),
    route("projects/:id", "routes/project-detail.tsx"),
    route("todos/:id", "routes/todo-detail.tsx"),
    route("todos/:id/edit", "routes/todo-edit.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
    route("admin/users/new", "routes/admin.users.new.tsx"),
    route("admin/users/:id/edit", "routes/admin.users.$id.edit.tsx"),
    route("debug/py", "routes/debug-py.tsx"),
  ]),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
```

### Route Files

| File | URL | Purpose |
|------|-----|---------|
| `api.auth.$.ts` | `/api/auth/*` | BetterAuth catch-all handler |
| `login.tsx` | `/login` | Login page (public) |
| `_protected.tsx` | - | Auth middleware layout |
| `home.tsx` | `/` | Redirect based on feature flag |
| `dashboard.tsx` | `/dashboard` | Dashboard view |
| `projects-list.tsx` | `/projects` | Create/list/delete projects |
| `project-detail.tsx` | `/projects/:id` | Project with todos |
| `todo-detail.tsx` | `/todos/:id` | Todo with attachments/assignments |
| `todo-edit.tsx` | `/todos/:id/edit` | Edit todo form |
| `admin.users.tsx` | `/admin/users` | User list (admin only) |
| `admin.users.new.tsx` | `/admin/users/new` | Create user (admin only) |
| `admin.users.$id.edit.tsx` | `/admin/users/:id/edit` | Edit user (admin only) |
| `debug-py.tsx` | `/debug/py` | Python bridge debug page |
| `not-found.tsx` | `*` | 404 handler |

---

## Authentication (app/lib/auth.server.ts)

BetterAuth with Prisma adapter:

```typescript
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: config.auth.secret,
  baseURL: config.auth.url,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,  // Users created via CLI only
  },
});

export async function requireAuth(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/login");
  return session;
}

export async function requireAdmin(request: Request) {
  const session = await requireAuth(request);
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!hasRole(user?.roles ?? null, "admin")) {
    throw new Response("Forbidden", { status: 403 });
  }
  return session;
}
```

### Middleware Auth Gate (_protected.tsx)

```typescript
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request }, next) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw redirect("/login");
    const response = await next();
    log.info({ method: request.method, path: url.pathname, userId: session.user.id }, "request");
    return response;
  },
];
```

### Role System (app/lib/roles.ts)

```typescript
export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function parseRoles(rolesJson: string | null): Role[];
export function serializeRoles(roles: Role[]): string;
export function hasRole(rolesJson: string | null, role: Role): boolean;
```

Roles stored as JSON string in database, parsed to typed arrays.

### Browser Auth Client (app/lib/auth-client.ts)

```typescript
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient();
```

Used for `authClient.signIn.email()` and `authClient.signOut()`.

---

## Forms Pattern

### Schema Definition (app/lib/schemas.ts)

```typescript
export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  roles: z.array(z.enum(ROLES)).min(1),
});
```

### Server-Side Parsing (app/lib/forms.ts)

```typescript
// Returns { success: true, data } or { success: false, errors }
export function parseFormData<T>(formData: FormData, schema: T): FormResult<T>;

// Throws Response(400) on validation failure
export function parseFormDataOrThrow<T>(formData: FormData, schema: T): T;

// For multi-action forms
export function getIntent(formData: FormData): string | null;
```

### Client-Side Validation (app/lib/utils.ts)

```typescript
// Parses FormData with automatic array field detection
export function parseForm<T>(schema: T, formData: FormData): SafeParseReturnType;

// Hook for progressive enhancement
export function useFormValidation<T>(schema: T, serverErrors?: FieldErrors) {
  return { onSubmit, errors };
}
```

### Usage Pattern

```tsx
// Action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = parseForm(createProjectSchema, formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors };
  // ... create project
}

// Component
export default function CreatePage() {
  const actionData = useActionData<typeof action>();
  const { onSubmit, errors } = useFormValidation(createProjectSchema, actionData?.errors);

  return (
    <Form method="post" onSubmit={onSubmit}>
      <Input name="name" />
      {errors?.name && <p className="text-destructive">{errors.name[0]}</p>}
      <Button type="submit">Create</Button>
    </Form>
  );
}
```

---

## Layout Components

### Root Layout (app/root.tsx)

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getOptionalSession(request);
  if (!session?.user) return { user: null };
  const dbUser = await db.user.findUnique({ where: { id: session.user.id } });
  return { user: { ...session.user, roles: parseRoles(dbUser?.roles) } };
}

export default function App({ loaderData }: Route.ComponentProps) {
  const isLoginPage = location.pathname === "/login";
  if (isLoginPage) return <Outlet />;

  return (
    <SidebarProvider>
      <AppSidebar user={loaderData.user} />
      <SidebarInset>
        <PageHeader />
        <main><Outlet /></main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

### Sidebar (app/components/app-sidebar.tsx)

- Logo + app name
- Search filter for nav items
- Nav groups: Workspace, Organization, Admin (if admin role), Dev
- User dropdown with logout
- Uses `__ENABLE_DASHBOARD__` feature flag

### Page Header (app/components/page-header.tsx)

```typescript
export type RouteHandle = {
  breadcrumb?: BreadcrumbValue | ((data: unknown) => BreadcrumbValue);
};

// In route files:
export const handle: RouteHandle = {
  breadcrumb: { label: "Projects", href: "/projects" },
};

// Or dynamic:
export const handle: RouteHandle = {
  breadcrumb: (data) => [
    { label: "Projects", href: "/" },
    { label: data.project.name },
  ],
};
```

---

## Background Jobs (Graphile Worker)

### Job Queue Helper (app/lib/jobs.server.ts)

```typescript
export async function queueThumbnailJob(payload: {
  attachmentId: number;
  filepath: string;
}) {
  await quickAddJob({ connectionString }, "generateThumbnail", payload);
}
```

### Worker Runner (scripts/worker.ts)

```typescript
const generateThumbnail: Task = async (payload, helpers) => {
  const { attachmentId, filepath } = payload;

  // Call Python service
  const response = await generateThumbnailGenerateThumbnailPost({
    client: pyClient,
    body: { filepath, width: 200, height: 200 },
  });

  // Update database
  await db.attachment.update({
    where: { id: attachmentId },
    data: { thumbnailPath: response.data.thumbnail_path },
  });
};

const taskList: TaskList = { generateThumbnail };

await run({
  connectionString: process.env.DATABASE_URL,
  concurrency: 5,
  pollInterval: 1000,
  taskList,
});
```

---

## Python Bridge

**Not REST API.** Inter-language RPC with full type safety.

### Python Endpoints (py/main.py)

```python
@app.get("/hi")
async def hello():
    return {"message": "Hello, World!"}

@app.post("/greet")
async def greet_person(person: GreetPersonSchema):
    return {"greeting": f"Hello, {person.first_name} {person.last_name}!"}

@app.post("/resize")
async def resize_image(file: UploadFile, width: int, height: int):
    # Returns StreamingResponse with resized image

@app.post("/generate-thumbnail")
async def generate_thumbnail(request: GenerateThumbnailRequest) -> GenerateThumbnailResponse:
    # Crops and resizes to 200x200, saves to /uploads/thumbnails/
    return GenerateThumbnailResponse(thumbnail_path=thumbnail_path)
```

### SDK Generation (scripts/sync-py.sh)

```bash
cd py/
uv run python3 -c "
import json
from main import app
print(json.dumps(app.openapi(), indent=2))
" > ../openapi.json
cd ..

npx @hey-api/openapi-ts \
  -i openapi.json \
  -o ./app/lib/py/gen \
  -c @hey-api/client-fetch

rm openapi.json
```

### TypeScript Client (app/lib/py/client.ts)

```typescript
import { client } from "./gen/client.gen";
export * from "./gen/sdk.gen";

const PY_URL = typeof window === "undefined"
  ? process.env.PY_URL ?? "http://localhost:8001"
  : "http://localhost:8001";

client.setConfig({
  baseUrl: PY_URL,
  fetch: (request) => fetch(request, { signal: AbortSignal.timeout(15 * 60 * 1000) }),
});
```

### Generated SDK (app/lib/py/gen/)

Auto-generated from OpenAPI:
- `types.gen.ts` - Request/response types (`GenerateThumbnailRequest`, `GreetPersonSchema`, etc.)
- `sdk.gen.ts` - Function calls (`helloHiGet`, `greetPersonGreetPost`, etc.)
- `client.gen.ts` - Base client configuration

Usage in loaders/actions:
```typescript
import { greetPersonGreetPost } from "~/lib/py/client";

const result = await greetPersonGreetPost({
  body: { first_name: "John", last_name: "Doe" },
});
```

---

## Feature Flags

Compile-time flags via Vite `define`:

```typescript
// vite.config.ts
const featureFlags = {
  __ENABLE_DASHBOARD__: JSON.stringify(process.env.ENABLE_DASHBOARD !== "false"),
};
```

Usage:
```tsx
// Components
{__ENABLE_DASHBOARD__ && <DashboardLink />}

// Routes
if (!__ENABLE_DASHBOARD__) throw redirect("/projects");
```

Disabled code is removed from bundle (dead code elimination).

---

## Logging (app/lib/logger.server.ts)

```typescript
import pino from "pino";

export const log = pino({
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true, singleLine: true } }
    : undefined,
});

// Usage
log.info({ projectId, userId }, "project_created");
log.info({ method, path, userId, ms }, "request");
```

---

## Configuration (app/lib/config.server.ts)

Zod-validated environment:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const config = {
  db: { url: result.data.DATABASE_URL },
  auth: { secret: result.data.BETTER_AUTH_SECRET, url: result.data.BETTER_AUTH_URL },
  env: result.data.NODE_ENV,
  isDev: result.data.NODE_ENV === "development",
  isProd: result.data.NODE_ENV === "production",
};
```

---

## Testing

### Playwright Config (playwright.config.ts)

```typescript
export default defineConfig({
  testDir: "./tests",
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { storageState: "playwright/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    { command: "npm run dev:vite", url: "http://localhost:5173" },
    { command: "npm run dev:py", url: "http://localhost:8001/hi" },
  ],
});
```

### Auth Setup (tests/auth.setup.ts)

```typescript
setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
```

### Seeder (prisma/seed.ts)

Creates test user: `admin@example.com` / `admin` (admin role).

---

## User Management CLI (scripts/manage-users.ts)

```bash
npx tsx scripts/manage-users.ts list
npx tsx scripts/manage-users.ts create user@example.com admin "John Doe"
npx tsx scripts/manage-users.ts update user@example.com password newpassword
npx tsx scripts/manage-users.ts update user@example.com name "Jane Doe"
npx tsx scripts/manage-users.ts delete user@example.com
```

---

## Shadcn UI Components

Installed in `app/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `avatar.tsx` | User avatars |
| `breadcrumb.tsx` | Navigation breadcrumbs |
| `button.tsx` | Buttons (variants: default, outline, ghost, destructive) |
| `card.tsx` | Card containers |
| `checkbox.tsx` | Checkboxes |
| `dialog.tsx` | Modal dialogs |
| `dropdown-menu.tsx` | Dropdown menus |
| `input.tsx` | Text inputs |
| `label.tsx` | Form labels |
| `pagination.tsx` | Pagination controls |
| `separator.tsx` | Visual separators |
| `sheet.tsx` | Slide-out panels |
| `sidebar.tsx` | Sidebar navigation |
| `skeleton.tsx` | Loading skeletons |
| `table.tsx` | Data tables |
| `tooltip.tsx` | Tooltips |

Install more: `npx shadcn@latest add <component>`

---

## CSS Theming (app/app.css)

- Imports: `tailwindcss`, `tw-animate-css`
- Font: Inter (Google Fonts)
- Color scheme: OKLCH-based design tokens
- Light/dark mode via CSS custom properties
- Sidebar-specific tokens for separate theming

---

## Docker (Dockerfile)

Multi-stage build:
1. `development-dependencies-env` - Full npm ci
2. `production-dependencies-env` - Production deps only
3. `build-env` - Build application
4. Final image - Node 20 Alpine with built app

```dockerfile
CMD ["npm", "run", "start"]
```

---

## Workflows

### Add New Database Model

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Run `npm run db:generate`
4. Create route files, register in `app/routes.ts`

### Add New Page

1. Create route file in `app/routes/`
2. Add to `app/routes.ts` (use explicit mapping)
3. Add loader/action as needed
4. Optional: Add `handle.breadcrumb` for navigation

### Add Python Endpoint

1. Define Pydantic model + endpoint in `py/main.py`
2. Run `./scripts/sync-py.sh`
3. Import from `~/lib/py/client` in loaders/actions
4. Never call from browser (server-side only)

### Add Background Job

1. Define task in `scripts/worker.ts`
2. Add queue helper in `app/lib/jobs.server.ts`
3. Call queue function from actions

### Create New User

```bash
npx tsx scripts/manage-users.ts create email@example.com password "Full Name"
```

---

## Key Constraints

- **No API routes** except `api.auth.$.ts`
- **No client state** (Redux, etc.) - use URL + database
- **No manual CSS** - Tailwind only
- **No tests unless requested**
- **No abstractions until 3+ uses** (WET over DRY)
- **No file-system routing** - explicit `routes.ts`
- **Import alias required** - use `~/` not relative paths
- **Full files under 200 lines** - no `// ... existing code`
