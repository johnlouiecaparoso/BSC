-- =====================================================
-- QUICK FIX: Resolve "infinite recursion" in profiles RLS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Create a SECURITY DEFINER function that checks admin role
-- This bypasses RLS to avoid the recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Drop all existing policies on all tables
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('profiles', 'offices', 'bsc_entries', 'quarterly_records', 'notifications')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END
$$;

-- =========================
-- PROFILES POLICIES (fixed)
-- =========================

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Uses is_admin() function instead of subquery to avoid recursion
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (public.is_admin());

-- =========================
-- OFFICES POLICIES
-- =========================

CREATE POLICY "Users can view own office" ON offices
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own office" ON offices
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own office" ON offices
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own office" ON offices
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all offices" ON offices
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can delete all offices" ON offices
    FOR DELETE USING (public.is_admin());

-- =========================
-- BSC ENTRIES POLICIES
-- =========================

CREATE POLICY "Users can view own bsc entries" ON bsc_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM offices
            WHERE offices.id = bsc_entries.office_id
            AND offices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own bsc entries" ON bsc_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM offices
            WHERE offices.id = office_id
            AND offices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own bsc entries" ON bsc_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM offices
            WHERE offices.id = bsc_entries.office_id
            AND offices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own bsc entries" ON bsc_entries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM offices
            WHERE offices.id = bsc_entries.office_id
            AND offices.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all bsc entries" ON bsc_entries
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all bsc entries" ON bsc_entries
    FOR UPDATE USING (public.is_admin());

-- =========================
-- QUARTERLY RECORDS POLICIES
-- =========================

CREATE POLICY "Users can view own quarterly records" ON quarterly_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bsc_entries
            JOIN offices ON offices.id = bsc_entries.office_id
            WHERE bsc_entries.id = quarterly_records.bsc_entry_id
            AND offices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own quarterly records" ON quarterly_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bsc_entries
            JOIN offices ON offices.id = bsc_entries.office_id
            WHERE bsc_entries.id = bsc_entry_id
            AND offices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own quarterly records" ON quarterly_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bsc_entries
            JOIN offices ON offices.id = bsc_entries.office_id
            WHERE bsc_entries.id = quarterly_records.bsc_entry_id
            AND offices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own quarterly records" ON quarterly_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM bsc_entries
            JOIN offices ON offices.id = bsc_entries.office_id
            WHERE bsc_entries.id = quarterly_records.bsc_entry_id
            AND offices.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all quarterly records" ON quarterly_records
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all quarterly records" ON quarterly_records
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete all quarterly records" ON quarterly_records
    FOR DELETE USING (public.is_admin());

-- =========================
-- NOTIFICATIONS POLICIES
-- =========================

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);
