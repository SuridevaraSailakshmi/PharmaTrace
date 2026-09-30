# PharmaTrace — Architecture

## Overview

PharmaTrace is a pharmaceutical QR, SSCC, and product traceability management system. It follows a **modular monolith** architecture deployed on **Vercel** with **Supabase** as the backend-as-a-service.

## System Architecture

```
┌──────────────────────────────────┐
│         Browser / Client         │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│          Next.js UI              │
│   (React + TypeScript + Tailwind)│
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│    Next.js Server / API Routes   │
│     (Route Handlers, RSC)        │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│        Authorization Layer       │
│         (Application RBAC)       │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│      Application Services        │
│  (Form, PRC, SSCC, QR, Audit)    │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│       Supabase Client            │
│   (@supabase/ssr, @supabase/js)  │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│     PostgreSQL / Supabase        │
│   (RLS, Migrations, Functions)   │
└──────────────────────────────────┘
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes (login)
│   ├── (dashboard)/        # Protected dashboard routes
│   └── api/                # API route handlers
│
├── components/             # Reusable UI components
│   ├── ui/                 # Primitive UI elements
│   ├── layout/             # Layout components (sidebar, topbar)
│   ├── forms/              # Form-related components
│   ├── qr/                 # QR display/download components
│   ├── tables/             # Data table components
│   └── feedback/           # Alerts, toasts, loading states
│
├── features/               # Feature modules
│   ├── auth/               # Authentication
│   ├── users/              # User management
│   ├── forms/              # Form engine
│   ├── submissions/        # Form submissions
│   ├── product-references/ # PRC generation
│   ├── sscc/               # SSCC generation
│   ├── qr/                 # QR generation
│   ├── audit/              # Audit logging
│   └── settings/           # System settings
│
├── services/               # Business logic services
│   ├── forms/              # Form service
│   ├── product-reference/  # Product Reference Code service
│   ├── sscc/               # SSCC service
│   ├── qr/                 # QR payload + generator services
│   ├── audit/              # Audit service
│   ├── users/              # User service
│   └── settings/           # Settings service
│
├── lib/                    # Shared utilities and infrastructure
│   ├── supabase/           # Supabase client (browser, server, middleware)
│   ├── validation/         # Zod schemas
│   ├── permissions/        # RBAC definitions
│   ├── errors/             # Structured error classes
│   ├── logging/            # Logger
│   ├── constants/          # Application constants
│   └── utils/              # General utilities
│
├── types/                  # TypeScript type definitions
│   ├── common.ts           # Shared types (API response, pagination)
│   ├── auth.ts             # Auth & RBAC types
│   ├── database.ts         # Database entity types
│   ├── forms.ts            # Form engine types
│   ├── qr.ts               # QR types
│   └── sscc.ts             # SSCC types
│
└── middleware.ts            # Next.js middleware (session refresh)

supabase/
├── migrations/             # Database migration files
└── seed/                   # Seed data

tests/
├── unit/                   # Vitest unit tests
├── integration/            # Integration tests
└── e2e/                    # Playwright E2E tests

docs/
├── architecture/           # Architecture documentation
├── database/               # Database schema documentation
├── security/               # Security documentation
├── ui-ux/                  # UI/UX design documentation
├── api/                    # API documentation
└── testing/                # Testing documentation
```

## Logical Services

| Service | Responsibility |
|---|---|
| Form Service | CRUD for forms, versioning, field management |
| Product Reference Service | Generate PRC-YYYY-NNNNNN codes |
| SSCC Service | Generate 18-digit SSCC codes |
| QR Payload Service | Build structured QR payload from form data |
| QR Generator Service | Generate QR image from payload |
| QR Record Service | Persist QR records |
| Audit Service | Write and query audit logs |
| User Service | User CRUD, role management |
| Authorization Service | Permission checking |
| Settings Service | System-wide settings |

## Core Workflow: Submit & Generate QR

```
Worker fills form
    → Validate form (Zod)
    → Generate Product Reference Code (PRC-YYYY-NNNNNN)
    → Generate SSCC (18-digit)
    → Build QR payload
    → Generate QR image
    → Save complete record (transaction)
    → Create audit record
    → Display QR to worker
    → Allow download / print
```

## Key Design Decisions

1. **Modular monolith** — No microservices. All services live in the same codebase.
2. **Feature-oriented structure** — Code organized by business domain, not by technical layer.
3. **No ORM** — Direct Supabase client usage. No Prisma, no Drizzle.
4. **Server-side generation** — PRC and SSCC are generated server-side, never by the client.
5. **Immutable published forms** — Once a form version is published, it cannot be modified.
6. **Separated QR concerns** — Payload building and QR image generation are separate services.
7. **Application RBAC** — Permissions checked at the application layer, with RLS as a defense-in-depth layer.
