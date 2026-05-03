-- =====================================================
-- CSU Accomplishment Tracking System - Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with additional user data
-- =====================================================
CREATE TABLE profiles (
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

-- =====================================================
-- OFFICES TABLE
-- Stores office/college/unit information
-- =====================================================
CREATE TABLE offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    office_name TEXT NOT NULL,
    pillar TEXT,
    assignment_type TEXT, -- Strategic, Core, Support (comma-separated)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BSC ENTRIES TABLE
-- Stores Balanced Scorecard KPI entries
-- =====================================================
CREATE TABLE bsc_entries (
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

-- =====================================================
-- QUARTERLY RECORDS TABLE
-- Stores quarterly performance data for each BSC entry
-- =====================================================
CREATE TABLE quarterly_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bsc_entry_id UUID NOT NULL REFERENCES bsc_entries(id) ON DELETE CASCADE,
    quarter TEXT NOT NULL CHECK (quarter IN ('q1', 'q2', 'q3', 'q4')),

    -- Performance Data
    quarterly_target DECIMAL,
    month_1 DECIMAL,
    month_2 DECIMAL,
    month_3 DECIMAL,

    -- Activities Data
    key_activities TEXT,
    mov TEXT, -- Means of Verification (URL)
    status TEXT CHECK (status IN ('Not Started', 'Ongoing', 'Completed', 'Delayed', 'For Validation')),
    issues TEXT,
    assistance TEXT,

    -- Admin Assignment
    focal_person TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one record per entry per quarter
    UNIQUE(bsc_entry_id, quarter)
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- Stores user notifications
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'approval', 'focal_person', 'general'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID, -- Can reference office, entry, or record
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_offices_user_id ON offices(user_id);
CREATE INDEX idx_bsc_entries_office_id ON bsc_entries(office_id);
CREATE INDEX idx_bsc_entries_quarter ON bsc_entries(quarter);
CREATE INDEX idx_quarterly_records_bsc_entry_id ON quarterly_records(bsc_entry_id);
CREATE INDEX idx_quarterly_records_quarter ON quarterly_records(quarter);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsc_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

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

-- Admins can update all profiles (for approval)
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- OFFICES POLICIES
-- =====================================================

-- Users can view their own office
CREATE POLICY "Users can view own office" ON offices
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own office
CREATE POLICY "Users can insert own office" ON offices
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own office
CREATE POLICY "Users can update own office" ON offices
    FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all offices
CREATE POLICY "Admins can view all offices" ON offices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- BSC ENTRIES POLICIES
-- =====================================================

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

-- =====================================================
-- QUARTERLY RECORDS POLICIES
-- =====================================================

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

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

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

-- System can insert notifications (for triggers)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offices_updated_at BEFORE UPDATE ON offices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bsc_entries_updated_at BEFORE UPDATE ON bsc_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quarterly_records_updated_at BEFORE UPDATE ON quarterly_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification when profile is approved
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
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_approval
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_approval();

-- Function to create notification when focal person is assigned
CREATE OR REPLACE FUNCTION notify_on_focal_person_assignment()
RETURNS TRIGGER AS $$
DECLARE
    office_user_id UUID;
    entry_kpi TEXT;
BEGIN
    IF NEW.focal_person IS NOT NULL AND (OLD.focal_person IS NULL OR OLD.focal_person != NEW.focal_person) THEN
        -- Get the office user_id and KPI name
        SELECT offices.user_id, bsc_entries.kpi
        INTO office_user_id, entry_kpi
        FROM bsc_entries
        JOIN offices ON offices.id = bsc_entries.office_id
        WHERE bsc_entries.id = NEW.bsc_entry_id;

        -- Create notification for office user
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_focal_person
    AFTER UPDATE ON quarterly_records
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_focal_person_assignment();

-- =====================================================
-- INITIAL ADMIN USER
-- After running this schema, you need to:
-- 1. Create a user in Supabase Auth Dashboard
-- 2. Run this query to make them admin:
--
-- INSERT INTO profiles (id, full_name, email, role, status)
-- VALUES (
--     'auth-user-id-here',
--     'Admin User',
--     'admin@csu.edu.ph',
--     'admin',
--     'approved'
-- );
-- =====================================================

-- =====================================================
-- USEFUL QUERIES FOR TESTING
-- =====================================================

-- View all pending registrations (for admin)
-- SELECT p.*, o.office_name, o.pillar, o.assignment_type
-- FROM profiles p
-- LEFT JOIN offices o ON o.user_id = p.id
-- WHERE p.status = 'pending' AND p.role = 'office';

-- View all offices with entry count
-- SELECT o.*, COUNT(b.id) as total_entries
-- FROM offices o
-- LEFT JOIN bsc_entries b ON b.office_id = o.id
-- GROUP BY o.id;

-- View quarterly records with issues but no focal person
-- SELECT o.office_name, b.kpi, qr.quarter, qr.issues
-- FROM quarterly_records qr
-- JOIN bsc_entries b ON b.id = qr.bsc_entry_id
-- JOIN offices o ON o.id = b.office_id
-- WHERE (qr.issues IS NOT NULL AND qr.issues != '')
-- AND (qr.focal_person IS NULL OR qr.focal_person = '');
