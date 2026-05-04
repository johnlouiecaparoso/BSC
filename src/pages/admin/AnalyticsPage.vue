<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Analytics</h1>
      <p class="text-gray-600 mt-1">Performance analytics and insights</p>
    </div>

    <div class="space-y-4">
      <SearchBar
        v-model="searchQuery"
        placeholder="Search offices for comparison..."
        @search="handleSearch"
      />

      <FilterPanel
        :filters="filters"
        @update:filters="handleFilterChange"
        @clear="handleClearFilters"
      />

      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-gray-700">Select Quarter:</span>
        <div class="flex gap-2">
          <AppButton
            v-for="q in quarters"
            :key="q.value"
            :variant="selectedQuarter === q.value ? 'primary' : 'outline'"
            size="sm"
            @click="selectQuarter(q.value)"
          >
            {{ q.label }}
          </AppButton>
        </div>
      </div>
    </div>

    <div v-if="selectedOffice" class="bg-primary-50 border border-primary-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-semibold text-primary-900">Viewing analytics for: {{ selectedOffice }}</p>
          <p class="text-sm text-primary-700">Comparison with university-wide data</p>
        </div>
        <AppButton variant="outline" size="sm" @click="clearSelection">
          Clear Selection
        </AppButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3 text-gray-500">
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span>Loading analytics...</span>
      </div>
    </div>

    <template v-if="!loading">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ selectedOffice ? `${selectedOffice} - Accomplishment by KPI` : 'University-wide Accomplishment' }}
              </h3>
              <ChartExportButton
                target-selector="#chart-accomplishment"
                :filename="`accomplishment-${selectedQuarter}`"
              />
            </div>
          </template>
          <div id="chart-accomplishment">
            <AccomplishmentBarChart
              :labels="chartData.accomplishmentLabels"
              :data="chartData.accomplishmentData"
            />
          </div>
        </AppCard>

        <AppCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Status Distribution</h3>
              <ChartExportButton
                target-selector="#chart-status"
                :filename="`status-distribution-${selectedQuarter}`"
              />
            </div>
          </template>
          <div id="chart-status">
            <StatusDoughnutChart :data="chartData.statusDistribution" />
          </div>
        </AppCard>

        <AppCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Monthly Trend</h3>
              <ChartExportButton
                target-selector="#chart-monthly-trend"
                :filename="`monthly-trend-${selectedQuarter}`"
              />
            </div>
          </template>
          <div id="chart-monthly-trend">
            <MonthlyTrendLineChart :data="chartData.monthlyTrend" />
          </div>
        </AppCard>

        <AppCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedQuarter.toUpperCase() }} Performance Gauge</h3>
              <ChartExportButton
                target-selector="#chart-gauge"
                :filename="`performance-gauge-${selectedQuarter}`"
              />
            </div>
          </template>
          <div id="chart-gauge">
            <AccomplishmentGauge :percentage="chartData.gaugePercentage" />
          </div>
        </AppCard>
      </div>

      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Performance by Goal</h3>
            <ChartExportButton
              target-selector="#chart-goal-performance"
              :filename="`goal-performance-${selectedQuarter}`"
            />
          </div>
        </template>
        <div id="chart-goal-performance">
          <GoalStackedBarChart
            :labels="chartData.goalLabels"
            :datasets="chartData.goalDatasets"
          />
        </div>
      </AppCard>

      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Office Comparison</h3>
            <ChartExportButton
              target-selector="#chart-office-comparison"
              :filename="`office-comparison-${selectedQuarter}`"
            />
          </div>
        </template>
        <div id="chart-office-comparison">
          <OfficeComparisonChart
            :labels="chartData.comparisonLabels"
            :data="chartData.comparisonData"
            :highlight-office-id="selectedOffice"
          />
        </div>
      </AppCard>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import SearchBar from '@/components/admin/SearchBar.vue'
import FilterPanel from '@/components/admin/FilterPanel.vue'
import ChartExportButton from '@/components/charts/ChartExportButton.vue'
import AccomplishmentBarChart from '@/components/charts/AccomplishmentBarChart.vue'
import MonthlyTrendLineChart from '@/components/charts/MonthlyTrendLineChart.vue'
import StatusDoughnutChart from '@/components/charts/StatusDoughnutChart.vue'
import GoalStackedBarChart from '@/components/charts/GoalStackedBarChart.vue'
import OfficeComparisonChart from '@/components/charts/OfficeComparisonChart.vue'
import AccomplishmentGauge from '@/components/charts/AccomplishmentGauge.vue'
import * as analyticsService from '@/services/analyticsService'

const searchQuery = ref('')
const selectedOffice = ref('')
const selectedQuarter = ref('q1')
const loading = ref(false)

const quarters = [
  { value: 'q1', label: 'Q1' },
  { value: 'q2', label: 'Q2' },
  { value: 'q3', label: 'Q3' },
  { value: 'q4', label: 'Q4' }
]

const filters = reactive({
  office: '',
  pillar: '',
  assignmentType: '',
  perspective: '',
  status: '',
  hasFocalPerson: ''
})

const chartData = reactive({
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
  gaugePercentage: 0,
  goalLabels: [],
  goalDatasets: [],
  comparisonLabels: [],
  comparisonData: []
})

onMounted(async () => {
  await loadAnalytics()
})

const loadAnalytics = async () => {
  loading.value = true
  try {
    const activeFilters = { ...filters, quarter: selectedQuarter.value }

    // Status Distribution
    const statusData = await analyticsService.getStatusDistribution(activeFilters)
    chartData.statusDistribution = statusData

    // Load accomplishment data by office with optional office filter
    const accomplishmentByOffice = await analyticsService.getAccomplishmentByOffice(
      selectedQuarter.value,
      selectedOffice.value || null,
      filters
    )
    chartData.accomplishmentLabels = accomplishmentByOffice.map(o => o.officeName)
    chartData.accomplishmentData = accomplishmentByOffice.map(o => o.percentage)

    // Load comparison data (same data, for comparison chart)
    chartData.comparisonLabels = accomplishmentByOffice.map(o => o.officeName)
    chartData.comparisonData = accomplishmentByOffice.map(o => o.percentage)

    // Load monthly trend
    const monthlyTrend = await analyticsService.getMonthlyTrend(null, 2026, filters)
    chartData.monthlyTrend = monthlyTrend

    // Compute gauge percentage from overall stats
    const totalPct = chartData.accomplishmentData.reduce((a, b) => a + b, 0)
    chartData.gaugePercentage = chartData.accomplishmentData.length > 0
      ? Math.round(totalPct / chartData.accomplishmentData.length)
      : 0

    // Load goal performance
    const goalPerf = await analyticsService.getGoalPerformance(selectedQuarter.value, filters)
    chartData.goalLabels = goalPerf.labels || []
    chartData.goalDatasets = goalPerf.datasets || []
  } catch (err) {
    console.error('Error loading analytics:', err)
  } finally {
    loading.value = false
  }
}

const selectQuarter = (q) => {
  selectedQuarter.value = q
  loadAnalytics()
}

const handleSearch = (query) => {
  searchQuery.value = query
  if (query) {
    selectedOffice.value = query
  } else {
    selectedOffice.value = ''
  }
  loadAnalytics()
}

const handleFilterChange = (newFilters) => {
  Object.assign(filters, newFilters)
  loadAnalytics()
}

const handleClearFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = ''
  })
  searchQuery.value = ''
  selectedOffice.value = ''
  loadAnalytics()
}

const clearSelection = () => {
  selectedOffice.value = ''
  searchQuery.value = ''
  loadAnalytics()
}
</script>
