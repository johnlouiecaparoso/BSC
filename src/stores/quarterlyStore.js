import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as quarterlyService from '@/services/quarterlyService'

export const useQuarterlyStore = defineStore('quarterly', () => {
  const records = ref([])
  const currentQuarter = ref('q1')
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchRecords(officeId, quarter) {
    isLoading.value = true
    error.value = null
    try {
      const data = await quarterlyService.getRecords(officeId, quarter)
      records.value = data
      currentQuarter.value = quarter
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function saveRecord(officeId, entryId, quarter, data) {
    isLoading.value = true
    error.value = null
    try {
      const response = await quarterlyService.saveRecord(officeId, entryId, quarter, data)
      if (response.success && response.record) {
        const index = records.value.findIndex(r => r.entryId === entryId && r.quarter === quarter)
        if (index !== -1) {
          records.value[index] = response.record
        } else {
          records.value.push(response.record)
        }
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateRecord(recordId, data) {
    isLoading.value = true
    error.value = null
    try {
      const response = await quarterlyService.updateRecord(recordId, data)
      if (response.success) {
        const index = records.value.findIndex(r => r.id === recordId)
        if (index !== -1) {
          records.value[index] = { ...records.value[index], ...data }
        }
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteRecord(recordId) {
    isLoading.value = true
    error.value = null
    try {
      const response = await quarterlyService.deleteRecord(recordId)
      if (response.success) {
        records.value = records.value.filter(r => r.id !== recordId)
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    records,
    currentQuarter,
    isLoading,
    error,
    fetchRecords,
    saveRecord,
    updateRecord,
    deleteRecord
  }
})
