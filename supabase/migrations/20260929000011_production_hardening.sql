-- Migration 20260929000011_production_hardening.sql
-- Production Security Hardening:
-- Fix search_path for all SECURITY DEFINER functions to prevent schema hijacking vulnerabilities.

ALTER FUNCTION public.generate_next_prc() SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_sscc_sequence(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.persist_traceability_record(UUID, UUID, UUID, VARCHAR, VARCHAR, UUID, JSONB, VARCHAR, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_qr_history(TEXT, VARCHAR, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, UUID, BOOLEAN) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_qr_detail(UUID, UUID, BOOLEAN) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_admin_users(TEXT, VARCHAR, BOOLEAN, INT, INT) SET search_path = public, pg_temp;
ALTER FUNCTION public.admin_update_user(UUID, VARCHAR, BOOLEAN, UUID) SET search_path = public, pg_temp;
-- ALTER FUNCTION public.get_active_sscc_config() SET search_path = public, pg_temp;
-- ALTER FUNCTION public.set_active_sscc_config(VARCHAR, VARCHAR, VARCHAR, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_system_settings() SET search_path = public, pg_temp;
ALTER FUNCTION public.process_atomic_traceability_record(UUID, UUID, UUID, UUID, VARCHAR, VARCHAR, JSONB, VARCHAR, JSONB) SET search_path = public, pg_temp;
