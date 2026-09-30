# Production Acceptance Checklist

## 1. Infrastructure
- [ ] Vercel production project created
- [ ] Environment variables configured correctly in Vercel
- [ ] Build process completes without warnings
- [ ] Production domains mapped

## 2. Database
- [ ] Supabase production project created
- [ ] PostgreSQL version verified
- [ ] Migrations `20260929000000` through `20260929000011` applied successfully
- [ ] Connection string updated in Vercel

## 3. Authentication
- [ ] Production JWT secret securely generated
- [ ] Email provider configured (if not using Supabase default)
- [ ] Authentication tested via web interface

## 4. Authorization
- [ ] RLS policies verified active on production database
- [ ] Admin role confirmed working
- [ ] Worker role confirmed restricted

## 5. Forms
- [ ] Default pharmaceutical form seeded/published
- [ ] Form rendering tested in production UI
- [ ] Form builder validation works

## 6. PRC
- [ ] PRC allocation sequence initialized
- [ ] Correct PRC format (prefix + sequential) verified in production

## 7. SSCC
- [ ] GS1 Company Prefix configured correctly in production settings
- [ ] SSCC generation check digit calculation verified
- [ ] Sequence handles concurrency properly

## 8. QR
- [ ] QR payload conforms to GS1 DL URI format
- [ ] QR generator outputs valid images
- [ ] Downloads and printing work on supported browsers

## 9. Traceability
- [ ] `process_atomic_traceability_record` confirmed running within a single transaction
- [ ] Worker can submit tracing events
- [ ] Historical data appears in tracing views

## 10. Audit
- [ ] Audit triggers are firing appropriately
- [ ] Worker cannot overwrite or spoof audit entries
- [ ] Admin can view audit logs accurately

## 11. Backup
- [ ] Supabase Point-in-Time-Recovery (PITR) enabled (if required)
- [ ] Automated daily backups verified active
- [ ] Recovery procedure documented and accessible

## 12. Monitoring
- [ ] Application error monitoring configured (e.g., Sentry)
- [ ] Log drains or Vercel analytics enabled
- [ ] Alerts for 5xx errors configured

## 13. Security
- [ ] HTTPS enforced on all domains
- [ ] Security headers active (HSTS, Content-Security-Policy)
- [ ] RPC `search_path` hardened

## 14. Domain/HTTPS
- [ ] Custom domain resolves correctly
- [ ] SSL certificate provisioned and valid

## 15. Rollback
- [ ] Procedure for rolling back failed deployments tested
- [ ] Orphaned records verification completed safely (or tested in staging)
