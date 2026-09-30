-- ──────────────────────────────────────────────
-- Enable RLS on all core tables
-- ──────────────────────────────────────────────

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sscc_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sscc_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sscc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- Helper Functions
-- ──────────────────────────────────────────────

-- Get the user's role from the public.users table based on auth.uid()
CREATE OR REPLACE FUNCTION public.user_role() RETURNS VARCHAR AS $$
  SELECT role_id FROM public.users WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE;

-- ──────────────────────────────────────────────
-- Policies
-- ──────────────────────────────────────────────

-- Roles & Permissions (Read-only for all authenticated users)
CREATE POLICY "Allow read access to roles for authenticated users" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to permissions for authenticated users" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to role_permissions for authenticated users" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Users
-- Users can read all users (needed for display names, audit logs, etc.)
CREATE POLICY "Allow read access to users for authenticated users" ON public.users FOR SELECT TO authenticated USING (true);
-- Only ADMIN can modify users
CREATE POLICY "Allow all access to users for ADMIN" ON public.users FOR ALL TO authenticated USING (public.user_role() = 'ADMIN');

-- System Settings
-- All authenticated users can read settings
CREATE POLICY "Allow read access to system_settings for authenticated users" ON public.system_settings FOR SELECT TO authenticated USING (true);
-- Only ADMIN can modify settings
CREATE POLICY "Allow all access to system_settings for ADMIN" ON public.system_settings FOR ALL TO authenticated USING (public.user_role() = 'ADMIN');

-- SSCC Configurations & Sequences
-- All authenticated users can read configurations and sequences
CREATE POLICY "Allow read access to sscc_configurations for authenticated users" ON public.sscc_configurations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to sscc_sequences for authenticated users" ON public.sscc_sequences FOR SELECT TO authenticated USING (true);
-- Only ADMIN can modify configurations
CREATE POLICY "Allow all access to sscc_configurations for ADMIN" ON public.sscc_configurations FOR ALL TO authenticated USING (public.user_role() = 'ADMIN');
-- Only Server (Service Role) can modify sequences to ensure transaction safety and prevent gaps/duplication
-- Service role bypasses RLS, so no specific policy is needed, but we don't grant insert/update to authenticated users.

-- Forms, Versions, Fields, Options
-- All authenticated users can read published forms, but only ADMIN can read draft/archived forms.
CREATE POLICY "Allow read access to forms for authenticated users" ON public.forms FOR SELECT TO authenticated USING (status = 'published' OR public.user_role() = 'ADMIN');
CREATE POLICY "Allow read access to form_versions for authenticated users" ON public.form_versions FOR SELECT TO authenticated USING (is_published = true OR public.user_role() = 'ADMIN');
CREATE POLICY "Allow read access to form_fields for authenticated users" ON public.form_fields FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.form_versions v WHERE v.id = form_fields.form_version_id AND (v.is_published = true OR public.user_role() = 'ADMIN'))
);
CREATE POLICY "Allow read access to form_field_options for authenticated users" ON public.form_field_options FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.form_fields f 
        JOIN public.form_versions v ON f.form_version_id = v.id 
        WHERE f.id = form_field_options.field_id AND (v.is_published = true OR public.user_role() = 'ADMIN')
    )
);
-- Only ADMIN can modify forms
CREATE POLICY "Allow all access to forms for ADMIN" ON public.forms FOR ALL TO authenticated USING (public.user_role() = 'ADMIN');
CREATE POLICY "Allow all access to form_versions for ADMIN" ON public.form_versions FOR ALL TO authenticated USING (public.user_role() = 'ADMIN');
CREATE POLICY "Allow all access to form_fields for ADMIN" ON public.form_fields FOR ALL TO authenticated USING (public.user_role() = 'ADMIN');
CREATE POLICY "Allow all access to form_field_options for ADMIN" ON public.form_field_options FOR ALL TO authenticated USING (public.user_role() = 'ADMIN');

-- Submissions & Values
-- Users can read submissions they created, ADMIN can read all
CREATE POLICY "Allow read access to form_submissions for ADMIN" ON public.form_submissions FOR SELECT TO authenticated USING (public.user_role() = 'ADMIN');
CREATE POLICY "Allow read access to own form_submissions for WORKER" ON public.form_submissions FOR SELECT TO authenticated USING (submitted_by = auth.uid());
-- Creating submissions is allowed for authenticated users (server validation handles the rest)
CREATE POLICY "Allow insert access to form_submissions for authenticated users" ON public.form_submissions FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() OR public.user_role() = 'ADMIN');
-- Submission values follow the submission visibility
CREATE POLICY "Allow read access to submission_values for ADMIN" ON public.submission_values FOR SELECT TO authenticated USING (public.user_role() = 'ADMIN');
CREATE POLICY "Allow read access to own submission_values for WORKER" ON public.submission_values FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.form_submissions s WHERE s.id = submission_values.submission_id AND s.submitted_by = auth.uid())
);
CREATE POLICY "Allow insert access to submission_values for authenticated users" ON public.submission_values FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.form_submissions s WHERE s.id = submission_values.submission_id AND s.submitted_by = auth.uid()) OR public.user_role() = 'ADMIN'
);

-- Product References, SSCC Records, QR Records
-- Read access follows submission visibility
CREATE POLICY "Allow read access to product_references for ADMIN" ON public.product_references FOR SELECT TO authenticated USING (public.user_role() = 'ADMIN');
CREATE POLICY "Allow read access to own product_references for WORKER" ON public.product_references FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.form_submissions s WHERE s.id = product_references.submission_id AND s.submitted_by = auth.uid())
);

CREATE POLICY "Allow read access to sscc_records for ADMIN" ON public.sscc_records FOR SELECT TO authenticated USING (public.user_role() = 'ADMIN');
CREATE POLICY "Allow read access to own sscc_records for WORKER" ON public.sscc_records FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.form_submissions s WHERE s.id = sscc_records.submission_id AND s.submitted_by = auth.uid())
);

CREATE POLICY "Allow read access to qr_records for ADMIN" ON public.qr_records FOR SELECT TO authenticated USING (public.user_role() = 'ADMIN');
CREATE POLICY "Allow read access to own qr_records for WORKER" ON public.qr_records FOR SELECT TO authenticated USING (
    created_by = auth.uid()
);

-- Note: Insert/Update of PRCs, SSCC records, and QR records should be strictly performed by the Service Role on the server to guarantee atomicity and correct generation (e.g. sequence increment).
-- Therefore, we do not grant insert/update policies to authenticated users for these tables.

-- Audit Logs
-- Read access only for ADMIN
CREATE POLICY "Allow read access to audit_logs for ADMIN" ON public.audit_logs FOR SELECT TO authenticated USING (public.user_role() = 'ADMIN');
-- Insert access for all authenticated users (Server usually creates these, but frontend might log too if needed. Normally server handles this via Service Role, but we can allow insert just in case).
CREATE POLICY "Allow insert access to audit_logs for authenticated users" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

