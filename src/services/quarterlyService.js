import { supabase } from '@/lib/supabase'
import { toNullableNumber } from '@/utils/computeAccomplishment'
import { getCurrentYear } from '@/utils/quarterHelpers'

/**
 * Maps a database row onto the camelCase shape the UI works with.
 * @param {object} record
 * @returns {object}
 */
function mapRecord(record) {
  return {
    id: record.id,
    entryId: record.bsc_entry_id,
    quarter: record.quarter,
    year: record.year,
    quarterlyTarget: record.quarterly_target,
    month1: record.month_1,
    month2: record.month_2,
    month3: record.month_3,
    keyActivities: record.key_activities,
    mov: record.mov,
    status: record.status,
    issues: record.issues,
    assistance: record.assistance,
    focalPerson: record.focal_person,
    updatedAt: record.updated_at,
    createdAt: record.created_at
  }
}

/**
 * Builds the writable column set from UI data.
 * Numeric fields go through toNullableNumber so a typed 0 is stored as 0 and
 * only a blank field becomes null.
 * @param {object} data
 * @returns {object}
 */
function buildRecordPayload(data) {
  return {
    quarterly_target: toNullableNumber(data.quarterlyTarget),
    month_1: toNullableNumber(data.month1),
    month_2: toNullableNumber(data.month2),
    month_3: toNullableNumber(data.month3),
    key_activities: data.keyActivities || null,
    mov: data.mov || null,
    status: data.status || null,
    issues: data.issues || null,
    assistance: data.assistance || null,
    updated_at: new Date().toISOString()
  }
}

/**
 * Get quarterly records for a single office
 * @param {string} officeId - The office ID (not user ID)
 * @param {string} quarter - q1, q2, q3, q4
 * @param {number} [year] - Reporting year, defaults to the current year
 * @returns {Promise<array>}
 */
export async function getRecords(officeId, quarter, year = getCurrentYear()) {
  return getRecordsForOffices([officeId], quarter, year)
}

/**
 * Get quarterly records for several offices in one round trip.
 * Callers used to loop getRecords per office, which meant two sequential
 * queries per office on every quarter change.
 * @param {string[]} officeIds
 * @param {string} quarter - q1, q2, q3, q4
 * @param {number} [year] - Reporting year, defaults to the current year
 * @returns {Promise<array>}
 */
export async function getRecordsForOffices(officeIds = [], quarter, year = getCurrentYear()) {
  try {
    const ids = officeIds.filter(Boolean)

    if (ids.length === 0) return []

    const { data: entries, error: entriesError } = await supabase
      .from('bsc_entries')
      .select('id')
      .in('office_id', ids)

    if (entriesError) throw entriesError

    const entryIds = (entries || []).map(e => e.id)

    if (entryIds.length === 0) return []

    let query = supabase
      .from('quarterly_records')
      .select('*')
      .in('bsc_entry_id', entryIds)
      .eq('quarter', quarter)

    if (year !== null && year !== undefined) {
      query = query.eq('year', year)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(mapRecord)
  } catch (error) {
    console.error('Error fetching quarterly records:', error)
    return []
  }
}

/**
 * Save quarterly record (insert or update for the entry/year/quarter)
 * @param {string} entryId
 * @param {string} quarter
 * @param {number} year
 * @param {object} data - Performance and activities data
 * @returns {Promise<object>}
 */
export async function saveRecord(entryId, quarter, year, data) {
  try {
    const reportingYear = year ?? getCurrentYear()

    const { data: existing, error: checkError } = await supabase
      .from('quarterly_records')
      .select('id')
      .eq('bsc_entry_id', entryId)
      .eq('quarter', quarter)
      .eq('year', reportingYear)
      .maybeSingle()

    if (checkError) throw checkError

    const payload = buildRecordPayload(data)

    let savedRecord = null

    if (existing) {
      const { data: updatedRecord, error } = await supabase
        .from('quarterly_records')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) throw error
      savedRecord = updatedRecord
    } else {
      const { data: insertedRecord, error } = await supabase
        .from('quarterly_records')
        .insert({
          ...payload,
          bsc_entry_id: entryId,
          quarter,
          year: reportingYear
        })
        .select('*')
        .single()

      if (error) throw error
      savedRecord = insertedRecord
    }

    return {
      success: true,
      message: 'Quarterly record saved successfully',
      record: mapRecord(savedRecord)
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
    const { error, count } = await supabase
      .from('quarterly_records')
      .update(buildRecordPayload(data), { count: 'exact' })
      .eq('id', recordId)

    if (error) throw error

    if (count === 0) {
      throw new Error('Failed to update quarterly record. Record may not exist or permission was denied.')
    }

    return {
      success: true,
      message: 'Quarterly record updated successfully'
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to update quarterly record')
  }
}
