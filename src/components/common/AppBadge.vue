<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => [
      'default',
      'primary',
      'success',
      'warning',
      'danger',
      'info',
      'not-started',
      'ongoing',
      'completed',
      'delayed',
      'for-validation'
    ].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center font-medium rounded-full'

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    'not-started': 'bg-gray-100 text-gray-800',
    'ongoing': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'delayed': 'bg-red-100 text-red-800',
    'for-validation': 'bg-yellow-100 text-yellow-800'
  }

  return `${base} ${sizes[props.size]} ${variants[props.variant]}`
})
</script>
