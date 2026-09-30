# PharmaTrace — Production Database Backup & Recovery Strategy

## 1. Classification & Scope

| Category | Classification | Description |
| :--- | :--- | :--- |
| **Critical Immutable Traceability** | **NON-NEGOTIABLE** | `form_submissions`, `submission_values`, `product_references`, `sscc_records`, `qr_records`, `audit_logs`, `traceability_idempotency` |
| **System & Sequence State** | **HIGH IMPORTANCE** | `sscc_configurations`, `sscc_sequences`, `prc_sequences`, `forms`, `form_versions`, `form_fields`, `form_field_options`, `system_settings` |
| **User & Access Control** | **HIGH IMPORTANCE** | `users`, `roles`, `permissions`, `role_permissions` |

---

## 2. Infrastructure Backup Strategy

### A. Point-in-Time Recovery (PITR)
- **Status**: **REQUIRES SUPABASE/INFRASTRUCTURE CONFIGURATION**
- **Target RPO (Recovery Point Objective)**: < 5 minutes
- **Target RTO (Recovery Time Objective)**: < 1 hour
- **Specification**: Enable Supabase Enterprise / Pro Point-in-Time Recovery (WAL archiving) retaining 30 days of continuous write-ahead log state.

### B. Daily Automated Logical Backups
- **Status**: **OPERATIONAL PROCEDURE**
- **Frequency**: Every 24 hours at 01:00 UTC.
- **Command / Tool**:
  ```bash
  pg_dump -h db.<project-id>.supabase.co -U postgres -F c -b -v -f pharmatrace_backup_$(date +%Y%m%d).dump postgres
  ```
- **Storage**: Encrypted AWS S3 / Cloud Storage bucket with Object Lock (WORM compliance) for 7 years.

---

## 3. Migration & Rollback Strategy

### A. Forward-Only Migration Policy
- Database migrations in `supabase/migrations/` are forward-only (`20260929000000` through `20260929000011`).
- Never drop columns or tables containing active `form_submissions`, `qr_records`, or `audit_logs`.

### B. Rollback Procedure
1. Create a point-in-time database snapshot prior to executing new schema migrations.
2. If a migration failure occurs during deployment, roll back application deployment in Vercel to the previous commit SHA.
3. If database structural restoration is necessary, perform PITR to a timestamp immediately prior to migration execution.

---

## 4. Verification & Testing Procedure

1. **Quarterly Restoration Test**: Restore a production `.dump` backup file into an isolated staging database instance.
2. **Integrity Validation Query**:
   ```sql
   SELECT 
     (SELECT COUNT(*) FROM public.form_submissions) AS total_submissions,
     (SELECT COUNT(*) FROM public.qr_records) AS total_qr_records,
     (SELECT COUNT(*) FROM public.audit_logs) AS total_audit_logs;
   ```
3. **Checksum Comparison**: Verify that random samples of `product_references.code` and `sscc_records.sscc` match audit log entries.
