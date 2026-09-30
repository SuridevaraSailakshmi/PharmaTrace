-- Migration: Admin User Management RPCs

-- 1. Get Users
CREATE OR REPLACE FUNCTION get_admin_users(
    p_search TEXT,
    p_role VARCHAR,
    p_is_active BOOLEAN,
    p_limit INT,
    p_offset INT
) RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name VARCHAR,
    role_id VARCHAR,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_users AS (
        SELECT u.id, u.email, u.full_name, u.role_id, u.is_active, u.created_at
        FROM users u
        WHERE 
            (p_role IS NULL OR u.role_id = p_role)
            AND (p_is_active IS NULL OR u.is_active = p_is_active)
            AND (
                p_search IS NULL OR p_search = '' OR
                u.email ILIKE '%' || p_search || '%' OR
                u.full_name ILIKE '%' || p_search || '%'
            )
    ),
    counted AS (
        SELECT COUNT(*) AS exact_count FROM filtered_users
    )
    SELECT 
        fu.id,
        fu.email,
        fu.full_name,
        fu.role_id,
        fu.is_active,
        fu.created_at,
        c.exact_count
    FROM filtered_users fu
    CROSS JOIN counted c
    ORDER BY fu.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update User (with Last Admin Protection)
CREATE OR REPLACE FUNCTION admin_update_user(
    p_target_user_id UUID,
    p_new_role_id VARCHAR,
    p_is_active BOOLEAN,
    p_admin_id UUID
) RETURNS VOID AS $$
DECLARE
    v_current_role VARCHAR;
    v_current_active BOOLEAN;
    v_active_admin_count INT;
BEGIN
    -- Get current state
    SELECT role_id, is_active INTO v_current_role, v_current_active
    FROM users WHERE id = p_target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- If trying to change an active admin to something else (worker or inactive)
    IF v_current_role = 'ADMIN' AND v_current_active = TRUE THEN
        IF p_new_role_id != 'ADMIN' OR p_is_active = FALSE THEN
            -- Check how many active admins will remain
            SELECT COUNT(*) INTO v_active_admin_count
            FROM users
            WHERE role_id = 'ADMIN' AND is_active = TRUE AND id != p_target_user_id;

            IF v_active_admin_count = 0 THEN
                RAISE EXCEPTION 'Cannot demote or deactivate the last active ADMIN';
            END IF;
        END IF;
    END IF;

    -- Perform update
    UPDATE users
    SET role_id = p_new_role_id,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_target_user_id;

    -- Audit
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
        p_admin_id,
        'USER_UPDATED',
        'users',
        p_target_user_id::VARCHAR,
        jsonb_build_object(
            'old_role', v_current_role,
            'new_role', p_new_role_id,
            'old_active', v_current_active,
            'new_active', p_is_active
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
