<template>
  <div class="space-y-4">
    <div class="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-gray-600">Goal:</span>
          <p class="font-medium text-gray-900">{{ entry.goal }}</p>
        </div>
        <div>
          <span class="text-gray-600">Perspective:</span>
          <p class="font-medium text-gray-900">{{ entry.perspective }}</p>
        </div>
        <div>
          <span class="text-gray-600">Strategic Objective:</span>
          <p class="font-medium text-gray-900">{{ entry.strategicObjective }}</p>
        </div>
        <div>
          <span class="text-gray-600">KPI:</span>
          <p class="font-medium text-gray-900">{{ entry.kpi }}</p>
        </div>
        <div>
          <span class="text-gray-600">2026 Target:</span>
          <p class="font-medium text-gray-900">{{ entry.target2026 }}</p>
        </div>
      </div>
    </div>

    <AppInput
      v-model="localData.quarterlyTarget"
      type="number"
      label="Quarterly Target"
      placeholder="Enter quarterly target"
      @input="handleInput"
    />

    <div class="grid grid-cols-3 gap-4">
      <AppInput
        v-model="localData.month1"
        type="number"
        :label="`${monthLabels[0]} Actual`"
        :placeholder="`Enter ${monthLabels[0]} actual`"
        @input="handleInput"
      />
      <AppInput
        v-model="localData.month2"
        type="number"
        :label="`${monthLabels[1]} Actual`"
        :placeholder="`Enter ${monthLabels[1]} actual`"
        @input="handleInput"
      />
      <AppInput
        v-model="localData.month3"
        type="number"
        :label="`${monthLabels[2]} Actual`"
        :placeholder="`Enter ${monthLabels[2]} actual`"
        @input="handleInput"
      />
    </div>

    <div class="grid grid-cols-2 gap-4 bg-primary-50 p-4 rounded-lg">
      <div>
        <span class="text-sm text-gray-600">Total Accomplishment:</span>
        <p class="text-2xl font-bold text-gray-900">{{ totalAccomplishment }}</p>
      </div>
      <div>
        <span class="text-sm text-gray-600">% Accomplishment vs Target:</span>
        <p class="text-2xl font-bold text-primary-600">
          {{ percentageAccomplishment }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import AppInput from '@/components/common/AppInput.vue'
import { computeTotal, computePercentage } from '@/utils/computeAccomplishment'
import { getMonthLabels } from '@/utils/quarterHelpers'

const props = defineProps({
  entry: {
    type: Object,
    required: true
  },
  quarter: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: () => ({
      quarterlyTarget: '',
      month1: '',
      month2: '',
      month3: ''
    })
  }
})

const emit = defineEmits(['update'])

const localData = reactive({
  quarterlyTarget: '',
  month1: '',
  month2: '',
  month3: ''
})

const monthLabels = computed(() => getMonthLabels(props.quarter))

const totalAccomplishment = computed(() => {
  return computeTotal(localData.month1, localData.month2, localData.month3)
})

const percentageAccomplishment = computed(() => {
  const percentage = computePercentage(totalAccomplishment.value, localData.quarterlyTarget)
  return percentage !== null ? `${percentage.toFixed(2)}%` : '—'
})

watch(() => props.data, (newData) => {
  if (newData) {
    localData.quarterlyTarget = newData.quarterlyTarget || ''
    localData.month1 = newData.month1 || ''
    localData.month2 = newData.month2 || ''
    localData.month3 = newData.month3 || ''
  }
}, { immediate: true, deep: true })

const handleInput = () => {
  emit('update', { ...localData })
}
</script>
