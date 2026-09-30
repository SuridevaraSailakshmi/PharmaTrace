# PharmaTrace — Production Operations & Observability Guide

## 1. System Overview & Logging Architecture

PharmaTrace V1 uses a structured server-side error logging model. All API route errors, database exceptions, and authorization failures emit structured console logs that are ingested by Vercel Logs and Supabase Postgres Logs.

---

## 2. Key Diagnostic Signals & Metric Triggers

| Failure Domain | Log Pattern / Code | Alert Threshold | Operational Escalation |
| :--- | :--- | :--- | :--- |
| **Traceability Sequence Exhaustion** | `PRC_SEQUENCE_EXHAUSTED`, `SSCC_SEQUENCE_EXHAUSTED` | **CRITICAL** (1 occurrence) | Immediately initialize new annual PRC year sequence or active SSCC configuration block. |
| **Authentication Failures** | `401 Unauthorized`, `Invalid credentials` | > 20 failures / 5 min | Investigate credential stuffing / brute force attempt. |
| **Idempotency Rejection** | `409 Conflict`, `IDEMPOTENCY_CONFLICT` | > 5 failures / 10 min | Inspect client client-side retry logic or duplicate submission attempts. |
| **Atomic RPC Failure** | `process_atomic_traceability_record error` | **HIGH** (1 occurrence) | Check Supabase database connectivity, disk space, and locks. |
| **Database Connection Exhaustion** | `FATAL: remaining connection slots are reserved` | **HIGH** (> 1 occurrence) | Verify connection pooling configuration in Supabase Transaction Mode (port 6543). |

---

## 3. Recommended Production Monitoring Setup

1. **Sentry / Application Error Tracking**:
   - Install `@sentry/nextjs` for real-time frontend and server-side uncaught exception monitoring.
2. **Supabase Alerts**:
   - Configure Supabase Dashboard alerts for DB CPU > 85%, Storage > 80%, and Connection Pooler utilization > 90%.
3. **Vercel Log Drains**:
   - Connect Vercel Log Drains to Datadog / Better Stack / Axiom for long-term log retention and audit compliance.

---

## 4. Runbook: Common Operational Procedures

### A. Updating Active SSCC Configuration
1. Login as `ADMIN`.
2. Navigate to `/admin/settings`.
3. Update `GS1 Company Prefix` or `Extension Digit`.
4. Submit form (triggers `set_active_sscc_config` RPC and writes an audit log entry).

### B. Unlocking Deactivated User Accounts
1. Login as `ADMIN`.
2. Navigate to `/admin/users`.
3. Locate target user and toggle status to `Active` (triggers `admin_update_user` RPC with last-admin protection check).
