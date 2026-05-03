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
 * Get status distribution across all quarterly records
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getStatusDistribution(filters = {}) {
  try {
    let query = supabase
      .from('quarterly_records')
      .select('status, quarter')

    if (filters.quarter) {
      query = query.eq('quarter', filters.quarter)
    }

    const { data, error } = await query

    if (error) throw error

    const distribution = {
      notStarted: 0,
      ongoing: 0,
      completed: 0,
      delayed: 0,
      forValidation: 0
    }

    for (const record of (data || [])) {
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
 * @returns {Promise<array>}
 */
export async function getAccomplishmentByOffice(quarter = 'q1', officeFilter = null) {
  try {
    // Get approved offices without relying on a filtered join so we keep every office visible
    const { data: offices, error: officesError } = await supabase
      .from('offices')
      .select(`
        id,
        office_name,
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

      // Filter by office name if provided
      if (officeFilter && !office.office_name.toLowerCase().includes(officeFilter.toLowerCase())) {
        continue
      }

      // Get entries for this office
      const { data: entries } = await supabase
        .from('bsc_entries')
        .select('id')
        .eq('office_id', office.id)

      const entryIds = (entries || []).map(e => e.id)
      if (entryIds.length === 0) {
        results.push({ officeName: office.office_name, percentage: 0 })
        continue
      }

      // Get quarterly records
      const { data: records } = await supabase
        .from('quarterly_records')
        .select('quarterly_target, month_1, month_2, month_3')
        .in('bsc_entry_id', entryIds)
        .eq('quarter', quarter)

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
 * @returns {Promise<array>}
 */
export async function getMonthlyTrend(officeId = null, year = 2026) {
  try {
    // Build base query for quarterly records
    let entryIds = []

    if (officeId) {
      // Get entries for specific office
      const { data: entries } = await supabase
        .from('bsc_entries')
        .select('id')
        .eq('office_id', officeId)

      entryIds = (entries || []).map(e => e.id)
    } else {
      // Get all entries
      const { data: entries } = await supabase
        .from('bsc_entries')
        .select('id')

      entryIds = (entries || []).map(e => e.id)
    }

    if (entryIds.length === 0) return []

    // Get all quarterly records
    const { data: records } = await supabase
      .from('quarterly_records')
      .select('quarter, quarterly_target, month_1, month_2, month_3')
      .in('bsc_entry_id', entryIds)

    // Map quarters to months: q1 = Jan/Feb/Mar, q2 = Apr/May/Jun, etc.
    const monthlyData = new Array(12).fill(0)
    const monthlyCounts = new Array(12).fill(0)

    for (const record of (records || [])) {
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
 * @returns {Promise<object>} - { labels, datasets }
 */
export async function getGoalPerformance(quarter = null) {
  try {
    // Get all BSC entries with their quarterly records
    const { data: entries, error } = await supabase
      .from('bsc_entries')
      .select(`
        id,
        goal,
        quarterly_records (
          quarter,
          quarterly_target,
          month_1,
          month_2,
          month_3
        )
      `)

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
