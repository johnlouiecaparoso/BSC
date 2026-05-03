<template>
  <header class="bg-white border-b border-gray-200 px-6 py-4 ml-64 fixed top-0 right-0 left-64 z-10">
    <div class="flex items-center justify-between">
      <div>
        <slot name="title">
          <h2 class="text-xl font-semibold text-gray-900">{{ title }}</h2>
        </slot>
        <p v-if="subtitle" class="text-sm text-gray-600 mt-1">{{ subtitle }}</p>
      </div>

      <div class="flex items-center gap-4">
        <slot name="actions">
          <button
            v-if="showNotifications"
            type="button"
            class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            @click="$emit('notification-click')"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span
              v-if="notificationCount > 0"
              class="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
            >
              {{ notificationCount > 9 ? '9+' : notificationCount }}
            </span>
          </button>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  showNotifications: {
    type: Boolean,
    default: true
  },
  notificationCount: {
    type: Number,
    default: 0
  }
})

defineEmits(['notification-click'])
</script>
