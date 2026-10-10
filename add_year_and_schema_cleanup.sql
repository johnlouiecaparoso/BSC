-- =====================================================
-- Migration: multi-year support + schema cleanup
-- =====================================================
-- Apply AFTER supabase_complete_setup.sql, supabase_rls_fix.sql,
-- add_bsc_entry_quarter.sql, add_office_delete_policy.sql and
-- add_quarterly_delete_policy.sql.
--
-- This script is IDEMPOTENT — safe to run multiple times.
--
-- What it does:
--   1. Adds `year` to quarterly_records so the system can hold more than
--      one reporting year. Previously UNIQUE(bsc_entry_id, quarter) meant
--      Q1-2027 would overwrite Q1-2026.
--   2. Renames bsc_entries.target_2026 -> target_value (the year no longer
--      belongs in a column name).
--   3. Drops bsc_entries.quarter — it was never written by the app and
--      never read; every row held the 'q1' default. A KPI is defined for
--      the year and reported every quarter via quarterly_records.
--   4. Removes the notifications INSERT policy that allowed any
--      authenticated user to write a notification for any other user.
-- =====================================================

-- =========================
-- 1. QUARTERLY RECORDS: add year
-- =========================

ALTER TABLE quarterly_records
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Backfill: everything recorded so far belongs to the 2026 cycle.
UPDATE quarterly_records
SET year = 2026
WHERE year IS NULL;

ALTER TABLE quarterly_records
ALTER COLUMN year SET DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER;

ALTER TABLE quarterly_records
ALTER COLUMN year SET NOT NULL;

-- Guard against typos / bad client data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quarterly_records_year_check'
  ) THEN
    ALTER TABLE quarterly_records
    ADD CONSTRAINT quarterly_records_year_check
    CHECK (year BETWEEN 2000 AND 2100);
  END IF;
END $$;

-- Replace UNIQUE(bsc_entry_id, quarter) with UNIQUE(bsc_entry_id, year, quarter).
-- The old constraint is what capped the system at a single year.
DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'quarterly_records'
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname::TEXT ORDER BY a.attname)
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      ) = ARRAY['bsc_entry_id', 'quarter']
  LOOP
    EXECUTE format('ALTER TABLE quarterly_records DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quarterly_records_entry_year_quarter_key'
  ) THEN
    ALTER TABLE quarterly_records
    ADD CONSTRAINT quarterly_records_entry_year_quarter_key
    UNIQUE (bsc_entry_id, year, quarter);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quarterly_records_year ON quarterly_records(year);
CREATE INDEX IF NOT EXISTS idx_quarterly_records_year_quarter ON quarterly_records(year, quarter);

-- =========================
-- 2. BSC ENTRIES: target_2026 -> target_value
-- =========================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bsc_entries'
      AND column_name = 'target_2026'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bsc_entries'
      AND column_name = 'target_value'
  ) THEN
    ALTER TABLE bsc_entries RENAME COLUMN target_2026 TO target_value;
  END IF;
END $$;

-- The year a KPI definition belongs to, so entries can roll over too.
ALTER TABLE bsc_entries
ADD COLUMN IF NOT EXISTS target_year INTEGER;

UPDATE bsc_entries
SET target_year = 2026
WHERE target_year IS NULL;

ALTER TABLE bsc_entries
ALTER COLUMN target_year SET DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER;

ALTER TABLE bsc_entries
ALTER COLUMN target_year SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bsc_entries_target_year ON bsc_entries(target_year);

-- =========================
-- 3. BSC ENTRIES: drop the dead `quarter` column
-- =========================
-- Added by add_bsc_entry_quarter.sql, but bscService never wrote it and
-- nothing ever filtered on it — every row was the 'q1' default.

DROP INDEX IF EXISTS idx_bsc_entries_quarter;

ALTER TABLE bsc_entries
DROP CONSTRAINT IF EXISTS bsc_entries_quarter_check;

ALTER TABLE bsc_entries
DROP COLUMN IF EXISTS quarter;

-- =========================
-- 4. NOTIFICATIONS: close the open INSERT policy
-- =========================
-- "Service role can insert notifications" was WITH CHECK (true). RLS policies
-- are OR'd, so it fully negated the admin-only policy beside it: any user
-- holding the anon key could write notifications addressed to anyone.
-- The notify_* triggers are SECURITY DEFINER and bypass RLS, so nothing
-- legitimate depended on it.

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Users may delete their own notifications (was missing entirely).
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- =========================
-- 5. ATOMIC REGISTRATION
-- =========================
-- Registration used to run three client calls: auth.signUp, then a profiles
-- upsert, then an offices insert. When email confirmation is enabled signUp
-- returns a user but no session, so the two follow-up inserts ran
-- unauthenticated and failed RLS — leaving an auth user with no office row and
-- no way to retry ("user already registered").
--
-- Creating both rows inside the existing SECURITY DEFINER trigger makes
-- registration a single atomic operation that does not depend on a session.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_office_name TEXT;
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, status, contact_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        'office',
        'pending',
        NULLIF(NEW.raw_user_meta_data->>'contact_number', '')
    )
    ON CONFLICT (id) DO NOTHING;

    new_office_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'office_name', '')), '');

    IF new_office_name IS NOT NULL THEN
        INSERT INTO public.offices (user_id, office_name, pillar, assignment_type)
        SELECT NEW.id, new_office_name, NULL, NULL
        WHERE NOT EXISTS (
            SELECT 1 FROM public.offices WHERE user_id = NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =========================
-- 6. VERIFICATION
-- =========================

-- quarterly_records should now show `year`, and the unique constraint
-- should span (bsc_entry_id, year, quarter).
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'quarterly_records'
ORDER BY ordinal_position;

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.quarterly_records'::regclass AND contype = 'u';

-- bsc_entries should show target_value + target_year, and no `quarter`.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bsc_entries'
ORDER BY ordinal_position;

-- notifications should have exactly one INSERT policy (admins only).
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notifications'
ORDER BY policyname;
