import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as adminService from '@/services/adminService'

export const useAdminStore = defineStore('admin', () => {
  const offices = ref([])
  const selectedOffice = ref(null)
  const pendingApprovals = ref([])
  const isLoading = ref(false)
  const filters = ref({
    office: '',
    pillar: '',
    assignmentType: '',
    goal: '',
    perspective: '',
    strategicObjective: '',
    kpi: '',
    quarter: '',
    status: '',
    hasFocalPerson: ''
  })

  async function fetchAllOffices(customFilters = null) {
    isLoading.value = true
    try {
      const appliedFilters = customFilters || filters.value
      const data = await adminService.getAllOffices(appliedFilters)
      offices.value = data
      return data
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOfficeById(officeId) {
    isLoading.value = true
    try {
      const data = await adminService.getOfficeById(officeId)
      selectedOffice.value = data
      return data
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function approveOffice(officeId) {
    isLoading.value = true
    try {
      const response = await adminService.approveOffice(officeId)
      if (response.success) {
        pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== officeId)
      }
      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function rejectOffice(officeId, reason) {
    isLoading.value = true
    try {
      const response = await adminService.rejectOffice(officeId, reason)
      if (response.success) {
        pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== officeId)
      }
      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function assignFocalPerson(recordId, focalPerson) {
    isLoading.value = true
    try {
      const response = await adminService.assignFocalPerson(recordId, focalPerson)
      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPendingApprovals() {
    isLoading.value = true
    try {
      const data = await adminService.getPendingApprovals()
      pendingApprovals.value = data
      return data
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function applyFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      office: '',
      pillar: '',
      assignmentType: '',
      goal: '',
      perspective: '',
      strategicObjective: '',
      kpi: '',
      quarter: '',
      status: '',
      hasFocalPerson: ''
    }
  }

  return {
    offices,
    selectedOffice,
    pendingApprovals,
    isLoading,
    filters,
    fetchAllOffices,
    fetchOfficeById,
    approveOffice,
    rejectOffice,
    assignFocalPerson,
    fetchPendingApprovals,
    applyFilters,
    clearFilters
  }
})
