import { supabase } from '@/lib/supabase'

/**
 * Maps a database row onto the camelCase shape the UI works with.
 * @param {object} office
 * @returns {object}
 */
function mapOffice(office) {
  return {
    id: office.id,
    officeName: office.office_name,
    pillar: office.pillar,
    assignmentType: office.assignment_type,
    createdAt: office.created_at,
    updatedAt: office.updated_at
  }
}

/**
 * Get all offices for a user
 * @param {string} userId
 * @returns {Promise<array>}
 */
export async function getAllOfficesByUser(userId) {
  try {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(mapOffice)
  } catch (error) {
    console.error('Error fetching offices:', error)
    return []
  }
}

/**
 * Get a single office by its own ID.
 * @param {string} officeId
 * @returns {Promise<object|null>}
 */
export async function getOffice(officeId) {
  try {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('id', officeId)
      .maybeSingle()

    if (error) throw error

    return data ? mapOffice(data) : null
  } catch (error) {
    console.error('Error fetching office:', error)
    return null
  }
}

/**
 * Get the user's first office.
 * A user may own several offices, so this deliberately takes the newest rather
 * than using .single(), which threw PGRST116 as soon as a second office existed.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getPrimaryOffice(userId) {
  try {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return data ? mapOffice(data) : null
  } catch (error) {
    console.error('Error fetching primary office:', error)
    return null
  }
}

/**
 * Create a new office
 * @param {string} userId
 * @param {object} data - {officeName, pillar, assignmentType}
 * @returns {Promise<object>}
 */
export async function createOffice(userId, data) {
  try {
    const { data: newOffice, error } = await supabase
      .from('offices')
      .insert({
        user_id: userId,
        office_name: data.officeName,
        pillar: data.pillar,
        assignment_type: data.assignmentType
      })
      .select()
      .single()

    if (error) throw error

    return mapOffice(newOffice)
  } catch (error) {
    throw new Error(error.message || 'Failed to create office')
  }
}

/**
 * Update an office by its own ID.
 * Keyed on `id`, never on `user_id` — a user can own several offices, and
 * updating by user_id overwrote every one of them with the same values.
 * @param {string} officeId
 * @param {object} data - {officeName, pillar, assignmentType}
 * @returns {Promise<object>}
 */
export async function updateOffice(officeId, data) {
  try {
    const { data: updated, error } = await supabase
      .from('offices')
      .update({
        office_name: data.officeName,
        pillar: data.pillar,
        assignment_type: data.assignmentType,
        updated_at: new Date().toISOString()
      })
      .eq('id', officeId)
      .select()
      .maybeSingle()

    if (error) throw error

    if (!updated) {
      throw new Error('Failed to update office. Office may not exist or permission was denied.')
    }

    return mapOffice(updated)
  } catch (error) {
    throw new Error(error.message || 'Failed to update office')
  }
}

/**
 * Delete an office and all its BSC entries
 * @param {string} officeId
 * @returns {Promise<object>}
 */
export async function deleteOffice(officeId) {
  try {
    // Delete the office directly and rely on ON DELETE CASCADE for child BSC entries.
    // Use exact count so we can distinguish real no-op from successful deletion.
    const { error, count } = await supabase
      .from('offices')
      .delete({ count: 'exact' })
      .eq('id', officeId)

    if (error) throw error

    if (count === 0) {
      throw new Error(
        'Failed to delete office. It may not exist, or a row-level security policy denied the deletion.'
      )
    }

    return {
      success: true,
      message: 'Office deleted successfully'
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to delete office')
  }
}
