import { supabase } from '@/lib/supabase'

/**
 * Get quarterly records for an office
 * @param {string} officeId - The office ID (not user ID)
 * @param {string} quarter - q1, q2, q3, q4
 * @returns {Promise<array>}
 */
export async function getRecords(officeId, quarter) {
  try {
    // Get all BSC entries for this specific office
    const { data: entries, error: entriesError } = await supabase
      .from('bsc_entries')
      .select('id')
      .eq('office_id', officeId)

    if (entriesError) throw entriesError

    const entryIds = entries.map(e => e.id)

    if (entryIds.length === 0) return []

    // Get quarterly records for these entries AND this quarter
    const { data, error } = await supabase
      .from('quarterly_records')
      .select('*')
      .in('bsc_entry_id', entryIds)
      .eq('quarter', quarter)

    if (error) throw error

    return data.map(record => ({
      id: record.id,
      entryId: record.bsc_entry_id,
      quarter: record.quarter,
      quarterlyTarget: record.quarterly_target,
      month1: record.month_1,
      month2: record.month_2,
      month3: record.month_3,
      keyActivities: record.key_activities,
      mov: record.mov,
      status: record.status,
      issues: record.issues,
      assistance: record.assistance,
      focalPerson: record.focal_person
    }))
  } catch (error) {
    console.error('Error fetching quarterly records:', error)
    return []
  }
}

/**
 * Save quarterly record
 * @param {string} userId
 * @param {string} entryId
 * @param {string} quarter
 * @param {object} data - Performance and activities data
 * @returns {Promise<object>}
 */
export async function saveRecord(userId, entryId, quarter, data) {
  try {
    // Check if record exists
    const { data: existing, error: checkError } = await supabase
      .from('quarterly_records')
      .select('id')
      .eq('bsc_entry_id', entryId)
      .eq('quarter', quarter)
      .maybeSingle()

    if (checkError) throw checkError

    const recordData = {
      bsc_entry_id: entryId,
      quarter: quarter,
      quarterly_target: data.quarterlyTarget || null,
      month_1: data.month1 || null,
      month_2: data.month2 || null,
      month_3: data.month3 || null,
      key_activities: data.keyActivities || null,
      mov: data.mov || null,
      status: data.status || null,
      issues: data.issues || null,
      assistance: data.assistance || null,
      updated_at: new Date().toISOString()
    }

    let savedRecord = null

    if (existing) {
      // Update existing record
      const { data: updatedRecord, error } = await supabase
        .from('quarterly_records')
        .update(recordData)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) throw error
      savedRecord = updatedRecord
    } else {
      // Insert new record
      const { data: insertedRecord, error } = await supabase
        .from('quarterly_records')
        .insert(recordData)
        .select('*')
        .single()

      if (error) throw error
      savedRecord = insertedRecord
    }

    return {
      success: true,
      message: 'Quarterly record saved successfully',
      record: {
        id: savedRecord.id,
        entryId: savedRecord.bsc_entry_id,
        quarter: savedRecord.quarter,
        quarterlyTarget: savedRecord.quarterly_target,
        month1: savedRecord.month_1,
        month2: savedRecord.month_2,
        month3: savedRecord.month_3,
        keyActivities: savedRecord.key_activities,
        mov: savedRecord.mov,
        status: savedRecord.status,
        issues: savedRecord.issues,
        assistance: savedRecord.assistance,
        focalPerson: savedRecord.focal_person
      }
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to save quarterly record')
  }
}

/**
 * Delete quarterly record
 * @param {string} recordId
 * @returns {Promise<object>}
 */
export async function deleteRecord(recordId) {
  try {
    const { error, count } = await supabase
      .from('quarterly_records')
      .delete({ count: 'exact' })
      .eq('id', recordId)

    if (error) throw error

    if (count === 0) {
      throw new Error('Failed to delete quarterly record. Record may not exist or permission was denied.')
    }

    return {
      success: true,
      message: 'Quarterly record deleted successfully'
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to delete quarterly record')
  }
}

/**
 * Update quarterly record
 * @param {string} recordId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateRecord(recordId, data) {
  try {
    const { error } = await supabase
      .from('quarterly_records')
      .update({
        quarterly_target: data.quarterlyTarget || null,
        month_1: data.month1 || null,
        month_2: data.month2 || null,
        month_3: data.month3 || null,
        key_activities: data.keyActivities || null,
        mov: data.mov || null,
        status: data.status || null,
        issues: data.issues || null,
        assistance: data.assistance || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)

    if (error) throw error

    return {
      success: true,
      message: 'Quarterly record updated successfully'
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to update quarterly record')
  }
}
