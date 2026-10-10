import { supabase } from '@/lib/supabase'
import { toNumber } from '@/utils/computeAccomplishment'
import { getCurrentQuarter, getCurrentYear } from '@/utils/quarterHelpers'

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
 * Get all offices with optional filters.
 * The accomplishment summary reflects `filters.quarter` (falling back to the
 * current calendar quarter) rather than a hardcoded Q1.
 * @param {object} filters - {office, pillar, assignmentType, goal, perspective,
 *   strategicObjective, kpi, quarter, year, status, hasFocalPerson}
 * @returns {Promise<array>}
 */
export async function getAllOffices(filters = {}) {
  try {
    const summaryQuarter = filters.quarter || getCurrentQuarter()
    const year = filters.year ?? getCurrentYear()

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
      .select('id, office_id, goal, perspective, strategic_objective, kpi, target_value, target_year')
      .in('office_id', officeIds)
      .eq('target_year', year)

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
          year,
          quarterly_target,
          month_1,
          month_2,
          month_3,
          status,
          focal_person
        `)
        .in('bsc_entry_id', entryIds)
        .eq('year', year)

      if (recordsError) throw recordsError

      recordsByEntryId = (records || []).reduce((acc, record) => {
        if (!acc[record.bsc_entry_id]) {
          acc[record.bsc_entry_id] = []
        }

        acc[record.bsc_entry_id].push({
          id: record.id,
          quarter: record.quarter,
          year: record.year,
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
        targetValue: entry.target_value,
        targetYear: entry.target_year,
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

        const entriesForSummary = hasEntryFilters || hasRecordFilters
          ? filteredEntries
          : officeEntries.map((entry) => ({ ...entry, filteredRecords: entry.records || [] }))

        // Summarise the quarter the admin is actually looking at. Previously this
        // always filtered to 'q1', so selecting any other quarter zeroed every card.
        const summaryRecords = entriesForSummary.flatMap(entry =>
          (entry.filteredRecords || []).filter(record => record.quarter === summaryQuarter)
        )

        let totalAccomplishment = 0
        let totalTarget = 0

        for (const record of summaryRecords) {
          const target = toNumber(record.quarterlyTarget)

          if (target > 0) {
            totalAccomplishment += toNumber(record.month1) + toNumber(record.month2) + toNumber(record.month3)
            totalTarget += target
          }
        }

        const percentage = totalTarget > 0
          ? Math.round((totalAccomplishment / totalTarget) * 100)
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
          summaryQuarter,
          summaryYear: year,
          totalAccomplishment,
          totalTarget,
          percentage,
          completion: percentage,
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
 * @param {object} [options] - {year} to scope entries and records
 * @returns {Promise<object|null>}
 */
export async function getOfficeById(officeId, { year = null } = {}) {
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
      .maybeSingle()

    if (officeError) throw officeError
    if (!office) return null

    let entriesQuery = supabase
      .from('bsc_entries')
      .select('*')
      .eq('office_id', officeId)
      .order('created_at', { ascending: true })

    if (year !== null && year !== undefined) {
      entriesQuery = entriesQuery.eq('target_year', year)
    }

    const { data: entries, error: entriesError } = await entriesQuery

    if (entriesError) throw entriesError

    const entryIds = (entries || []).map(e => e.id)
    let quarterlyRecords = []

    if (entryIds.length > 0) {
      let recordsQuery = supabase
        .from('quarterly_records')
        .select('*')
        .in('bsc_entry_id', entryIds)
        .order('year', { ascending: true })
        .order('quarter', { ascending: true })

      if (year !== null && year !== undefined) {
        recordsQuery = recordsQuery.eq('year', year)
      }

      const { data: records, error: recordsError } = await recordsQuery

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
        targetValue: entry.target_value,
        targetYear: entry.target_year,
        createdAt: entry.created_at
      })),
      quarterlyRecords: quarterlyRecords.map(r => ({
        id: r.id,
        entryId: r.bsc_entry_id,
        quarter: r.quarter,
        year: r.year,
        // Null means "not reported" and must stay distinguishable from a
        // reported zero, so these are no longer coerced to 0.
        quarterlyTarget: r.quarterly_target,
        month1: r.month_1,
        month2: r.month_2,
        month3: r.month_3,
        keyActivities: r.key_activities || '',
        mov: r.mov || '',
        status: r.status || '',
        issues: r.issues || '',
        assistance: r.assistance || '',
        focalPerson: r.focal_person || '',
        updatedAt: r.updated_at
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
    const { error, count } = await supabase
      .from('quarterly_records')
      .update({ focal_person: focalPerson }, { count: 'exact' })
      .eq('id', recordId)

    if (error) throw error

    if (count === 0) {
      return {
        success: false,
        message: 'Failed to assign focal person. Record may not exist or permission was denied.'
      }
    }

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

    const profiles = pendingProfiles || []

    if (profiles.length === 0) return []

    // One query for every pending user's office rather than one per user.
    const { data: offices, error: officesError } = await supabase
      .from('offices')
      .select('user_id, office_name, pillar, assignment_type')
      .in('user_id', profiles.map(p => p.id))

    if (officesError) throw officesError

    const officeByUserId = (offices || []).reduce((acc, office) => {
      if (!acc[office.user_id]) acc[office.user_id] = office
      return acc
    }, {})

    return profiles.map((profile) => {
      const office = officeByUserId[profile.id]

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
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return []
  }
}

/**
 * Load the distinct filter option values an admin can choose from.
 * Lives here so components go through the service layer instead of querying
 * Supabase directly.
 * @param {number|null} [year]
 * @returns {Promise<object>} - {offices, pillars, assignmentTypes, goals, perspectives, strategicObjectives, kpis}
 */
export async function getFilterOptions(year = null) {
  const empty = {
    offices: [],
    pillars: [],
    assignmentTypes: [],
    goals: [],
    perspectives: [],
    strategicObjectives: [],
    kpis: []
  }

  try {
    const { data: offices, error: officesError } = await supabase
      .from('offices')
      .select('id, office_name, pillar, assignment_type, profiles (status)')
      .order('office_name')

    if (officesError) throw officesError

    const approved = (offices || []).filter(o => matchesOfficeApprovalStatus(o.profiles))

    if (approved.length === 0) return empty

    let entriesQuery = supabase
      .from('bsc_entries')
      .select('goal, perspective, strategic_objective, kpi')
      .in('office_id', approved.map(o => o.id))

    if (year !== null && year !== undefined) {
      entriesQuery = entriesQuery.eq('target_year', year)
    }

    const { data: entries, error: entriesError } = await entriesQuery

    if (entriesError) throw entriesError

    const distinct = (items, key) => [...new Set(items.map(item => item[key]).filter(Boolean))].sort()

    return {
      offices: approved.map(o => o.office_name),
      pillars: distinct(approved, 'pillar'),
      assignmentTypes: distinct(approved, 'assignment_type'),
      goals: distinct(entries || [], 'goal'),
      perspectives: distinct(entries || [], 'perspective'),
      strategicObjectives: distinct(entries || [], 'strategic_objective'),
      kpis: distinct(entries || [], 'kpi')
    }
  } catch (error) {
    console.error('Error loading filter options:', error)
    return empty
  }
}
