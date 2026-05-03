<template>
  <div class="w-full h-80">
    <Doughnut v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
      <div class="text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
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
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      notStarted: 0,
      ongoing: 0,
      completed: 0,
      delayed: 0,
      forValidation: 0
    })
  },
  title: {
    type: String,
    default: 'Status Distribution'
  }
})

const hasData = computed(() => {
  return Object.values(props.data).some(val => val > 0)
})

const chartData = computed(() => ({
  labels: ['Not Started', 'Ongoing', 'Completed', 'Delayed', 'For Validation'],
  datasets: [
    {
      data: [
        props.data.notStarted,
        props.data.ongoing,
        props.data.completed,
        props.data.delayed,
        props.data.forValidation
      ],
      backgroundColor: [
        '#9ca3af', // gray
        '#3b82f6', // blue
        '#10b981', // green
        '#ef4444', // red
        '#f59e0b'  // yellow
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom'
    },
    title: {
      display: true,
      text: props.title
    }
  }
}
</script>
