-- Seed default PharmaTrace form

DO $$
DECLARE
    admin_user_id UUID;
    v_form_id UUID;
    version_id UUID;
BEGIN
    -- Find an admin user to assign as creator
    SELECT id INTO admin_user_id FROM public.users WHERE role_id = 'ADMIN' LIMIT 1;

    IF admin_user_id IS NULL THEN
        -- Fallback if no admin exists yet
        SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    END IF;

    -- Create Form
    INSERT INTO public.forms (id, name, description, status, created_by)
    VALUES (
        '11111111-1111-1111-1111-111111111111',
        'PharmaTrace Standard Form',
        'Default pharmaceutical product and API traceability form.',
        'published',
        admin_user_id
    ) ON CONFLICT (name) DO NOTHING;
    
    SELECT id INTO v_form_id FROM public.forms WHERE name = 'PharmaTrace Standard Form';

    IF v_form_id IS NOT NULL THEN
        -- Create Version 1
        INSERT INTO public.form_versions (id, form_id, version_number, is_published, published_at, published_by)
        VALUES (
            '22222222-2222-2222-2222-222222222222',
            v_form_id,
            1,
            true,
            now(),
            admin_user_id
        ) ON CONFLICT (form_id, version_number) DO NOTHING;

        SELECT id INTO version_id FROM public.form_versions WHERE public.form_versions.form_id = v_form_id AND version_number = 1;

        -- Update form's current version
        UPDATE public.forms SET current_version_id = version_id WHERE id = v_form_id;

        -- Insert Fields (if not exist)
        IF NOT EXISTS (SELECT 1 FROM public.form_fields WHERE form_version_id = version_id) THEN
            INSERT INTO public.form_fields (form_version_id, field_key, label, field_type, is_required, sort_order, include_in_qr) VALUES
            (version_id, 'product_name', 'Product Name', 'short_text', true, 1, true),
            (version_id, 'batch_no', 'Batch No.', 'short_text', true, 2, true),
            (version_id, 'license_no', 'License No.', 'short_text', true, 3, true),
            (version_id, 'cas_no', 'CAS No.', 'short_text', true, 4, true),
            (version_id, 'mfg_date', 'Mfg. Date', 'date', true, 5, true),
            (version_id, 'retest_expiry_date', 'Re-test/Expiry Date', 'date', true, 6, true),
            (version_id, 'container_no', 'Container No.', 'short_text', true, 7, true),
            (version_id, 'country_of_origin', 'Country of Origin', 'short_text', true, 8, true),
            (version_id, 'storage', 'Storage', 'short_text', true, 9, true),
            (version_id, 'manufactured_by', 'Manufactured By', 'short_text', true, 10, true),
            (version_id, 'manufacturer_address', 'Manufacturer Address', 'long_text', true, 11, true),
            (version_id, 'gross_weight', 'Gross Weight', 'decimal', true, 12, true),
            (version_id, 'tare_weight', 'Tare Weight', 'decimal', true, 13, true),
            (version_id, 'net_weight', 'Net Weight', 'decimal', true, 14, true),
            (version_id, 'prc', 'Product Reference Code', 'system_generated', true, 15, true),
            (version_id, 'sscc', 'SSCC', 'system_generated', true, 16, true);
        END IF;
    END IF;
END $$;
