-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES
CREATE TABLE public.roles (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT
);

-- PERMISSIONS
CREATE TABLE public.permissions (
    id VARCHAR(100) PRIMARY KEY,
    description TEXT
);


-- ROLE_PERMISSIONS
CREATE TABLE public.role_permissions (
    role_id VARCHAR(50) REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- USERS
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role_id VARCHAR(50) REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SYSTEM_SETTINGS
CREATE TABLE public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.users(id)
);

-- SSCC_CONFIGURATIONS
CREATE TABLE public.sscc_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gs1_company_prefix VARCHAR(50) NOT NULL,
    extension_digit VARCHAR(1) NOT NULL DEFAULT '0',
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.users(id)
);
-- Ensure only one active config
CREATE UNIQUE INDEX idx_sscc_config_active ON public.sscc_configurations (is_active) WHERE is_active = true;

-- SSCC_SEQUENCES
CREATE TABLE public.sscc_sequences (
    configuration_id UUID PRIMARY KEY REFERENCES public.sscc_configurations(id) ON DELETE CASCADE,
    current_value BIGINT NOT NULL DEFAULT 0,
    max_value BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FORMS
CREATE TABLE public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.users(id)
);

-- FORM_VERSIONS
CREATE TABLE public.form_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(form_id, version_number)
);

-- Add current_version_id to forms
ALTER TABLE public.forms ADD COLUMN current_version_id UUID REFERENCES public.form_versions(id) ON DELETE SET NULL;

-- FORM_FIELDS
CREATE TABLE public.form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_version_id UUID NOT NULL REFERENCES public.form_versions(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL,
    include_in_qr BOOLEAN NOT NULL DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    UNIQUE(form_version_id, field_key)
);

-- FORM_FIELD_OPTIONS
CREATE TABLE public.form_field_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES public.form_fields(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL,
    UNIQUE(field_id, value)
);

-- SUBMISSIONS (we need to resolve circular deps, SSCC and QR references)
CREATE TABLE public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE RESTRICT,
    form_version_id UUID NOT NULL REFERENCES public.form_versions(id) ON DELETE RESTRICT,
    submitted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'voided'))
);

-- SUBMISSION_VALUES
CREATE TABLE public.submission_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE RESTRICT,
    field_id UUID NOT NULL REFERENCES public.form_fields(id) ON DELETE RESTRICT,
    value TEXT,
    UNIQUE(submission_id, field_id)
);

-- PRODUCT_REFERENCES
CREATE TABLE public.product_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SSCC_RECORDS
CREATE TABLE public.sscc_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sscc VARCHAR(18) NOT NULL UNIQUE,
    submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE RESTRICT,
    configuration_id UUID REFERENCES public.sscc_configurations(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QR_RECORDS
CREATE TABLE public.qr_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE RESTRICT,
    product_reference_id UUID NOT NULL REFERENCES public.product_references(id) ON DELETE RESTRICT,
    sscc_record_id UUID NOT NULL REFERENCES public.sscc_records(id) ON DELETE RESTRICT,
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE RESTRICT,
    form_version_id UUID NOT NULL REFERENCES public.form_versions(id) ON DELETE RESTRICT,
    payload JSONB NOT NULL,
    payload_version VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'VOID', 'CANCELLED')),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update form_submissions to reference the newly created related records
ALTER TABLE public.form_submissions ADD COLUMN product_reference_id UUID REFERENCES public.product_references(id) ON DELETE RESTRICT;
ALTER TABLE public.form_submissions ADD COLUMN sscc_record_id UUID REFERENCES public.sscc_records(id) ON DELETE RESTRICT;
ALTER TABLE public.form_submissions ADD COLUMN qr_record_id UUID REFERENCES public.qr_records(id) ON DELETE RESTRICT;

-- AUDIT_LOGS
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sscc_sequences_updated_at BEFORE UPDATE ON public.sscc_sequences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- INDEXES
CREATE INDEX idx_users_role_id ON public.users(role_id);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_forms_status ON public.forms(status);
CREATE INDEX idx_form_versions_form_id ON public.form_versions(form_id);
CREATE INDEX idx_form_submissions_submitted_by ON public.form_submissions(submitted_by);
CREATE INDEX idx_form_submissions_form_version ON public.form_submissions(form_id, form_version_id);
CREATE INDEX idx_product_references_code ON public.product_references(code);
CREATE INDEX idx_sscc_records_sscc ON public.sscc_records(sscc);
CREATE INDEX idx_qr_records_product_ref ON public.qr_records(product_reference_id);
CREATE INDEX idx_qr_records_sscc ON public.qr_records(sscc_record_id);
CREATE INDEX idx_qr_records_created_at ON public.qr_records(created_at);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
