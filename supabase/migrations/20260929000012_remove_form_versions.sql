-- Migration: 20260929000012_remove_form_versions.sql
-- Purpose:   Flatten form architecture from forms→form_versions→form_fields
--            to forms→form_fields. Preserves historical submission values
--            using immutable snapshots.

BEGIN;

DO $$
DECLARE
  v_count INT;
  v_form_count INT;
  v_version_count INT;
  v_orphan_sv INT;
  v_duplicate_keys INT;
  v_unsnapshotted INT;
  v_null_form_id INT;
  v_func_count INT;
BEGIN

  -- ════════════════════════════════════════════════
  -- PHASE 1: PRE-MIGRATION ASSERTIONS
  -- ════════════════════════════════════════════════
  
  -- Exactly 1 form
  SELECT count(*) INTO v_form_count FROM public.forms;
  IF v_form_count != 1 THEN
    RAISE EXCEPTION 'PRE-MIGRATION FAILED: Expected exactly 1 form, found %', v_form_count;
  END IF;

  -- Exactly 1 form_version
  SELECT count(*) INTO v_version_count FROM public.form_versions;
  IF v_version_count != 1 THEN
    RAISE EXCEPTION 'PRE-MIGRATION FAILED: Expected exactly 1 form_version, found %', v_version_count;
  END IF;

  -- No orphan submission_values (all field_id references valid)
  SELECT count(*) INTO v_orphan_sv
  FROM public.submission_values sv
  LEFT JOIN public.form_fields ff ON sv.field_id = ff.id
  WHERE ff.id IS NULL;
  IF v_orphan_sv > 0 THEN
    RAISE EXCEPTION 'PRE-MIGRATION FAILED: Found % orphan submission_values with invalid field_id', v_orphan_sv;
  END IF;

  -- No duplicate field_keys per form (would block UNIQUE constraint)
  SELECT count(*) INTO v_duplicate_keys FROM (
    SELECT fv.form_id, ff.field_key, count(*) AS cnt
    FROM public.form_fields ff
    JOIN public.form_versions fv ON ff.form_version_id = fv.id
    GROUP BY fv.form_id, ff.field_key
    HAVING count(*) > 1
  ) dupes;
  IF v_duplicate_keys > 0 THEN
    RAISE EXCEPTION 'PRE-MIGRATION FAILED: Found duplicate field_keys for the same form';
  END IF;

END $$;

-- ════════════════════════════════════════════════
-- PHASE 2: ADD HISTORICAL SNAPSHOT COLUMNS TO submission_values
-- ════════════════════════════════════════════════
ALTER TABLE public.submission_values
  ADD COLUMN IF NOT EXISTS field_key VARCHAR(100),
  ADD COLUMN IF NOT EXISTS label VARCHAR(255),
  ADD COLUMN IF NOT EXISTS field_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- ════════════════════════════════════════════════
-- PHASE 3: BACKFILL HISTORICAL SNAPSHOTS
-- ════════════════════════════════════════════════
UPDATE public.submission_values sv
SET 
  field_key = ff.field_key,
  label = ff.label,
  field_type = ff.field_type,
  sort_order = ff.sort_order
FROM public.form_fields ff
WHERE sv.field_id = ff.id
  AND sv.field_key IS NULL;

-- ════════════════════════════════════════════════
-- PHASE 4: VERIFY SNAPSHOT BACKFILL
-- ════════════════════════════════════════════════
DO $$
DECLARE
  v_unsnapshotted INT;
BEGIN
  SELECT count(*) INTO v_unsnapshotted
  FROM public.submission_values
  WHERE field_key IS NULL;

  IF v_unsnapshotted > 0 THEN
    RAISE EXCEPTION 'PHASE 4 FAILED: % submission_values still have NULL field_key after backfill', v_unsnapshotted;
  END IF;
END $$;

-- ════════════════════════════════════════════════
-- PHASE 5: ADD form_id TO form_fields
-- ════════════════════════════════════════════════
ALTER TABLE public.form_fields
  ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE;

-- ════════════════════════════════════════════════
-- PHASE 6: BACKFILL form_id ON form_fields
-- ════════════════════════════════════════════════
UPDATE public.form_fields ff
SET form_id = fv.form_id
FROM public.form_versions fv
WHERE ff.form_version_id = fv.id
  AND ff.form_id IS NULL;

-- ════════════════════════════════════════════════
-- PHASE 7: VERIFY form_id BACKFILL AND SET NOT NULL
-- ════════════════════════════════════════════════
DO $$
DECLARE
  v_null_form_id INT;
BEGIN
  SELECT count(*) INTO v_null_form_id
  FROM public.form_fields
  WHERE form_id IS NULL;

  IF v_null_form_id > 0 THEN
    RAISE EXCEPTION 'PHASE 7 FAILED: % form_fields still have NULL form_id after backfill', v_null_form_id;
  END IF;
END $$;

ALTER TABLE public.form_fields
  ALTER COLUMN form_id SET NOT NULL;

-- ════════════════════════════════════════════════
-- PHASE 8: DECOUPLE submission_values FROM form_fields FK
-- ════════════════════════════════════════════════
ALTER TABLE public.submission_values
  DROP CONSTRAINT IF EXISTS submission_values_field_id_fkey;

ALTER TABLE public.submission_values
  ALTER COLUMN field_id DROP NOT NULL;

-- ════════════════════════════════════════════════
-- PHASE 9: DROP OBSOLETE TRACEABILITY RPCS
-- ════════════════════════════════════════════════
-- Drop without arguments to avoid signature mismatches that cause IF EXISTS to silently fail
DROP FUNCTION IF EXISTS public.persist_traceability_record;
DROP FUNCTION IF EXISTS public.process_atomic_traceability_record;
DROP FUNCTION IF EXISTS public.get_qr_detail;

-- ════════════════════════════════════════════════
-- PHASE 10: REWRITE RLS POLICIES
-- ════════════════════════════════════════════════
-- Remove policies referencing form_versions exactly by name.
DROP POLICY IF EXISTS "Allow read access to form_fields for authenticated users" ON public.form_fields;
DROP POLICY IF EXISTS "Allow read access to form_field_options for authenticated users" ON public.form_field_options;
DROP POLICY IF EXISTS "Allow read access to forms for authenticated users" ON public.forms;

CREATE POLICY "Allow read access to forms for authenticated users" 
  ON public.forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to form_fields for authenticated users" 
  ON public.form_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to form_field_options for authenticated users" 
  ON public.form_field_options FOR SELECT TO authenticated USING (true);

-- ════════════════════════════════════════════════
-- PHASE 11: DROP OBSOLETE COLUMNS (NATIVELY DROPS CONSTRAINTS)
-- ════════════════════════════════════════════════
-- By explicitly dropping the columns, PostgreSQL automatically and cleanly 
-- cascades to drop any associated Foreign Key and Unique constraints, regardless of their names.

ALTER TABLE public.form_fields
  DROP COLUMN IF EXISTS form_version_id;

ALTER TABLE public.form_submissions
  DROP COLUMN IF EXISTS form_version_id;

ALTER TABLE public.qr_records
  DROP COLUMN IF EXISTS form_version_id;

ALTER TABLE public.forms
  DROP COLUMN IF EXISTS current_version_id;
  
ALTER TABLE public.forms
  DROP COLUMN IF EXISTS status;

-- ════════════════════════════════════════════════
-- PHASE 12: RE-ESTABLISH NEW UNIQUE CONSTRAINT FOR FORM FIELDS
-- ════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'form_fields_form_id_field_key_key'
  ) THEN
    ALTER TABLE public.form_fields ADD CONSTRAINT form_fields_form_id_field_key_key UNIQUE (form_id, field_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON public.form_fields(form_id);

-- ════════════════════════════════════════════════
-- PHASE 13: DROP form_versions TABLE
-- ════════════════════════════════════════════════
-- Because all referencing columns, policies, and functions have been dropped, 
-- this drop is deterministic and requires no CASCADE.
DROP TABLE IF EXISTS public.form_versions;

-- ════════════════════════════════════════════════
-- PHASE 14: CREATE FINAL TRACEABILITY RPC
-- ════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.persist_traceability_record(
    p_form_id UUID,
    p_user_id UUID,
    p_sscc_config_id UUID,
    p_extension_digit VARCHAR,
    p_company_prefix VARCHAR,
    p_qr_payload JSONB,
    p_qr_payload_version VARCHAR,
    p_submission_values JSONB -- [{field_key, label, field_type, sort_order, value}]
) RETURNS UUID AS $$
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
    -- A. ATOMICALLY ALLOCATE PRC
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

    -- B. ATOMICALLY ALLOCATE SSCC
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
        IF (17 - i) % 2 = 0 THEN
            v_sscc_weight := 3;
        ELSE
            v_sscc_weight := 1;
        END IF;
        v_sscc_check_sum := v_sscc_check_sum + (v_sscc_digit * v_sscc_weight);
    END LOOP;

    v_sscc_check_digit := (10 - (v_sscc_check_sum % 10)) % 10;
    v_generated_sscc := v_sscc_body || v_sscc_check_digit::TEXT;

    -- C. INJECT PRC + SSCC INTO QR PAYLOAD
    p_qr_payload := jsonb_set(p_qr_payload, '{prc}', to_jsonb(v_generated_prc));
    p_qr_payload := jsonb_set(p_qr_payload, '{sscc}', to_jsonb(v_generated_sscc));

    -- D. PERSIST FORM SUBMISSION (No version references)
    INSERT INTO public.form_submissions (
        form_id, submitted_by, status
    ) VALUES (
        p_form_id, p_user_id, 'completed'
    ) RETURNING id INTO v_submission_id;

    -- E. PERSIST IMMUTABLE SUBMISSION VALUES SNAPSHOT
    FOR v_value_obj IN SELECT * FROM jsonb_array_elements(p_submission_values)
    LOOP
        INSERT INTO public.submission_values (
            submission_id, field_key, label, field_type, sort_order, value
        ) VALUES (
            v_submission_id,
            v_value_obj->>'field_key',
            v_value_obj->>'label',
            v_value_obj->>'field_type',
            (v_value_obj->>'sort_order')::INTEGER,
            v_value_obj->>'value'
        );
    END LOOP;

    -- F. PERSIST PRODUCT REFERENCE
    INSERT INTO public.product_references (
        code, submission_id
    ) VALUES (
        v_generated_prc, v_submission_id
    ) RETURNING id INTO v_prc_id;

    -- G. PERSIST SSCC RECORD
    INSERT INTO public.sscc_records (
        sscc, submission_id, configuration_id
    ) VALUES (
        v_generated_sscc, v_submission_id, p_sscc_config_id
    ) RETURNING id INTO v_sscc_id;

    -- H. PERSIST QR RECORD
    INSERT INTO public.qr_records (
        submission_id,
        product_reference_id,
        sscc_record_id,
        form_id,
        payload,
        payload_version,
        status,
        created_by
    ) VALUES (
        v_submission_id,
        v_prc_id,
        v_sscc_id,
        p_form_id,
        p_qr_payload,
        p_qr_payload_version,
        'GENERATED',
        p_user_id
    ) RETURNING id INTO v_qr_record_id;

    -- I. UPDATE SUBMISSION LINKS
    UPDATE public.form_submissions
    SET product_reference_id = v_prc_id,
        sscc_record_id = v_sscc_id,
        qr_record_id = v_qr_record_id
    WHERE id = v_submission_id;

    -- J. AUDIT TRAIL
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

    RETURN v_qr_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ════════════════════════════════════════════════
-- PHASE 15: CREATE FINAL get_qr_detail RPC
-- ════════════════════════════════════════════════
CREATE FUNCTION public.get_qr_detail(
    p_qr_id UUID,
    p_user_id UUID,
    p_is_admin BOOLEAN
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', q.id,
        'status', q.status,
        'created_at', q.created_at,
        'created_by', q.created_by,
        'payload', q.payload,
        'payload_version', q.payload_version,
        'product_reference_code', p.code,
        'sscc', s.sscc,
        'form', jsonb_build_object(
            'id', f.id,
            'name', f.name
        ),
        'fields', (
            SELECT jsonb_agg(jsonb_build_object(
                'field_key', sv.field_key,
                'label', sv.label,
                'field_type', sv.field_type,
                'sort_order', sv.sort_order,
                'value', sv.value
            ) ORDER BY sv.sort_order ASC)
            FROM public.submission_values sv
            WHERE sv.submission_id = q.submission_id
        )
    ) INTO v_result
    FROM public.qr_records q
    JOIN public.product_references p ON q.product_reference_id = p.id
    JOIN public.sscc_records s ON q.sscc_record_id = s.id
    JOIN public.forms f ON q.form_id = f.id
    WHERE q.id = p_qr_id
      AND (p_is_admin = TRUE OR q.created_by = p_user_id);

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ════════════════════════════════════════════════
-- PHASE 16: UPDATE get_qr_history RPC
-- ════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_qr_history(
    p_search TEXT,
    p_status VARCHAR,
    p_form_id UUID,
    p_created_by UUID,
    p_date_from TIMESTAMPTZ,
    p_date_to TIMESTAMPTZ,
    p_limit INT,
    p_offset INT,
    p_user_id UUID,
    p_is_admin BOOLEAN
) RETURNS TABLE (
    id UUID,
    product_reference_code VARCHAR,
    sscc VARCHAR,
    product_name TEXT,
    batch_no TEXT,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    created_by UUID,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_records AS (
        SELECT 
            q.id,
            q.submission_id,
            q.status,
            q.created_at,
            q.created_by,
            p.code AS product_reference_code,
            s.sscc AS sscc,
            (SELECT sv.value FROM public.submission_values sv WHERE sv.submission_id = q.submission_id AND sv.field_key = 'product_name' LIMIT 1) AS product_name,
            (SELECT sv.value FROM public.submission_values sv WHERE sv.submission_id = q.submission_id AND sv.field_key = 'batch_no' LIMIT 1) AS batch_no
        FROM public.qr_records q
        JOIN public.product_references p ON q.product_reference_id = p.id
        JOIN public.sscc_records s ON q.sscc_record_id = s.id
        WHERE
            (p_is_admin = TRUE OR q.created_by = p_user_id)
            AND (p_status IS NULL OR q.status = p_status)
            AND (p_form_id IS NULL OR q.form_id = p_form_id)
            AND (p_created_by IS NULL OR q.created_by = p_created_by)
            AND (p_date_from IS NULL OR q.created_at >= p_date_from)
            AND (p_date_to IS NULL OR q.created_at <= p_date_to)
            AND (
                p_search IS NULL OR p_search = '' OR
                p.code ILIKE '%' || p_search || '%' OR
                s.sscc ILIKE '%' || p_search || '%' OR
                EXISTS (
                    SELECT 1 FROM public.submission_values sv
                    WHERE sv.submission_id = q.submission_id
                    AND sv.value ILIKE '%' || p_search || '%'
                )
            )
    ),
    counted AS (
        SELECT COUNT(*) AS exact_count FROM filtered_records
    )
    SELECT 
        fr.id,
        fr.product_reference_code,
        fr.sscc,
        fr.product_name,
        fr.batch_no,
        fr.status,
        fr.created_at,
        fr.created_by,
        c.exact_count
    FROM filtered_records fr
    CROSS JOIN counted c
    ORDER BY fr.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ════════════════════════════════════════════════
-- PHASE 17: POST-MIGRATION ASSERTIONS
-- ════════════════════════════════════════════════
DO $$
DECLARE
  v_count INT;
  v_func_count INT;
BEGIN

  -- Exactly 1 form
  SELECT count(*) INTO v_count FROM public.forms;
  IF v_count != 1 THEN
    RAISE EXCEPTION 'POST-MIGRATION FAILED: Expected exactly 1 form, found %', v_count;
  END IF;

  -- form_versions must not exist
  SELECT count(*) INTO v_count FROM pg_tables WHERE tablename = 'form_versions' AND schemaname = 'public';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'POST-MIGRATION FAILED: form_versions table still exists';
  END IF;

  -- forms.current_version_id must be gone
  SELECT count(*) INTO v_count FROM information_schema.columns 
  WHERE table_name = 'forms' AND column_name = 'current_version_id' AND table_schema = 'public';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'POST-MIGRATION FAILED: forms.current_version_id column still exists';
  END IF;
  
  -- form_fields.form_version_id must be gone
  SELECT count(*) INTO v_count FROM information_schema.columns 
  WHERE table_name = 'form_fields' AND column_name = 'form_version_id' AND table_schema = 'public';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'POST-MIGRATION FAILED: form_fields.form_version_id column still exists';
  END IF;

  -- Verify data counts
  SELECT count(*) INTO v_count FROM public.qr_records;
  IF v_count != 4 THEN RAISE EXCEPTION 'POST-MIGRATION FAILED: Expected 4 qr_records, found %', v_count; END IF;

  SELECT count(*) INTO v_count FROM public.form_submissions;
  IF v_count != 4 THEN RAISE EXCEPTION 'POST-MIGRATION FAILED: Expected 4 form_submissions, found %', v_count; END IF;

  SELECT count(*) INTO v_count FROM public.form_fields;
  IF v_count != 16 THEN RAISE EXCEPTION 'POST-MIGRATION FAILED: Expected 16 form_fields, found %', v_count; END IF;

  SELECT count(*) INTO v_count FROM public.submission_values;
  IF v_count != 56 THEN RAISE EXCEPTION 'POST-MIGRATION FAILED: Expected 56 submission_values, found %', v_count; END IF;

  SELECT count(*) INTO v_count FROM public.audit_logs;
  IF v_count != 10 THEN RAISE EXCEPTION 'POST-MIGRATION FAILED: Expected 10 audit_logs, found %', v_count; END IF;

  -- Ensure snapshot integrity
  SELECT count(*) INTO v_count FROM public.submission_values WHERE field_key IS NULL OR label IS NULL OR field_type IS NULL OR sort_order IS NULL OR value IS NULL;
  IF v_count > 0 THEN RAISE EXCEPTION 'POST-MIGRATION FAILED: Found % submission_values with NULL snapshot fields', v_count; END IF;

  -- Verify exact final function signatures using regprocedure casting
  -- get_qr_detail exists with correct signature
  PERFORM 'public.get_qr_detail(uuid, uuid, boolean)'::regprocedure;

  -- persist_traceability_record exists with correct signature
  PERFORM 'public.persist_traceability_record(uuid, uuid, uuid, varchar, varchar, jsonb, varchar, jsonb)'::regprocedure;
  
  -- get_qr_history exists with correct signature
  PERFORM 'public.get_qr_history(text, varchar, uuid, uuid, timestamptz, timestamptz, integer, integer, uuid, boolean)'::regprocedure;

  -- process_atomic_traceability_record must not exist
  SELECT count(*) INTO v_func_count FROM pg_proc WHERE proname = 'process_atomic_traceability_record';
  IF v_func_count > 0 THEN
    RAISE EXCEPTION 'POST-MIGRATION FAILED: stale process_atomic_traceability_record function still exists';
  END IF;

END $$;

COMMIT;
