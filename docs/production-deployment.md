# PharmaTrace — Production Deployment Guide

## 1. Deployment Prerequisites

- **Vercel Account**: Access to deployment workspace with Next.js 16 environment support.
- **Supabase Production Project**: Active Supabase project with PostgreSQL database, auth enabled, and SSL database URL.
- **GS1 Enterprise Allocation**: Valid allocated GS1 Company Prefix registered to the pharmaceutical manufacturing entity.
- **Domain & SSL**: Production domain (e.g. `traceability.pharmaceuticals.com`) with automated SSL provision.

---

## 2. Supabase Production Configuration

1. **Authentication Settings**:
   - Set **Site URL** to `https://<production-domain>`.
   - Set **Redirect URLs** to `https://<production-domain>/auth/callback` and `https://<production-domain>/dashboard`.
2. **Database Migrations**:
   - Execute migrations in exact numerical sequence (`20260929000000` through `20260929000011`):
     ```bash
     npx supabase db push --db-url "postgres://postgres:<db-password>@db.<project-id>.supabase.co:5432/postgres"
     ```
3. **SSCC Configuration Initialisation**:
   - Seed or execute `set_active_sscc_config` with the production GS1 company prefix.

---

## 3. Environment Variables (Vercel Project Settings)

Configure the following environment variables in Vercel settings:

```env
# Public Environment Variables (Build & Runtime)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
NEXT_PUBLIC_APP_NAME=PharmaTrace
NEXT_PUBLIC_APP_URL=https://<your-production-domain>

# Server-Side Secrets (Runtime Only - NEVER Expose to Client)
SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
NODE_ENV=production
```

---

## 4. Vercel Deployment Procedure

1. Connect GitHub repository to Vercel.
2. Select Framework Preset: **Next.js**.
3. Set Build Command: `npm run build`.
4. Set Output Directory: `.next`.
5. Deploy project to production branch (`main`).

---

## 5. Post-Deployment Verification (Smoke Tests)

1. Navigate to `https://<production-domain>/api/health` — Verify HTTP `200 OK` JSON response.
2. Login as `ADMIN` — Verify dashboard rendering and user management controls.
3. Login as `WORKER` — Open published form, fill required fields, click **Submit & Generate QR**.
4. Verify PRC format (`PRC-YYYY-NNNNNN`), 18-digit SSCC, SVG QR code rendering, and history log creation.
5. Re-send submission with same `Idempotency-Key` — Verify cached response is returned without creating duplicate records.

---

## 6. Rollback Considerations

- **Application Rollback**: In Vercel, select the previous successful deployment build and click **Promote to Production**.
- **Database Rollback**: Migrations are forward-additive. If structural recovery is required, restore from PITR snapshot taken prior to deployment window.
