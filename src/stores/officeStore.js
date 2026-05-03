import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as officeService from '@/services/officeService'

export const useOfficeStore = defineStore('office', () => {
  const profile = ref(null)
  const allOffices = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchAllOffices(userId) {
    isLoading.value = true
    error.value = null
    try {
      const data = await officeService.getAllOfficesByUser(userId)
      allOffices.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProfile(officeId) {
    isLoading.value = true
    error.value = null
    try {
      const data = await officeService.getProfile(officeId)
      profile.value = data
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(officeId, data) {
    isLoading.value = true
    error.value = null
    try {
      const response = await officeService.updateProfile(officeId, data)
      if (response.success) {
        profile.value = { ...profile.value, ...data }
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createOffice(userId, data) {
    isLoading.value = true
    error.value = null
    try {
      const newOffice = await officeService.createOffice(userId, data)
      allOffices.value.push(newOffice)
      return newOffice
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateOffice(officeId, data) {
    isLoading.value = true
    error.value = null
    try {
      const updated = await officeService.updateOffice(officeId, data)
      const index = allOffices.value.findIndex(o => o.id === officeId)
      if (index !== -1) {
        allOffices.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteOffice(officeId) {
    isLoading.value = true
    error.value = null
    try {
      const response = await officeService.deleteOffice(officeId)
      
      // Only filter from local state if service reports success
      if (response.success) {
        allOffices.value = allOffices.value.filter(o => o.id !== officeId)
        console.log('Office removed from local state')
      }
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Store delete error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    profile,
    allOffices,
    isLoading,
    error,
    fetchAllOffices,
    fetchProfile,
    updateProfile,
    createOffice,
    updateOffice,
    deleteOffice
  }
})
