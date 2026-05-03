<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p class="text-gray-600 mt-1">University-wide performance overview</p>
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
      <AppCard title="Status Distribution">
        <StatusDoughnutChart :data="statusDistribution" />
      </AppCard>

      <AppCard title="Overall Accomplishment">
        <AccomplishmentBarChart
          :labels="accomplishmentLabels"
          :data="accomplishmentData"
          title="Top Performing Offices"
        />
      </AppCard>
    </div>

    <!-- Row 2: Monthly Trend + Performance Gauge -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Monthly Trend">
        <MonthlyTrendLineChart :data="monthlyTrend" />
      </AppCard>

      <AppCard title="Overall Performance">
        <AccomplishmentGauge :percentage="gaugePercentage" />
      </AppCard>
    </div>

    <!-- Row 3: Goal Performance (full width) -->
    <AppCard title="Performance by Goal">
      <GoalStackedBarChart
        :labels="goalLabels"
        :datasets="goalDatasets"
      />
    </AppCard>

    <!-- Row 4: Office Comparison (full width) -->
    <AppCard title="Office Comparison">
      <OfficeComparisonChart
        :labels="comparisonLabels"
        :data="comparisonData"
      />
    </AppCard>

    <!-- Alerts Table -->
    <AlertTable :alerts="alerts" @assign-focal-person="handleAssignFocalPerson" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import StatusDoughnutChart from '@/components/charts/StatusDoughnutChart.vue'
import AccomplishmentBarChart from '@/components/charts/AccomplishmentBarChart.vue'
import MonthlyTrendLineChart from '@/components/charts/MonthlyTrendLineChart.vue'
import AccomplishmentGauge from '@/components/charts/AccomplishmentGauge.vue'
import GoalStackedBarChart from '@/components/charts/GoalStackedBarChart.vue'
import OfficeComparisonChart from '@/components/charts/OfficeComparisonChart.vue'
import AlertTable from '@/components/admin/AlertTable.vue'
import { useAdminStore } from '@/stores/adminStore'
import * as analyticsService from '@/services/analyticsService'

const router = useRouter()
const adminStore = useAdminStore()

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

const accomplishmentLabels = ref([])
const accomplishmentData = ref([])
const monthlyTrend = ref([])
const gaugePercentage = ref(0)
const goalLabels = ref([])
const goalDatasets = ref([])
const comparisonLabels = ref([])
const comparisonData = ref([])
const alerts = ref([])

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  // Stats cards
  const universityStats = await analyticsService.getUniversityWideStats()
  stats.value = universityStats

  // Status distribution (doughnut chart)
  const statusData = await analyticsService.getStatusDistribution()
  statusDistribution.value = statusData

  // Pending approvals
  await adminStore.fetchPendingApprovals()
  stats.value.pendingApprovals = adminStore.pendingApprovals.length

  // Accomplishment by office (bar chart + comparison chart)
  const accomplishmentByOffice = await analyticsService.getAccomplishmentByOffice('q1')
  accomplishmentLabels.value = accomplishmentByOffice.map(o => o.officeName)
  accomplishmentData.value = accomplishmentByOffice.map(o => o.percentage)
  comparisonLabels.value = accomplishmentByOffice.map(o => o.officeName)
  comparisonData.value = accomplishmentByOffice.map(o => o.percentage)

  // Monthly trend (line chart)
  const trendData = await analyticsService.getMonthlyTrend(null)
  monthlyTrend.value = trendData

  // Gauge percentage (average of all offices)
  const totalPct = accomplishmentData.value.reduce((a, b) => a + b, 0)
  gaugePercentage.value = accomplishmentData.value.length > 0
    ? Math.round(totalPct / accomplishmentData.value.length)
    : 0

  // Goal performance (stacked bar chart)
  const goalPerf = await analyticsService.getGoalPerformance()
  goalLabels.value = goalPerf.labels || []
  goalDatasets.value = goalPerf.datasets || []

  // Alerts — entries with issues but no focal person
  const alertData = await analyticsService.getEntriesWithIssuesNoFocalPerson()
  alerts.value = alertData
}

const handleAssignFocalPerson = (entry) => {
  router.push(`/admin/offices/${entry.officeId}`)
}
</script>
