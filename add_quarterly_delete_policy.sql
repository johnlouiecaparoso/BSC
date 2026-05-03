-- =====================================================
-- ADD MISSING DELETE POLICIES FOR QUARTERLY_RECORDS
-- =====================================================
-- Run this in Supabase SQL Editor to enable delete in Quarterly Data Entry

DROP POLICY IF EXISTS "Users can delete own quarterly records" ON quarterly_records;
CREATE POLICY "Users can delete own quarterly records" ON quarterly_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM bsc_entries
            JOIN offices ON offices.id = bsc_entries.office_id
            WHERE bsc_entries.id = quarterly_records.bsc_entry_id
            AND offices.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can delete all quarterly records" ON quarterly_records;
CREATE POLICY "Admins can delete all quarterly records" ON quarterly_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Optional verification:
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'quarterly_records'
-- ORDER BY policyname;