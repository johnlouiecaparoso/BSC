-- =====================================================
-- CSU BSC Accomplishment Tracking System
-- COMPLETE Supabase Setup Script
-- =====================================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query > Paste > Run)
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- It uses DROP IF EXISTS / CREATE OR REPLACE to avoid conflicts.
-- =====================================================

-- =========================
-- 1. EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- 2. TABLES
-- =========================

-- PROFILES TABLE
-- Extends Supabase auth.users with additional user data
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('office', 'admin')),
    contact_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OFFICES TABLE
-- Stores office/college/unit information
CREATE TABLE IF NOT EXISTS offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    office_name TEXT NOT NULL,
    pillar TEXT,
    assignment_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BSC ENTRIES TABLE
-- Stores Balanced Scorecard KPI entries
CREATE TABLE IF NOT EXISTS bsc_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    perspective TEXT NOT NULL CHECK (perspective IN ('Stakeholders', 'Process Excellence', 'Talents, Learning & Growth', 'Financial')),
    strategic_objective TEXT NOT NULL,
    kpi TEXT NOT NULL,
    target_2026 TEXT NOT NULL,
    quarter TEXT NOT NULL DEFAULT 'q1' CHECK (quarter IN ('q1', 'q2', 'q3', 'q4')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUARTERLY RECORDS TABLE
-- Stores quarterly performance data for each BSC entry
CREATE TABLE IF NOT EXISTS quarterly_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bsc_entry_id UUID NOT NULL REFERENCES bsc_entries(id) ON DELETE CASCADE,
    quarter TEXT NOT NULL CHECK (quarter IN ('q1', 'q2', 'q3', 'q4')),
    quarterly_target DECIMAL,
    month_1 DECIMAL,
    month_2 DECIMAL,
    month_3 DECIMAL,
    key_activities TEXT,
    mov TEXT,
    status TEXT CHECK (status IN ('Not Started', 'Ongoing', 'Completed', 'Delayed', 'For Validation')),
    issues TEXT,
    assistance TEXT,
    focal_person TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bsc_entry_id, quarter)
);

-- NOTIFICATIONS TABLE
-- Stores user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 3. INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_offices_user_id ON offices(user_id);
CREATE INDEX IF NOT EXISTS idx_bsc_entries_office_id ON bsc_entries(office_id);
CREATE INDEX IF NOT EXISTS idx_bsc_entries_quarter ON bsc_entries(quarter);
CREATE INDEX IF NOT EXISTS idx_quarterly_records_bsc_entry_id ON quarterly_records(bsc_entry_id);
CREATE INDEX IF NOT EXISTS idx_quarterly_records_quarter ON quarterly_records(quarter);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =========================
-- 4. ENABLE ROW LEVEL SECURITY
-- =========================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsc_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =========================
-- 5. DROP ALL EXISTING POLICIES (clean slate)
-- =========================
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
-- 6. PROFILES POLICIES
-- =========================

-- *** CRITICAL: Allow new users to insert their own profile during registration ***
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all profiles (for approval/rejection)
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =========================
-- 7. OFFICES POLICIES
-- =========================

-- Users can view their own office
CREATE POLICY "Users can view own office" ON offices
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own office
CREATE POLICY "Users can insert own office" ON offices
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own office
CREATE POLICY "Users can update own office" ON offices
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own office
CREATE POLICY "Users can delete own office" ON offices
    FOR DELETE USING (user_id = auth.uid());

-- Admins can view all offices
CREATE POLICY "Admins can view all offices" ON offices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete all offices
CREATE POLICY "Admins can delete all offices" ON offices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =========================
-- 8. BSC ENTRIES POLICIES
-- =========================

-- Users can view their own BSC entries
CREATE POLICY "Users can view own bsc entries" ON bsc_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM offices
            WHERE offices.id = bsc_entries.office_id
            AND offices.user_id = auth.uid()
        )
    );

-- Users can insert their own BSC entries
CREATE POLICY "Users can insert own bsc entries" ON bsc_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM offices
            WHERE offices.id = office_id
            AND offices.user_id = auth.uid()
        )
    );

-- Users can update their own BSC entries
CREATE POLICY "Users can update own bsc entries" ON bsc_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM offices
            WHERE offices.id = bsc_entries.office_id
            AND offices.user_id = auth.uid()
        )
    );

-- Users can delete their own BSC entries
CREATE POLICY "Users can delete own bsc entries" ON bsc_entries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM offices
            WHERE offices.id = bsc_entries.office_id
            AND offices.user_id = auth.uid()
        )
    );

-- Admins can view all BSC entries
CREATE POLICY "Admins can view all bsc entries" ON bsc_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all BSC entries
CREATE POLICY "Admins can update all bsc entries" ON bsc_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =========================
-- 9. QUARTERLY RECORDS POLICIES
-- =========================

-- Users can view their own quarterly records
CREATE POLICY "Users can view own quarterly records" ON quarterly_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bsc_entries
            JOIN offices ON offices.id = bsc_entries.office_id
            WHERE bsc_entries.id = quarterly_records.bsc_entry_id
            AND offices.user_id = auth.uid()
        )
    );

-- Users can insert their own quarterly records
CREATE POLICY "Users can insert own quarterly records" ON quarterly_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bsc_entries
            JOIN offices ON offices.id = bsc_entries.office_id
            WHERE bsc_entries.id = bsc_entry_id
            AND offices.user_id = auth.uid()
        )
    );

-- Users can update their own quarterly records
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

-- Admins can view all quarterly records
CREATE POLICY "Admins can view all quarterly records" ON quarterly_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all quarterly records (for focal person assignment)
CREATE POLICY "Admins can update all quarterly records" ON quarterly_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all quarterly records" ON quarterly_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =========================
-- 10. NOTIFICATIONS POLICIES
-- =========================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow trigger/system inserts (needed for automatic notifications)
CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- =========================
-- 11. FUNCTIONS & TRIGGERS
-- =========================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_offices_updated_at ON offices;
CREATE TRIGGER update_offices_updated_at BEFORE UPDATE ON offices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bsc_entries_updated_at ON bsc_entries;
CREATE TRIGGER update_bsc_entries_updated_at BEFORE UPDATE ON bsc_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quarterly_records_updated_at ON quarterly_records;
CREATE TRIGGER update_quarterly_records_updated_at BEFORE UPDATE ON quarterly_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 12. NOTIFICATION TRIGGERS
-- =========================

-- Notify user when their profile is approved
CREATE OR REPLACE FUNCTION notify_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
            NEW.id,
            'approval',
            'Registration Approved',
            'Your office registration has been approved. You can now access the system.'
        );
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
            NEW.id,
            'approval',
            'Registration Rejected',
            COALESCE('Your registration was rejected. Reason: ' || NEW.rejection_reason, 'Your registration was rejected.')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_approval ON profiles;
CREATE TRIGGER trigger_notify_on_approval
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_approval();

-- Notify office user when focal person is assigned
CREATE OR REPLACE FUNCTION notify_on_focal_person_assignment()
RETURNS TRIGGER AS $$
DECLARE
    office_user_id UUID;
    entry_kpi TEXT;
BEGIN
    IF NEW.focal_person IS NOT NULL AND (OLD.focal_person IS NULL OR OLD.focal_person != NEW.focal_person) THEN
        SELECT offices.user_id, bsc_entries.kpi
        INTO office_user_id, entry_kpi
        FROM bsc_entries
        JOIN offices ON offices.id = bsc_entries.office_id
        WHERE bsc_entries.id = NEW.bsc_entry_id;

        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES (
            office_user_id,
            'focal_person',
            'Focal Person Assigned',
            format('A focal person (%s) has been assigned to your entry: %s for %s',
                NEW.focal_person, entry_kpi, UPPER(NEW.quarter)),
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_focal_person ON quarterly_records;
CREATE TRIGGER trigger_notify_on_focal_person
    AFTER UPDATE ON quarterly_records
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_focal_person_assignment();

-- =========================
-- 13. HANDLE NEW USER TRIGGER (FALLBACK)
-- =========================
-- This creates a profile automatically when a user signs up via Supabase Auth
-- Acts as a safety net if the frontend insert fails

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        'office',
        'pending'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =========================
-- 14. HELPER VIEWS (optional, for admin analytics)
-- =========================

-- View: Office summary with entry counts
CREATE OR REPLACE VIEW office_summary AS
SELECT
    o.id AS office_id,
    o.office_name,
    o.pillar,
    o.assignment_type,
    p.id AS user_id,
    p.full_name,
    p.email,
    p.status AS profile_status,
    p.contact_number,
    o.created_at,
    COUNT(DISTINCT b.id) AS total_entries,
    COUNT(DISTINCT qr.id) AS total_quarterly_records
FROM offices o
JOIN profiles p ON p.id = o.user_id
LEFT JOIN bsc_entries b ON b.office_id = o.id
LEFT JOIN quarterly_records qr ON qr.bsc_entry_id = b.id
GROUP BY o.id, o.office_name, o.pillar, o.assignment_type, p.id, p.full_name, p.email, p.status, p.contact_number, o.created_at;

-- =========================
-- 15. VERIFICATION QUERIES
-- =========================
-- Run these after setup to verify everything is correct:

-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'offices', 'bsc_entries', 'quarterly_records', 'notifications')
ORDER BY table_name;

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'offices', 'bsc_entries', 'quarterly_records', 'notifications');

-- Check all policies exist (should show ~20+ policies)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
