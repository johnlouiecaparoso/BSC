<template>
  <div :class="containerClasses">
    <div :class="spinnerClasses"></div>
    <p v-if="text" class="mt-2 text-sm text-gray-600">{{ text }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})

const containerClasses = computed(() => {
  const base = 'flex flex-col items-center justify-center'
  const fullscreen = props.fullscreen ? 'fixed inset-0 bg-white bg-opacity-90 z-50' : ''
  return `${base} ${fullscreen}`
})

const spinnerClasses = computed(() => {
  const base = 'border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin'

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return `${base} ${sizes[props.size]}`
})
</script>
