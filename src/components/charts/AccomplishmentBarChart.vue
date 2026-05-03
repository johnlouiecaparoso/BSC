<template>
  <div class="w-full h-80">
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
  data: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Accomplishment vs Target'
  }
})

const hasData = computed(() => props.labels.length > 0 && props.data.length > 0)

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: '% Accomplishment',
      data: props.data,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      borderWidth: 1
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: props.title
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: (value) => `${value}%`
      }
    }
  }
}
</script>
