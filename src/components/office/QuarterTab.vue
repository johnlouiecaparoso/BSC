<template>
  <div class="border-b border-gray-200">
    <nav class="-mb-px flex gap-8">
      <button
        v-for="quarter in quarters"
        :key="quarter.value"
        type="button"
        :class="getTabClasses(quarter.value)"
        @click="$emit('change', quarter.value)"
      >
        <span>{{ quarter.label }}</span>
        <div
          v-if="quarter.completed"
          class="ml-2 w-2 h-2 bg-green-500 rounded-full"
          title="All entries completed"
        ></div>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeQuarter: {
    type: String,
    required: true
  },
  completionStatus: {
    type: Object,
    default: () => ({
      q1: false,
      q2: false,
      q3: false,
      q4: false
    })
  }
})

defineEmits(['change'])

const quarters = computed(() => [
  { value: 'q1', label: 'Q1', completed: props.completionStatus.q1 },
  { value: 'q2', label: 'Q2', completed: props.completionStatus.q2 },
  { value: 'q3', label: 'Q3', completed: props.completionStatus.q3 },
  { value: 'q4', label: 'Q4', completed: props.completionStatus.q4 }
])

const getTabClasses = (quarter) => {
  const base = 'flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors'
  const active = 'border-primary-600 text-primary-600'
  const inactive = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

  return props.activeQuarter === quarter ? `${base} ${active}` : `${base} ${inactive}`
}
</script>
