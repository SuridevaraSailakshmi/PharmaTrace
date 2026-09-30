-- Migration: Admin System Config RPCs

CREATE OR REPLACE FUNCTION set_active_sscc_config(
    p_company_prefix VARCHAR,
    p_extension_digit VARCHAR,
    p_admin_id UUID
) RETURNS UUID AS $$
DECLARE
    v_new_id UUID;
BEGIN
    -- Deactivate current active configurations
    UPDATE public.sscc_configurations SET is_active = false WHERE is_active = true;

    -- Insert new active configuration
    INSERT INTO public.sscc_configurations (
        gs1_company_prefix, extension_digit, is_active, created_by
    ) VALUES (
        p_company_prefix, p_extension_digit, true, p_admin_id
    ) RETURNING id INTO v_new_id;

    -- Create corresponding sequence record
    INSERT INTO public.sscc_sequences (
        configuration_id, current_value, max_value
    ) VALUES (
        v_new_id, 0, 999999999
    );

    -- Audit
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
        p_admin_id,
        'SSCC_CONFIG_UPDATED',
        'sscc_configurations',
        v_new_id::VARCHAR,
        jsonb_build_object(
            'company_prefix', p_company_prefix,
            'extension_digit', p_extension_digit
        )
    );

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_system_settings()
RETURNS TABLE (
    key VARCHAR,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY SELECT s.key, s.value, s.description, s.updated_at FROM system_settings s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION update_system_setting(
    p_key VARCHAR,
    p_value JSONB,
    p_admin_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE system_settings
    SET value = p_value,
        updated_by = p_admin_id
    WHERE key = p_key;

    IF NOT FOUND THEN
        INSERT INTO system_settings (key, value, updated_by)
        VALUES (p_key, p_value, p_admin_id);
    END IF;

    -- Audit
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
        p_admin_id,
        'SETTING_UPDATED',
        'system_settings',
        p_key,
        jsonb_build_object('new_value', p_value)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
