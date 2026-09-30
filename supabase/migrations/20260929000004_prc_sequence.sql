-- PRC_SEQUENCES table
CREATE TABLE public.prc_sequences (
    year INTEGER PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_prc_sequences_updated_at 
BEFORE UPDATE ON public.prc_sequences 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS (Service role only access expected)
ALTER TABLE public.prc_sequences ENABLE ROW LEVEL SECURITY;

-- RPC for atomic PRC generation
CREATE OR REPLACE FUNCTION generate_next_prc()
RETURNS VARCHAR AS $$
DECLARE
    current_year INTEGER;
    next_val INTEGER;
    prc_code VARCHAR;
BEGIN
    current_year := extract(year from now());
    
    INSERT INTO public.prc_sequences (year, last_value)
    VALUES (current_year, 1)
    ON CONFLICT (year) DO UPDATE 
    SET last_value = public.prc_sequences.last_value + 1
    RETURNING last_value INTO next_val;
    
    IF next_val > 999999 THEN
        RAISE EXCEPTION 'PRC_SEQUENCE_EXHAUSTED: Annual PRC sequence exhausted for year %', current_year;
    END IF;
    
    prc_code := 'PRC-' || current_year || '-' || LPAD(next_val::TEXT, 6, '0');
    
    RETURN prc_code;
END;
$$ LANGUAGE plpgsql;
