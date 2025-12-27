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

### 8. Setup Claude

- Install Claude Code Paid Tier
- Install the Chrome integration 

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
