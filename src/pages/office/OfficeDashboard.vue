<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600 mt-1">Welcome to your office dashboard</p>
    </div>

    <div v-if="!isOfficeSetup" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-yellow-900">Get Started</h3>
          <p class="text-yellow-800 mt-1">You have not set up your office yet. Create your first office to begin entering BSC data.</p>
          <AppButton variant="primary" class="mt-4" @click="router.push('/office/offices')">
            Go to Offices
          </AppButton>
        </div>
      </div>
    </div>

    <div v-else-if="bscStore.entries.length === 0" class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-3-3v6m0 0v6m0-6H6a2 2 0 01-2-2V7a2 2 0 012-2h4m6 0h4a2 2 0 012 2v3a2 2 0 01-2 2h-4" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-blue-900">Office Ready</h3>
          <p class="text-blue-800 mt-1">Your office is registered. Add KPI entries so you can start tracking quarterly progress.</p>
          <AppButton variant="primary" class="mt-4" @click="router.push('/office/offices')">
            Add KPI Entries
          </AppButton>
        </div>
      </div>
    </div>

    <QuarterProgressIndicator
      v-if="bscStore.entries.length > 0"
      :quarter="selectedQuarter"
      :completed-count="completedEntriesCount"
      :total-count="bscStore.entries.length"
    />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AppCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total BSC Entries</p>
            <p class="text-2xl font-bold text-gray-900">{{ bscStore.entries.length }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Current Quarter %</p>
            <p class="text-2xl font-bold text-green-600">{{ averageAccomplishment }}%</p>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">With Issues</p>
            <p class="text-2xl font-bold text-yellow-600">{{ entriesWithIssues }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">With Focal Person</p>
            <p class="text-2xl font-bold text-blue-600">{{ entriesWithFocalPerson }}</p>
          </div>
        </div>
      </AppCard>
    </div>

    <AppCard v-if="recentActivities.length > 0" title="Recent Activity">
      <div class="space-y-3">
        <div
          v-for="(activity, index) in recentActivities"
          :key="index"
          class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ activity.kpi }}</p>
            <p class="text-sm text-gray-600 mt-1">{{ activity.quarter }} — Last updated {{ activity.updatedAt }}</p>
          </div>
          <AppBadge :variant="getStatusBadgeVariant(activity.status)">
            {{ activity.status }}
          </AppBadge>
        </div>
      </div>
    </AppCard>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <AppButton :variant="selectedQuarter === 'q1' ? 'primary' : 'outline'" @click="selectQuarter('q1')">
        View Q1 Data
      </AppButton>
      <AppButton :variant="selectedQuarter === 'q2' ? 'primary' : 'outline'" @click="selectQuarter('q2')">
        View Q2 Data
      </AppButton>
      <AppButton :variant="selectedQuarter === 'q3' ? 'primary' : 'outline'" @click="selectQuarter('q3')">
        View Q3 Data
      </AppButton>
      <AppButton :variant="selectedQuarter === 'q4' ? 'primary' : 'outline'" @click="selectQuarter('q4')">
        View Q4 Data
      </AppButton>
    </div>

    <AppCard title="Quarter Analytics" class="mt-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-600">Selected Quarter</p>
          <p class="text-xl font-bold text-gray-900 mt-2">{{ selectedQuarter.toUpperCase() }}</p>
          <p class="text-sm text-gray-500 mt-1">This view shows data status for the quarter you chose.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-600">KPIs with Data</p>
          <p class="text-3xl font-bold text-green-700 mt-2">{{ quarterRecords.length }}</p>
          <p class="text-sm text-gray-500 mt-1">Entries that already contain quarterly records.</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-600">KPIs without Data</p>
          <p class="text-3xl font-bold text-red-700 mt-2">{{ getMissingDataCount() }}</p>
          <p class="text-sm text-gray-500 mt-1">Entries that still need quarterly data.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-600">Completed</p>
          <p class="text-2xl font-bold text-green-700 mt-2">{{ completedEntriesCount }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-600">Ongoing</p>
          <p class="text-2xl font-bold text-blue-700 mt-2">{{ quarterRecords.filter(r => r.status === 'Ongoing').length }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-600">Not Started</p>
          <p class="text-2xl font-bold text-yellow-700 mt-2">{{ getNotStartedCount() }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-600">Issues</p>
          <p class="text-2xl font-bold text-orange-700 mt-2">{{ entriesWithIssues }}</p>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import QuarterProgressIndicator from '@/components/office/QuarterProgressIndicator.vue'
import { useBscStore } from '@/stores/bscStore'
import { useOfficeStore } from '@/stores/officeStore'
import { useAuthStore } from '@/stores/authStore'
import * as bscService from '@/services/bscService'
import * as quarterlyService from '@/services/quarterlyService'
import { computeTotal, computePercentage } from '@/utils/computeAccomplishment'

const router = useRouter()
const bscStore = useBscStore()
const officeStore = useOfficeStore()
const authStore = useAuthStore()

// Determine current quarter based on date
const getCurrentQuarter = () => {
  const month = new Date().getMonth()
  if (month < 3) return 'q1'
  if (month < 6) return 'q2'
  if (month < 9) return 'q3'
  return 'q4'
}

const selectedQuarter = ref(getCurrentQuarter())
const completedEntriesCount = ref(0)
const averageAccomplishment = ref(0)
const entriesWithIssues = ref(0)
const entriesWithFocalPerson = ref(0)
const recentActivities = ref([])
const quarterRecords = ref([])

const isOfficeSetup = computed(() => (officeStore.allOffices || []).length > 0)

const loadOfficeEntries = async () => {
  const officeIds = (officeStore.allOffices || []).map(office => office.id)
  if (officeIds.length === 0) {
    bscStore.entries = []
    return
  }

  const allEntries = []
  for (const officeId of officeIds) {
    const entries = await bscService.getEntries(officeId)
    allEntries.push(...entries)
  }

  bscStore.entries = allEntries
}

const loadQuarterlyAnalytics = async (quarter) => {
  if (!isOfficeSetup.value) {
    quarterRecords.value = []
    return
  }

  const officeIds = (officeStore.allOffices || []).map(office => office.id)
  const recordSets = await Promise.all(
    officeIds.map(officeId => quarterlyService.getRecords(officeId, quarter))
  )

  quarterRecords.value = recordSets.flat()
  computeDashboardStats()
}

onMounted(async () => {
  if (!authStore.user) return

  await officeStore.fetchAllOffices(authStore.user.id)
  await loadOfficeEntries()
  await loadQuarterlyAnalytics(selectedQuarter.value)
})

const computeDashboardStats = () => {
  const records = quarterRecords.value
  const entries = bscStore.entries

  completedEntriesCount.value = records.filter(r => r.status === 'Completed').length

  let totalPct = 0
  let countWithTarget = 0

  for (const record of records) {
    const target = parseFloat(record.quarterlyTarget)
    if (target && target > 0) {
      const total = computeTotal(record.month1, record.month2, record.month3)
      const pct = computePercentage(total, target)
      if (pct !== null) {
        totalPct += pct
        countWithTarget++
      }
    }
  }

  averageAccomplishment.value = countWithTarget > 0
    ? Math.round(totalPct / countWithTarget)
    : 0

  entriesWithIssues.value = records.filter(r =>
    r.issues && r.issues.trim() !== ''
  ).length

  entriesWithFocalPerson.value = records.filter(r =>
    r.focalPerson && r.focalPerson.trim() !== ''
  ).length

  const entryMap = {}
  for (const entry of entries) {
    entryMap[entry.id] = entry
  }

  recentActivities.value = records
    .filter(r => r.status)
    .map(r => {
      const entry = entryMap[r.entryId]
      return {
        kpi: entry?.kpi || 'Unknown KPI',
        quarter: r.quarter?.toUpperCase() || '',
        status: r.status || 'Not Started',
        updatedAt: new Date().toLocaleDateString()
      }
    })
    .slice(0, 5)
}

const getMissingDataCount = () => {
  const records = quarterRecords.value
  return Math.max(0, bscStore.entries.length - records.length)
}

const getNotStartedCount = () => {
  const records = quarterRecords.value
  const notStartedRecords = records.filter(r => !r.status || r.status === 'Not Started').length
  return notStartedRecords + getMissingDataCount()
}

const selectQuarter = async (quarter) => {
  selectedQuarter.value = quarter || getCurrentQuarter()
  await loadQuarterlyAnalytics(selectedQuarter.value)
}

const getStatusBadgeVariant = (status) => {
  const statusMap = {
    'Not Started': 'not-started',
    'Ongoing': 'ongoing',
    'Completed': 'completed',
    'Delayed': 'delayed',
    'For Validation': 'for-validation'
  }
  return statusMap[status] || 'default'
}
</script>
