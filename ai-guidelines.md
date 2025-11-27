# AI Development Guidelines for Tesseract UI

> This file contains absolute AI guidelines for this project.
> All AI assistants must carefully review and understand these guidelines before beginning any development work.

## Quick Start

**Before any work**: Run `nvm use` to set the correct Node.js version.

**Key project info**:
- Main language: Portuguese (Brazil) - all documentation and text in pt-br by default
- Framework: SvelteKit 5 (with Svelte 5 runes, `$props`, `$state`, `$derived`)
- Database: PostgreSQL with Drizzle ORM
- Styling: TailwindCSS 4.x, shadcn-svelte components
- Testing: Vitest (unit), Playwright (e2e)
- i18n: Paraglide (inlang)
- Deployment: Vercel (primary), Cloudflare Workers (disabled)

---

## Essential Commands

### Development
```bash
pnpm dev                    # Start dev server (default port varies)
pnpm build                  # Build for production
pnpm preview                # Build and preview with Wrangler (port 8788)
```

### Testing
```bash
pnpm test                   # Run all tests (unit + e2e)
pnpm test:unit              # Run Vitest unit tests
pnpm test:e2e               # Run Playwright e2e tests
```

### Code Quality
```bash
pnpm lint                   # Run Prettier + ESLint (with --fix)
pnpm prettier               # Run Prettier only
pnpm format                 # Format all files
pnpm check                  # Run svelte-check with TypeScript
pnpm check:watch            # Watch mode for svelte-check
```

### Database (Drizzle)
```bash
pnpm db:push                # Push schema changes to DB (NEEDS HUMAN REVIEW)
pnpm db:generate            # Generate migration files
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open Drizzle Studio GUI
```

### Internationalization
```bash
pnpm paraglide:compile      # Compile translations (development mode)
```

### Cloudflare
```bash
pnpm cf-typegen             # Generate worker-configuration.d.ts
pnpm deploy                 # Build and deploy to Cloudflare (currently disabled)
```

### Utilities
```bash
./cleanup_chrome.sh         # Kill all Chrome instances (after e2e tests)
./cleanup_port_5173.sh      # Free up port 5173
```

---

## Project Structure

### Core Directories

```
/src/
  /routes/              # All modules, CRUD, frontend and backend
    /user/              # Example: User module (all user features here)
      /profile/
        +page.svelte           # Frontend
        +page.server.ts        # Server-side logic
        +layout.svelte         # Layout
        page.server.spec.ts    # Unit tests alongside files
        utils.server.ts        # Server utilities
    /home/              # Home module
    /doc/               # Documentation pages
  /lib/
    /components/        # All frontend components
      /ui/              # shadcn-svelte components
      /user/            # User-specific components
    /db/
      schema.ts         # Drizzle schema (ORIGINAL)
      schema.md         # Mermaid diagram (MIRROR)
    /utils/             # Shared utilities
    /server/            # Server-only modules (never sent to client)
    /paraglide/         # Auto-generated i18n (DO NOT EDIT)
    /assets/            # Server raw file storage
    app.ts              # Core app config (getSoftwareList)
  hooks.server.ts       # SvelteKit hooks (auth, i18n middleware)
  app.html              # HTML template
  worker-configuration.d.ts  # Cloudflare types (AUTO-GENERATED, DO NOT EDIT)

/e2e/                   # End-to-end tests (Playwright)
/messages/              # i18n JSON files (pt-br.json, en.json, etc.)
/static/                # Static assets (DO NOT MODIFY)
/stash/                 # Ignored directory (scratch/notes)
/project.inlang/        # i18n configuration
```

### Key Files

| File                             | Purpose                | Notes                                                      |
|----------------------------------|------------------------|------------------------------------------------------------|
| `SPEC.md`                        | Project specifications | Mirror: `src/routes/doc/spec/+page.md`                     |
| `ai-guidelines.md`               | AI development rules   | Read this first                                            |
| `terminology.md`                 | Terminology dictionary | Standard terms for UI/docs                                 |
| `src/lib/db/schema.ts`           | Database schema        | Original source                                            |
| `src/lib/db/schema.md`           | Schema diagram         | Mirror with Mermaid                                        |
| `src/routes/doc/schema/+page.md` | Schema docs            | Mirror                                                     |
| `src/lib/app.ts`                 | Software list          | Register modules in `getSoftwareList()`                    |
| `src/lib/utils/common.ts`        | Common utilities       | Register modules in `ensureDefaultAdminGroupAndRelation()` |
| `.env`                           | Environment variables  | Keep in sync with `.env.example` (mask values)             |
| `wrangler.jsonc`                 | Cloudflare config      | Check variables match `.env`                               |
| `worker-configuration.d.ts`      | Cloudflare types       | AUTO-GENERATED by `pnpm cf-typegen`                        |
| `components.json`                | shadcn-svelte config   | Component library config                                   |

---

## Code Organization and Architecture

### Module Structure (SvelteKit Route Groups)

Every module MUST be organized in a group under `src/routes/`:

**Example**: User module lives entirely in `src/routes/user/`

```
src/routes/user/
  /profile/
    +page.svelte              # Frontend UI
    +page.server.ts           # Server-side logic (load, actions)
    +layout.svelte            # Layout (example reference)
    page.server.spec.ts       # Unit tests
    utils.server.ts           # Server utilities
    utils.server.spec.ts      # Utility tests
  /login/
    +page.svelte
    +page.server.ts
    login-form.svelte         # Component-specific to login
```

**Rule**: Everything about a module (frontend, backend, tests, utilities) lives in the same directory.

**Exception**: End-to-end tests go in `/e2e/` directory.

### Registering a New Module

When creating a new module, you MUST:

1. **Add to module list**: Edit `src/lib/utils/common.ts` → function `ensureDefaultAdminGroupAndRelation()` → add to `listDefaultModules` array
2. **Add navigation link**: Edit `src/lib/app.ts` → function `getSoftwareList()` → add new `SoftwareItem`
3. **Use audit log**: Every module must integrate the audit log feature (see Audit Log section)
4. **Follow layout pattern**: Use `src/routes/user/profile/+layout.svelte` and `+page.svelte` as reference

### Shared Code and Utilities

- **Location**: `src/lib/` for all shared/reusable code
- **Server-only code**: `src/lib/server/` or `*.server.ts` files (never sent to client)
- **Components**: `src/lib/components/` (organized by domain/feature)

### Testing Patterns

#### Unit Tests
- **Location**: Alongside the file being tested (e.g., `+page.server.ts` → `page.server.spec.ts`)
- **Framework**: Vitest
- **Naming**: `*.spec.ts` or `*.test.ts`
- **Environment**:
  - Server tests: Node environment
  - Svelte component tests: Browser environment (Playwright provider)
- **Example**: See `src/routes/home/demo.spec.ts` or `src/routes/user/profile/page.server.spec.ts`

**Test structure**:
```ts
import { describe, it, expect, vi } from 'vitest';

// Mock SvelteKit modules at the top
const mockFn = vi.hoisted(() => vi.fn());
vi.mock('$app/server', () => ({ getRequestEvent: mockFn }));

describe('feature name', () => {
  it('should do something', () => {
    expect(value).toBe(expected);
  });
});
```

#### E2E Tests
- **Location**: `/e2e/` directory
- **Framework**: Playwright
- **Naming**: `*.test.ts`
- **Port**: Tests run against preview server on port 8788
- **Cleanup**: Run `./cleanup_chrome.sh` after tests to kill Chrome instances

---

## Database and Schema Management

### Schema Definition

**Source of truth**: `src/lib/db/schema.ts` (Drizzle ORM schema)

**Mirrors** (must be kept in sync):
- `src/lib/db/schema.md` - Mermaid ER diagram
- `src/routes/doc/schema/+page.md` - Public-facing schema docs

**Table prefix**: All tables use `tesser_` prefix (defined in `PREFIX` constant)

**Current schema**:
- `tesser_user` - User accounts
- `tesser_sessions` - Session management
- `tesser_group` - Groups/roles
- `tesser_rel_group` - User-group relations (composite PK)
- `tesser_audit_log` - Audit trail for all actions

### Schema Changes Workflow

1. **Edit schema**: Modify `src/lib/db/schema.ts`
2. **Update docs**: Update both mirror files with new Mermaid diagram
3. **Generate migration**: Run `pnpm db:generate`
4. **Review migration**: HUMAN MUST review generated SQL
5. **Apply to DB**: Run `pnpm db:push` (strict mode enabled)
6. **Test**: Verify changes work in dev environment

**CRITICAL**: `pnpm db:push` requires human review. Never run automatically.

### Database Access

```ts
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Query example
const users = await db.select().from(schema.user).where(eq(schema.user.id, userId));

// Insert example
await db.insert(schema.group).values({ id: '...', name: '...' });
```

**Config**: `drizzle.config.ts` - requires `DATABASE_URL` env var

---

## Authentication and Session Management

### How Auth Works

**Implementation**: `src/hooks.server.ts` + `src/lib/utils/auth.ts`

**Flow**:
1. Request arrives → `handleAuth` hook runs
2. Check for session cookie (`auth_session`)
3. Validate session token → load user + groups
4. Populate `event.locals` with user data
5. Route can access `locals.user`, `locals.session`, `locals.groups`

**Locals interface**:
```ts
event.locals.user: User | null
event.locals.session: Session | null
event.locals.groups: { groupId: string, groupName: string | null, isAdmin: boolean }[] | null
```

### Protecting Routes

**Server-side** (`+page.server.ts`):
```ts
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export const load = async () => {
  const { locals } = getRequestEvent();
  if (!locals.user) {
    return redirect(302, '/user/login');
  }
  return { user: locals.user, groups: locals.groups };
};
```

**See**: `src/routes/user/profile/+page.server.ts` for full example

### Special Users

**System User**: ID = `'1'`
- Has special privileges (e.g., group management)
- Check with: `locals.user?.id === '1'`

**Admin Users**: Users with `isAdmin: true` in any group
- Check with: `locals.groups?.some(g => g.isAdmin === true)`

---

## Internationalization (i18n)

### Framework: Paraglide (inlang)

**Message files**: `/messages/*.json` (ar, de, en, es, fr, hi, it, ja, pt-br, pt, ru, zh-*)

**Default language**: Portuguese (Brazil) - `pt-br`

**Config**: `project.inlang/settings.json`

### Usage in Code

**Svelte components**:
```svelte
<script>
  import { m } from '$lib/paraglide/messages.js';
  import { setLocale } from '$lib/paraglide/runtime';
</script>

<p>{m.hello({ name: 'World' })}</p>
<button onclick={() => setLocale('en')}>Switch to English</button>
```

**Server-side** (TypeScript):
```ts
import { m } from '$lib/paraglide/messages.js';
console.error(m.errorFetchingUser(), error);
```

### Adding New Translations

1. Add key to all JSON files in `/messages/`
2. Use descriptive keys (camelCase): `userAddedSuccessfully`, `groupNotFound`
3. Run `pnpm paraglide:compile` to regenerate types
4. Use `m.yourKey()` in code

**Note**: `src/lib/paraglide/` is auto-generated - NEVER edit directly.

---

## UI Components and Styling

### Component Library: shadcn-svelte

**Docs**: https://shadcn-svelte.com/docs/components/sidebar

**Location**: `src/lib/components/ui/`

**Key components used**:
- Card, Button, Input, Textarea, Label
- Select, Checkbox, Switch, Slider
- AlertDialog, Sheet, Popover, Tooltip
- Table, Tabs, Sidebar
- Form (using Formsnap + Superforms)

**Config**: `components.json`

### Styling: TailwindCSS 4.x

**Configuration**: Uses Vite plugin (`@tailwindcss/vite`)

**Plugins**:
- `@tailwindcss/forms`
- `@tailwindcss/typography`

**Utilities**:
- `tailwind-merge` - Merge class strings
- `tailwind-variants` - Component variants
- `tw-animate-css` - Animation utilities

### Icons

**Libraries**:
- `@tabler/icons-svelte` - Primary icon set
- `@lucide/svelte` - Secondary icon set

**Usage**:
```svelte
<script>
  import CodeIcon from '@tabler/icons-svelte/icons/code';
  import { Home } from '@lucide/svelte';
</script>
<CodeIcon />
<Home />
```

### Form Handling

**Stack**: Formsnap + Sveltekit-superforms + Zod

**Pattern**:
```svelte
<form method="post" action="?/actionName" use:enhance>
  <Input name="fieldName" />
  <Button type="submit">Submit</Button>
</form>
```

**Server-side validation**: Use Zod schemas

**See**: `src/routes/user/profile/+page.svelte` for examples

---

## Server-Side Patterns

### SvelteKit Form Actions

**Location**: `+page.server.ts` → `export const actions`

**Pattern**:
```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  actionName: async (event) => {
    const formData = await event.request.formData();
    const field = formData.get('fieldName');
    
    // Validate
    if (!field) {
      return fail(400, { message: 'FIELD_REQUIRED' });
    }
    
    // Process
    // ...
    
    // Return success
    return { success: true, message: 'SUCCESS' };
  }
};
```

**Access in component**:
```svelte
<script>
  let { data, form } = $props();
  // form contains action result
</script>
```

### Load Functions

**Pattern**:
```ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  
  // Check auth
  if (!locals.user) {
    return redirect(302, '/user/login');
  }
  
  // Fetch data
  const data = await db.select()...;
  
  return { user: locals.user, data };
};
```

### Utility Functions

**Server-only utilities**: `*.server.ts` files (e.g., `utils.server.ts`)

**Pattern**: Export small, testable functions
```ts
// utils.server.ts
export async function getUsersInGroup(db, groupId) {
  const results = await db.select()...
  return results;
}
```

**Tests**: `utils.server.spec.ts` alongside the file

---

## Audit Logging

**Implementation**: `src/lib/utils/audit.ts` (assumed based on usage patterns)

**Every module MUST use audit logging** for all create/update/delete operations.

**Usage**:
```ts
import { createAuditLog } from '$lib/utils/audit';

await createAuditLog(db, 'action.name', userId, {
  // payload (any JSON-serializable data)
  key: 'value'
});
```

**Action naming convention**: `module.action` (e.g., `user.logout`, `group.create`, `group.delete`)

**Schema**: `tesser_audit_log` table
```ts
{
  id: string (PK)
  action: string (NOT NULL)
  performedById: string (FK to user.id, nullable)
  payload: jsonb (nullable)
  createdAt: timestamp (default now())
}
```

**Examples** (from codebase):
- `user.logout` - When user logs out
- `group.create` - When group created
- `group.delete` - When group deleted
- `group.add_user` - When user added to group

---

## Security Best Practices

### Server-Only Modules

**SvelteKit protection**: Never send server code to client

**Rules**:
1. Place in `src/lib/server/` directory, OR
2. Name with `.server.js` / `.server.ts` extension

**These are NEVER bundled for client**:
- `+page.server.js`
- `+layout.server.js`
- `+server.js`
- `*.server.js` / `*.server.ts`
- Anything in `src/lib/server/`

### Environment Variables

**Files**:
- `.env` - Real values (NOT committed)
- `.env.example` - Masked template (MUST keep in sync)

**Access**:
```ts
// Server-only (static, build-time)
import { PASSPHRASE } from '$env/static/private';

// Server-only (dynamic, runtime)
import { env } from '$env/dynamic/private';

// Public (safe for client)
import { PUBLIC_API_URL } from '$env/static/public';
```

**NEVER**:
- Import `$env/static/private` in client code (will error)
- Log secrets to console
- Send secrets in responses

### Database Security

**Always use**:
- Parameterized queries (Drizzle handles this)
- Foreign key constraints (defined in schema)
- Transaction for multi-step operations

**Example transaction**:
```ts
await db.transaction(async (tx) => {
  await tx.insert(schema.group).values({...});
  await createAuditLog(tx, 'group.create', userId, {...});
});
```

---

## Code Conventions and Style

### Svelte 5 Patterns (Runes)

**State management**:
```svelte
<script>
  // Props
  let { data, form } = $props();
  
  // State
  let count = $state(0);
  
  // Derived
  let doubled = $derived(count * 2);
  
  // Derived (complex)
  let filtered = $derived.by(() => {
    return items.filter(i => i.active);
  });
  
  // Effects
  $effect(() => {
    console.log('count changed:', count);
  });
</script>
```

**No more**:
- `export let prop` (use `$props()`)
- `$:` reactive declarations (use `$derived`)
- `$:` reactive statements (use `$effect`)

### TypeScript

**Required**: All files should use TypeScript

**Types**:
```ts
// Import generated types
import type { PageServerData } from './$types';
import type { Actions, PageServerLoad } from './$types';

// Schema types
import type { User, Group } from '$lib/db/schema';
```

**Avoid**: `any` type (use `unknown` if needed)

### Naming Conventions

**Files**:
- Routes: `+page.svelte`, `+page.server.ts`, `+layout.svelte`
- Components: PascalCase (`GroupManagementCard.svelte`)
- Utils: camelCase (`utils.server.ts`)
- Tests: `*.spec.ts`, `*.test.ts`

**Variables**:
- camelCase for variables, functions
- PascalCase for components, types
- UPPER_CASE for constants

**Database**:
- Table prefix: `tesser_`
- Column names: snake_case in DB, camelCase in schema
- Foreign keys: `userId`, `groupId` (camelCase in schema)

### Import Aliases

**Available**:
- `$lib` → `src/lib`
- `$app` → SvelteKit app modules
- `$env` → Environment variables

**Example**:
```ts
import { db } from '$lib/db';
import { m } from '$lib/paraglide/messages.js';
import { getRequestEvent } from '$app/server';
import { DATABASE_URL } from '$env/static/private';
```

---

## Important Gotchas and Edge Cases

### Mirror Files (CRITICAL)

**These files must stay in sync** (update ALL when changing one):

1. **Schema**:
   - `src/lib/db/schema.ts` (source)
   - `src/lib/db/schema.md` (mirror)
   - `src/routes/doc/schema/+page.md` (mirror)

2. **Specification**:
   - `SPEC.md` (source)
   - `src/routes/doc/spec/+page.md` (mirror)

**Rule**: As an AI, read all mirror files but DO NOT LOOP. Read once and stop recursive search.

### Auto-Generated Files (DO NOT EDIT)

- `src/lib/paraglide/*` - Generated by `pnpm paraglide:compile`
- `src/worker-configuration.d.ts` - Generated by `pnpm cf-typegen`

### Ignore Directories

- `/stash/` - Scratch notes, not part of the app
- `/static/` - Static assets, AIs should not modify
- `src/lib/paraglide/` - Auto-generated

### Cloudflare Workers (Currently Disabled)

**Status**: Project was configured for Cloudflare Workers but currently uses Vercel

**Evidence**:
- `wrangler.jsonc` exists
- `svelte.config.js` has CF adapter commented out
- `vite.config.ts` has CF-related code commented out (lines 26-30)

**If re-enabling**:
1. Uncomment adapter in `svelte.config.js`
2. Uncomment global fix in `vite.config.ts`
3. Run `pnpm cf-typegen`
4. Check env vars in `wrangler.jsonc` match `.env`

### mdsvex (Markdown in Svelte)

**Enabled**: Project uses mdsvex for `.md` files in Svelte

**Config**: `mdsvex.config.js`, `mdsvex.config.ts`

**Extensions**: `.svelte`, `.svx`, `.md` (all treated as Svelte)

**Used in**: Documentation pages (`src/routes/doc/`)

### Lint Expected Result

When running `pnpm lint`, the expected output is:

```
All matched files use Prettier code style!
```

If you see formatting errors, run `pnpm format` to fix.

### Database Connection

**Requires**: `DATABASE_URL` environment variable

**Format**: PostgreSQL connection string

**Driver**: `postgres` (npm package, not `pg`)

**Connection**: Defined in `src/lib/db` (not shown but imported throughout)

---

## Common Patterns and Examples

### Adding a New Route with Auth

```ts
// src/routes/my-route/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const { locals } = getRequestEvent();
  
  if (!locals.user) {
    return redirect(302, '/user/login');
  }
  
  return {
    user: locals.user,
    groups: locals.groups
  };
};
```

```svelte
<!-- src/routes/my-route/+page.svelte -->
<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';
  import type { PageServerData } from './$types';
  
  let { data } = $props<{ data: PageServerData }>();
</script>

<h1>{m.hello({ name: data.user.username })}</h1>
```

### Creating a Form with Action

```svelte
<!-- Frontend -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  
  let { form } = $props<{ form?: any }>();
  let name = $state('');
</script>

<form method="post" action="?/create" use:enhance>
  <Input name="name" bind:value={name} required />
  {#if form?.message}
    <p class="text-red-600">{form.message}</p>
  {/if}
  <Button type="submit">Create</Button>
</form>
```

```ts
// Backend: +page.server.ts
export const actions: Actions = {
  create: async (event) => {
    const formData = await event.request.formData();
    const name = formData.get('name');
    
    if (!name || typeof name !== 'string') {
      return fail(400, { message: 'NAME_REQUIRED' });
    }
    
    // Process...
    await createAuditLog(db, 'item.create', event.locals.user?.id, { name });
    
    return { success: true };
  }
};
```

### Query Database with Drizzle

```ts
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Select
const users = await db
  .select()
  .from(schema.user)
  .where(eq(schema.user.username, 'admin'));

// Insert
await db.insert(schema.group).values({
  id: crypto.randomUUID(),
  name: 'New Group',
  description: 'Description'
});

// Update
await db
  .update(schema.user)
  .set({ name: 'Updated' })
  .where(eq(schema.user.id, userId));

// Delete (better: soft delete)
await db
  .delete(schema.group)
  .where(eq(schema.group.id, groupId));

// Join
const results = await db
  .select({
    userId: schema.user.id,
    groupName: schema.group.name
  })
  .from(schema.relGroup)
  .innerJoin(schema.user, eq(schema.relGroup.userId, schema.user.id))
  .innerJoin(schema.group, eq(schema.relGroup.groupId, schema.group.id))
  .where(eq(schema.user.id, userId));
```

### Using shadcn-svelte Components

```svelte
<script>
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    Content here
  </Card.Content>
</Card.Root>

<AlertDialog.Root>
  <AlertDialog.Trigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Confirm</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
```

---

## Related Documentation

**Essential reads**:
- [SPEC.md](./SPEC.md) - Project specifications (with Mermaid diagrams)
- [terminology.md](./terminology.md) - Standard terminology for UI
- [src/lib/db/schema.md](src/lib/db/schema.md) - Database schema diagram
- [README.md](./README.md) - Project overview

**External docs**:
- [SvelteKit](https://kit.svelte.dev/docs)
- [Svelte 5 (Runes)](https://svelte.dev/docs/svelte/overview)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [shadcn-svelte](https://shadcn-svelte.com/docs/components)
- [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)

---

## Workflow Checklist for AI Agents

When implementing a new feature:

- [ ] Read `SPEC.md` for requirements
- [ ] Check if module exists or needs creation
- [ ] If new module:
  - [ ] Add to `listDefaultModules` in `src/lib/utils/common.ts`
  - [ ] Add to `getSoftwareList()` in `src/lib/app.ts`
- [ ] Create route structure: `+page.svelte`, `+page.server.ts`
- [ ] Add unit tests: `page.server.spec.ts`
- [ ] If schema changes:
  - [ ] Update `src/lib/db/schema.ts`
  - [ ] Update both mirror files (`schema.md`, `doc/schema/+page.md`)
  - [ ] Run `pnpm db:generate`
  - [ ] Wait for human to review and run `pnpm db:push`
- [ ] Add i18n messages to all `/messages/*.json` files
- [ ] Run `pnpm paraglide:compile` after adding messages
- [ ] Add audit logging for all state changes
- [ ] Protect routes with auth checks if needed
- [ ] Follow existing component patterns (see `src/routes/user/profile/`)
- [ ] Run `pnpm lint` before finishing
- [ ] Run `pnpm test:unit` to verify tests pass
- [ ] Update `SPEC.md` if adding new feature

---

## Final Notes

**This project prioritizes**:
- Code organization (everything about a module in one place)
- Audit trails (log all important actions)
- Internationalization (support many languages)
- Type safety (TypeScript everywhere)
- Testing (unit tests alongside code, e2e in `/e2e/`)
- Security (server-only modules, environment variables)

**Main language**: Portuguese (Brazil) - but code/comments in English is acceptable

**When in doubt**: Look at existing modules like `src/routes/user/profile/` for patterns to follow.

**Reference implementations**:
- Profile page: `src/routes/user/profile/` (auth, forms, actions, groups)
- Login: `src/routes/user/login/` (auth flow, OAuth)
- Group management: `src/lib/components/user/GroupManagementCard.svelte` (complex component)

**Package manager**: Use `pnpm` (not npm or yarn)
