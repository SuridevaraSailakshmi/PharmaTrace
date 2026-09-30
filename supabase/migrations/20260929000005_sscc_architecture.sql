-- Add environment column to distinguish dev/prod SSCC configurations
ALTER TABLE public.sscc_configurations 
ADD COLUMN environment VARCHAR(20) NOT NULL DEFAULT 'development' 
CHECK (environment IN ('development', 'production'));

-- Function to atomically increment the sequence for a specific configuration
CREATE OR REPLACE FUNCTION increment_sscc_sequence(conf_id UUID)
RETURNS BIGINT AS $$
DECLARE
    next_val BIGINT;
    maximum BIGINT;
BEGIN
    UPDATE public.sscc_sequences 
    SET current_value = current_value + 1
    WHERE configuration_id = conf_id
    RETURNING current_value, max_value INTO next_val, maximum;

    IF next_val IS NULL THEN
        RAISE EXCEPTION 'SSCC_SEQUENCE_NOT_FOUND: Sequence not initialized for configuration %', conf_id;
    END IF;

    IF next_val > maximum THEN
        RAISE EXCEPTION 'SSCC_SEQUENCE_EXHAUSTED: SSCC sequence exhausted for configuration %', conf_id;
    END IF;

    RETURN next_val;
END;
$$ LANGUAGE plpgsql;
