-- =====================================================
-- ADD MISSING DELETE POLICY FOR OFFICES TABLE
-- =====================================================
-- This policy allows users to delete their own offices

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete own office" ON offices;

-- Create the DELETE policy for users to delete their own offices
CREATE POLICY "Users can delete own office" ON offices
    FOR DELETE USING (user_id = auth.uid());

-- Optional: Also add DELETE policy for admins
DROP POLICY IF EXISTS "Admins can delete all offices" ON offices;

CREATE POLICY "Admins can delete all offices" ON offices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- VERIFICATION (Run this to check policies)
-- =====================================================
-- SELECT policyname, cmd, qual FROM pg_policies
-- WHERE tablename = 'offices'
-- ORDER BY policyname;
