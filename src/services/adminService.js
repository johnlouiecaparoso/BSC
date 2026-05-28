import { supabase } from '@/lib/supabase'

const normalizeText = (value) => (value || '').toString().trim().toLowerCase()

const matchesContains = (value, filterValue) => {
  if (!filterValue) return true
  return normalizeText(value).includes(normalizeText(filterValue))
}

const hasAssignedFocalPerson = (record) => {
  const focalPerson = record?.focalPerson ?? record?.focal_person ?? ''
  return focalPerson.toString().trim() !== ''
}

const matchesOfficeApprovalStatus = (profiles) => {
  if (Array.isArray(profiles)) {
    return profiles.some(profile => profile?.status === 'approved')
  }

  return profiles?.status === 'approved'
}

const getOfficeProfile = (profiles) => {
  if (Array.isArray(profiles)) {
    return profiles[0] || {}
  }

  return profiles || {}
}

const matchesQuarterAndStatusFilters = (record, filters = {}) => {
  if (filters.quarter && record?.quarter !== filters.quarter) {
    return false
  }

  if (filters.status && record?.status !== filters.status) {
    return false
  }

  return true
}

const matchesRecordFilters = (record, filters = {}) => {
  if (!matchesQuarterAndStatusFilters(record, filters)) {
    return false
  }

  if (filters.hasFocalPerson === 'yes') {
    return hasAssignedFocalPerson(record)
  }

  if (filters.hasFocalPerson === 'no') {
    return !hasAssignedFocalPerson(record)
  }

  return true
}

const matchesOfficeFocalPersonFilter = (records = [], filters = {}) => {
  if (!filters.hasFocalPerson) {
    return true
  }

  const relevantRecords = records.filter(record => matchesQuarterAndStatusFilters(record, filters))

  if (relevantRecords.length === 0) {
    return false
  }

  if (filters.hasFocalPerson === 'yes') {
    return relevantRecords.some(record => hasAssignedFocalPerson(record))
  }

  if (filters.hasFocalPerson === 'no') {
    return relevantRecords.every(record => !hasAssignedFocalPerson(record))
  }

  return true
}

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
    const { data: offices, error: officesError } = await supabase
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
      .order('created_at', { ascending: false })

    if (officesError) throw officesError

    const approvedOffices = (offices || []).filter(office =>
      matchesOfficeApprovalStatus(office.profiles)
    )
    const officeIds = approvedOffices.map(office => office.id)

    if (officeIds.length === 0) {
      return []
    }

    const { data: entries, error: entriesError } = await supabase
      .from('bsc_entries')
      .select(`
        id,
        office_id,
        goal,
        perspective,
        strategic_objective,
        kpi
      `)
      .in('office_id', officeIds)

    if (entriesError) throw entriesError

    const allEntries = entries || []
    const entryIds = allEntries.map(entry => entry.id)

    let recordsByEntryId = {}

    if (entryIds.length > 0) {
      const { data: records, error: recordsError } = await supabase
        .from('quarterly_records')
        .select(`
          id,
          bsc_entry_id,
          quarter,
          quarterly_target,
          month_1,
          month_2,
          month_3,
          status,
          focal_person
        `)
        .in('bsc_entry_id', entryIds)

      if (recordsError) throw recordsError

      recordsByEntryId = (records || []).reduce((acc, record) => {
        if (!acc[record.bsc_entry_id]) {
          acc[record.bsc_entry_id] = []
        }

        acc[record.bsc_entry_id].push({
          id: record.id,
          quarter: record.quarter,
          quarterlyTarget: record.quarterly_target,
          month1: record.month_1,
          month2: record.month_2,
          month3: record.month_3,
          status: record.status,
          focalPerson: record.focal_person
        })

        return acc
      }, {})
    }

    const entriesByOfficeId = allEntries.reduce((acc, entry) => {
      if (!acc[entry.office_id]) {
        acc[entry.office_id] = []
      }

      acc[entry.office_id].push({
        id: entry.id,
        goal: entry.goal,
        perspective: entry.perspective,
        strategicObjective: entry.strategic_objective,
        kpi: entry.kpi,
        records: recordsByEntryId[entry.id] || []
      })

      return acc
    }, {})

    const hasEntryFilters = Boolean(
      filters.goal ||
      filters.perspective ||
      filters.strategicObjective ||
      filters.kpi
    )
    const hasRecordFilters = Boolean(filters.quarter || filters.status || filters.hasFocalPerson)

    return approvedOffices
      .filter((office) => {
        if (!matchesContains(office.office_name, filters.office)) return false
        if (!matchesContains(office.pillar, filters.pillar)) return false
        if (!matchesContains(office.assignment_type, filters.assignmentType)) return false

        const officeEntries = entriesByOfficeId[office.id] || []
        const filteredEntries = officeEntries.filter(entry =>
          matchesContains(entry.goal, filters.goal) &&
          matchesContains(entry.perspective, filters.perspective) &&
          matchesContains(entry.strategicObjective, filters.strategicObjective) &&
          matchesContains(entry.kpi, filters.kpi)
        )

        if (hasEntryFilters && filteredEntries.length === 0) {
          return false
        }

        if (hasRecordFilters) {
          const entriesToCheck = hasEntryFilters ? filteredEntries : officeEntries
          const relevantRecords = entriesToCheck.flatMap(entry => entry.records || [])

          if (!matchesOfficeFocalPersonFilter(relevantRecords, filters)) {
            return false
          }

          return entriesToCheck.some(entry =>
            (entry.records || []).some(record => matchesRecordFilters(record, filters))
          )
        }

        return true
      })
      .map((office) => {
        const profile = getOfficeProfile(office.profiles)
        const officeEntries = entriesByOfficeId[office.id] || []
        const filteredEntries = officeEntries
          .filter(entry =>
            matchesContains(entry.goal, filters.goal) &&
            matchesContains(entry.perspective, filters.perspective) &&
            matchesContains(entry.strategicObjective, filters.strategicObjective) &&
            matchesContains(entry.kpi, filters.kpi)
          )
          .map((entry) => ({
            ...entry,
            filteredRecords: hasRecordFilters
              ? (entry.records || []).filter(record => matchesRecordFilters(record, filters))
              : (entry.records || [])
          }))
          .filter(entry => !hasRecordFilters || entry.filteredRecords.length > 0)

        const entriesForSummary = hasEntryFilters || hasRecordFilters ? filteredEntries : officeEntries.map((entry) => ({
          ...entry,
          filteredRecords: entry.records || []
        }))

        const q1Records = entriesForSummary.flatMap(entry =>
          (entry.filteredRecords || []).filter(record => record.quarter === 'q1')
        )

        const totalQ1Accomplishment = q1Records.reduce((sum, record) => {
          return sum +
            (parseFloat(record.month1) || 0) +
            (parseFloat(record.month2) || 0) +
            (parseFloat(record.month3) || 0)
        }, 0)

        const totalQ1Target = q1Records.reduce((sum, record) => {
          return sum + (parseFloat(record.quarterlyTarget) || 0)
        }, 0)

        const q1Percentage = totalQ1Target > 0
          ? Math.round((totalQ1Accomplishment / totalQ1Target) * 100)
          : 0

        return {
          id: office.id,
          officeName: office.office_name,
          pillar: office.pillar || '',
          assignmentType: office.assignment_type || '',
          registeredBy: profile.full_name || '',
          email: profile.email || '',
          userId: office.user_id,
          totalEntries: entriesForSummary.length,
          totalQ1Accomplishment,
          totalQ1Target,
          q1Percentage,
          completion: q1Percentage,
          lastUpdated: office.updated_at || office.created_at,
          createdAt: office.created_at
        }
      })
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

    // Get quarterly records for all entries - this is efficient and ensures all data is loaded
    const entryIds = (entries || []).map(e => e.id)
    let quarterlyRecords = []

    if (entryIds.length > 0) {
      // Fetch all quarterly records for all quarters at once
      const { data: records, error: recordsError } = await supabase
        .from('quarterly_records')
        .select('*')
        .in('bsc_entry_id', entryIds)
        .order('quarter', { ascending: true })

      if (recordsError) throw recordsError
      quarterlyRecords = records || []
    }

    const profile = getOfficeProfile(office.profiles)

    return {
      id: office.id,
      officeName: office.office_name,
      pillar: office.pillar || '',
      assignmentType: office.assignment_type || '',
      userId: office.user_id,
      registeredBy: profile.full_name || '',
      email: profile.email || '',
      contactNumber: profile.contact_number || '',
      status: profile.status || '',
      createdAt: office.created_at,
      entries: (entries || []).map(entry => ({
        id: entry.id,
        goal: entry.goal,
        perspective: entry.perspective,
        strategicObjective: entry.strategic_objective,
        kpi: entry.kpi,
        target2026: entry.target_2026,
        quarter: entry.quarter || 'q1',
        createdAt: entry.created_at
      })),
      quarterlyRecords: quarterlyRecords.map(r => ({
        id: r.id,
        entryId: r.bsc_entry_id,
        quarter: r.quarter,
        quarterlyTarget: r.quarterly_target !== null ? r.quarterly_target : 0,
        month1: r.month_1 !== null ? r.month_1 : 0,
        month2: r.month_2 !== null ? r.month_2 : 0,
        month3: r.month_3 !== null ? r.month_3 : 0,
        keyActivities: r.key_activities || '',
        mov: r.mov || '',
        status: r.status || '',
        issues: r.issues || '',
        assistance: r.assistance || '',
        focalPerson: r.focal_person || ''
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
