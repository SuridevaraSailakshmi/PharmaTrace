# PharmaTrace

**Pharmaceutical QR, SSCC & Product Traceability Management System**

---

## About

PharmaTrace is a production-oriented pharmaceutical web application that enables authorized workers to submit product information forms and generate traceable QR codes with unique Product Reference Codes (PRC) and Serial Shipping Container Codes (SSCC).

## Technology Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Next.js Server, Route Handlers (REST-style API)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with application-level RBAC
- **Validation:** Zod
- **Testing:** Vitest, Playwright
- **Deployment:** Vercel + Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd PharmaTrace

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

## Documentation

- [Architecture](docs/architecture/README.md)
- [Project Status](docs/PROJECT_STATUS.md)

## License

Proprietary — All rights reserved.
