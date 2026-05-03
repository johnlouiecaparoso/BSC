import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as bscService from '@/services/bscService'

export const useBscStore = defineStore('bsc', () => {
  const entries = ref([])
  const selectedOfficeId = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchAllEntries() {
    isLoading.value = true
    error.value = null
    try {
      const data = await bscService.getAllEntries()
      entries.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEntries(officeId) {
    isLoading.value = true
    error.value = null
    try {
      selectedOfficeId.value = officeId
      const data = await bscService.getEntries(officeId)
      entries.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createEntry(officeId, data) {
    isLoading.value = true
    error.value = null
    try {
      const response = await bscService.createEntry(officeId, data)
      if (response.success && response.entry) {
        entries.value.push(response.entry)
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateEntry(entryId, data) {
    isLoading.value = true
    error.value = null
    try {
      const response = await bscService.updateEntry(entryId, data)
      if (response.success) {
        const index = entries.value.findIndex(e => e.id === entryId)
        if (index !== -1) {
          entries.value[index] = { ...entries.value[index], ...data }
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

  async function deleteEntry(entryId) {
    isLoading.value = true
    error.value = null
    try {
      const response = await bscService.deleteEntry(entryId)
      if (response.success) {
        entries.value = entries.value.filter(e => e.id !== entryId)
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
    entries,
    selectedOfficeId,
    isLoading,
    error,
    fetchAllEntries,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry
  }
})
