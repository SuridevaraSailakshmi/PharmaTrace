-- Migration 20260929000010_audit_remediation.sql
-- Remediates:
-- 1. Idempotency Table & Storage
-- 2. Single-Step Atomic Traceability RPC (Persisting PRC, SSCC, Submissions, QR Records, Audit within single DB transaction)
-- 3. Restricting direct RLS insert access to audit_logs for WORKER role

-- ──────────────────────────────────────────────
-- 1. Traceability Idempotency Table
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.traceability_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(128) NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id),
    request_hash VARCHAR(64) NOT NULL,
    resulting_qr_record_id UUID REFERENCES public.qr_records(id),
    resulting_submission_id UUID REFERENCES public.form_submissions(id),
    response_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_idempotency_key UNIQUE (user_id, idempotency_key)
);

ALTER TABLE public.traceability_idempotency ENABLE ROW LEVEL SECURITY;

-- Idempotency records read/write by user
CREATE POLICY "Users can read own idempotency keys" 
ON public.traceability_idempotency FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own idempotency keys" 
ON public.traceability_idempotency FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());


-- ──────────────────────────────────────────────
-- 2. Restrict Direct Audit Log Access
-- ──────────────────────────────────────────────
-- Drop old permissive insert policy
DROP POLICY IF EXISTS "Allow insert access to audit_logs for authenticated users" ON public.audit_logs;

-- Controlled insert policy: Allow insert ONLY via Security Definer RPCs or ADMIN
CREATE POLICY "Allow insert to audit_logs for ADMIN" 
ON public.audit_logs FOR INSERT TO authenticated 
WITH CHECK (public.user_role() = 'ADMIN');


-- ──────────────────────────────────────────────
-- 3. Atomic Single-Step Traceability Transaction RPC
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_atomic_traceability_record(
    p_form_id UUID,
    p_form_version_id UUID,
    p_user_id UUID,
    p_sscc_config_id UUID,
    p_extension_digit VARCHAR,
    p_company_prefix VARCHAR,
    p_qr_payload JSONB,
    p_qr_payload_version VARCHAR,
    p_submission_values JSONB -- Array of objects: [{"field_id": "uuid", "value": "text"}]
) RETURNS TABLE (
    qr_record_id UUID,
    submission_id UUID,
    prc VARCHAR,
    sscc VARCHAR
) AS $$
DECLARE
    v_year INTEGER;
    v_prc_val INTEGER;
    v_generated_prc VARCHAR;
    v_sscc_seq BIGINT;
    v_sscc_body VARCHAR;
    v_sscc_check_sum INTEGER := 0;
    v_sscc_check_digit INTEGER;
    v_sscc_digit INTEGER;
    v_sscc_weight INTEGER;
    v_sscc_serial_len INTEGER;
    v_sscc_serial_str VARCHAR;
    v_generated_sscc VARCHAR;
    
    v_submission_id UUID;
    v_prc_id UUID;
    v_sscc_id UUID;
    v_qr_record_id UUID;
    v_value_obj JSONB;
    i INTEGER;
BEGIN
    -- A. Atomically allocate PRC (atomic row lock / upsert)
    v_year := extract(year from now());
    
    INSERT INTO public.prc_sequences (year, last_value)
    VALUES (v_year, 1)
    ON CONFLICT (year) DO UPDATE 
    SET last_value = public.prc_sequences.last_value + 1
    RETURNING last_value INTO v_prc_val;
    
    IF v_prc_val > 999999 THEN
        RAISE EXCEPTION 'PRC_SEQUENCE_EXHAUSTED: Annual PRC sequence exhausted for year %', v_year;
    END IF;
    
    v_generated_prc := 'PRC-' || v_year || '-' || LPAD(v_prc_val::TEXT, 6, '0');

    -- B. Atomically allocate SSCC (atomic row update)
    UPDATE public.sscc_sequences 
    SET current_value = current_value + 1
    WHERE configuration_id = p_sscc_config_id
    RETURNING current_value INTO v_sscc_seq;

    IF v_sscc_seq IS NULL THEN
        RAISE EXCEPTION 'SSCC_SEQUENCE_NOT_FOUND: Sequence not initialized for configuration %', p_sscc_config_id;
    END IF;

    -- Construct 18-digit SSCC
    v_sscc_serial_len := 16 - length(p_company_prefix);
    v_sscc_serial_str := LPAD(v_sscc_seq::TEXT, v_sscc_serial_len, '0');
    v_sscc_body := p_extension_digit || p_company_prefix || v_sscc_serial_str;
    
    IF length(v_sscc_body) != 17 THEN
        RAISE EXCEPTION 'SSCC_BUILD_ERROR: SSCC body must be exactly 17 digits';
    END IF;

    -- Compute GS1 modulo 10 check digit
    FOR i IN 1..17 LOOP
        v_sscc_digit := substring(v_sscc_body from i for 1)::INTEGER;
        -- Right-to-left weights: index 17 gets weight 3, 16 gets 1...
        IF (17 - i) % 2 = 0 THEN
            v_sscc_weight := 3;
        ELSE
            v_sscc_weight := 1;
        END IF;
        v_sscc_check_sum := v_sscc_check_sum + (v_sscc_digit * v_sscc_weight);
    END LOOP;

    v_sscc_check_digit := (10 - (v_sscc_check_sum % 10)) % 10;
    v_generated_sscc := v_sscc_body || v_sscc_check_digit::TEXT;

    -- Replace PRC and SSCC placeholders inside JSONB QR payload
    p_qr_payload := jsonb_set(p_qr_payload, '{prc}', to_jsonb(v_generated_prc));
    p_qr_payload := jsonb_set(p_qr_payload, '{sscc}', to_jsonb(v_generated_sscc));

    -- C. Persist Form Submission
    INSERT INTO public.form_submissions (
        form_id, form_version_id, submitted_by, status
    ) VALUES (
        p_form_id, p_form_version_id, p_user_id, 'completed'
    ) RETURNING id INTO v_submission_id;

    -- D. Persist Submission Values
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

    -- E. Persist Product Reference
    INSERT INTO public.product_references (
        code, submission_id
    ) VALUES (
        v_generated_prc, v_submission_id
    ) RETURNING id INTO v_prc_id;

    -- F. Persist SSCC Record
    INSERT INTO public.sscc_records (
        sscc, submission_id, configuration_id
    ) VALUES (
        v_generated_sscc, v_submission_id, p_sscc_config_id
    ) RETURNING id INTO v_sscc_id;

    -- G. Persist QR Record
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

    -- Update form_submissions links
    UPDATE public.form_submissions
    SET product_reference_id = v_prc_id,
        sscc_record_id = v_sscc_id,
        qr_record_id = v_qr_record_id
    WHERE id = v_submission_id;

    -- H. Persist Audit Log
    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id, details
    ) VALUES (
        p_user_id,
        'QR_GENERATED',
        'qr_records',
        v_qr_record_id::VARCHAR,
        jsonb_build_object(
            'submission_id', v_submission_id,
            'prc', v_generated_prc,
            'sscc', v_generated_sscc
        )
    );

    RETURN QUERY SELECT v_qr_record_id, v_submission_id, v_generated_prc, v_generated_sscc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
