import { supabase } from '@/lib/supabase'

/**
 * Get all BSC entries for all offices
 * @returns {Promise<array>}
 */
export async function getAllEntries() {
  try {
    const { data, error } = await supabase
      .from('bsc_entries')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    return data.map(entry => ({
      id: entry.id,
      office_id: entry.office_id,
      officeId: entry.office_id,
      goal: entry.goal,
      perspective: entry.perspective,
      strategicObjective: entry.strategic_objective,
      kpi: entry.kpi,
      target2026: entry.target_2026,
      quarter: entry.quarter || 'q1',
      createdAt: entry.created_at
    }))
  } catch (error) {
    console.error('Error fetching all BSC entries:', error)
    return []
  }
}

/**
 * Get all BSC entries for an office
 * @param {string} officeId - The office ID
 * @returns {Promise<array>}
 */
export async function getEntries(officeId) {
  try {
    // Get BSC entries for this office
    const { data, error } = await supabase
      .from('bsc_entries')
      .select('*')
      .eq('office_id', officeId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return data.map(entry => ({
      id: entry.id,
      officeId: entry.office_id,
      goal: entry.goal,
      perspective: entry.perspective,
      strategicObjective: entry.strategic_objective,
      kpi: entry.kpi,
      target2026: entry.target_2026,
      quarter: entry.quarter || 'q1',
      createdAt: entry.created_at
    }))
  } catch (error) {
    console.error('Error fetching BSC entries:', error)
    return []
  }
}

/**
 * Create new BSC entry
 * @param {string} officeId - The office ID
 * @param {object} data - {goal, perspective, strategicObjective, kpi, target2026}
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
        target_2026: data.target2026
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      message: 'BSC entry created successfully',
      entry: {
        id: entry.id,
        officeId: entry.office_id,
        goal: entry.goal,
        perspective: entry.perspective,
        strategicObjective: entry.strategic_objective,
        kpi: entry.kpi,
        target2026: entry.target_2026,
        quarter: entry.quarter || 'q1'
      }
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
    const { error } = await supabase
      .from('bsc_entries')
      .update({
        goal: data.goal,
        perspective: data.perspective,
        strategic_objective: data.strategicObjective,
        kpi: data.kpi,
        target_2026: data.target2026,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)

    if (error) throw error

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
    const { error } = await supabase
      .from('bsc_entries')
      .delete()
      .eq('id', entryId)

    if (error) throw error

    return {
      success: true,
      message: 'BSC entry deleted successfully'
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to delete BSC entry')
  }
}
