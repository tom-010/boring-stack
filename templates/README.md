# Templates

Templates generate **starting points**, not finished code.

## Philosophy

Templates save time on boilerplate so you can spend it on actual features. The generated code is a canvas—remove what doesn't fit, add what's missing, change everything as needed.

Templates are **not** complete implementations or production-ready code. Just a little starting point. Solve the problem.

## Usage

```bash
# Write to file
npx tsx scripts/generate-from-template.ts <template> <config.json> <output>

# Print to stdout (for copy-paste into existing files)
npx tsx scripts/generate-from-template.ts <template> <config.json>
```

## Template Index

| Template | Description | Best For |
|----------|-------------|----------|
| `table-list-view.njk` | Full page with paginated table, search, sort | List pages (users, projects, todos) |
| `detail-page.njk` | Single entity view with edit/delete | CRUD detail pages |
| `detail-with-table.njk` | Parent entity with children table | One-to-many (Project→Todos) |
| `blank-page.njk` | Minimal route skeleton | Settings, dashboards, custom pages |
| `table-only.njk` | Just the table component | Embedding tables in existing pages |
| `form-all-inputs.njk` | Form with all input types | Create/edit forms |

---

## table-list-view.njk

Paginated table view with search bar, sortable columns, and delete actions.

```bash
npx tsx scripts/generate-from-template.ts \
  templates/table-list-view.njk \
  templates/configs/my-feature.json \
  app/routes/my-feature.tsx
```

**Config:**
```json
{
  "filename": "users-list",
  "entityName": "User",
  "entityNamePlural": "Users",
  "entityLabel": "user",
  "entityLabelPlural": "users",
  "basePath": "/admin/users",
  "prismaModel": "user",
  "icon": "Users",
  "sortFields": [
    { "name": "name", "label": "Name", "type": "string" },
    { "name": "createdAt", "label": "Created", "type": "date" }
  ],
  "columns": [
    { "field": "name", "label": "Name", "sortable": true, "link": true },
    { "field": "email", "label": "Email", "sortable": true, "hiddenOnMobile": true },
    { "field": "createdAt", "label": "Created", "sortable": true, "type": "date" }
  ],
  "searchFields": ["name", "email"],
  "ownerField": null
}
```

---

## detail-page.njk

Single entity detail page with inline edit form and delete confirmation.

```bash
npx tsx scripts/generate-from-template.ts \
  templates/detail-page.njk \
  templates/configs/user-detail.json \
  app/routes/user-detail.tsx
```

**Config:**
```json
{
  "filename": "user-detail",
  "entityName": "User",
  "entityLabel": "user",
  "basePath": "/users",
  "listPath": "/users",
  "prismaModel": "user",
  "displayFields": [
    { "field": "name", "label": "Name", "type": "string" },
    { "field": "email", "label": "Email", "type": "string" },
    { "field": "bio", "label": "Bio", "type": "text" },
    { "field": "createdAt", "label": "Created", "type": "date" }
  ],
  "editFields": [
    { "name": "name", "label": "Name", "type": "text", "required": true },
    { "name": "email", "label": "Email", "type": "email", "required": true },
    { "name": "bio", "label": "Bio", "type": "textarea", "required": false }
  ],
  "ownerField": null,
  "icon": "User"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `filename` | Yes | Route filename (no extension) |
| `entityName` | Yes | Singular PascalCase (e.g., "User") |
| `entityLabel` | Yes | Singular lowercase (e.g., "user") |
| `basePath` | Yes | URL base path (e.g., "/users") |
| `listPath` | Yes | URL to return after delete |
| `prismaModel` | Yes | Prisma model name |
| `displayFields` | Yes | Fields to show in view mode |
| `editFields` | Yes | Fields in edit form (form-all-inputs style) |
| `ownerField` | No | Field for ownership check |
| `icon` | No | Lucide icon name |
| `showEditLink` | No | If true, link to separate edit page |
| `editPath` | If showEditLink | URL pattern (e.g., "/users/{id}/edit") |

**Display field types:**
- `string` - Plain text
- `text` - Multiline (full width)
- `date` - Formatted date
- `boolean` - Yes/No

---

## detail-with-table.njk

Parent entity detail page with a table of related children (one-to-many).

Example: Project detail showing all its Todos.

```bash
npx tsx scripts/generate-from-template.ts \
  templates/detail-with-table.njk \
  templates/configs/project-detail.json \
  app/routes/project-detail.tsx
```

**Config:**
```json
{
  "filename": "project-detail",
  "parentEntity": {
    "name": "Project",
    "label": "project",
    "prismaModel": "project",
    "basePath": "/projects",
    "listPath": "/",
    "displayField": "name",
    "descriptionField": "description",
    "editFields": [
      { "name": "name", "label": "Name", "type": "text", "required": true },
      { "name": "description", "label": "Description", "type": "textarea", "required": false }
    ]
  },
  "childEntity": {
    "name": "Todo",
    "namePlural": "Todos",
    "label": "todo",
    "labelPlural": "todos",
    "prismaModel": "todo",
    "foreignKey": "projectId",
    "detailPath": "/todos/{id}",
    "columns": [
      { "field": "title", "label": "Title", "link": true },
      { "field": "priority", "label": "Priority" },
      { "field": "completed", "label": "Done", "type": "boolean" }
    ],
    "createFields": [
      { "name": "title", "label": "Title", "type": "text", "required": true, "placeholder": "Add a new todo..." }
    ],
    "defaultValues": { "priority": "medium" }
  },
  "ownerField": "userId",
  "icon": "FolderKanban",
  "childIcon": "CheckSquare"
}
```

**parentEntity fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Singular PascalCase |
| `label` | Yes | Singular lowercase |
| `prismaModel` | Yes | Prisma model name |
| `basePath` | Yes | URL base path |
| `listPath` | Yes | URL to return after delete |
| `displayField` | Yes | Primary display field |
| `descriptionField` | No | Secondary field |
| `editFields` | Yes | Fields for inline edit |

**childEntity fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Singular PascalCase |
| `namePlural` | Yes | Plural PascalCase |
| `label` | Yes | Singular lowercase |
| `labelPlural` | Yes | Plural lowercase |
| `prismaModel` | Yes | Prisma model name |
| `foreignKey` | Yes | FK field pointing to parent |
| `detailPath` | Yes | URL pattern with `{id}` |
| `columns` | Yes | Table column configs |
| `createFields` | Yes | Quick-add form fields |
| `defaultValues` | No | Defaults for new children |

---

## blank-page.njk

Minimal starting point with loader/action skeleton.

```bash
npx tsx scripts/generate-from-template.ts \
  templates/blank-page.njk \
  templates/configs/settings.json \
  app/routes/settings.tsx
```

**Config:**
```json
{
  "filename": "settings",
  "pageTitle": "Settings",
  "pageDescription": "Manage your account settings",
  "breadcrumbLabel": "Settings",
  "breadcrumbHref": "/settings",
  "requiresAuth": true,
  "icon": "Settings"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `filename` | Yes | Route filename (no extension) |
| `pageTitle` | Yes | Page title for `<title>` and h1 |
| `pageDescription` | Yes | Meta description and subtitle |
| `breadcrumbLabel` | Yes | Breadcrumb text |
| `breadcrumbHref` | Yes | Breadcrumb URL |
| `requiresAuth` | No | Default `true`. Set `false` for public pages |
| `icon` | No | Lucide icon name |

---

## table-only.njk

Standalone table component for embedding in existing pages. Designed for stdout output.

```bash
# Print to stdout, then copy-paste into your file
npx tsx scripts/generate-from-template.ts \
  templates/table-only.njk \
  templates/configs/user-table.json
```

**Config:**
```json
{
  "componentName": "UserTable",
  "entityLabel": "user",
  "entityLabelPlural": "users",
  "columns": [
    { "field": "name", "label": "Name", "type": "link", "linkTo": "/users/{id}" },
    { "field": "email", "label": "Email" },
    { "field": "createdAt", "label": "Created", "type": "date", "hiddenOnMobile": true }
  ],
  "showRowNumbers": true,
  "showActions": true,
  "actionsBasePath": "/users",
  "emptyIcon": "Users"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `componentName` | Yes | PascalCase component name |
| `entityLabel` | Yes | Singular lowercase for messages |
| `entityLabelPlural` | Yes | Plural lowercase for messages |
| `columns` | Yes | Array of column configs |
| `showRowNumbers` | No | Default `true`. Show `#` column |
| `showActions` | No | Default `false`. Show edit/delete column |
| `actionsBasePath` | If showActions | URL base for action links |
| `emptyIcon` | No | Lucide icon for empty state |

**Column types:**
- `string` (default) - Plain text
- `date` - Formatted date
- `number` - Numeric (tabular-nums)
- `link` - Clickable link (requires `linkTo` with `{id}` placeholder)

---

## form-all-inputs.njk

Comprehensive form with validation. Supports all common input types.

```bash
npx tsx scripts/generate-from-template.ts \
  templates/form-all-inputs.njk \
  templates/configs/user-edit.json \
  app/routes/user-edit.tsx
```

**Config:**
```json
{
  "filename": "user-edit",
  "pageTitle": "Edit User",
  "pageDescription": "Edit user account details",
  "breadcrumbLabel": "Edit User",
  "breadcrumbHref": "/users/edit",
  "schemaName": "editUserSchema",
  "cancelUrl": "/users",
  "successRedirect": "/users",
  "isEditForm": true,
  "prismaModel": "user",
  "entityLabel": "user",
  "fields": [
    { "name": "name", "label": "Name", "type": "text", "required": true, "minLength": 1, "maxLength": 100 },
    { "name": "email", "label": "Email", "type": "email", "required": true },
    { "name": "bio", "label": "Bio", "type": "textarea", "required": false, "maxLength": 500, "placeholder": "About you..." },
    { "name": "age", "label": "Age", "type": "number", "min": 0, "max": 150 },
    { "name": "birthDate", "label": "Birth Date", "type": "date", "required": false },
    { "name": "isActive", "label": "Active", "type": "checkbox" },
    { "name": "role", "label": "Role", "type": "select", "options": [{"value": "user", "label": "User"}, {"value": "admin", "label": "Admin"}] },
    { "name": "notifications", "label": "Notifications", "type": "checkboxes", "options": [{"value": "email", "label": "Email"}, {"value": "sms", "label": "SMS"}] }
  ]
}
```

**Field types:**
| Type | Description | Extra Options |
|------|-------------|---------------|
| `text` | Standard text input | `minLength`, `maxLength`, `placeholder` |
| `email` | Email input with validation | |
| `password` | Password input | |
| `number` | Numeric input | `min`, `max` |
| `textarea` | Multi-line text | `minLength`, `maxLength`, `placeholder` |
| `date` | Date picker | |
| `checkbox` | Single boolean checkbox | |
| `checkboxes` | Multiple checkboxes (array) | `options: [{value, label}]` |
| `select` | Dropdown select | `options: [{value, label}]` |
| `hidden` | Hidden field | |

**Common field options:**
| Option | Description |
|--------|-------------|
| `required` | Default `true`. Set `false` for optional fields |
| `placeholder` | Placeholder text |
| `defaultValue` | Default value for new forms |
| `helpText` | Helper text below the field |

---

## After Generation

1. Add route to `app/routes.ts`
2. Run `npm run typecheck`
3. Read the generated code and adapt it
4. Remove anything that doesn't make sense
5. Add your actual business logic
