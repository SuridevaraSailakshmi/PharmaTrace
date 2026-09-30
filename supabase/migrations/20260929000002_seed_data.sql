-- ──────────────────────────────────────────────
-- SEED DATA
-- ──────────────────────────────────────────────

-- ROLES
INSERT INTO public.roles (id, description) VALUES
('ADMIN', 'Administrator with full system access'),
('WORKER', 'Standard operational worker')
ON CONFLICT (id) DO NOTHING;

-- USERS (To be created via script or API)

-- PERMISSIONS
INSERT INTO public.permissions (id, description) VALUES
('users.view', 'View user directory'),
('users.create', 'Create new users'),
('users.edit', 'Edit existing users'),
('users.disable', 'Disable users'),
('forms.view', 'View forms'),
('forms.create', 'Create new forms'),
('forms.edit', 'Edit forms'),
('forms.publish', 'Publish forms'),
('forms.version', 'Version forms'),
('qr.view', 'View QR records'),
('qr.create', 'Create QR records'),
('qr.download', 'Download QR records'),
('qr.print', 'Print QR records'),
('qr.void', 'Void QR records'),
('sscc.view', 'View SSCC configurations and sequences'),
('sscc.configure', 'Configure SSCC settings'),
('audit.view', 'View audit logs'),
('settings.view', 'View system settings'),
('settings.edit', 'Edit system settings')
ON CONFLICT (id) DO NOTHING;

-- ROLE PERMISSIONS MAP
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
-- ADMIN
('ADMIN', 'users.view'),
('ADMIN', 'users.create'),
('ADMIN', 'users.edit'),
('ADMIN', 'users.disable'),
('ADMIN', 'forms.view'),
('ADMIN', 'forms.create'),
('ADMIN', 'forms.edit'),
('ADMIN', 'forms.publish'),
('ADMIN', 'forms.version'),
('ADMIN', 'qr.view'),
('ADMIN', 'qr.create'),
('ADMIN', 'qr.download'),
('ADMIN', 'qr.print'),
('ADMIN', 'qr.void'),
('ADMIN', 'sscc.view'),
('ADMIN', 'sscc.configure'),
('ADMIN', 'audit.view'),
('ADMIN', 'settings.view'),
('ADMIN', 'settings.edit'),

-- WORKER
('WORKER', 'forms.view'),
('WORKER', 'qr.view'),
('WORKER', 'qr.create'),
('WORKER', 'qr.download'),
('WORKER', 'qr.print'),
('WORKER', 'sscc.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- NOTE: We do NOT seed a fake GS1 Company Prefix in sscc_configurations.
-- The system will start in development mode until an Admin configures it.
