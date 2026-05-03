<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Offices</h1>
      <p class="text-gray-600 mt-1">Manage office information and KPI entries for quarterly data entry.</p>
    </div>

    <!-- Add Office Button -->
    <div class="flex justify-end">
      <AppButton variant="primary" @click="showOfficeModal = true">
        Add New Office
      </AppButton>
    </div>

    <!-- Offices Grid -->
    <div v-if="officeList.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No Offices Yet</h3>
      <p class="text-gray-600">Get started by adding your first office</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <OfficeManagementCard
        v-for="office in officeList"
        :key="office.id"
        :office="office"
        :kpi-count="getOfficeKPICount(office.id)"
        @add-kpi="handleAddKPI(office)"
        @edit="handleEditOffice(office)"
        @delete="handleDeleteOffice(office)"
      />
    </div>

    <!-- Selected Office KPI Entries View -->
    <template v-if="selectedOfficeForKPI">
      <div class="border-t border-gray-200 pt-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">KPI Entries for {{ selectedOfficeForKPI.officeName }}</h2>
            <p class="text-gray-600 mt-1">{{ selectedOfficeForKPI.pillar }} - {{ selectedOfficeForKPI.assignmentType }}</p>
          </div>
          <AppButton variant="outline" @click="selectedOfficeForKPI = null">
            Close
          </AppButton>
        </div>

        <AppLoader v-if="bscStore.isLoading" size="lg" text="Loading KPI entries..." />

        <div v-else-if="getOfficeKPIs(selectedOfficeForKPI.id).length === 0" class="text-center py-8">
          <p class="text-gray-600 mb-4">No KPI entries yet for this office</p>
          <AppButton variant="primary" @click="handleAddKPI(selectedOfficeForKPI)">
            Add First KPI Entry
          </AppButton>
        </div>

        <div v-else class="grid grid-cols-1 gap-4">
          <BSCEntryCard
            v-for="entry in getOfficeKPIs(selectedOfficeForKPI.id)"
            :key="entry.id"
            :entry="entry"
            @edit="handleEditKPI"
            @delete="handleDeleteKPI"
          />
        </div>
      </div>
    </template>

    <!-- Office Modal -->
    <AppModal
      v-model:show="showOfficeModal"
      :title="editingOffice ? 'Edit Office' : 'Add New Office'"
      size="lg"
    >
      <OfficeInfoForm
        :office="editingOffice"
        :is-loading="officeFormLoading"
        @submit="handleOfficeSubmit"
        @cancel="closeOfficeModal"
      />
    </AppModal>

    <!-- KPI Modal -->
    <AppModal
      v-model:show="showKPIModal"
      :title="editingKPI ? 'Edit KPI Entry' : 'Add KPI Entry'"
      size="lg"
    >
      <InitialBSCSetupForm
        :office="selectedOfficeForKPI"
        :is-loading="kpiFormLoading"
        @submit="handleKPISubmit"
        @cancel="closeKPIModal"
      />
    </AppModal>

    <!-- Delete Confirm Modal -->
    <AppModal
      v-model:show="showDeleteModal"
      title="Confirm Delete"
      size="sm"
    >
      <div class="py-4">
        <p class="text-gray-700">{{ deleteConfirmMessage }}</p>
      </div>
      <template #footer>
        <AppButton variant="outline" @click="showDeleteModal = false">
          Cancel
        </AppButton>
        <AppButton variant="danger" :loading="deleteLoading" @click="confirmDelete">
          Delete
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import OfficeInfoForm from '@/components/office/OfficeInfoForm.vue'
import OfficeManagementCard from '@/components/office/OfficeManagementCard.vue'
import BSCEntryCard from '@/components/office/BSCEntryCard.vue'
import InitialBSCSetupForm from '@/components/office/InitialBSCSetupForm.vue'
import { useBscStore } from '@/stores/bscStore'
import { useAuthStore } from '@/stores/authStore'
import { useOfficeStore } from '@/stores/officeStore'

const toast = useToast()
const bscStore = useBscStore()
const authStore = useAuthStore()
const officeStore = useOfficeStore()

// Office Management
const showOfficeModal = ref(false)
const editingOffice = ref(null)
const officeFormLoading = ref(false)
const officeToDelete = ref(null)

// KPI Management
const showKPIModal = ref(false)
const selectedOfficeForKPI = ref(null)
const editingKPI = ref(null)
const kpiFormLoading = ref(false)
const kpiToDelete = ref(null)

// Delete Modal
const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const deleteConfirmMessage = ref('')
const deleteType = ref(null) // 'office' or 'kpi'

// Computed
const officeList = computed(() => {
  return officeStore.allOffices || []
})

onMounted(async () => {
  if (authStore.user) {
    await officeStore.fetchAllOffices(authStore.user.id)
    await bscStore.fetchAllEntries()
  }
})

// Office Methods
const handleAddKPI = async (office) => {
  selectedOfficeForKPI.value = office
  editingKPI.value = null
  await bscStore.fetchEntries(office.id)
  showKPIModal.value = true
}

const handleEditOffice = (office) => {
  editingOffice.value = office
  showOfficeModal.value = true
}

const handleDeleteOffice = (office) => {
  officeToDelete.value = office
  deleteType.value = 'office'
  deleteConfirmMessage.value = `Are you sure you want to delete "${office.officeName}"? This will also delete all KPI entries for this office.`
  showDeleteModal.value = true
}

const handleOfficeSubmit = async (data) => {
  officeFormLoading.value = true
  try {
    if (editingOffice.value) {
      // Update existing office
      await officeStore.updateOffice(editingOffice.value.id, data)
      toast.success('Office updated successfully!')
    } else {
      // Create new office
      await officeStore.createOffice(authStore.user.id, data)
      toast.success('Office created successfully!')
    }
    closeOfficeModal()
    await officeStore.fetchAllOffices(authStore.user.id)
  } catch (error) {
    toast.error('Failed to save office')
  } finally {
    officeFormLoading.value = false
  }
}

const closeOfficeModal = () => {
  showOfficeModal.value = false
  editingOffice.value = null
}

// KPI Methods
const handleEditKPI = (kpi) => {
  editingKPI.value = kpi
  showKPIModal.value = true
}

const handleDeleteKPI = (kpi) => {
  kpiToDelete.value = kpi
  deleteType.value = 'kpi'
  deleteConfirmMessage.value = `Are you sure you want to delete this KPI entry? This action cannot be undone.`
  showDeleteModal.value = true
}

const handleKPISubmit = async (data) => {
  kpiFormLoading.value = true
  try {
    if (editingKPI.value) {
      await bscStore.updateEntry(editingKPI.value.id, data)
      toast.success('KPI entry updated successfully!')
    } else {
      await bscStore.createEntry(selectedOfficeForKPI.value.id, data)
      toast.success('KPI entry created successfully!')
    }
    closeKPIModal()
    await bscStore.fetchEntries(selectedOfficeForKPI.value.id)
  } catch (error) {
    toast.error(error.message || 'Failed to save KPI entry')
  } finally {
    kpiFormLoading.value = false
  }
}

const closeKPIModal = () => {
  showKPIModal.value = false
  editingKPI.value = null
}

const confirmDelete = async () => {
  deleteLoading.value = true
  try {
    if (deleteType.value === 'office') {
      const deletedOfficeId = officeToDelete.value.id
      await officeStore.deleteOffice(deletedOfficeId)
      toast.success('Office deleted successfully!')
      
      // Clear selected office view if it was the one being deleted
      if (selectedOfficeForKPI.value?.id === deletedOfficeId) {
        selectedOfficeForKPI.value = null
      }
      
      // Reload both offices and entries
      await officeStore.fetchAllOffices(authStore.user.id)
      await bscStore.fetchAllEntries()
    } else if (deleteType.value === 'kpi') {
      await bscStore.deleteEntry(kpiToDelete.value.id)
      toast.success('KPI entry deleted successfully!')
      await bscStore.fetchEntries(selectedOfficeForKPI.value.id)
    }
    showDeleteModal.value = false
    officeToDelete.value = null
    kpiToDelete.value = null
    deleteType.value = null
  } catch (error) {
    console.error('Delete error:', error)
    toast.error(error.message || 'Failed to delete')
  } finally {
    deleteLoading.value = false
  }
}

// Helper Methods
const getOfficeKPICount = (officeId) => {
  return bscStore.entries.filter(entry => entry.office_id === officeId).length
}

const getOfficeKPIs = (officeId) => {
  return bscStore.entries.filter(entry => entry.office_id === officeId)
}
</script>
