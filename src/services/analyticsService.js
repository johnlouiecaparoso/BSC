import { supabase } from '@/lib/supabase'
import { toNumber } from '@/utils/computeAccomplishment'
import { getCurrentYear, getQuarterStartMonth, QUARTERS } from '@/utils/quarterHelpers'

/**
 * Analytics Service
 * Full Supabase implementation for analytics and chart data.
 *
 * Every aggregation here follows the same shape: fetch offices, entries and
 * records in a fixed number of round trips, then group in memory. Looping a
 * query per office turns one chart into 2N sequential requests.
 */

const ID_CHUNK_SIZE = 200

const normalizeText = (value) => (value || '').toString().trim().toLowerCase()

const matchesContains = (value, filterValue) => {
  if (!filterValue) return true
  return normalizeText(value).includes(normalizeText(filterValue))
}

const hasAssignedFocalPerson = (record) => {
  const focalPerson = record?.focal_person ?? record?.focalPerson ?? ''
  return focalPerson.toString().trim() !== ''
}

const matchesOfficeApprovalStatus = (profiles) => {
  if (Array.isArray(profiles)) {
    return profiles.some(profile => profile?.status === 'approved')
  }

  return profiles?.status === 'approved'
}

const matchesOfficeFocalPersonFilter = (records = [], filters = {}) => {
  if (!filters.hasFocalPerson) {
    return true
  }

  if (records.length === 0) {
    return false
  }

  if (filters.hasFocalPerson === 'yes') {
    return records.some(record => hasAssignedFocalPerson(record))
  }

  if (filters.hasFocalPerson === 'no') {
    return records.every(record => !hasAssignedFocalPerson(record))
  }

  return true
}

const applyRecordFilters = (records = [], filters = {}) => {
  return records.filter((record) => {
    if (filters.status && record.status !== filters.status) {
      return false
    }

    if (filters.hasFocalPerson === 'yes') {
      return hasAssignedFocalPerson(record)
    }

    if (filters.hasFocalPerson === 'no') {
      return !hasAssignedFocalPerson(record)
    }

    return true
  })
}

const matchesEntryFilters = (entry, filters = {}) =>
  matchesContains(entry.goal, filters.goal) &&
  matchesContains(entry.perspective, filters.perspective) &&
  matchesContains(entry.strategic_objective, filters.strategicObjective) &&
  matchesContains(entry.kpi, filters.kpi)

const matchesOfficeFilters = (office, filters = {}, officeSearch = null) => {
  if (officeSearch && !matchesContains(office.office_name, officeSearch)) return false
  if (!matchesContains(office.office_name, filters.office)) return false
  if (filters.pillar && !matchesContains(office.pillar, filters.pillar)) return false
  if (filters.assignmentType && !matchesContains(office.assignment_type, filters.assignmentType)) return false

  return true
}

/**
 * Splits a list of ids into chunks so `.in(...)` never builds an over-long URL.
 * @param {array} items
 * @param {number} size
 * @returns {array[]}
 */
function chunk(items, size = ID_CHUNK_SIZE) {
  const chunks = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

/**
 * Fetches every approved office once.
 * @returns {Promise<array>}
 */
async function fetchApprovedOffices() {
  const { data, error } = await supabase
    .from('offices')
    .select('id, office_name, pillar, assignment_type, profiles (status)')

  if (error) throw error

  return (data || []).filter(office => matchesOfficeApprovalStatus(office.profiles))
}

/**
 * Fetches BSC entries for the given offices in as few requests as possible.
 * @param {string[]} officeIds
 * @param {number|null} year
 * @returns {Promise<array>}
 */
async function fetchEntries(officeIds, year = null) {
  if (officeIds.length === 0) return []

  const batches = await Promise.all(
    chunk(officeIds).map(async (ids) => {
      let query = supabase
        .from('bsc_entries')
        .select('id, office_id, goal, perspective, strategic_objective, kpi')
        .in('office_id', ids)

      if (year !== null && year !== undefined) {
        query = query.eq('target_year', year)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    })
  )

  return batches.flat()
}

/**
 * Fetches quarterly records for the given entries in as few requests as possible.
 * @param {string[]} entryIds
 * @param {object} options - {quarter, year, status}
 * @returns {Promise<array>}
 */
async function fetchRecords(entryIds, { quarter = null, year = null, status = null } = {}) {
  if (entryIds.length === 0) return []

  const batches = await Promise.all(
    chunk(entryIds).map(async (ids) => {
      let query = supabase
        .from('quarterly_records')
        .select('bsc_entry_id, quarter, year, quarterly_target, month_1, month_2, month_3, status, focal_person')
        .in('bsc_entry_id', ids)

      if (quarter) query = query.eq('quarter', quarter)
      if (year !== null && year !== undefined) query = query.eq('year', year)
      if (status) query = query.eq('status', status)

      const { data, error } = await query

      if (error) throw error

      return data || []
    })
  )

  return batches.flat()
}

/**
 * Groups an array by a key selector.
 * @param {array} items
 * @param {function} keyOf
 * @returns {object}
 */
function groupBy(items, keyOf) {
  return items.reduce((acc, item) => {
    const key = keyOf(item)

    if (!acc[key]) acc[key] = []
    acc[key].push(item)

    return acc
  }, {})
}

/**
 * Sums the three monthly columns of a record.
 * @param {object} record
 * @returns {number}
 */
function recordTotal(record) {
  return toNumber(record.month_1) + toNumber(record.month_2) + toNumber(record.month_3)
}

/**
 * Get university-wide statistics
 * @param {number|null} [year] - Reporting year, null for all years
 * @returns {Promise<object>}
 */
export async function getUniversityWideStats(year = getCurrentYear()) {
  try {
    let issuesQuery = supabase
      .from('quarterly_records')
      .select('id', { count: 'exact', head: true })
      .not('issues', 'is', null)
      .neq('issues', '')
      .or('focal_person.is.null,focal_person.eq.')

    if (year !== null && year !== undefined) {
      issuesQuery = issuesQuery.eq('year', year)
    }

    let entriesQuery = supabase
      .from('bsc_entries')
      .select('id', { count: 'exact', head: true })

    if (year !== null && year !== undefined) {
      entriesQuery = entriesQuery.eq('target_year', year)
    }

    const [offices, entries, pending, issues] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'office')
        .eq('status', 'approved'),
      entriesQuery,
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('role', 'office'),
      issuesQuery
    ])

    return {
      totalOffices: offices.count || 0,
      totalEntries: entries.count || 0,
      pendingApprovals: pending.count || 0,
      entriesWithIssuesNoFocalPerson: issues.count || 0
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
 * @param {object} [options] - {quarter, year}
 * @returns {Promise<object>}
 */
export async function getOfficeStats(officeId, { quarter = null, year = getCurrentYear() } = {}) {
  try {
    const entries = await fetchEntries([officeId], year)
    const entryIds = entries.map(e => e.id)

    if (entryIds.length === 0) {
      return { totalEntries: 0, averageAccomplishment: 0, completedEntries: 0 }
    }

    const records = await fetchRecords(entryIds, { quarter, year })

    const completedEntries = records.filter(r => r.status === 'Completed').length

    let totalAccomplishment = 0
    let totalTarget = 0

    for (const record of records) {
      const target = toNumber(record.quarterly_target)

      if (target > 0) {
        totalAccomplishment += recordTotal(record)
        totalTarget += target
      }
    }

    // Weighted by target rather than a mean of per-record percentages, so a KPI
    // with a target of 500 counts for more than one with a target of 2.
    const averageAccomplishment = totalTarget > 0
      ? Math.round((totalAccomplishment / totalTarget) * 100)
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
 * Get status distribution across quarterly records
 * @param {object} filters - May include quarter, year and the FilterPanel fields
 * @returns {Promise<object>}
 */
export async function getStatusDistribution(filters = {}) {
  const distribution = {
    notStarted: 0,
    ongoing: 0,
    completed: 0,
    delayed: 0,
    forValidation: 0
  }

  try {
    const year = filters.year ?? getCurrentYear()

    const offices = await fetchApprovedOffices()
    const scopedOffices = offices.filter(office => matchesOfficeFilters(office, filters))

    if (scopedOffices.length === 0) return distribution

    const entries = await fetchEntries(scopedOffices.map(o => o.id), year)
    const scopedEntries = entries.filter(entry => matchesEntryFilters(entry, filters))

    if (scopedEntries.length === 0) return distribution

    const records = await fetchRecords(scopedEntries.map(e => e.id), {
      quarter: filters.quarter || null,
      year,
      status: filters.status || null
    })

    for (const record of applyRecordFilters(records, filters)) {
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
    return distribution
  }
}

/**
 * Get accomplishment data by office for a quarter.
 * Runs three queries total regardless of how many offices exist.
 * @param {string} quarter
 * @param {string|null} officeSearch - Optional office name from the search bar
 * @param {object} filters - Additional filters from FilterPanel
 * @returns {Promise<array>}
 */
export async function getAccomplishmentByOffice(quarter = 'q1', officeSearch = null, filters = {}) {
  try {
    const year = filters.year ?? getCurrentYear()

    const offices = await fetchApprovedOffices()
    const scopedOffices = offices.filter(office => matchesOfficeFilters(office, filters, officeSearch))

    if (scopedOffices.length === 0) return []

    const entries = await fetchEntries(scopedOffices.map(o => o.id), year)
    const scopedEntries = entries.filter(entry => matchesEntryFilters(entry, filters))
    const entriesByOffice = groupBy(scopedEntries, e => e.office_id)

    const records = await fetchRecords(scopedEntries.map(e => e.id), {
      quarter,
      year,
      status: filters.status || null
    })
    const recordsByEntry = groupBy(records, r => r.bsc_entry_id)

    const hasRecordFilter = Boolean(filters.status || filters.hasFocalPerson)
    const results = []

    for (const office of scopedOffices) {
      const officeEntries = entriesByOffice[office.id] || []

      if (officeEntries.length === 0) {
        // Offices with no entries still appear at 0% so they are visible as
        // non-reporting, but only when no record-level filter is narrowing the view.
        if (!hasRecordFilter) {
          results.push({
            officeId: office.id,
            officeName: office.office_name,
            totalAccomplishment: 0,
            totalTarget: 0,
            percentage: 0
          })
        }
        continue
      }

      const rawRecords = officeEntries.flatMap(entry => recordsByEntry[entry.id] || [])

      if (!matchesOfficeFocalPersonFilter(rawRecords, filters)) continue

      const officeRecords = applyRecordFilters(rawRecords, filters)

      if (hasRecordFilter && officeRecords.length === 0) continue

      let totalAccomplishment = 0
      let totalTarget = 0

      for (const record of officeRecords) {
        const target = toNumber(record.quarterly_target)

        if (target > 0) {
          totalAccomplishment += recordTotal(record)
          totalTarget += target
        }
      }

      results.push({
        officeId: office.id,
        officeName: office.office_name,
        totalAccomplishment,
        totalTarget,
        percentage: totalTarget > 0 ? Math.round((totalAccomplishment / totalTarget) * 100) : 0
      })
    }

    return results.sort((a, b) => b.percentage - a.percentage)
  } catch (error) {
    console.error('Error fetching accomplishment by office:', error)
    return []
  }
}

/**
 * Get monthly trend data for an office or university-wide.
 * Returns twelve values; months with no reported data are null so the line
 * breaks rather than dropping to zero.
 * @param {string|null} officeId - null for university-wide
 * @param {number} year
 * @param {object} filters - Additional filters
 * @returns {Promise<Array<number|null>>}
 */
export async function getMonthlyTrend(officeId = null, year = getCurrentYear(), filters = {}) {
  try {
    const reportingYear = year ?? filters.year ?? getCurrentYear()

    let officeIds

    if (officeId) {
      officeIds = [officeId]
    } else {
      const offices = await fetchApprovedOffices()
      officeIds = offices
        .filter(office => matchesOfficeFilters(office, filters))
        .map(o => o.id)
    }

    if (officeIds.length === 0) return []

    const entries = await fetchEntries(officeIds, reportingYear)
    const scopedEntries = entries.filter(entry => matchesEntryFilters(entry, filters))

    if (scopedEntries.length === 0) return []

    const rawRecords = await fetchRecords(scopedEntries.map(e => e.id), {
      year: reportingYear,
      status: filters.status || null
    })
    const records = applyRecordFilters(rawRecords, filters)

    const monthlyTotals = new Array(12).fill(0)
    const monthlyTargets = new Array(12).fill(0)
    const monthlyReported = new Array(12).fill(false)

    for (const record of records) {
      const target = toNumber(record.quarterly_target)

      if (target <= 0) continue

      const baseMonth = getQuarterStartMonth(record.quarter)

      // Unknown quarter values would otherwise write outside the 12-month array.
      if (baseMonth === null) continue

      // A quarterly target spread evenly across its three months, so a month's
      // percentage is comparable to the others.
      const monthlyTarget = target / 3
      const months = [record.month_1, record.month_2, record.month_3]

      months.forEach((value, index) => {
        // A reported 0 is real data and must pull the average down. Only a null
        // (nothing submitted) is skipped — the old `> 0` check dropped genuine
        // zeros and biased the trend upward.
        if (value === null || value === undefined) return

        monthlyTotals[baseMonth + index] += toNumber(value)
        monthlyTargets[baseMonth + index] += monthlyTarget
        monthlyReported[baseMonth + index] = true
      })
    }

    return monthlyTotals.map((total, index) => {
      if (!monthlyReported[index] || monthlyTargets[index] <= 0) return null

      return Math.round((total / monthlyTargets[index]) * 100)
    })
  } catch (error) {
    console.error('Error fetching monthly trend:', error)
    return []
  }
}

/**
 * Get performance data grouped by goal.
 * Datasets are per-quarter averages, so the chart must render them grouped —
 * stacking them would sum four averages into a meaningless 0-400% bar.
 * @param {string|null} quarter
 * @param {object} filters - Additional filters
 * @returns {Promise<object>} - { labels, datasets }
 */
export async function getGoalPerformance(quarter = null, filters = {}) {
  const empty = { labels: [], datasets: [] }

  try {
    const year = filters.year ?? getCurrentYear()

    const offices = await fetchApprovedOffices()
    const scopedOffices = offices.filter(office => matchesOfficeFilters(office, filters))

    if (scopedOffices.length === 0) return empty

    const entries = await fetchEntries(scopedOffices.map(o => o.id), year)
    const scopedEntries = entries.filter(entry => matchesEntryFilters(entry, filters))

    if (scopedEntries.length === 0) return empty

    const records = await fetchRecords(scopedEntries.map(e => e.id), {
      quarter: quarter || null,
      year,
      status: filters.status || null
    })
    const recordsByEntry = groupBy(applyRecordFilters(records, filters), r => r.bsc_entry_id)

    // Accumulate accomplishment and target per goal per quarter, so the result is
    // weighted by target instead of averaging percentages of unequal size.
    const goalMap = {}

    for (const entry of scopedEntries) {
      const goal = entry.goal || 'Unspecified goal'

      if (!goalMap[goal]) {
        goalMap[goal] = QUARTERS.reduce((acc, q) => {
          acc[q] = { accomplishment: 0, target: 0 }
          return acc
        }, {})
      }

      for (const record of (recordsByEntry[entry.id] || [])) {
        const bucket = goalMap[goal][record.quarter]

        // Skip quarters outside q1-q4 rather than throwing on an undefined bucket.
        if (!bucket) continue

        const target = toNumber(record.quarterly_target)

        if (target <= 0) continue

        bucket.accomplishment += recordTotal(record)
        bucket.target += target
      }
    }

    const labels = Object.keys(goalMap)

    if (labels.length === 0) return empty

    const quarterStyles = {
      q1: { bg: '#3b82f6', label: 'Q1' },
      q2: { bg: '#10b981', label: 'Q2' },
      q3: { bg: '#f59e0b', label: 'Q3' },
      q4: { bg: '#ef4444', label: 'Q4' }
    }

    const visibleQuarters = quarter ? [quarter] : QUARTERS

    const datasets = visibleQuarters
      .filter(q => quarterStyles[q])
      .map(q => ({
        label: quarterStyles[q].label,
        backgroundColor: quarterStyles[q].bg,
        data: labels.map((goal) => {
          const bucket = goalMap[goal][q]

          return bucket && bucket.target > 0
            ? Math.round((bucket.accomplishment / bucket.target) * 100)
            : 0
        })
      }))

    return { labels, datasets }
  } catch (error) {
    console.error('Error fetching goal performance:', error)
    return empty
  }
}

/**
 * Get entries that have issues reported but no focal person assigned
 * Used for the Alerts table on the admin dashboard
 * @param {number|null} [year] - Reporting year, null for all years
 * @returns {Promise<array>}
 */
export async function getEntriesWithIssuesNoFocalPerson(year = getCurrentYear()) {
  try {
    let query = supabase
      .from('quarterly_records')
      .select(`
        id,
        quarter,
        year,
        issues,
        focal_person,
        bsc_entry_id,
        updated_at,
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
      .order('updated_at', { ascending: false })

    if (year !== null && year !== undefined) {
      query = query.eq('year', year)
    }

    const { data: records, error } = await query

    if (error) throw error

    return (records || [])
      .filter(r => !r.focal_person || r.focal_person.trim() === '')
      .map(r => ({
        id: r.id,
        officeName: r.bsc_entries?.offices?.office_name || 'Unknown',
        officeId: r.bsc_entries?.offices?.id || '',
        kpi: r.bsc_entries?.kpi || 'Unknown KPI',
        quarter: r.quarter,
        year: r.year,
        issue: r.issues,
        entryId: r.bsc_entry_id,
        updatedAt: r.updated_at
      }))
  } catch (error) {
    console.error('Error fetching entries with issues:', error)
    return []
  }
}
