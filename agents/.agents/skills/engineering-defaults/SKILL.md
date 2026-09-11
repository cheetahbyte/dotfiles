---
name: engineering-defaults
description: >-
  Canonical, opinionated technology stack for any new project — what to use, in what order, and what to avoid. Always apply when starting a new project or making stack decisions: scaffolding an app, prototype, dashboard, landing page, or design system; or choosing a framework, UI library, database, ORM, auth, hosting, animation library, or any other dependency. Triggers: "new project", "start building", "scaffold", "spin up a site/app", "what should I use for", "which framework/library/database", "set up auth", "add a backend", "where do I deploy", "build a prototype". Always active when selecting or installing technology.
disable-model-invocation: false
---
# Engineering Defaults

## Principles
Six principles. Every choice below flows from one of them.

- Reach for the lightest thing that works. No dedicated backend until server functions can't do the job. No database until something needs to persist. No new dependency when the stack already has the answer. The best dependency is the one you didn't add.
- One ecosystem, one mental model. TanStack on the web, React Native on mobile, React for email templates. The same Query, Zod, and TypeScript instincts carry across all of them. Don't fragment the skillset.
- Own the data. Anything touching users or secrets is self-hosted on infrastructure you control — your Postgres, your auth tables, your object storage. Third-party processors are a liability, not a convenience.
- Sensitive data lives server-side. It is read, handled, and transformed on the server (server functions or a Go backend) and never shipped into the client bundle. The browser sees rendered results, not raw secrets.
- Fail loud, early. A missing env var crashes at boot, not in production. Validation (Zod) sits at every boundary — env, forms, API, database. Bad data never travels.
- Type-safe end to end. The database schema generates the validators; the validators type the forms and the API. One source of truth, no drift between layers.

## Scope
This stack is for new projects. In an existing project, keep its package manager, framework, hosting, ORM, and conventions; apply these defaults only to dependencies that are being added, and only where the project has no equivalent already.

## Selection Order
Start at step 1 and stop as soon as the project requirements are covered.

1. Start with TanStack Start, TypeScript, Tailwind CSS, and shadcn/ui.
2. Add PostgreSQL and Drizzle only when data must persist.
3. Add Better Auth only when the product needs identity or sessions.
4. Add R2 only when the product stores files or blobs.
5. Add Zustand only when React state and URL state no longer fit.
6. Add a Go, sqlc, and Gin backend only when server functions no longer fit.

## Stack Overview
|Topic|Tool|Comments|
|---|---|---|
|Package manager|Bun|No npm or pnpm.|
|Language (web)|TypeScript|Everywhere on the JS side. No plain JS.|
|Web framework|TanStack Start|Full-stack SSR and server functions on Vite.|
|Routing / data / tables / forms|TanStack Router / Query / Table / Form|Keep the web stack in one ecosystem.|
|Client-side state|React state + URL params, then Zustand|Server state stays in Query; never copy it into a client store.|
|Styles|Tailwind CSS 4|CSS-first configuration with the Vite plugin.|
|Components|shadcn/ui|Own the component code; adapt it locally.|
|Icons|Lucide||
|Toasts|Sonner||
|Charts|TanStack Charts|Prefer its shadcn chart integration.|
|Fonts|Self-hosted fonts|Never load fonts from Google Fonts or another CDN.|
|Validation|Zod|Validate every boundary. Derive schemas from Drizzle tables with `drizzle-zod`.|
|Database|PostgreSQL||
|ORM|Drizzle ORM||
|Authentication|Better Auth|Keep auth data in the project's PostgreSQL database.|
|Object storage|Cloudflare R2||
|Linting / formatting|Oxlint + Oxfmt||
|Testing|Vitest + Playwright|Vitest for unit and integration tests; Playwright for browser flows.|
|Analytics|None by default|Add analytics only when the project has a concrete measurement need.|
|Hosting|Cloudflare Workers|One Worker serving a static `assets` directory, with an `ASSETS` binding when the app also needs server routes. Not Pages: Cloudflare recommends Workers Static Assets for new projects.|
|Dedicated backend|Go + sqlc + Gin|Add only when TanStack Start server functions no longer fit, are about to explode|

## Avoid

- Substituting a familiar equivalent for a canonical choice by preference; only an explicit project requirement rules one out.
- Adding a dependency that overlaps TanStack, shadcn/ui, browser APIs, or platform features.
- Copying server state into a client store.
