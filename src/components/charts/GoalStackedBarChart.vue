<template>
  <div class="w-full" :style="{ height: dynamicHeight }">
    <Bar v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
      <div class="text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="text-gray-600">No data available</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  labels: {
    type: Array,
    default: () => []
  },
  datasets: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Performance by Goal'
  }
})

const hasData = computed(() => props.labels.length > 0 && props.datasets.length > 0)

// Dynamic height based on number of labels for horizontal bars
const dynamicHeight = computed(() => {
  const baseHeight = 120
  const perBar = 40
  const height = Math.max(320, baseHeight + props.labels.length * perBar)
  return `${height}px`
})

// Truncate long labels for display
const truncatedLabels = computed(() => {
  return props.labels.map(label => {
    if (label && label.length > 50) {
      return label.substring(0, 47) + '...'
    }
    return label
  })
})

const chartData = computed(() => ({
  labels: truncatedLabels.value,
  datasets: props.datasets
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    title: {
      display: true,
      text: props.title
    },
    tooltip: {
      callbacks: {
        // Show full goal name in tooltip
        title: function(context) {
          const index = context[0].dataIndex
          return props.labels[index] || ''
        },
        label: function(context) {
          return `${context.dataset.label}: ${context.parsed.x}%`
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        callback: (value) => `${value}%`
      }
    },
    y: {
      stacked: true,
      ticks: {
        font: {
          size: 11
        },
        autoSkip: false
      }
    }
  }
}))
</script>
