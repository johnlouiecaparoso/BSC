<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="outline" @click="handleBack">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </AppButton>
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Office Details</h1>
        <p class="text-gray-600 mt-1">View and manage office information</p>
      </div>
    </div>

    <AppLoader v-if="adminStore.isLoading" size="lg" text="Loading office details..." />

    <template v-else-if="adminStore.selectedOffice">
      <OfficeDetailPanel :office="officeForPanel" />

      <QuarterTab
        :active-quarter="currentQuarter"
        @change="handleQuarterChange"
      />

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AppCard>
          <p class="text-sm text-gray-600">{{ currentQuarterLabel }} KPI Records</p>
          <p class="text-2xl font-bold text-gray-900 mt-2">{{ officeAnalytics.totalRecords }}</p>
        </AppCard>
        <AppCard>
          <p class="text-sm text-gray-600">Total {{ currentQuarterLabel }} Accomplishment</p>
          <p class="text-2xl font-bold text-gray-900 mt-2">{{ officeAnalytics.totalAccomplishment }}</p>
        </AppCard>
        <AppCard>
          <p class="text-sm text-gray-600">Total {{ currentQuarterLabel }} Target</p>
          <p class="text-2xl font-bold text-gray-900 mt-2">{{ officeAnalytics.totalTarget }}</p>
        </AppCard>
        <AppCard>
          <p class="text-sm text-gray-600">% Accomplishment vs {{ currentQuarterLabel }} Target</p>
          <p class="text-2xl font-bold text-primary-600 mt-2">{{ officeAnalytics.percentageLabel }}</p>
        </AppCard>
      </div>

      <div class="space-y-6">
        <AppCard
          v-for="entry in officeEntries"
          :key="entry.id"
        >
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">{{ entry.kpi }}</h3>
          </template>

          <div class="space-y-6">
            <div class="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 class="font-semibold text-gray-900">Performance Data</h4>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Quarterly Target:</span>
                  <p class="font-semibold text-gray-900">{{ entry.quarterlyTarget || '—' }}</p>
                </div>
                <div>
                  <span class="text-gray-600">{{ monthLabels[0] }}:</span>
                  <p class="font-semibold text-gray-900">{{ entry.month1 || '—' }}</p>
                </div>
                <div>
                  <span class="text-gray-600">{{ monthLabels[1] }}:</span>
                  <p class="font-semibold text-gray-900">{{ entry.month2 || '—' }}</p>
                </div>
                <div>
                  <span class="text-gray-600">{{ monthLabels[2] }}:</span>
                  <p class="font-semibold text-gray-900">{{ entry.month3 || '—' }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg">
                <div>
                  <span class="text-sm text-gray-600">Total Accomplishment:</span>
                  <p class="text-xl font-bold text-gray-900">{{ entry.totalAccomplishment || 0 }}</p>
                </div>
                <div>
                  <span class="text-sm text-gray-600">% Accomplishment vs Target:</span>
                  <p class="text-xl font-bold text-primary-600">{{ entry.percentageAccomplishment || '—' }}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="font-semibold text-gray-900">Activities & Details</h4>

              <div class="grid grid-cols-1 gap-4">
                <div>
                  <span class="text-sm font-medium text-gray-700">Key Activities / Output Link:</span>
                  <div class="mt-1">
                    <a
                      v-if="entry.keyActivities && isValidURL(entry.keyActivities)"
                      :href="entry.keyActivities"
                      target="_blank"
                      class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      {{ entry.keyActivities }}
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <p v-else class="text-gray-900 mt-1">{{ entry.keyActivities || '—' }}</p>
                  </div>
                </div>

                <div>
                  <span class="text-sm font-medium text-gray-700">Means of Verification:</span>
                  <div class="mt-1">
                    <a
                      v-if="entry.mov && isValidURL(entry.mov)"
                      :href="entry.mov"
                      target="_blank"
                      class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      {{ entry.mov }}
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <p v-else class="text-gray-500">{{ entry.mov || '—' }}</p>
                  </div>
                </div>

                <div>
                  <span class="text-sm font-medium text-gray-700">Status:</span>
                  <div class="mt-1">
                    <AppBadge v-if="entry.status" :variant="getStatusBadgeVariant(entry.status)">
                      {{ entry.status }}
                    </AppBadge>
                    <p v-else class="text-gray-500">—</p>
                  </div>
                </div>

                <div>
                  <span class="text-sm font-medium text-gray-700">Issues / Challenges:</span>
                  <p class="text-gray-900 mt-1">{{ entry.issues || '—' }}</p>
                </div>

                <div>
                  <span class="text-sm font-medium text-gray-700">Assistance Needed:</span>
                  <p class="text-gray-900 mt-1">{{ entry.assistance || '—' }}</p>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-200">
              <FocalPersonInput
                :model-value="entry.focalPerson"
                :record-id="entry.recordId"
                :is-loading="savingFocalPerson === entry.recordId"
                @save="handleSaveFocalPerson"
              />
            </div>
          </div>
        </AppCard>
      </div>

      <AppCard title="Office Performance Charts">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h3 class="text-lg font-semibold text-gray-900">Office Performance Charts</h3>
            <ChartExportButton
              target-selector="#office-charts-container"
              :filename="`${adminStore.selectedOffice?.officeName || 'office'}-charts`"
            />
          </div>
        </template>
        <div id="office-charts-container" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccomplishmentBarChart
            :labels="chartData.accomplishmentLabels"
            :data="chartData.accomplishmentData"
            :title="`${adminStore.selectedOffice.officeName} ${currentQuarterLabel} KPI Accomplishment`"
          />

          <StatusDoughnutChart
            :data="chartData.statusDistribution"
            :title="`${adminStore.selectedOffice.officeName} ${currentQuarterLabel} Status Distribution`"
          />

          <MonthlyTrendLineChart
            :data="chartData.monthlyTrend"
            :title="`${adminStore.selectedOffice.officeName} Monthly Trend`"
          />

          <AccomplishmentGauge
            :percentage="chartData.currentQuarterPercentage"
          />
        </div>
      </AppCard>

      <AppCard title="Comparison with Other Offices">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h3 class="text-lg font-semibold text-gray-900">Comparison with Other Offices</h3>
            <ChartExportButton
              target-selector="#comparison-chart-container"
              :filename="`${adminStore.selectedOffice?.officeName || 'office'}-comparison`"
            />
          </div>
        </template>
        <div id="comparison-chart-container">
          <OfficeComparisonChart
            :labels="chartData.comparisonLabels"
            :data="chartData.comparisonData"
            :office-ids="chartData.comparisonOfficeIds"
            :highlight-office-id="adminStore.selectedOffice.id"
            :title="`${currentQuarterLabel} % Accomplishment vs Target by Office`"
          />
        </div>
      </AppCard>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import QuarterTab from '@/components/office/QuarterTab.vue'
import FocalPersonInput from '@/components/admin/FocalPersonInput.vue'
import OfficeDetailPanel from '@/components/admin/OfficeDetailPanel.vue'
import AccomplishmentBarChart from '@/components/charts/AccomplishmentBarChart.vue'
import MonthlyTrendLineChart from '@/components/charts/MonthlyTrendLineChart.vue'
import StatusDoughnutChart from '@/components/charts/StatusDoughnutChart.vue'
import AccomplishmentGauge from '@/components/charts/AccomplishmentGauge.vue'
import OfficeComparisonChart from '@/components/charts/OfficeComparisonChart.vue'
import ChartExportButton from '@/components/charts/ChartExportButton.vue'
import { useAdminStore } from '@/stores/adminStore'
import { isValidURL } from '@/utils/urlValidator'
import { getMonthLabels } from '@/utils/quarterHelpers'
import * as analyticsService from '@/services/analyticsService'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const adminStore = useAdminStore()

const currentQuarter = ref('q1')
const savingFocalPerson = ref(null)
const officeEntries = ref([])

const monthLabels = computed(() => getMonthLabels(currentQuarter.value))
const currentQuarterLabel = computed(() => currentQuarter.value.toUpperCase())

const officeForPanel = computed(() => {
  const office = adminStore.selectedOffice
  if (!office) return {}

  return {
    ...office,
    totalEntries: office.entries?.length || 0,
    bscEntries: office.entries || []
  }
})

const chartData = ref({
  accomplishmentLabels: [],
  accomplishmentData: [],
  statusDistribution: {
    notStarted: 0,
    ongoing: 0,
    completed: 0,
    delayed: 0,
    forValidation: 0
  },
  monthlyTrend: [],
  currentQuarterPercentage: 0,
  comparisonLabels: [],
  comparisonOfficeIds: [],
  comparisonData: []
})

const officeAnalytics = computed(() => {
  const totalAccomplishment = officeEntries.value.reduce((sum, entry) => {
    return sum + (parseFloat(entry.totalAccomplishment) || 0)
  }, 0)

  const totalTarget = officeEntries.value.reduce((sum, entry) => {
    return sum + (parseFloat(entry.quarterlyTarget) || 0)
  }, 0)

  const percentage = totalTarget > 0
    ? Math.round((totalAccomplishment / totalTarget) * 100)
    : null

  return {
    totalRecords: officeEntries.value.filter(entry => entry.recordId).length,
    totalAccomplishment,
    totalTarget,
    percentage,
    percentageLabel: percentage === null ? '—' : `${percentage}%`
  }
})

onMounted(async () => {
  const officeId = route.params.officeId
  if (officeId) {
    await adminStore.fetchOfficeById(officeId)
    loadEntriesForQuarter()
    await loadChartData(officeId)
  }
})

watch(currentQuarter, async () => {
  loadEntriesForQuarter()
  const officeId = route.params.officeId
  if (officeId) {
    await loadChartData(officeId)
  }
})

const loadEntriesForQuarter = () => {
  const office = adminStore.selectedOffice
  if (!office) return

  const entries = office.entries || []
  const records = office.quarterlyRecords || []
  const quarterRecords = records.filter(record => record.quarter === currentQuarter.value)

  officeEntries.value = entries.map((entry) => {
    const record = quarterRecords.find(item => item.entryId === entry.id)
    const month1 = parseFloat(record?.month1) || 0
    const month2 = parseFloat(record?.month2) || 0
    const month3 = parseFloat(record?.month3) || 0
    const total = month1 + month2 + month3
    const target = parseFloat(record?.quarterlyTarget) || 0
    const percentage = target > 0 ? Math.round((total / target) * 100) : null

    return {
      id: entry.id,
      recordId: record?.id || '',
      kpi: entry.kpi,
      goal: entry.goal,
      perspective: entry.perspective,
      quarterlyTarget: record?.quarterlyTarget || '',
      month1: record?.month1 || '',
      month2: record?.month2 || '',
      month3: record?.month3 || '',
      totalAccomplishment: total,
      percentageAccomplishment: percentage === null ? '—' : `${percentage}%`,
      keyActivities: record?.keyActivities || '',
      mov: record?.mov || '',
      status: record?.status || '',
      issues: record?.issues || '',
      assistance: record?.assistance || '',
      focalPerson: record?.focalPerson || '',
      officeId: office.id
    }
  })
}

const loadChartData = async (officeId) => {
  try {
    const entries = adminStore.selectedOffice?.entries || []
    const records = (adminStore.selectedOffice?.quarterlyRecords || [])
      .filter(record => record.quarter === currentQuarter.value)

    const kpiLabels = []
    const kpiData = []

    entries.forEach((entry) => {
      const record = records.find(item => item.entryId === entry.id)
      kpiLabels.push(entry.kpi)

      if (!record) {
        kpiData.push(0)
        return
      }

      const target = parseFloat(record.quarterlyTarget) || 0
      const total = (parseFloat(record.month1) || 0) +
        (parseFloat(record.month2) || 0) +
        (parseFloat(record.month3) || 0)

      kpiData.push(target > 0 ? Math.round((total / target) * 100) : 0)
    })

    chartData.value.accomplishmentLabels = kpiLabels
    chartData.value.accomplishmentData = kpiData

    const statusDist = {
      notStarted: 0,
      ongoing: 0,
      completed: 0,
      delayed: 0,
      forValidation: 0
    }

    records.forEach((record) => {
      switch (record.status) {
        case 'Not Started': statusDist.notStarted++; break
        case 'Ongoing': statusDist.ongoing++; break
        case 'Completed': statusDist.completed++; break
        case 'Delayed': statusDist.delayed++; break
        case 'For Validation': statusDist.forValidation++; break
      }
    })

    chartData.value.statusDistribution = statusDist
    chartData.value.monthlyTrend = await analyticsService.getMonthlyTrend(officeId)

    const comparisonData = await analyticsService.getAccomplishmentByOffice(currentQuarter.value)
    const selectedOfficeSummary = comparisonData.find(item => item.officeId === officeId)

    chartData.value.currentQuarterPercentage = selectedOfficeSummary?.percentage || 0
    chartData.value.comparisonLabels = comparisonData.map(item => item.officeName)
    chartData.value.comparisonOfficeIds = comparisonData.map(item => item.officeId)
    chartData.value.comparisonData = comparisonData.map(item => item.percentage)
  } catch (error) {
    console.error('Error loading chart data:', error)
  }
}

const handleBack = () => {
  router.push('/admin/offices')
}

const handleQuarterChange = (quarter) => {
  currentQuarter.value = quarter
}

const handleSaveFocalPerson = async ({ recordId, focalPerson }) => {
  savingFocalPerson.value = recordId

  try {
    await adminStore.assignFocalPerson(recordId, focalPerson)

    const officeId = route.params.officeId
    if (officeId) {
      await adminStore.fetchOfficeById(officeId)
      loadEntriesForQuarter()
      await loadChartData(officeId)
    }

    toast.success('Focal person assigned successfully!')
  } catch (error) {
    toast.error('Failed to assign focal person')
  } finally {
    savingFocalPerson.value = null
  }
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
