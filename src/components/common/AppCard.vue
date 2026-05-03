<template>
  <div :class="cardClasses">
    <div v-if="title || $slots.header" :class="headerClasses">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </slot>
    </div>

    <div :class="bodyClasses">
      <slot />
    </div>

    <div v-if="$slots.footer" :class="footerClasses">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  padding: {
    type: Boolean,
    default: true
  },
  shadow: {
    type: String,
    default: 'md',
    validator: (value) => ['none', 'sm', 'md', 'lg'].includes(value)
  },
  hover: {
    type: Boolean,
    default: false
  }
})

const cardClasses = computed(() => {
  const base = 'bg-white rounded-lg border border-gray-200'

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  const hoverEffect = props.hover ? 'transition-shadow hover:shadow-lg' : ''

  return `${base} ${shadows[props.shadow]} ${hoverEffect}`
})

const headerClasses = computed(() => {
  return props.padding ? 'px-6 py-4 border-b border-gray-200' : 'border-b border-gray-200'
})

const bodyClasses = computed(() => {
  return props.padding ? 'p-6' : ''
})

const footerClasses = computed(() => {
  return props.padding ? 'px-6 py-4 border-t border-gray-200' : 'border-t border-gray-200'
})
</script>
