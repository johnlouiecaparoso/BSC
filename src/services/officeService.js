import { supabase } from '@/lib/supabase'

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

    return (data || []).map(office => ({
      id: office.id,
      officeName: office.office_name,
      pillar: office.pillar,
      assignmentType: office.assignment_type,
      createdAt: office.created_at
    }))
  } catch (error) {
    console.error('Error fetching offices:', error)
    return []
  }
}

/**
 * Get office profile by user ID (gets the first office for backward compatibility)
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return {
      id: data.id,
      officeName: data.office_name,
      pillar: data.pillar,
      assignmentType: data.assignment_type
    }
  } catch (error) {
    console.error('Error fetching office profile:', error)
    return null
  }
}

/**
 * Update office profile
 * @param {string} userId
 * @param {object} data - {officeName, pillar, assignmentType}
 * @returns {Promise<object>}
 */
export async function updateProfile(userId, data) {
  try {
    const { error } = await supabase
      .from('offices')
      .update({
        office_name: data.officeName,
        pillar: data.pillar,
        assignment_type: data.assignmentType,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) throw error

    return {
      success: true,
      message: 'Profile updated successfully'
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to update profile')
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
      .insert([
        {
          user_id: userId,
          office_name: data.officeName,
          pillar: data.pillar,
          assignment_type: data.assignmentType,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error

    return {
      id: newOffice[0].id,
      officeName: newOffice[0].office_name,
      pillar: newOffice[0].pillar,
      assignmentType: newOffice[0].assignment_type
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to create office')
  }
}

/**
 * Update an office
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

    if (error) throw error

    return {
      id: updated[0].id,
      officeName: updated[0].office_name,
      pillar: updated[0].pillar,
      assignmentType: updated[0].assignment_type
    }
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

    if (error) {
      console.error('Error deleting office:', error)
      throw error
    }

    console.log(`Deleted ${count} office(s)`)

    if (count === 0) {
      const message = 'Failed to delete office. This is usually because: 1) Office doesn\'t exist, 2) RLS policy denied deletion, or 3) You don\'t have permission to delete this office.'
      console.error(message)
      throw new Error(message)
    }

    return {
      success: true,
      message: 'Office deleted successfully'
    }
  } catch (error) {
    console.error('Delete office error:', error)
    throw new Error(error.message || 'Failed to delete office')
  }
}
