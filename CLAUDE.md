# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Next.js 15** — App Router, TypeScript, Tailwind CSS v4
- **Prisma v7** + `@prisma/adapter-neon` — ORM with Neon serverless adapter
- **Neon** — serverless PostgreSQL

## Commands

```bash
npm run dev                                    # Dev server (Turbopack)
npm run build                                  # Production build
npm run lint                                   # ESLint

npx prisma generate                            # Regenerate Prisma client after schema changes
npx prisma db push                             # Push schema to DB without a migration file
npx prisma migrate dev --name <name>           # Create and apply a named migration
npx prisma studio                              # Open Prisma data browser
```

## Project Structure

```
app/
  api/              # Route Handlers (route.ts files)
  generated/prisma/ # Auto-generated Prisma client (do not edit)
actions/            # Server Actions ("use server" files)
components/         # Shared React components
lib/
  db.ts             # Prisma client singleton — always import from here
types/
  index.ts          # Shared TypeScript types
prisma/
  schema.prisma     # Data model
  migrations/       # Migration history
prisma.config.ts    # Prisma CLI configuration
```

## Key Conventions

- **Import alias**: `@/` maps to the project root
- **DB access**: always `import { db } from "@/lib/db"` — never instantiate PrismaClient directly
- **Generated Prisma client** is output to `app/generated/prisma/` — import from there when needed outside `lib/db.ts`
- **Server Components by default** — add `"use client"` only when needed
- **Server Actions** in `actions/` must have `"use server"` directive at the top
- **Tailwind v4**: uses `@import "tailwindcss"` in `globals.css` — no `tailwind.config.ts` required

## Environment Variables

Copy `.env.example` to `.env.local` and fill in both Neon connection strings:

- `DATABASE_URL` — pooled Neon connection (runtime, used by the app via `lib/db.ts`)
- `DIRECT_URL` — direct Neon connection (used by `prisma.config.ts` for CLI commands: migrate, db push)

The two URLs differ: `DATABASE_URL` uses the `-pooler` hostname; `DIRECT_URL` uses the direct hostname. Prisma CLI requires the direct connection to run advisory locks during migrations.

## Prisma v7 Notes

- Connection URLs are **not** in `schema.prisma` — they live in `prisma.config.ts` (CLI) and are passed via the adapter in `lib/db.ts` (runtime)
- The generated client is in `app/generated/prisma/` — import `PrismaClient` from there directly
- `lib/db.ts` uses `PrismaNeon` from `@prisma/adapter-neon` as a `SqlDriverAdapterFactory`
