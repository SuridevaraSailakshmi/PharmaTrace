-- Migration: create QR History RPCs

-- 1. History List RPC
CREATE OR REPLACE FUNCTION get_qr_history(
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
            (SELECT sv.value FROM submission_values sv JOIN form_fields ff ON sv.field_id = ff.id WHERE sv.submission_id = q.submission_id AND ff.field_key = 'product_name' LIMIT 1) AS product_name,
            (SELECT sv.value FROM submission_values sv JOIN form_fields ff ON sv.field_id = ff.id WHERE sv.submission_id = q.submission_id AND ff.field_key = 'batch_no' LIMIT 1) AS batch_no
        FROM qr_records q
        JOIN product_references p ON q.product_reference_id = p.id
        JOIN sscc_records s ON q.sscc_record_id = s.id
        WHERE
            -- Role filter
            (p_is_admin = TRUE OR q.created_by = p_user_id)
            -- Filters
            AND (p_status IS NULL OR q.status = p_status)
            AND (p_form_id IS NULL OR q.form_id = p_form_id)
            AND (p_created_by IS NULL OR q.created_by = p_created_by)
            AND (p_date_from IS NULL OR q.created_at >= p_date_from)
            AND (p_date_to IS NULL OR q.created_at <= p_date_to)
            -- Search
            AND (
                p_search IS NULL OR p_search = '' OR
                p.code ILIKE '%' || p_search || '%' OR
                s.sscc ILIKE '%' || p_search || '%' OR
                EXISTS (
                    SELECT 1 FROM submission_values sv
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Detail RPC
-- Since detail requires dynamic fields, we can just fetch the core record in one query, 
-- and fetch the fields in another, or return JSON. Let's return JSON for the fields.
CREATE OR REPLACE FUNCTION get_qr_detail(
    p_qr_id UUID,
    p_user_id UUID,
    p_is_admin BOOLEAN
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'id', q.id,
        'status', q.status,
        'created_at', q.created_at,
        'created_by', q.created_by,
        'payload', q.payload,
        'payload_version', q.payload_version,
        'product_reference_code', p.code,
        'sscc', s.sscc,
        'form', json_build_object(
            'id', f.id,
            'name', f.name
        ),
        'form_version', json_build_object(
            'id', fv.id,
            'version_number', fv.version_number
        ),
        'fields', (
            SELECT json_agg(json_build_object(
                'field_key', ff.field_key,
                'label', ff.label,
                'field_type', ff.field_type,
                'sort_order', ff.sort_order,
                'value', sv.value
            ) ORDER BY ff.sort_order ASC)
            FROM form_fields ff
            LEFT JOIN submission_values sv ON sv.field_id = ff.id AND sv.submission_id = q.submission_id
            WHERE ff.form_version_id = q.form_version_id
        )
    ) INTO v_result
    FROM qr_records q
    JOIN product_references p ON q.product_reference_id = p.id
    JOIN sscc_records s ON q.sscc_record_id = s.id
    JOIN forms f ON q.form_id = f.id
    JOIN form_versions fv ON q.form_version_id = fv.id
    WHERE q.id = p_qr_id
      AND (p_is_admin = TRUE OR q.created_by = p_user_id);

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
