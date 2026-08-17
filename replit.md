# FindIt

FindIt is a mobile-first personal visual memory app for saving belongings, reference photos, and manual sightings so users can remember where they last saw things.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/findit/src/` — React screens, mobile shell, camera foundation, and visual components.
- `artifacts/api-server/src/routes/findit.ts` — FindIt API routes and local-user persistence.
- `lib/api-spec/openapi.yaml` — source of truth for object, observation, home-summary, and demo-data contracts.
- `lib/db/src/schema/` — PostgreSQL schema for users, objects, and observations.

## Architecture decisions

- Step 1 uses a single local user record because authentication is intentionally outside this foundation.
- Photos are resized in the browser and persisted as data URLs for this step; the storage boundary can move to App Storage later.
- The scan flow saves manual observations only; computer vision is intentionally not called by the app.
- API contracts are OpenAPI-first and generated client hooks are used by the frontend.

## Product

- Mobile home overview with recently seen memories and optional demo data.
- Personal object collection with categories, reference photos, descriptions, and observation counts.
- Camera/gallery scan foundation with preview, retake, and manual object association.
- Timeline history of saved observations with optional location metadata.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing the API contract.
- Image persistence is intentionally data-URL based until App Storage is available and authentication is added.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
