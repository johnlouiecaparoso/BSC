<template>
  <div class="bg-white p-4 rounded-lg border border-gray-200">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ quarterLabel }}</h3>
        <p class="text-sm text-gray-600 mt-1">{{ completedCount }} of {{ totalCount }} entries completed</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-bold text-primary-600">{{ completionPercentage }}%</div>
        <p class="text-sm text-gray-600 mt-1">Complete</p>
      </div>
    </div>

    <div class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-primary-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${completionPercentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getQuarterLabel } from '@/utils/quarterHelpers'

const props = defineProps({
  quarter: {
    type: String,
    required: true
  },
  completedCount: {
    type: Number,
    required: true
  },
  totalCount: {
    type: Number,
    required: true
  }
})

const quarterLabel = computed(() => getQuarterLabel(props.quarter))

const completionPercentage = computed(() => {
  if (props.totalCount === 0) return 0
  return Math.round((props.completedCount / props.totalCount) * 100)
})
</script>
