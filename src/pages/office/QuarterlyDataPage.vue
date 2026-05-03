<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Quarterly Data Entry</h1>
      <p class="text-gray-600 mt-1">Enter and track your quarterly performance data</p>
    </div>

    <QuarterTab
      :active-quarter="currentQuarter"
      :completion-status="completionStatus"
      @change="handleQuarterChange"
    />

    <div v-if="bscStore.entries.length === 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-yellow-900">Offices Setup Required</h3>
          <p class="text-yellow-800 mt-1">Please complete your Offices setup first before entering quarterly data.</p>
          <AppButton variant="primary" class="mt-4" @click="router.push('/office/offices')">
            Go to Offices
          </AppButton>
        </div>
      </div>
    </div>

    <div v-else-if="quarterEntries.length === 0" class="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-900">No KPI entries for {{ currentQuarter.toUpperCase() }}</h3>
      <p class="text-gray-600 mt-1">Create a KPI entry for this quarter in Offices before entering quarterly data.</p>
    </div>

    <QuarterProgressIndicator
      v-if="quarterEntries.length > 0"
      :quarter="currentQuarter"
      :completed-count="completedCount"
      :total-count="quarterEntries.length"
    />

    <div v-if="quarterEntries.length > 0" class="space-y-4">
      <div
        v-for="(group, groupIndex) in groupedOfficeEntries"
        :key="group.officeId"
        :class="['rounded-lg border-2', getOfficeHighlightClass(groupIndex)]"
      >
        <!-- Office Header (Accordion Trigger) -->
        <button
          @click="toggleOfficeExpanded(group.officeId)"
          :class="['w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity', getOfficeHighlightClass(groupIndex)]"
        >
          <div class="flex items-center gap-3 flex-1 text-left">
            <svg
              :class="['w-5 h-5 text-gray-600 transition-transform', expandedOffices[group.officeId] ? 'transform rotate-90' : '']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <h2 class="text-lg font-bold text-gray-900">{{ group.officeName }}</h2>
              <p class="text-sm text-gray-600">
                {{ group.pillar || 'No pillar' }} • {{ group.entries.length }} KPI
              </p>
            </div>
          </div>
          <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', getOfficeChipClass(groupIndex)]">
            {{ completedOfficeCount(group.entries) }}/{{ group.entries.length }}
          </span>
        </button>

        <!-- KPI Bullet List (Expanded Content) -->
        <div v-if="expandedOffices[group.officeId]" :class="['border-t-2', getOfficeHighlightClass(groupIndex)]">
          <ul class="p-4 space-y-2">
            <li v-for="entry in group.entries" :key="entry.id" class="list-none">
              <button
                @click="selectEntryForEdit(entry.id)"
                :class="['w-full text-left p-3 rounded-lg border-l-4 transition-colors', 
                  getEntryHighlightClass(groupIndex),
                  selectedEntryId === entry.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                ]"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">• {{ entry.kpi }}</p>
                    <p class="text-xs text-gray-600 mt-1">{{ entry.goal }}</p>
                  </div>
                  <div v-if="entryCompletionStatus[entry.id]" class="flex-shrink-0">
                    <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <AppModal
      v-model:show="showFormModal"
      title="Enter Quarterly Data"
      size="lg"
    >
      <div v-if="selectedEntry" class="space-y-6 max-h-96 overflow-y-auto py-4">
        <div class="pb-4 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">{{ selectedEntry.kpi }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ selectedEntry.goal }}</p>
        </div>

        <PerformanceForm
          :entry="selectedEntry"
          :quarter="currentQuarter"
          :data="entryData[selectedEntry.id]?.performance"
          @update="(data) => updateEntryData(selectedEntry.id, 'performance', data)"
        />

        <div class="border-t border-gray-200 pt-6">
          <ActivitiesForm
            :data="entryData[selectedEntry.id]?.activities"
            @update="(data) => updateEntryData(selectedEntry.id, 'activities', data)"
          />
        </div>
      </div>

      <template #footer>
        <AppButton
          variant="outline"
          :disabled="!entryData[selectedEntryId]?.recordId"
          @click="handleDelete(selectedEntryId)"
        >
          Delete Entry
        </AppButton>
        <AppButton variant="outline" @click="showFormModal = false">
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          :loading="savingEntryId === selectedEntryId"
          @click="handleSaveAndClose"
        >
          Save Entry
        </AppButton>
      </template>
    </AppModal>

    <AppModal
      v-model:show="showDeleteModal"
      title="Delete Quarterly Entry"
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import QuarterTab from '@/components/office/QuarterTab.vue'
import QuarterProgressIndicator from '@/components/office/QuarterProgressIndicator.vue'
import PerformanceForm from '@/components/office/PerformanceForm.vue'
import ActivitiesForm from '@/components/office/ActivitiesForm.vue'
import { useBscStore } from '@/stores/bscStore'
import { useQuarterlyStore } from '@/stores/quarterlyStore'
import { useAuthStore } from '@/stores/authStore'
import { useOfficeStore } from '@/stores/officeStore'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const bscStore = useBscStore()
const quarterlyStore = useQuarterlyStore()
const authStore = useAuthStore()
const officeStore = useOfficeStore()

const currentQuarter = ref('q1')
const entryData = reactive({})
const entryCompletionStatus = reactive({})
const savingEntryId = ref(null)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const deleteConfirmMessage = ref('')
const recordToDelete = ref(null)
const expandedOffices = reactive({})
const selectedEntryId = ref(null)
const showFormModal = ref(false)

const quarterEntries = computed(() => {
  return bscStore.entries
})

const selectedEntry = computed(() => {
  return quarterEntries.value.find(entry => entry.id === selectedEntryId.value)
})

const officeMap = computed(() => {
  return (officeStore.allOffices || []).reduce((map, office) => {
    map[office.id] = office
    return map
  }, {})
})

const groupedOfficeEntries = computed(() => {
  const groups = {}

  for (const entry of quarterEntries.value) {
    const officeId = entry.office_id || entry.officeId
    const office = officeMap.value[officeId] || {}

    if (!groups[officeId]) {
      groups[officeId] = {
        officeId,
        officeName: office.officeName || 'Unknown Office',
        pillar: office.pillar || '',
        assignmentType: office.assignmentType || '',
        entries: []
      }
    }

    groups[officeId].entries.push(entry)
  }

  return Object.values(groups).sort((a, b) => a.officeName.localeCompare(b.officeName))
})

const completionStatus = ref({
  q1: false,
  q2: false,
  q3: false,
  q4: false
})

const completedCount = computed(() => {
  return Object.values(entryCompletionStatus).filter(status => status).length
})

onMounted(async () => {
  currentQuarter.value = route.params.quarter || 'q1'

  if (authStore.user) {
    await officeStore.fetchAllOffices(authStore.user.id)
    await bscStore.fetchAllEntries()
    await loadQuarterlyData()
  }
})

watch(() => route.params.quarter, (newQuarter) => {
  if (newQuarter && authStore.user) {
    currentQuarter.value = newQuarter
    loadQuarterlyData()
  }
})

const handleQuarterChange = (quarter) => {
  router.push(`/office/quarterly/${quarter}`)
}

const loadQuarterlyData = async () => {
  if (!authStore.user) return

  // Clear existing data for this quarter
  const newEntryData = {}

  const officeIds = [...new Set(
    quarterEntries.value
      .map(entry => entry.office_id || entry.officeId)
      .filter(Boolean)
  )]

  const records = []
  for (const officeId of officeIds) {
    const officeRecords = await quarterlyStore.fetchRecords(officeId, currentQuarter.value)
    records.push(...officeRecords)
  }

  // Create a map of records by entryId for quick lookup
  const recordsMap = {}
  records.forEach(record => {
    recordsMap[record.entryId] = record
  })

  // Initialize or update data for each entry
  quarterEntries.value.forEach(entry => {
    const record = recordsMap[entry.id]
    
    newEntryData[entry.id] = {
      recordId: record?.id || null,
      performance: {
        quarterlyTarget: record?.quarterlyTarget || '',
        month1: record?.month1 || '',
        month2: record?.month2 || '',
        month3: record?.month3 || ''
      },
      activities: {
        keyActivities: record?.keyActivities || '',
        mov: record?.mov || '',
        status: record?.status || '',
        issues: record?.issues || '',
        assistance: record?.assistance || ''
      }
    }

    // Update completion status
    checkEntryCompletion(entry.id, newEntryData[entry.id])
  })

  // Replace entryData entirely to avoid cross-quarter data persistence
  Object.keys(entryData).forEach(key => {
    delete entryData[key]
  })
  Object.keys(entryCompletionStatus).forEach(key => {
    delete entryCompletionStatus[key]
  })
  Object.assign(entryData, newEntryData)
}

const updateEntryData = (entryId, section, data) => {
  if (!entryData[entryId]) {
    entryData[entryId] = {
      performance: {},
      activities: {}
    }
  }
  entryData[entryId][section] = data

  checkEntryCompletion(entryId)
}

const checkEntryCompletion = (entryId, data = null) => {
  const checkData = data || entryData[entryId]
  if (!checkData) {
    entryCompletionStatus[entryId] = false
    return
  }

  // An entry is considered "completed" when it has a saved record
  // and at least the quarterly target and status are set
  const hasRecord = !!checkData.recordId
  const hasTarget = !!checkData.performance?.quarterlyTarget
  const hasStatus = !!checkData.activities?.status

  entryCompletionStatus[entryId] = !!(hasRecord && hasTarget && hasStatus)
}

const handleSave = async (entryId) => {
  const data = entryData[entryId]
  if (!data) {
    toast.error('No data to save')
    return
  }

  const entry = quarterEntries.value.find(item => item.id === entryId)
  const officeId = entry?.office_id || entry?.officeId
  if (!officeId) {
    toast.error('Cannot determine office for this KPI entry')
    return
  }

  savingEntryId.value = entryId
  try {
    const response = await quarterlyStore.saveRecord(officeId, entryId, currentQuarter.value, {
      ...data.performance,
      ...data.activities
    })

    if (response?.record?.id) {
      entryData[entryId].recordId = response.record.id
    }

    toast.success('Entry saved successfully!')
  } catch (error) {
    toast.error(error.message || 'Failed to save entry')
  } finally {
    savingEntryId.value = null
  }
}

const officeHighlightClasses = [
  'border-blue-300 bg-blue-50/50',
  'border-emerald-300 bg-emerald-50/50',
  'border-amber-300 bg-amber-50/50',
  'border-violet-300 bg-violet-50/50'
]

const officeChipClasses = [
  'bg-blue-100 text-blue-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-800'
]

const entryHighlightClasses = [
  'border-l-blue-400',
  'border-l-emerald-400',
  'border-l-amber-400',
  'border-l-violet-400'
]

const getOfficeHighlightClass = (index) => {
  return officeHighlightClasses[index % officeHighlightClasses.length]
}

const getOfficeChipClass = (index) => {
  return officeChipClasses[index % officeChipClasses.length]
}

const getEntryHighlightClass = (index) => {
  return entryHighlightClasses[index % entryHighlightClasses.length]
}

const handleDelete = (entryId) => {
  const recordId = entryData[entryId]?.recordId
  if (!recordId) {
    toast.error('No saved quarterly record found to delete')
    return
  }

  recordToDelete.value = { entryId, recordId }
  deleteConfirmMessage.value = 'Delete this quarterly entry? This cannot be undone.'
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!recordToDelete.value?.recordId) return

  deleteLoading.value = true
  try {
    await quarterlyStore.deleteRecord(recordToDelete.value.recordId)
    toast.success('Quarterly entry deleted successfully!')
    showDeleteModal.value = false
    recordToDelete.value = null
    await loadQuarterlyData()
  } catch (error) {
    toast.error(error.message || 'Failed to delete quarterly entry')
  } finally {
    deleteLoading.value = false
  }
}

const toggleOfficeExpanded = (officeId) => {
  expandedOffices[officeId] = !expandedOffices[officeId]
}

const selectEntryForEdit = (entryId) => {
  selectedEntryId.value = entryId
  showFormModal.value = true
}

const handleSaveAndClose = async () => {
  await handleSave(selectedEntryId.value)
  showFormModal.value = false
}

const completedOfficeCount = (entries) => {
  return entries.filter(entry => entryCompletionStatus[entry.id]).length
}
</script>
