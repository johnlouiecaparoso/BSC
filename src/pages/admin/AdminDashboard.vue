<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p class="text-gray-600 mt-1">
        University-wide performance overview — {{ selectedQuarter.toUpperCase() }} {{ selectedYear }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-6">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700">Quarter:</span>
        <div class="flex gap-2">
          <AppButton
            v-for="q in QUARTER_OPTIONS"
            :key="q.value"
            :variant="selectedQuarter === q.value ? 'primary' : 'outline'"
            size="sm"
            @click="selectQuarter(q.value)"
          >
            {{ q.label }}
          </AppButton>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700">Year:</span>
        <div class="flex gap-2">
          <AppButton
            v-for="year in selectableYears"
            :key="year"
            :variant="selectedYear === year ? 'primary' : 'outline'"
            size="sm"
            @click="selectYear(year)"
          >
            {{ year }}
          </AppButton>
        </div>
      </div>
    </div>

    <div v-if="loadError" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-red-800">{{ loadError }}</p>
        <AppButton variant="outline" size="sm" @click="loadDashboardData">Retry</AppButton>
      </div>
    </div>

    <div v-if="stats.pendingApprovals > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex-1">
          <p class="font-semibold text-yellow-900">{{ stats.pendingApprovals }} office(s) pending approval</p>
          <p class="text-sm text-yellow-800">Review and approve office registrations</p>
        </div>
        <AppButton variant="primary" @click="router.push('/admin/approvals')">
          View Approvals
        </AppButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AppCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Offices</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalOffices }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total BSC Entries</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalEntries }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Pending Approvals</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.pendingApprovals }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Needs Attention</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.entriesWithIssuesNoFocalPerson }}</p>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Row 1: Status Doughnut + Accomplishment Bar -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Status Distribution</h3>
            <ChartExportButton
              target-selector="#dash-chart-status"
              filename="dashboard-status-distribution"
            />
          </div>
        </template>
        <div id="dash-chart-status">
          <StatusDoughnutChart :data="statusDistribution" />
        </div>
      </AppCard>

      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Accomplishment by Office</h3>
            <ChartExportButton
              target-selector="#dash-chart-accomplishment"
              :filename="`dashboard-accomplishment-${selectedQuarter}-${selectedYear}`"
            />
          </div>
        </template>
        <div id="dash-chart-accomplishment">
          <AccomplishmentBarChart
            :labels="accomplishmentLabels"
            :data="accomplishmentData"
            :title="`Office Accomplishment — ${selectedQuarter.toUpperCase()} ${selectedYear}`"
          />
        </div>
      </AppCard>
    </div>

    <!-- Row 2: Monthly Trend + Performance Gauge -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Monthly Trend</h3>
            <ChartExportButton
              target-selector="#dash-chart-monthly-trend"
              filename="dashboard-monthly-trend"
            />
          </div>
        </template>
        <div id="dash-chart-monthly-trend">
          <MonthlyTrendLineChart :data="monthlyTrend" />
        </div>
      </AppCard>

      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Overall Performance</h3>
            <ChartExportButton
              target-selector="#dash-chart-gauge"
              filename="dashboard-performance-gauge"
            />
          </div>
        </template>
        <div id="dash-chart-gauge">
          <AccomplishmentGauge :percentage="gaugePercentage" />
        </div>
      </AppCard>
    </div>

    <!-- Row 3: Goal Performance (full width) -->
    <AppCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Performance by Goal</h3>
          <ChartExportButton
            target-selector="#dash-chart-goal-performance"
            :filename="`dashboard-goal-performance-${selectedQuarter}-${selectedYear}`"
          />
        </div>
      </template>
      <div id="dash-chart-goal-performance">
        <GoalPerformanceChart
          :labels="goalLabels"
          :datasets="goalDatasets"
          :title="`Performance by Goal — ${selectedQuarter.toUpperCase()} ${selectedYear}`"
        />
      </div>
    </AppCard>

    <!-- Row 4: Offices needing attention (full width) -->
    <AppCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Offices Needing Attention</h3>
          <ChartExportButton
            target-selector="#dash-chart-office-comparison"
            :filename="`dashboard-offices-needing-attention-${selectedQuarter}-${selectedYear}`"
          />
        </div>
      </template>
      <div id="dash-chart-office-comparison">
        <OfficeComparisonChart
          :labels="lowestPerformingLabels"
          :data="lowestPerformingData"
          :title="`Lowest Accomplishment — ${selectedQuarter.toUpperCase()} ${selectedYear}`"
        />
      </div>
    </AppCard>

    <!-- Alerts Table -->
    <AlertTable :alerts="alerts" @assign-focal-person="handleAssignFocalPerson" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import ChartExportButton from '@/components/charts/ChartExportButton.vue'
import StatusDoughnutChart from '@/components/charts/StatusDoughnutChart.vue'
import AccomplishmentBarChart from '@/components/charts/AccomplishmentBarChart.vue'
import MonthlyTrendLineChart from '@/components/charts/MonthlyTrendLineChart.vue'
import AccomplishmentGauge from '@/components/charts/AccomplishmentGauge.vue'
import GoalPerformanceChart from '@/components/charts/GoalPerformanceChart.vue'
import OfficeComparisonChart from '@/components/charts/OfficeComparisonChart.vue'
import AlertTable from '@/components/admin/AlertTable.vue'
import { useAdminStore } from '@/stores/adminStore'
import * as analyticsService from '@/services/analyticsService'
import {
  QUARTER_OPTIONS,
  getCurrentQuarter,
  getCurrentYear,
  getSelectableYears
} from '@/utils/quarterHelpers'

const TOP_OFFICE_COUNT = 10

const router = useRouter()
const adminStore = useAdminStore()

const selectedQuarter = ref(getCurrentQuarter())
const selectedYear = ref(getCurrentYear())
const selectableYears = getSelectableYears()
const loadError = ref('')

const stats = ref({
  totalOffices: 0,
  totalEntries: 0,
  pendingApprovals: 0,
  entriesWithIssuesNoFocalPerson: 0
})

const statusDistribution = ref({
  notStarted: 0,
  ongoing: 0,
  completed: 0,
  delayed: 0,
  forValidation: 0
})

const officeAccomplishment = ref([])
const monthlyTrend = ref([])
const gaugePercentage = ref(0)
const goalLabels = ref([])
const goalDatasets = ref([])
const alerts = ref([])

// The bar chart highlights the strongest offices; the comparison chart below
// surfaces the weakest. Previously both were fed the identical full list.
const topOffices = computed(() => officeAccomplishment.value.slice(0, TOP_OFFICE_COUNT))
const accomplishmentLabels = computed(() => topOffices.value.map(o => o.officeName))
const accomplishmentData = computed(() => topOffices.value.map(o => o.percentage))

const lowestPerforming = computed(() =>
  [...officeAccomplishment.value]
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, TOP_OFFICE_COUNT)
)
const lowestPerformingLabels = computed(() => lowestPerforming.value.map(o => o.officeName))
const lowestPerformingData = computed(() => lowestPerforming.value.map(o => o.percentage))

onMounted(loadDashboardData)

async function loadDashboardData() {
  loadError.value = ''

  const filters = { year: selectedYear.value }

  try {
    // Independent reads, so issue them together instead of six sequential awaits.
    const [
      universityStats,
      statusData,
      accomplishmentByOffice,
      trendData,
      goalPerf,
      alertData
    ] = await Promise.all([
      analyticsService.getUniversityWideStats(selectedYear.value),
      analyticsService.getStatusDistribution({ ...filters, quarter: selectedQuarter.value }),
      analyticsService.getAccomplishmentByOffice(selectedQuarter.value, null, filters),
      analyticsService.getMonthlyTrend(null, selectedYear.value, filters),
      analyticsService.getGoalPerformance(selectedQuarter.value, filters),
      analyticsService.getEntriesWithIssuesNoFocalPerson(selectedYear.value)
    ])

    stats.value = universityStats
    statusDistribution.value = statusData
    officeAccomplishment.value = accomplishmentByOffice
    monthlyTrend.value = trendData
    goalLabels.value = goalPerf.labels || []
    goalDatasets.value = goalPerf.datasets || []
    alerts.value = alertData

    // Weighted by target across the whole university rather than a plain mean of
    // office percentages, so a one-KPI office no longer counts as much as a
    // fifty-KPI one, and offices with no entries do not drag the figure down.
    const totals = accomplishmentByOffice.reduce((acc, office) => ({
      accomplishment: acc.accomplishment + (office.totalAccomplishment || 0),
      target: acc.target + (office.totalTarget || 0)
    }), { accomplishment: 0, target: 0 })

    gaugePercentage.value = totals.target > 0
      ? Math.round((totals.accomplishment / totals.target) * 100)
      : 0
  } catch (error) {
    console.error('Error loading dashboard:', error)
    loadError.value = 'Some dashboard data could not be loaded. Please try again.'
  }

  // Kept separate so a failure here cannot blank the charts above.
  try {
    await adminStore.fetchPendingApprovals()
    stats.value.pendingApprovals = adminStore.pendingApprovals.length
  } catch (error) {
    console.error('Error loading pending approvals:', error)
  }
}

const selectQuarter = (quarter) => {
  selectedQuarter.value = quarter
  loadDashboardData()
}

const selectYear = (year) => {
  selectedYear.value = year
  loadDashboardData()
}

const handleAssignFocalPerson = (entry) => {
  router.push(`/admin/offices/${entry.officeId}`)
}
</script>
