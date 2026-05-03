<template>
  <div class="w-full h-80 flex items-center justify-center">
    <div v-if="percentage !== null" class="relative w-64 h-64">
      <Doughnut :data="chartData" :options="chartOptions" />
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <div :class="percentageClasses">{{ percentage }}%</div>
        <div class="text-sm text-gray-600 mt-1">Complete</div>
      </div>
    </div>
    <div v-else class="flex items-center justify-center h-full bg-gray-50 rounded-lg w-full">
      <div class="text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        </svg>
        <p class="text-gray-600">No data available</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps({
  percentage: {
    type: Number,
    default: null
  }
})

const gaugeColor = computed(() => {
  if (props.percentage === null) return '#d1d5db'
  if (props.percentage <= 40) return '#ef4444' // red
  if (props.percentage <= 70) return '#f59e0b' // orange
  return '#10b981' // green
})

const percentageClasses = computed(() => {
  const base = 'text-4xl font-bold'
  if (props.percentage === null) return `${base} text-gray-400`
  if (props.percentage <= 40) return `${base} text-red-600`
  if (props.percentage <= 70) return `${base} text-yellow-600`
  return `${base} text-green-600`
})

const chartData = computed(() => ({
  datasets: [
    {
      data: [props.percentage || 0, 100 - (props.percentage || 0)],
      backgroundColor: [gaugeColor.value, '#e5e7eb'],
      borderWidth: 0,
      cutout: '75%'
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    tooltip: {
      enabled: false
    },
    legend: {
      display: false
    }
  }
}
</script>
