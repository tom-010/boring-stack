# Templates

Templates generate **starting points**, not finished code.

## Philosophy

Templates save time on boilerplate so you can spend it on actual features. The generated code is a canvas—remove what doesn't fit, add what's missing, change everything as needed.

Templates are **not** complete implementations or production-ready code. Just a little starting point. Solve the problem.

## Template Index

| Template | Description | Command |
|----------|-------------|---------|
| `table-list-view.tsx.njk` | Paginated list with search/sort | See below |

### table-list-view.tsx.njk

Paginated table view with search bar and sortable columns.

```bash
npx tsx scripts/generate-from-template.ts \
  templates/list-page.tsx.njk \
  templates/configs/my-feature.json \
  app/routes/my-feature.tsx
```

Config schema is documented in the template file header.

## After Generation

1. Add route to `app/routes.ts`
2. Run `npm run typecheck`
3. Read the generated code and adapt it
