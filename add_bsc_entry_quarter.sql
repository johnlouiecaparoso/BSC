-- =====================================================
-- Migration: add quarter to bsc_entries
-- =====================================================

ALTER TABLE bsc_entries
ADD COLUMN IF NOT EXISTS quarter TEXT;

UPDATE bsc_entries
SET quarter = 'q1'
WHERE quarter IS NULL OR quarter = '';

ALTER TABLE bsc_entries
ALTER COLUMN quarter SET DEFAULT 'q1';

ALTER TABLE bsc_entries
ALTER COLUMN quarter SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bsc_entries_quarter_check'
  ) THEN
    ALTER TABLE bsc_entries
    ADD CONSTRAINT bsc_entries_quarter_check
    CHECK (quarter IN ('q1', 'q2', 'q3', 'q4'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bsc_entries_quarter ON bsc_entries(quarter);
