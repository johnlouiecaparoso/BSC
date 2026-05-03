import { supabase } from '@/lib/supabase'

/**
 * Admin Service
 * Full Supabase implementation for admin operations
 */

/**
 * Get all offices with optional filters
 * @param {object} filters - {pillar, assignmentType, goal, perspective, quarter, status, hasFocalPerson}
 * @returns {Promise<array>}
 */
export async function getAllOffices(filters = {}) {
  try {
    // Get all approved offices with their profiles and entry counts
    let query = supabase
      .from('offices')
      .select(`
        id,
        office_name,
        pillar,
        assignment_type,
        created_at,
        updated_at,
        user_id,
        profiles!inner (
          id,
          full_name,
          email,
          status,
          contact_number
        )
      `)
      .eq('profiles.status', 'approved')

    // Apply filters
    if (filters.office) {
      query = query.ilike('office_name', `%${filters.office}%`)
    }
    if (filters.pillar) {
      query = query.ilike('pillar', `%${filters.pillar}%`)
    }
    if (filters.assignmentType) {
      query = query.ilike('assignment_type', `%${filters.assignmentType}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // For each office, get entry count and quarterly summary
    const officesWithStats = await Promise.all(
      (data || []).map(async (office) => {
        // Get BSC entries count
        const { count: entryCount } = await supabase
          .from('bsc_entries')
          .select('id', { count: 'exact', head: true })
          .eq('office_id', office.id)

        return {
          id: office.id,
          officeName: office.office_name,
          pillar: office.pillar || '',
          assignmentType: office.assignment_type || '',
          registeredBy: office.profiles.full_name,
          email: office.profiles.email,
          userId: office.user_id,
          totalEntries: entryCount || 0,
          createdAt: office.created_at
        }
      })
    )

    return officesWithStats
  } catch (error) {
    console.error('Error fetching offices:', error)
    return []
  }
}

/**
 * Get office details by ID (office UUID, not user UUID)
 * @param {string} officeId
 * @returns {Promise<object|null>}
 */
export async function getOfficeById(officeId) {
  try {
    const { data: office, error: officeError } = await supabase
      .from('offices')
      .select(`
        id,
        office_name,
        pillar,
        assignment_type,
        user_id,
        created_at,
        profiles (
          id,
          full_name,
          email,
          status,
          contact_number
        )
      `)
      .eq('id', officeId)
      .single()

    if (officeError) throw officeError

    // Get BSC entries for this office
    const { data: entries, error: entriesError } = await supabase
      .from('bsc_entries')
      .select('*')
      .eq('office_id', officeId)
      .order('created_at', { ascending: true })

    if (entriesError) throw entriesError

    // Get quarterly records for all entries
    const entryIds = (entries || []).map(e => e.id)
    let quarterlyRecords = []

    if (entryIds.length > 0) {
      const { data: records, error: recordsError } = await supabase
        .from('quarterly_records')
        .select('*')
        .in('bsc_entry_id', entryIds)

      if (recordsError) throw recordsError
      quarterlyRecords = records || []
    }

    return {
      id: office.id,
      officeName: office.office_name,
      pillar: office.pillar || '',
      assignmentType: office.assignment_type || '',
      userId: office.user_id,
      registeredBy: office.profiles?.full_name || '',
      email: office.profiles?.email || '',
      contactNumber: office.profiles?.contact_number || '',
      status: office.profiles?.status || '',
      createdAt: office.created_at,
      entries: (entries || []).map(entry => ({
        id: entry.id,
        goal: entry.goal,
        perspective: entry.perspective,
        strategicObjective: entry.strategic_objective,
        kpi: entry.kpi,
        target2026: entry.target_2026,
        createdAt: entry.created_at
      })),
      quarterlyRecords: quarterlyRecords.map(r => ({
        id: r.id,
        entryId: r.bsc_entry_id,
        quarter: r.quarter,
        quarterlyTarget: r.quarterly_target,
        month1: r.month_1,
        month2: r.month_2,
        month3: r.month_3,
        keyActivities: r.key_activities,
        mov: r.mov,
        status: r.status,
        issues: r.issues,
        assistance: r.assistance,
        focalPerson: r.focal_person
      }))
    }
  } catch (error) {
    console.error('Error fetching office by ID:', error)
    return null
  }
}

/**
 * Approve office registration
 * @param {string} userId - The profile/user UUID to approve
 * @returns {Promise<object>}
 */
export async function approveOffice(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'approved',
        rejection_reason: null
      })
      .eq('id', userId)

    if (error) throw error

    return {
      success: true,
      message: 'Office approved successfully'
    }
  } catch (error) {
    console.error('Error approving office:', error)
    return {
      success: false,
      message: error.message || 'Failed to approve office'
    }
  }
}

/**
 * Reject office registration
 * @param {string} userId - The profile/user UUID to reject
 * @param {string} reason - Optional rejection reason
 * @returns {Promise<object>}
 */
export async function rejectOffice(userId, reason = '') {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'rejected',
        rejection_reason: reason || null
      })
      .eq('id', userId)

    if (error) throw error

    return {
      success: true,
      message: 'Office registration rejected'
    }
  } catch (error) {
    console.error('Error rejecting office:', error)
    return {
      success: false,
      message: error.message || 'Failed to reject office'
    }
  }
}

/**
 * Assign focal person to a quarterly record
 * @param {string} recordId
 * @param {string} focalPerson
 * @returns {Promise<object>}
 */
export async function assignFocalPerson(recordId, focalPerson) {
  try {
    const { error } = await supabase
      .from('quarterly_records')
      .update({
        focal_person: focalPerson
      })
      .eq('id', recordId)

    if (error) throw error

    return {
      success: true,
      message: 'Focal person assigned successfully'
    }
  } catch (error) {
    console.error('Error assigning focal person:', error)
    return {
      success: false,
      message: error.message || 'Failed to assign focal person'
    }
  }
}

/**
 * Get pending office approvals
 * @returns {Promise<array>}
 */
export async function getPendingApprovals() {
  try {
    const { data: pendingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .eq('role', 'office')
      .order('created_at', { ascending: false })

    if (profileError) throw profileError

    // For each pending profile, get their office info
    const approvals = await Promise.all(
      (pendingProfiles || []).map(async (profile) => {
        const { data: office } = await supabase
          .from('offices')
          .select('office_name, pillar, assignment_type')
          .eq('user_id', profile.id)
          .maybeSingle()

        return {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          contactNumber: profile.contact_number,
          registeredBy: profile.full_name,
          officeName: office?.office_name || 'Not specified',
          pillar: office?.pillar || '',
          assignmentType: office?.assignment_type || '',
          createdAt: profile.created_at,
          status: profile.status
        }
      })
    )

    return approvals
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return []
  }
}
