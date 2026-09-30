-- Migration: create persist_traceability_record RPC
CREATE OR REPLACE FUNCTION persist_traceability_record(
    p_form_id UUID,
    p_form_version_id UUID,
    p_user_id UUID,
    p_prc VARCHAR,
    p_sscc VARCHAR,
    p_sscc_config_id UUID,
    p_qr_payload JSONB,
    p_qr_payload_version VARCHAR,
    p_submission_values JSONB -- Array of objects: [{"field_id": "uuid", "value": "text"}]
) RETURNS UUID AS $$
DECLARE
    v_submission_id UUID;
    v_prc_id UUID;
    v_sscc_id UUID;
    v_qr_record_id UUID;
    v_value_obj JSONB;
BEGIN
    -- 1. Create form submission
    INSERT INTO public.form_submissions (
        form_id, form_version_id, submitted_by, status
    ) VALUES (
        p_form_id, p_form_version_id, p_user_id, 'completed'
    ) RETURNING id INTO v_submission_id;

    -- 2. Insert submission values
    FOR v_value_obj IN SELECT * FROM jsonb_array_elements(p_submission_values)
    LOOP
        INSERT INTO public.submission_values (
            submission_id, field_id, value
        ) VALUES (
            v_submission_id,
            (v_value_obj->>'field_id')::UUID,
            v_value_obj->>'value'
        );
    END LOOP;

    -- 3. Persist Product Reference
    INSERT INTO public.product_references (
        code, submission_id
    ) VALUES (
        p_prc, v_submission_id
    ) RETURNING id INTO v_prc_id;

    -- 4. Persist SSCC Record
    INSERT INTO public.sscc_records (
        sscc, submission_id, configuration_id
    ) VALUES (
        p_sscc, v_submission_id, p_sscc_config_id
    ) RETURNING id INTO v_sscc_id;

    -- 5. Persist QR Record
    INSERT INTO public.qr_records (
        submission_id,
        product_reference_id,
        sscc_record_id,
        form_id,
        form_version_id,
        payload,
        payload_version,
        status,
        created_by
    ) VALUES (
        v_submission_id,
        v_prc_id,
        v_sscc_id,
        p_form_id,
        p_form_version_id,
        p_qr_payload,
        p_qr_payload_version,
        'GENERATED',
        p_user_id
    ) RETURNING id INTO v_qr_record_id;

    -- Update form_submissions to reference the created identifiers
    UPDATE public.form_submissions
    SET product_reference_id = v_prc_id,
        sscc_record_id = v_sscc_id,
        qr_record_id = v_qr_record_id
    WHERE id = v_submission_id;

    -- 6. Audit log
    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id, details
    ) VALUES (
        p_user_id,
        'QR_GENERATED',
        'qr_records',
        v_qr_record_id::VARCHAR,
        jsonb_build_object(
            'submission_id', v_submission_id,
            'prc', p_prc,
            'sscc', p_sscc
        )
    );

    RETURN v_qr_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
