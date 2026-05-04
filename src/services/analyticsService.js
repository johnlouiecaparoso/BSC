import { supabase } from '@/lib/supabase'

/**
 * Analytics Service
 * Full Supabase implementation for analytics and chart data
 */

/**
 * Get university-wide statistics
 * @returns {Promise<object>}
 */
export async function getUniversityWideStats() {
  try {
    // Total approved offices
    const { count: totalOffices } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'office')
      .eq('status', 'approved')

    // Total BSC entries
    const { count: totalEntries } = await supabase
      .from('bsc_entries')
      .select('id', { count: 'exact', head: true })

    // Pending approvals
    const { count: pendingApprovals } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('role', 'office')

    // Entries with issues but no focal person
    const { data: issueRecords } = await supabase
      .from('quarterly_records')
      .select('id')
      .not('issues', 'is', null)
      .neq('issues', '')
      .or('focal_person.is.null,focal_person.eq.')

    return {
      totalOffices: totalOffices || 0,
      totalEntries: totalEntries || 0,
      pendingApprovals: pendingApprovals || 0,
      entriesWithIssuesNoFocalPerson: issueRecords?.length || 0
    }
  } catch (error) {
    console.error('Error fetching university stats:', error)
    return {
      totalOffices: 0,
      totalEntries: 0,
      pendingApprovals: 0,
      entriesWithIssuesNoFocalPerson: 0
    }
  }
}

/**
 * Get office-specific statistics
 * @param {string} officeId
 * @returns {Promise<object>}
 */
export async function getOfficeStats(officeId) {
  try {
    // Get BSC entries for this office
    const { data: entries, error: entriesError } = await supabase
      .from('bsc_entries')
      .select('id')
      .eq('office_id', officeId)

    if (entriesError) throw entriesError

    const entryIds = (entries || []).map(e => e.id)

    if (entryIds.length === 0) {
      return { totalEntries: 0, averageAccomplishment: 0, completedEntries: 0 }
    }

    // Get quarterly records for these entries
    const { data: records } = await supabase
      .from('quarterly_records')
      .select('*')
      .in('bsc_entry_id', entryIds)

    // Count completed entries
    const completedEntries = (records || []).filter(r => r.status === 'Completed').length

    // Compute average accomplishment
    let totalPercentage = 0
    let countWithTarget = 0

    for (const record of (records || [])) {
      const target = parseFloat(record.quarterly_target)
      if (target && target > 0) {
        const total = (parseFloat(record.month_1) || 0) +
                      (parseFloat(record.month_2) || 0) +
                      (parseFloat(record.month_3) || 0)
        totalPercentage += (total / target) * 100
        countWithTarget++
      }
    }

    const averageAccomplishment = countWithTarget > 0
      ? Math.round(totalPercentage / countWithTarget)
      : 0

    return {
      totalEntries: entryIds.length,
      averageAccomplishment,
      completedEntries
    }
  } catch (error) {
    console.error('Error fetching office stats:', error)
    return { totalEntries: 0, averageAccomplishment: 0, completedEntries: 0 }
  }
}

/**
 * Resolve which office IDs match the current filter set.
 * Returns null if no filter narrows the set (meaning "all offices").
 * @param {object} filters
 * @returns {Promise<string[]|null>}
 */
async function resolveFilteredOfficeIds(filters = {}) {
  const hasOfficeFilter = filters.office || filters.pillar || filters.assignmentType
  if (!hasOfficeFilter) return null

  let query = supabase
    .from('offices')
    .select('id, office_name, pillar, assignment_type, profiles(status)')

  const { data, error } = await query
  if (error) throw error

  let offices = (data || []).filter(o => o.profiles?.status === 'approved')

  if (filters.office) {
    offices = offices.filter(o =>
      o.office_name.toLowerCase().includes(filters.office.toLowerCase())
    )
  }
  if (filters.pillar) {
    offices = offices.filter(o =>
      o.pillar && o.pillar.toLowerCase().includes(filters.pillar.toLowerCase())
    )
  }
  if (filters.assignmentType) {
    offices = offices.filter(o =>
      o.assignment_type && o.assignment_type.toLowerCase().includes(filters.assignmentType.toLowerCase())
    )
  }

  return offices.map(o => o.id)
}

/**
 * Resolve entry IDs for the given office IDs + entry-level filters (perspective).
 * @param {string[]|null} officeIds - null means all offices
 * @param {object} filters
 * @returns {Promise<string[]>}
 */
async function resolveFilteredEntryIds(officeIds, filters = {}) {
  let query = supabase
    .from('bsc_entries')
    .select('id, office_id, perspective')

  if (officeIds !== null && officeIds.length > 0) {
    query = query.in('office_id', officeIds)
  } else if (officeIds !== null && officeIds.length === 0) {
    return []
  }

  if (filters.perspective) {
    query = query.eq('perspective', filters.perspective)
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map(e => e.id)
}

/**
 * Get status distribution across all quarterly records
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getStatusDistribution(filters = {}) {
  try {
    // Resolve office + entry filters
    const officeIds = await resolveFilteredOfficeIds(filters)
    const entryIds = await resolveFilteredEntryIds(officeIds, filters)

    // If filters were applied and resulted in empty set, return zeros
    if ((officeIds !== null && officeIds.length === 0) || entryIds.length === 0) {
      // Only return zeros if a filter was actually set
      const anyFilterSet = filters.office || filters.pillar || filters.assignmentType || filters.perspective
      if (anyFilterSet) {
        return { notStarted: 0, ongoing: 0, completed: 0, delayed: 0, forValidation: 0 }
      }
    }

    let query = supabase
      .from('quarterly_records')
      .select('status, quarter, focal_person')

    if (filters.quarter) {
      query = query.eq('quarter', filters.quarter)
    }

    if (entryIds.length > 0 && (officeIds !== null || filters.perspective)) {
      query = query.in('bsc_entry_id', entryIds)
    }

    // Filter by status
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    // Apply focal person filter client-side for reliability
    let filteredData = data || []
    if (filters.hasFocalPerson === 'yes') {
      filteredData = filteredData.filter(r => r.focal_person && r.focal_person.trim() !== '')
    } else if (filters.hasFocalPerson === 'no') {
      filteredData = filteredData.filter(r => !r.focal_person || r.focal_person.trim() === '')
    }

    const distribution = {
      notStarted: 0,
      ongoing: 0,
      completed: 0,
      delayed: 0,
      forValidation: 0
    }

    for (const record of filteredData) {
      switch (record.status) {
        case 'Not Started': distribution.notStarted++; break
        case 'Ongoing': distribution.ongoing++; break
        case 'Completed': distribution.completed++; break
        case 'Delayed': distribution.delayed++; break
        case 'For Validation': distribution.forValidation++; break
      }
    }

    return distribution
  } catch (error) {
    console.error('Error fetching status distribution:', error)
    return { notStarted: 0, ongoing: 0, completed: 0, delayed: 0, forValidation: 0 }
  }
}

/**
 * Get accomplishment data by office for a quarter
 * @param {string} quarter
 * @param {string} officeFilter - Optional office name to filter by
 * @param {object} filters - Additional filters from FilterPanel
 * @returns {Promise<array>}
 */
export async function getAccomplishmentByOffice(quarter = 'q1', officeFilter = null, filters = {}) {
  try {
    // Get approved offices without relying on a filtered join so we keep every office visible
    const { data: offices, error: officesError } = await supabase
      .from('offices')
      .select(`
        id,
        office_name,
        pillar,
        assignment_type,
        profiles (
          status
        )
      `)

    if (officesError) throw officesError

    const results = []

    for (const office of (offices || [])) {
      if (office?.profiles?.status !== 'approved') {
        continue
      }

      // Filter by office name if provided (search bar)
      if (officeFilter && !office.office_name.toLowerCase().includes(officeFilter.toLowerCase())) {
        continue
      }

      // Filter by office dropdown
      if (filters.office && !office.office_name.toLowerCase().includes(filters.office.toLowerCase())) {
        continue
      }

      // Filter by pillar
      if (filters.pillar && (!office.pillar || !office.pillar.toLowerCase().includes(filters.pillar.toLowerCase()))) {
        continue
      }

      // Filter by assignment type
      if (filters.assignmentType && (!office.assignment_type || !office.assignment_type.toLowerCase().includes(filters.assignmentType.toLowerCase()))) {
        continue
      }

      // Get entries for this office
      let entryQuery = supabase
        .from('bsc_entries')
        .select('id')
        .eq('office_id', office.id)

      // Filter by perspective
      if (filters.perspective) {
        entryQuery = entryQuery.eq('perspective', filters.perspective)
      }

      const { data: entries } = await entryQuery

      const entryIds = (entries || []).map(e => e.id)

      // Check if any record-level filters are active
      const hasRecordFilter = filters.status || filters.hasFocalPerson

      if (entryIds.length === 0) {
        // Only include offices with no entries when no record-level filter is active
        if (!hasRecordFilter) {
          results.push({ officeName: office.office_name, percentage: 0 })
        }
        continue
      }

      // Get quarterly records
      let recQuery = supabase
        .from('quarterly_records')
        .select('quarterly_target, month_1, month_2, month_3, status, focal_person')
        .in('bsc_entry_id', entryIds)
        .eq('quarter', quarter)

      // Filter by status at query level
      if (filters.status) {
        recQuery = recQuery.eq('status', filters.status)
      }

      const { data: rawRecords } = await recQuery

      // Apply focal person filter client-side for reliability
      let records = rawRecords || []
      if (filters.hasFocalPerson === 'yes') {
        records = records.filter(r => r.focal_person && r.focal_person.trim() !== '')
      } else if (filters.hasFocalPerson === 'no') {
        records = records.filter(r => !r.focal_person || r.focal_person.trim() === '')
      }

      // Skip this office entirely if record-level filters are active and no records match
      if (hasRecordFilter && records.length === 0) {
        continue
      }

      let totalPercentage = 0
      let countWithTarget = 0

      for (const record of records) {
        const target = parseFloat(record.quarterly_target)
        if (target && target > 0) {
          const total = (parseFloat(record.month_1) || 0) +
                        (parseFloat(record.month_2) || 0) +
                        (parseFloat(record.month_3) || 0)
          totalPercentage += (total / target) * 100
          countWithTarget++
        }
      }

      const avgPercentage = countWithTarget > 0
        ? Math.round(totalPercentage / countWithTarget)
        : 0

      results.push({
        officeId: office.id,
        officeName: office.office_name,
        percentage: avgPercentage
      })
    }

    // Sort by percentage descending
    return results.sort((a, b) => b.percentage - a.percentage)
  } catch (error) {
    console.error('Error fetching accomplishment by office:', error)
    return []
  }
}

/**
 * Get monthly trend data for an office or university-wide
 * @param {string|null} officeId - null for university-wide
 * @param {number} year
 * @param {object} filters - Additional filters
 * @returns {Promise<array>}
 */
export async function getMonthlyTrend(officeId = null, year = 2026, filters = {}) {
  try {
    // Build base query for quarterly records
    let entryIds = []

    if (officeId) {
      // Get entries for specific office
      let query = supabase
        .from('bsc_entries')
        .select('id')
        .eq('office_id', officeId)

      if (filters.perspective) {
        query = query.eq('perspective', filters.perspective)
      }

      const { data: entries } = await query
      entryIds = (entries || []).map(e => e.id)
    } else {
      // Resolve office-level filters
      const filteredOfficeIds = await resolveFilteredOfficeIds(filters)

      let query = supabase
        .from('bsc_entries')
        .select('id')

      if (filteredOfficeIds !== null && filteredOfficeIds.length > 0) {
        query = query.in('office_id', filteredOfficeIds)
      } else if (filteredOfficeIds !== null && filteredOfficeIds.length === 0) {
        return []
      }

      if (filters.perspective) {
        query = query.eq('perspective', filters.perspective)
      }

      const { data: entries } = await query
      entryIds = (entries || []).map(e => e.id)
    }

    if (entryIds.length === 0) return []

    // Get all quarterly records
    let recQuery = supabase
      .from('quarterly_records')
      .select('quarter, quarterly_target, month_1, month_2, month_3, status, focal_person')
      .in('bsc_entry_id', entryIds)

    if (filters.status) {
      recQuery = recQuery.eq('status', filters.status)
    }

    const { data: rawRecords } = await recQuery

    // Apply focal person filter client-side for reliability
    let records = rawRecords || []
    if (filters.hasFocalPerson === 'yes') {
      records = records.filter(r => r.focal_person && r.focal_person.trim() !== '')
    } else if (filters.hasFocalPerson === 'no') {
      records = records.filter(r => !r.focal_person || r.focal_person.trim() === '')
    }

    // Map quarters to months: q1 = Jan/Feb/Mar, q2 = Apr/May/Jun, etc.
    const monthlyData = new Array(12).fill(0)
    const monthlyCounts = new Array(12).fill(0)

    for (const record of records) {
      const target = parseFloat(record.quarterly_target) || 0
      if (target <= 0) continue

      let baseMonth = 0
      switch (record.quarter) {
        case 'q1': baseMonth = 0; break
        case 'q2': baseMonth = 3; break
        case 'q3': baseMonth = 6; break
        case 'q4': baseMonth = 9; break
      }

      const months = [record.month_1, record.month_2, record.month_3]
      months.forEach((val, i) => {
        const monthVal = parseFloat(val) || 0
        if (monthVal > 0) {
          monthlyData[baseMonth + i] += (monthVal / target) * 100
          monthlyCounts[baseMonth + i]++
        }
      })
    }

    // Average the percentages
    return monthlyData.map((total, i) =>
      monthlyCounts[i] > 0 ? Math.round(total / monthlyCounts[i]) : 0
    )
  } catch (error) {
    console.error('Error fetching monthly trend:', error)
    return []
  }
}

/**
 * Get performance data grouped by goal
 * @param {string|null} quarter
 * @param {object} filters - Additional filters
 * @returns {Promise<object>} - { labels, datasets }
 */
export async function getGoalPerformance(quarter = null, filters = {}) {
  try {
    // Resolve office-level filters
    const filteredOfficeIds = await resolveFilteredOfficeIds(filters)

    let entryQuery = supabase
      .from('bsc_entries')
      .select(`
        id,
        goal,
        office_id,
        perspective,
        quarterly_records (
          quarter,
          quarterly_target,
          month_1,
          month_2,
          month_3,
          status,
          focal_person
        )
      `)

    if (filteredOfficeIds !== null && filteredOfficeIds.length > 0) {
      entryQuery = entryQuery.in('office_id', filteredOfficeIds)
    } else if (filteredOfficeIds !== null && filteredOfficeIds.length === 0) {
      return { labels: [], datasets: [] }
    }

    if (filters.perspective) {
      entryQuery = entryQuery.eq('perspective', filters.perspective)
    }

    const { data: entries, error } = await entryQuery

    if (error) throw error

    // Group by goal
    const goalMap = {}

    for (const entry of (entries || [])) {
      if (!goalMap[entry.goal]) {
        goalMap[entry.goal] = { q1: [], q2: [], q3: [], q4: [] }
      }

      for (const record of (entry.quarterly_records || [])) {
        if (quarter && record.quarter !== quarter) {
          continue
        }

        // Apply status filter
        if (filters.status && record.status !== filters.status) {
          continue
        }

        // Apply focal person filter
        if (filters.hasFocalPerson === 'yes' && (!record.focal_person || record.focal_person.trim() === '')) {
          continue
        }
        if (filters.hasFocalPerson === 'no' && record.focal_person && record.focal_person.trim() !== '') {
          continue
        }

        const target = parseFloat(record.quarterly_target) || 0
        if (target <= 0) continue
        const total = (parseFloat(record.month_1) || 0) +
                      (parseFloat(record.month_2) || 0) +
                      (parseFloat(record.month_3) || 0)
        const pct = Math.round((total / target) * 100)
        goalMap[entry.goal][record.quarter].push(pct)
      }
    }

    const labels = Object.keys(goalMap)

    if (labels.length === 0) return { labels: [], datasets: [] }

    const quarterColors = quarter
      ? {
          [quarter]: { bg: '#3b82f6', label: quarter.toUpperCase() }
        }
      : {
          q1: { bg: '#3b82f6', label: 'Q1' },
          q2: { bg: '#10b981', label: 'Q2' },
          q3: { bg: '#f59e0b', label: 'Q3' },
          q4: { bg: '#ef4444', label: 'Q4' }
        }

    const datasets = Object.keys(quarterColors).map(q => ({
      label: quarterColors[q].label,
      backgroundColor: quarterColors[q].bg,
      data: labels.map(goal => {
        const values = goalMap[goal][q]
        return values.length > 0
          ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          : 0
      })
    }))

    return { labels, datasets }
  } catch (error) {
    console.error('Error fetching goal performance:', error)
    return { labels: [], datasets: [] }
  }
}

/**
 * Get entries that have issues reported but no focal person assigned
 * Used for the Alerts table on the admin dashboard
 * @returns {Promise<array>}
 */
export async function getEntriesWithIssuesNoFocalPerson() {
  try {
    const { data: records, error } = await supabase
      .from('quarterly_records')
      .select(`
        id,
        quarter,
        issues,
        focal_person,
        bsc_entry_id,
        bsc_entries (
          id,
          kpi,
          office_id,
          offices (
            id,
            office_name
          )
        )
      `)
      .not('issues', 'is', null)
      .neq('issues', '')

    if (error) throw error

    // Filter to only those without a focal person
    const alerts = (records || [])
      .filter(r => !r.focal_person || r.focal_person.trim() === '')
      .map(r => ({
        id: r.id,
        officeName: r.bsc_entries?.offices?.office_name || 'Unknown',
        officeId: r.bsc_entries?.offices?.id || '',
        kpi: r.bsc_entries?.kpi || 'Unknown KPI',
        quarter: r.quarter,
        issue: r.issues,
        entryId: r.bsc_entry_id
      }))

    return alerts
  } catch (error) {
    console.error('Error fetching entries with issues:', error)
    return []
  }
}
