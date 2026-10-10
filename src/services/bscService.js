import { supabase } from '@/lib/supabase'
import { getCurrentYear } from '@/utils/quarterHelpers'

/**
 * Maps a database row onto the camelCase shape the UI works with.
 * @param {object} entry
 * @returns {object}
 */
function mapEntry(entry) {
  return {
    id: entry.id,
    office_id: entry.office_id,
    officeId: entry.office_id,
    goal: entry.goal,
    perspective: entry.perspective,
    strategicObjective: entry.strategic_objective,
    kpi: entry.kpi,
    targetValue: entry.target_value,
    targetYear: entry.target_year,
    createdAt: entry.created_at
  }
}

/**
 * Get all BSC entries visible to the caller.
 * Office users see only their own rows (enforced by RLS); admins see all.
 * @param {number|null} [year] - Filter to a target year, null for all years
 * @returns {Promise<array>}
 */
export async function getAllEntries(year = null) {
  try {
    let query = supabase
      .from('bsc_entries')
      .select('*')
      .order('created_at', { ascending: true })

    if (year !== null && year !== undefined) {
      query = query.eq('target_year', year)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(mapEntry)
  } catch (error) {
    console.error('Error fetching all BSC entries:', error)
    return []
  }
}

/**
 * Get all BSC entries for an office
 * @param {string} officeId - The office ID
 * @param {number|null} [year] - Filter to a target year, null for all years
 * @returns {Promise<array>}
 */
export async function getEntries(officeId, year = null) {
  return getEntriesForOffices([officeId], year)
}

/**
 * Get BSC entries for several offices in one round trip.
 * @param {string[]} officeIds
 * @param {number|null} [year] - Filter to a target year, null for all years
 * @returns {Promise<array>}
 */
export async function getEntriesForOffices(officeIds = [], year = null) {
  try {
    const ids = officeIds.filter(Boolean)

    if (ids.length === 0) return []

    let query = supabase
      .from('bsc_entries')
      .select('*')
      .in('office_id', ids)
      .order('created_at', { ascending: true })

    if (year !== null && year !== undefined) {
      query = query.eq('target_year', year)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(mapEntry)
  } catch (error) {
    console.error('Error fetching BSC entries:', error)
    return []
  }
}

/**
 * Create new BSC entry
 * @param {string} officeId - The office ID
 * @param {object} data - {goal, perspective, strategicObjective, kpi, targetValue, targetYear}
 * @returns {Promise<object>}
 */
export async function createEntry(officeId, data) {
  try {
    const { data: entry, error } = await supabase
      .from('bsc_entries')
      .insert({
        office_id: officeId,
        goal: data.goal,
        perspective: data.perspective,
        strategic_objective: data.strategicObjective,
        kpi: data.kpi,
        target_value: data.targetValue,
        target_year: data.targetYear ?? getCurrentYear()
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      message: 'BSC entry created successfully',
      entry: mapEntry(entry)
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to create BSC entry')
  }
}

/**
 * Update existing BSC entry
 * @param {string} entryId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateEntry(entryId, data) {
  try {
    const payload = {
      goal: data.goal,
      perspective: data.perspective,
      strategic_objective: data.strategicObjective,
      kpi: data.kpi,
      target_value: data.targetValue,
      updated_at: new Date().toISOString()
    }

    if (data.targetYear !== undefined && data.targetYear !== null) {
      payload.target_year = data.targetYear
    }

    const { error, count } = await supabase
      .from('bsc_entries')
      .update(payload, { count: 'exact' })
      .eq('id', entryId)

    if (error) throw error

    if (count === 0) {
      throw new Error('Failed to update BSC entry. Entry may not exist or permission was denied.')
    }

    return {
      success: true,
      message: 'BSC entry updated successfully'
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to update BSC entry')
  }
}

/**
 * Delete BSC entry
 * @param {string} entryId
 * @returns {Promise<object>}
 */
export async function deleteEntry(entryId) {
  try {
    // Count the affected rows so an RLS-blocked delete reports failure rather
    // than silently succeeding with nothing removed.
    const { error, count } = await supabase
      .from('bsc_entries')
      .delete({ count: 'exact' })
      .eq('id', entryId)

    if (error) throw error

    if (count === 0) {
      throw new Error('Failed to delete BSC entry. Entry may not exist or permission was denied.')
    }

    return {
      success: true,
      message: 'BSC entry deleted successfully'
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to delete BSC entry')
  }
}
