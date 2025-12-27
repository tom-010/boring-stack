# Complete Project Documentation

This document contains all documentation for the starter project, concatenated for easy sharing.

**Table of Contents:**
1. [Documentation Index](#documentation-index)
2. [Project Overview](#project-overview) (Presentation-ready narrative)
3. [Quick Start Guide](#quick-start-guide)
4. [Project Architecture](#project-architecture) (Technical reference)
5. [Demo Todo App](#demo-todo-app)
6. [Async Tasks](#async-tasks-graphile-worker)
7. [Python Bridge](#python-typescript-bridge)
8. [Configuration](#configuration-layer)
9. [Feature Flags](#feature-flags)

---

# Documentation Index

## Overview

- **Project Overview** - Comprehensive narrative description (presentation-ready, ~3000 words)

## Getting Started

- **Quick Start** - Get running in 5 minutes

## Reference

- **Project Architecture** - Complete reference for reproducing the entire project
- **Demo Todo App** - Walkthrough of the example application

## Subsystems

- **Async Tasks** - Background job processing with Graphile Worker
- **Python Bridge** - Type-safe RPC between TypeScript and Python
- **Configuration** - Environment variables and config layer
- **Feature Flags** - Compile-time feature flags

---

## Quick Links

| Task | Command |
|------|---------|
| Start dev | `npm run dev` |
| Build | `npm run build` |
| Type check | `npm run typecheck` |
| Migrate DB | `npm run db:migrate` |
| View DB | `npm run db:studio` |
| Add user | `npx tsx scripts/manage-users.ts create email@example.com password` |
| Add component | `npx shadcn@latest add button` |
| Regen Python SDK | `./scripts/sync-py.sh` |

## File Locations

| What | Where |
|------|-------|
| Routes | `app/routes.ts` + `app/routes/` |
| Database schema | `prisma/schema.prisma` |
| Zod schemas | `app/lib/schemas.ts` |
| Auth config | `app/lib/auth.server.ts` |
| Python endpoints | `py/main.py` |
| Background jobs | `scripts/worker.ts` |
| UI components | `app/components/ui/` |

---
---
---

# Project Overview

A comprehensive guide to understanding this starter project, written as a narrative suitable for presentations and onboarding.

---

## Introduction

This repository is a production-ready starter template for building business-to-business web applications. It represents a carefully considered set of technology choices optimized for developer velocity and maintainability rather than theoretical scale. The philosophy can be summarized as "boring is better" — prioritizing proven technologies with known failure modes over trendy alternatives that introduce unquantified risk.

The project includes a complete demonstration application — a todo manager with projects, file attachments, user assignments, and admin functionality — that serves as a reference implementation of all patterns. This demo is intended to be studied and then replaced with your own application code.

---

## Core Philosophy

### Code as Liability

Every line of code creates maintenance debt. The objective is maximum utility with minimum syntax. Rather than measuring code quality by abstract metrics like test coverage or design pattern usage, the only meaningful measure is how easily the system can be modified. A rigid, thoroughly tested system that resists change is considered a failure. Therefore, the approach strongly favors removing code over adding it, and explicit duplication is preferred over premature abstraction. Abstractions introduce invisible dependencies that can cripple future development velocity.

### Cognitive Load is the Bottleneck

Software development velocity is constrained by the developer's working memory, not by CPU cycles or network bandwidth. "Clever" code exhausts this limited cognitive resource, while "boring," predictable code preserves it for domain logic where creativity actually matters. The project enforces strict uniformity in implementation details to eliminate decision fatigue. Related logic is co-located in the same file whenever possible to minimize context switching. Coupling between modules is treated as the primary enemy because it prevents reasoning about one part of the system in isolation.

### Architect for Now, Not Later

Speculative architecture for hypothetical future requirements is resource waste. The project is designed for approximately ten users, and that's intentional. When you need to scale beyond that, you'll refactor — but you'll be refactoring based on actual requirements rather than imagined ones. The technology choices emphasize "Lindy" technologies — tools that have been around long enough that their failure modes are well understood. SQL databases, HTTP, and server-side rendering have decades of production experience behind them. Novelty introduces unquantified risk.

### Value Follows a Power Law

Most of the value in any application comes from a small number of features. Perfectionism in secondary UI elements or edge cases is economic malpractice. Real-world usage is the only valid way to determine what matters, so rapid, imperfect shipping outperforms perfect planning. A solution only exists when it delivers value to users; until then, it's merely inventory.

---

## Technology Choices

### Frontend Framework: React Router v7

React Router version 7 serves as the full-stack framework, handling both server-side rendering and client-side navigation. This is a significant evolution from earlier versions of React Router that only handled client-side routing. Version 7 provides a complete application framework comparable to Next.js or Remix, but with a simpler mental model.

The framework uses what's called "file-based routing with explicit registration" — route files exist in a routes directory, but they must be explicitly registered in a central routes file. This differs from purely file-system-based routing (where the file location determines the URL) and provides better discoverability when working in large codebases.

Server-side rendering is enabled by default, meaning the initial page load is rendered on the server and sent as complete HTML. This improves perceived performance and search engine optimization. After the initial load, navigation between pages happens client-side without full page reloads, providing a smooth single-page application experience.

### Styling: Tailwind CSS with Shadcn UI

The project uses Tailwind CSS version 4 for styling, which works through utility classes applied directly in the markup rather than separate stylesheets. This approach keeps styles co-located with the components they affect and eliminates the need to context-switch between HTML and CSS files.

Shadcn UI provides pre-built components that work with Tailwind. Unlike traditional component libraries that are installed as npm packages, Shadcn components are copied directly into your project and can be modified freely. This gives you ownership of the component code while still benefiting from well-designed defaults. The components are built on Radix UI primitives, which handle accessibility concerns like keyboard navigation and screen reader support.

A strict constraint of the project is that no custom CSS is written. Every visual change must use Tailwind utility classes or Shadcn components. This eliminates debates about CSS methodology and ensures consistent styling across the application.

### Database: PostgreSQL with Prisma ORM

PostgreSQL serves as the database, providing a mature, reliable relational data store. The project includes Docker Compose configuration for running PostgreSQL locally with a single command.

Prisma version 7 serves as the Object-Relational Mapping layer. Prisma uses a schema file that defines your data models in a declarative format. From this schema, Prisma generates TypeScript types and a query client. This means database queries are fully type-safe — the TypeScript compiler will catch errors like querying for fields that don't exist or passing wrong types to filters.

The database schema is synchronized to the actual database using the "push" command, which directly applies changes without generating migration files. This is appropriate for development and prototyping. For production systems with existing data, you would switch to explicit migrations.

Prisma Studio provides a graphical interface for browsing and editing database content, which is invaluable during development for inspecting data and manually fixing records.

### Authentication: BetterAuth

BetterAuth provides authentication with email and password login. It integrates with Prisma for storing user data, sessions, and accounts. The authentication tables are defined in the same Prisma schema as the application models.

A deliberate choice is that user self-registration is disabled. Users must be created by administrators through a command-line tool or the admin interface. This matches the reality of most B2B applications where users are provisioned by the organization rather than signing up independently.

The project includes role-based access control with two roles: user and admin. Roles are stored as a JSON array in the user record, allowing users to have multiple roles. Helper functions check role membership and protect routes that require specific roles.

Authentication state is maintained through HTTP-only cookies, which provide security against cross-site scripting attacks. The session token is verified on every request using middleware that runs before route handlers.

### Background Jobs: Graphile Worker

For tasks that should happen asynchronously — like processing uploaded images or sending emails — the project uses Graphile Worker. This library stores jobs in the PostgreSQL database, eliminating the need for a separate message queue like Redis or RabbitMQ.

Jobs are defined as TypeScript functions that receive a payload and execute the work. A separate worker process polls the database for pending jobs and executes them. The worker is started alongside the development server and handles job processing continuously.

The demo application uses background jobs for generating image thumbnails. When a user uploads an image attachment, a job is queued that will call the Python service to resize the image. This keeps the HTTP response fast while the image processing happens in the background.

### Optional Python Service

For compute-heavy tasks that benefit from Python's ecosystem — particularly image processing and machine learning — the project includes an optional Python service using FastAPI. This is not a REST API in the traditional sense but rather a Remote Procedure Call interface between TypeScript and Python.

The Python service runs alongside the Node.js server and is only called from server-side code — never from the browser. Think of it as a way to extend TypeScript with Python capabilities while maintaining type safety across the boundary.

When you define an endpoint in Python using FastAPI and Pydantic models, a build script generates TypeScript types and client code automatically. This means calling Python from TypeScript looks and feels like calling any other TypeScript function, with full autocompletion and type checking.

The demo application uses Python for image thumbnail generation, leveraging the Pillow library for image manipulation.

---

## Project Structure

### Directory Organization

The project follows a straightforward directory structure. The main application code lives in an "app" directory. Within this, there are subdirectories for routes (page components with their loaders and actions), components (shared UI elements), lib (utility functions and configuration), and db (database client setup).

The routes directory contains individual files for each page or API endpoint. Each route file can export multiple things: a component for rendering, a loader function for fetching data, an action function for handling form submissions, and metadata for the page title and description.

The lib directory contains utility code organized by concern. There are files for authentication, configuration, form handling, logging, schemas, roles, and utilities. This co-located approach means everything related to a particular concern lives in one place.

The components directory is split between application-specific components (like the sidebar and page header) and generic UI components in a ui subdirectory. The UI components are the Shadcn primitives that have been added to the project.

A prisma directory contains the database schema and seed scripts. The seed script creates a test user for development and is run automatically before end-to-end tests.

A scripts directory contains standalone scripts: the background worker runner, a user management command-line tool, and the Python SDK generator.

The py directory contains the Python service code, including the FastAPI application and its dependencies managed through uv, a fast Python package installer.

### Configuration Files

The project includes numerous configuration files, each serving a specific purpose. The package.json defines npm scripts and dependencies. The tsconfig.json configures TypeScript with path aliases so imports can use a tilde prefix instead of relative paths. The vite.config.ts configures the build tool with plugins for Tailwind, React Router, and automatic Python SDK synchronization.

A components.json file configures Shadcn's component installation, specifying paths and styling options. The react-router.config.ts enables server-side rendering and the middleware feature for authentication.

Environment variables are defined in a .env file and validated at startup using a schema. Missing or invalid configuration causes the application to fail immediately with a clear error message rather than partially working and failing unpredictably later.

---

## Application Patterns

### Data Loading and Mutation

The project follows a pattern where data loading happens in loader functions and mutations happen in action functions. Both are defined in the route file alongside the component, keeping related logic together.

Loaders run on the server when a page is requested. They fetch data from the database and return it to the component. The component receives this data as props and can trust that it's already loaded — there's no need for loading spinners or error states for the initial data fetch.

Actions handle form submissions. When a form is submitted, the action function receives the form data, validates it, performs the database operation, and either returns errors or redirects to another page. This is a progressive enhancement pattern — forms work without JavaScript, with validation happening on the server. When JavaScript is available, client-side validation provides faster feedback.

A key constraint is that separate API routes are forbidden except for the authentication endpoint. All data mutation logic lives in action functions co-located with the UI that triggers them. This prevents the scattered, hard-to-trace data flow that happens when mutations are spread across many API endpoints.

### Form Handling

Forms use Zod schemas for validation, with the same schema used on both client and server. A schema defines the expected structure and validation rules for form data. Helper functions convert FormData objects to plain objects and run them through the schema.

On the server, if validation fails, the action returns the validation errors. On the client, these errors are displayed next to the relevant form fields. If JavaScript is enabled, the same validation runs on submit before the form is sent to the server, providing immediate feedback.

For forms that handle multiple actions (like a page where you can create, update, or delete items), the convention is to include a hidden "intent" field that specifies which action to take. The action function switches on this intent to dispatch to the appropriate handler.

### Authentication and Authorization

Every route except the login page requires authentication. This is enforced through middleware that runs before any route handler. If no valid session exists, the middleware redirects to the login page. This centralized approach ensures authentication can't be accidentally omitted from a new route.

For routes that require specific roles, additional checks run in the loader or action. A helper function verifies the user has the required role and throws a forbidden response if not. The admin section of the demo application demonstrates this pattern.

The authentication system uses HTTP-only cookies for session storage. Cookies are automatically included with every request, so there's no need to manually attach tokens to fetch calls. The session token is verified on each request by looking it up in the database.

### Layout and Navigation

The application shell consists of a sidebar for navigation and a header with breadcrumbs. These are rendered by the root layout component, which wraps all other routes. The login page is handled specially, bypassing the layout to show a full-page login form.

The sidebar displays navigation items organized into groups. The items shown depend on the user's role — admin users see an additional admin section. A search box filters the navigation items for quick access in larger applications.

Breadcrumbs are defined per-route using a handle export. Each route specifies its breadcrumb label and optionally a link. For dynamic routes (like viewing a specific project), the breadcrumb can be a function that receives the loader data and returns the label. The page header collects breadcrumbs from all matched routes to build the complete trail.

---

## The Demo Application

### Data Model

The demo implements a todo application with projects, todos, attachments, and user assignments. Projects contain todos, and todos can have file attachments and be assigned to multiple users.

The User model comes from BetterAuth but is extended with a roles field. Sessions, accounts, and verifications are BetterAuth infrastructure tables for managing authentication state.

Projects are simple containers with a name, description, and color. Deleting a project cascades to delete all its todos.

Todos belong to a project and have an owner (the user who created them). They have a title, optional description, priority level, optional due date, and completion status. Beyond ownership, todos can be assigned to additional users who gain read access but not edit rights.

Attachments are files uploaded to todos. The file is stored on disk in a public directory, while metadata (filename, path, size, type) is stored in the database. For images, thumbnails are generated asynchronously and stored alongside the original.

### User Flows

The main flows in the demo are creating projects, adding todos, managing todo details, and administering users.

Project creation happens inline on the projects list page. A form at the top accepts a project name, and submitting it creates the project and redirects to its detail page.

On the project detail page, todos can be added via an inline form. The todo table shows all todos with checkboxes for completion status and badges for priority. Clicking a checkbox toggles completion. Clicking the priority badge cycles through low, medium, and high. Clicking the title navigates to the todo detail page.

The todo detail page shows all metadata and has sections for assigned users and attachments. The owner can edit the todo, assign other users, and upload files. Assigned users can view the todo and upload files but cannot edit or manage assignments.

The admin section is only accessible to users with the admin role. It shows all users and allows creating, editing, and deleting accounts. Admins can assign roles to users. Safety measures prevent admins from deleting themselves or removing their own admin role.

### Debug Page

A debug page demonstrates the Python bridge by calling Python endpoints from the browser. It shows a health check call and a typed RPC call with form inputs. This is useful for verifying the Python service is running and the SDK is correctly generated.

---

## Development Workflow

### Getting Started

Starting the project requires Docker for the database, Node.js for the application, and Python with uv for the optional Python service. With these installed, you start the database container, install dependencies, push the schema to the database, seed a test user, and start the development servers.

The main development command starts three processes concurrently: the Vite development server with hot module replacement, the Graphile Worker for background jobs, and the Python service for image processing. Colored output labels make it easy to distinguish which process is logging.

### Database Changes

When modifying the database schema, you edit the Prisma schema file and run the migrate command to push changes to the database. Then you regenerate the Prisma client so TypeScript knows about the new types. If you add fields to existing tables with data, you may need to provide default values or make them optional.

Prisma Studio provides a graphical interface for viewing and editing data. This is particularly useful during development for checking that data was created correctly or manually fixing test data.

### Adding Components

Adding new UI components uses the Shadcn CLI. You specify the component name, and it downloads the component code into your project. The component is immediately available to import. You can then customize it as needed since you own the code.

### Python Changes

When modifying the Python service, changes are automatically detected and the service restarts. The Vite development server watches for Python changes and regenerates the TypeScript SDK automatically. This means you can add a Python endpoint and immediately use it from TypeScript with full type safety.

For cases where automatic sync doesn't trigger, a manual sync command regenerates the SDK from the current Python code.

### Testing

The project includes both unit tests with Vitest and end-to-end tests with Playwright. Unit tests run in a simulated browser environment and can test individual components or utility functions.

End-to-end tests run against the full application. A setup step logs in and saves the authentication state so subsequent tests don't need to repeat the login flow. Tests can create data, interact with the UI, and verify results.

---

## Production Deployment

### Building

The production build compiles and optimizes all code. Client-side code is bundled and minified. Server-side code is compiled to run on Node.js. The output is a standalone package that can be deployed anywhere Node.js runs.

Feature flags are evaluated at build time, so disabled features are completely removed from the bundle. This is tree-shaking at the feature level, reducing both bundle size and attack surface.

### Docker

A Dockerfile defines a multi-stage build that installs dependencies, builds the application, and creates a minimal production image. The final image contains only the built code and production dependencies, keeping it small.

The container can be deployed to any platform that runs Docker containers: cloud services like AWS, Google Cloud, or Azure; container platforms like Fly.io or Railway; or your own servers.

### Configuration

Production requires different environment variables than development. You need a secure random secret for session encryption, the correct database URL for your production database, and the public URL where the application will be accessed.

The database will need to be migrated before the first deployment and after any schema changes. In production, you would typically use explicit migrations rather than the push command to have better control and the ability to roll back.

---

## Conclusion

This starter project represents a carefully considered set of choices for building business web applications. It prioritizes developer experience and maintainability over abstract perfection. Every piece is included because it solves a real problem in a straightforward way, and everything that could add complexity without clear benefit has been excluded.

The demo application is comprehensive enough to demonstrate all patterns but simple enough to understand quickly. It's meant to be studied, understood, and then replaced with your own application code. The patterns you learn here — co-located logic, progressive enhancement, type-safe data access — will serve you regardless of the specific features you build.

The technology choices will continue to be relevant for years because they're based on proven technologies with long track records. React, PostgreSQL, and HTTP aren't going anywhere. By choosing boring technology, you free yourself to focus on what makes your application valuable rather than fighting with your tools.

---
---
---

# Quick Start Guide

Get the starter project running in 5 minutes.

---

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- Python 3.12+ with `uv` (for Python service)

---

## Setup Steps

### 1. Start Database

```bash
docker compose up -d
```

Starts PostgreSQL on `localhost:5432` with:
- User: `app`
- Password: `app`
- Database: `app`

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Python Dependencies

```bash
cd py && uv sync && cd ..
```

### 4. Setup Database

```bash
npm run db:migrate    # Push schema to database
npm run db:generate   # Generate Prisma client
```

### 5. Create Test User

```bash
npx tsx prisma/seed.ts
```

Creates: `admin@example.com` / `admin` (admin role)

### 6. Start Development

```bash
npm run dev
```

Runs three processes:
- **VITE**: React Router dev server (http://localhost:5173)
- **WORKER**: Graphile Worker for background jobs
- **PY**: Python FastAPI service (http://localhost:8001)

### 7. Open App

Visit http://localhost:5173 and login with test credentials.

---

## Environment Variables

The `.env` file is pre-configured for local development:

```env
DATABASE_URL="postgresql://app:app@localhost:5432/app"
BETTER_AUTH_SECRET="sp14dQCMfgKyZ+2UcNHN87W2OtcHgCWUA3ApnBokvVA="
BETTER_AUTH_URL="http://localhost:5173"
```

For production, generate a new secret:
```bash
openssl rand -base64 32
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all dev servers |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run typecheck` | Type check all code |
| `npm run db:migrate` | Push schema changes |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |

---

## Adding Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

See available components: https://ui.shadcn.com/docs/components

---

## Project Structure Quick Reference

```
app/
├── routes.ts          # URL mapping
├── root.tsx           # Layout
├── routes/            # Pages
├── components/ui/     # Shadcn
├── lib/
│   ├── schemas.ts     # Zod schemas
│   ├── auth.server.ts # Auth config
│   └── utils.ts       # Helpers
└── db/client.ts       # Prisma

prisma/schema.prisma   # Database schema
scripts/worker.ts      # Background jobs
py/main.py             # Python endpoints
```

---

## Next Steps

1. Explore the demo todo app at `/projects`
2. Read `docs/project-architecture.md` for full reference
3. Read `docs/demo-todo-app.md` to understand patterns
4. Delete demo code and start building your app

---

## Troubleshooting

### Database connection refused
```bash
docker compose up -d  # Ensure Postgres is running
```

### Prisma client not generated
```bash
npm run db:generate
```

### Python service not starting
```bash
cd py && uv sync  # Install Python deps
```

### Port already in use
```bash
# Check what's using ports
lsof -i :5173
lsof -i :8001
lsof -i :5432
```

### Reset database
```bash
docker compose down -v  # Delete volume
docker compose up -d
npm run db:migrate
npx tsx prisma/seed.ts
```

---
---
---

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

---
---
---

# Demo Todo App

The starter includes a fully-functional todo application demonstrating all patterns. This is intended as a reference implementation to be modified or deleted.

---

## Features Demonstrated

| Feature | Implementation |
|---------|----------------|
| CRUD operations | Projects, Todos, Users |
| Form validation | Client + server with Zod |
| File uploads | Attachments with thumbnails |
| Background jobs | Thumbnail generation |
| User assignments | Many-to-many relationships |
| Role-based access | Admin pages |
| Breadcrumb navigation | Dynamic per-route |
| Pagination | Client-side table pagination |
| Multi-action forms | Intent-based dispatch |

---

## Data Model

```
Project (1) ─────────── (*) Todo
                              │
                              ├── (*) Attachment
                              │
                              └── (*) TodoAssignment ─── User
```

### Project
- Container for todos
- Name, description, color
- Cascade delete removes all todos

### Todo
- Belongs to project and user (owner)
- Title, description, priority (low/medium/high), due date
- Completed status
- Has many attachments and assignments

### Attachment
- File uploaded to `/public/uploads/`
- Filename, filepath, mimetype, size
- Optional thumbnail (generated async)

### TodoAssignment
- Assigns a todo to a user (not owner)
- Tracks who assigned (assignedBy)
- Unique constraint: one assignment per user per todo

---

## Route Structure

### Projects List (`/projects`)

**Loader:** Fetches all projects

**Actions:**
- Default (no intent): Create project
- `deleteProject`: Delete project by ID

**Features:**
- Create form inline
- Paginated table (ProjectsTable)
- Delete with confirmation

### Project Detail (`/projects/:id`)

**Loader:** Fetches project + user's todos

**Actions:**
- `updateProject`: Edit name/description
- `deleteProject`: Delete entire project
- `createTodo`: Add todo to project
- `updateTodo`: Toggle completed/priority
- `deleteTodo`: Remove todo

**Features:**
- Inline project editing (hover to reveal pencil)
- Auto-focus input after creating todo
- Completion counter

### Todo Detail (`/todos/:id`)

**Loader:** Fetches todo with attachments, assignments, all users

**Access:** Owner OR assigned users

**Actions:**
- `uploadAttachment`: File upload (max 10MB)
- `deleteAttachment`: Remove attachment + file
- `assignUser`: Assign user to todo (owner only)
- `unassignUser`: Remove assignment (owner only)

**Features:**
- Status, priority, due date display
- Thumbnail display for images
- User assignment dialog with search
- Edit link (owner only)

### Todo Edit (`/todos/:id/edit`)

**Loader:** Fetches todo

**Action:** Updates all fields

**Features:**
- Full form with all fields
- Date picker for due date
- Checkbox for completion

---

## Multi-Action Form Pattern

Actions use `intent` field to dispatch:

```tsx
// Component
<Form method="post">
  <input type="hidden" name="intent" value="deleteProject" />
  <input type="hidden" name="id" value={project.id} />
  <Button type="submit">Delete</Button>
</Form>

// Action
export async function action({ request }) {
  const formData = await request.formData();
  const intent = getIntent(formData);  // from ~/lib/forms

  switch (intent) {
    case "deleteProject":
      const { id } = parseFormDataOrThrow(formData, deleteByIdSchema);
      await db.project.delete({ where: { id } });
      return redirect("/projects");

    default:
      // Handle create (no intent)
  }
}
```

---

## File Upload Flow

1. User submits file via `<Form encType="multipart/form-data">`
2. Action receives `File` from `formData.get("file")`
3. Validate size (max 10MB)
4. Write to `public/uploads/{timestamp}-{filename}`
5. Create `Attachment` record in database
6. If image: Queue `generateThumbnail` job
7. Worker calls Python service to generate thumbnail
8. Worker updates `thumbnailPath` in database

```tsx
// Action
const file = formData.get("file") as File;
const buffer = Buffer.from(await file.arrayBuffer());
const uniqueName = `${Date.now()}-${file.name}`;
await writeFile(join(process.cwd(), "public", "uploads", uniqueName), buffer);

const attachment = await db.attachment.create({
  data: { todoId, userId, filename: file.name, filepath: `/uploads/${uniqueName}`, ... }
});

if (file.type.startsWith("image/")) {
  await queueThumbnailJob({ attachmentId: attachment.id, filepath: `/uploads/${uniqueName}` });
}
```

---

## User Assignment Flow

1. Owner opens "Assign User" dialog
2. Dialog shows searchable list of all users (excluding owner)
3. Owner clicks user → form submits with `intent=assignUser`
4. Action creates `TodoAssignment` record
5. Assigned user can now access the todo
6. Owner can unassign via X button

Access control in loader:
```typescript
const todo = await db.todo.findFirst({
  where: {
    id: todoId,
    OR: [
      { userId },                           // Owner
      { assignments: { some: { userId } } } // Assigned
    ],
  },
});
```

---

## Admin User Management

### Users List (`/admin/users`)

**Access:** Admin role required (`requireAdmin`)

**Loader:** All users with parsed roles

**Action:** Delete user (prevents self-deletion)

### New User (`/admin/users/new`)

**Action:**
1. Validate form with `createUserSchema`
2. Check email uniqueness
3. Hash password via BetterAuth
4. Create User + Account records

### Edit User (`/admin/users/:id/edit`)

**Action:**
1. Validate with `updateUserSchema`
2. Prevent admin removing own admin role
3. Update password only if provided
4. Serialize roles to JSON

---

## Table Components

Shared table components with pagination:

### ProjectsTable (`app/components/projects-table.tsx`)
- Columns: #, Name, Description, Created, Actions
- Client-side pagination (10 per page)
- Delete button with confirmation

### TodosTable (`app/components/todos-table.tsx`)
- Columns: Checkbox, Title, Description, Priority, Due Date, Actions
- Checkbox toggles completion (inline form)
- Priority cycles on click (low → medium → high → low)
- High priority rows highlighted

### UsersTable (`app/components/users-table.tsx`)
- Columns: #, Name, Email, Roles, Created, Actions
- Role badges
- Edit + Delete actions

---

## Breadcrumb System

Routes export `handle.breadcrumb`:

```typescript
// Static
export const handle: RouteHandle = {
  breadcrumb: { label: "Projects", href: "/projects" },
};

// Dynamic (uses loader data)
export const handle: RouteHandle = {
  breadcrumb: (data): BreadcrumbItem[] => {
    const { project, todo } = data as { project: Project; todo: Todo };
    return [
      { label: "Projects", href: "/" },
      { label: project.name, href: `/projects/${project.id}` },
      { label: todo.title },
    ];
  },
};
```

PageHeader collects breadcrumbs from matched routes:
```typescript
const matches = useMatches();
for (const match of matches) {
  const handle = match.handle as RouteHandle;
  if (handle?.breadcrumb) {
    const crumb = typeof handle.breadcrumb === "function"
      ? handle.breadcrumb(match.data)
      : handle.breadcrumb;
    breadcrumbs.push(...(Array.isArray(crumb) ? crumb : [crumb]));
  }
}
```

---

## Debug Page (`/debug/py`)

Test page for Python bridge:

- GET /hi → Health check
- POST /greet → Typed RPC call

Demonstrates calling Python from actions:
```typescript
import { helloHiGet, greetPersonGreetPost } from "~/lib/py/client";

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "hi") {
    return { result: await helloHiGet() };
  }

  if (intent === "greet") {
    return {
      result: await greetPersonGreetPost({
        body: {
          first_name: formData.get("firstName"),
          last_name: formData.get("lastName"),
        },
      }),
    };
  }
}
```

---

## Deleting the Demo

To remove the demo and start fresh:

1. Delete models from `prisma/schema.prisma`:
   - `Project`, `Todo`, `Attachment`, `TodoAssignment`
   - Keep: `User`, `Session`, `Account`, `Verification`

2. Delete route files:
   ```bash
   rm app/routes/projects-list.tsx
   rm app/routes/project-detail.tsx
   rm app/routes/todo-detail.tsx
   rm app/routes/todo-edit.tsx
   rm app/routes/debug-py.tsx
   ```

3. Delete components:
   ```bash
   rm app/components/projects-table.tsx
   rm app/components/todos-table.tsx
   ```

4. Update `app/routes.ts` to remove deleted routes

5. Update `app/lib/schemas.ts` to remove demo schemas

6. Run `npm run db:migrate` to update database

7. Update sidebar in `app/components/app-sidebar.tsx`

---
---
---

# Async Tasks (Graphile Worker)

Background job processing using [Graphile Worker](https://worker.graphile.org/).

## How it works

- Jobs stored in PostgreSQL (same database)
- Worker polls for jobs and executes tasks
- Tasks defined in `scripts/worker.ts`

## Running the Worker

```bash
npm run worker
```

Run alongside your dev server in a separate terminal.

## Queueing Jobs

Use the helper in `app/lib/jobs.server.ts`:

```ts
import { queueThumbnailJob } from "~/lib/jobs.server";

await queueThumbnailJob({
  attachmentId: 123,
  filepath: "/uploads/image.jpg",
});
```

## Adding New Tasks

1. Define task in `scripts/worker.ts`:

```ts
interface MyPayload {
  someId: number;
}

const myTask: Task = async (payload, helpers) => {
  const { someId } = payload as MyPayload;
  helpers.logger.info(`Processing ${someId}`);
  // do work...
};

const taskList: TaskList = {
  generateThumbnail,
  myTask, // add here
};
```

2. Add queue helper in `app/lib/jobs.server.ts`:

```ts
export async function queueMyTask(payload: MyPayload) {
  await quickAddJob({ connectionString }, "myTask", payload);
}
```

## Existing Tasks

| Task | Description |
|------|-------------|
| `generateThumbnail` | Creates 200x200 thumbnails for uploaded images |

---
---
---

# Python-TypeScript Bridge

Type-safe RPC between TypeScript and Python.

## What This Is

**Not a REST API.** This is an inter-language RPC bridge — TypeScript calling Python functions with full type safety.

**Server-side only.** Never call Python from the browser. The Python service is internal (localhost:8001), only accessible from loaders/actions.

Think of it as:
- FFI (Foreign Function Interface) for TypeScript → Python
- Co-located services that happen to speak HTTP

The endpoints are verbs (`/greet`, `/resize`), not resources.

## Why

Python excels at ML, image processing, data science. Rather than rewrite Python libraries in TypeScript, we run a FastAPI service and call it with types.

The Python service:
- Lives in `py/`
- Same container in production (100% coupled to this app)
- FastAPI generates OpenAPI schema → TypeScript codegen

## File Locations

| Path | Purpose |
|------|---------|
| `py/` | Python source (FastAPI) |
| `app/lib/py/client.ts` | Entry point (import from here) |
| `app/lib/py/gen/` | Generated SDK (overwritten by sync) |
| `scripts/sync-py.sh` | Regenerates SDK |

Generated SDK is committed to git (build works without Python, diffs visible in PRs).

## Usage

```typescript
import { greetPersonGreetPost } from "~/lib/py/client"

const result = await greetPersonGreetPost({
  body: { first_name: "John", last_name: "Doe" }
})
```

## Workflow

1. **Define in Python** (`py/main.py`):
   ```python
   class MyInputSchema(BaseModel):
       some_value: int

   @app.post("/my-endpoint")
   async def my_endpoint(data: MyInputSchema):
       return {"result": data.some_value * 2}
   ```

2. **Regenerate SDK**:
   ```bash
   ./scripts/sync-py.sh
   ```

3. **Use in TypeScript**:
   ```typescript
   import { myEndpointMyEndpointPost } from "~/lib/py/client"
   ```

## Running

```bash
cd py && uv run python main.py  # Port 8001
```

## Why OpenAPI?

OpenAPI is just the transport format:
- FastAPI generates it from Pydantic models
- Excellent TypeScript codegen exists
- NOT because we're building a REST API

---
---
---

# Configuration Layer

Centralized configuration via `app/lib/config.server.ts`.

## How it works

- Uses Zod to validate environment variables at startup
- Fails fast if required variables are missing
- Exports a typed `config` object

## Usage

```ts
import { config } from "~/lib/config.server";

// Access configuration
config.db.url        // Database connection string
config.auth.secret   // Auth secret
config.auth.url      // Auth base URL
config.isDev         // true in development
config.isProd        // true in production
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret for session encryption |
| `BETTER_AUTH_URL` | Yes | Base URL for auth callbacks |
| `NODE_ENV` | No | development (default), production, test |

## Adding New Variables

1. Add to schema in `config.server.ts`:
```ts
const envSchema = z.object({
  // existing...
  MY_NEW_VAR: z.string().min(1),
});
```

2. Export in the config object:
```ts
return {
  // existing...
  myNewVar: result.data.MY_NEW_VAR,
};
```

---
---
---

# Feature Flags

Compile-time flags that enable/disable features. Disabled code is removed from the bundle (dead code elimination).

## Available Flags

| Flag | Default | Description |
|------|---------|-------------|
| `ENABLE_DASHBOARD` | `true` | Dashboard page at `/dashboard` |

## Usage

**Dev (all enabled by default):**
```bash
npm run dev
```

**Build with flag disabled:**
```bash
ENABLE_DASHBOARD=false npm run build
```

**Build with all defaults (enabled):**
```bash
npm run build
```

## Adding New Flags

1. Add to `vite.config.ts`:
   ```typescript
   const featureFlags = {
     __ENABLE_DASHBOARD__: JSON.stringify(process.env.ENABLE_DASHBOARD !== "false"),
     __ENABLE_NEW_FEATURE__: JSON.stringify(process.env.ENABLE_NEW_FEATURE !== "false"),
   };
   ```

2. Add type to `env.d.ts`:
   ```typescript
   declare const __ENABLE_NEW_FEATURE__: boolean;
   ```

3. Use in code:
   ```tsx
   // In components
   {__ENABLE_NEW_FEATURE__ && <NewFeature />}

   // In routes - redirect if disabled (makes route inaccessible)
   export async function loader() {
     if (!__ENABLE_NEW_FEATURE__) {
       throw redirect("/fallback");
     }
     // ... feature code
   }
   ```
