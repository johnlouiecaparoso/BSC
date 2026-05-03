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
            @click="selectedQuarter = q.value"
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

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard :title="selectedOffice ? `${selectedOffice} - Accomplishment by KPI` : 'University-wide Accomplishment'">
        <AccomplishmentBarChart
          :labels="chartData.accomplishmentLabels"
          :data="chartData.accomplishmentData"
        />
      </AppCard>

      <AppCard title="Status Distribution">
        <StatusDoughnutChart :data="chartData.statusDistribution" />
      </AppCard>

      <AppCard title="Monthly Trend">
        <MonthlyTrendLineChart :data="chartData.monthlyTrend" />
      </AppCard>

      <AppCard :title="`${selectedQuarter.toUpperCase()} Performance Gauge`">
        <AccomplishmentGauge :percentage="chartData.gaugePercentage" />
      </AppCard>
    </div>

    <AppCard title="Performance by Goal">
      <GoalStackedBarChart
        :labels="chartData.goalLabels"
        :datasets="chartData.goalDatasets"
      />
    </AppCard>

    <AppCard title="Office Comparison">
      <OfficeComparisonChart
        :labels="chartData.comparisonLabels"
        :data="chartData.comparisonData"
        :highlight-office-id="selectedOffice"
      />
    </AppCard>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import SearchBar from '@/components/admin/SearchBar.vue'
import FilterPanel from '@/components/admin/FilterPanel.vue'
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

const quarters = [
  { value: 'q1', label: 'Q1' },
  { value: 'q2', label: 'Q2' },
  { value: 'q3', label: 'Q3' },
  { value: 'q4', label: 'Q4' }
]

const filters = reactive({
  pillar: '',
  assignmentType: '',
  goal: '',
  perspective: '',
  quarter: '',
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
  const statusData = await analyticsService.getStatusDistribution({
    ...filters,
    quarter: selectedQuarter.value
  })
  chartData.statusDistribution = statusData

  // Load accomplishment data by office with optional office filter
  const accomplishmentByOffice = await analyticsService.getAccomplishmentByOffice(selectedQuarter.value, selectedOffice.value || null)
  chartData.accomplishmentLabels = accomplishmentByOffice.map(o => o.officeName)
  chartData.accomplishmentData = accomplishmentByOffice.map(o => o.percentage)

  // Load comparison data (same data, for comparison chart)
  chartData.comparisonLabels = accomplishmentByOffice.map(o => o.officeName)
  chartData.comparisonData = accomplishmentByOffice.map(o => o.percentage)

  // Load monthly trend
  const monthlyTrend = await analyticsService.getMonthlyTrend(null)
  chartData.monthlyTrend = monthlyTrend

  // Compute gauge percentage from overall stats
  const overallStats = await analyticsService.getUniversityWideStats()
  // Average from accomplishment data
  const totalPct = chartData.accomplishmentData.reduce((a, b) => a + b, 0)
  chartData.gaugePercentage = chartData.accomplishmentData.length > 0
    ? Math.round(totalPct / chartData.accomplishmentData.length)
    : 0

  // Load goal performance
  const goalPerf = await analyticsService.getGoalPerformance(selectedQuarter.value)
  chartData.goalLabels = goalPerf.labels || []
  chartData.goalDatasets = goalPerf.datasets || []
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
