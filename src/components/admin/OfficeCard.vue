<template>
  <AppCard hover>
    <div class="space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">{{ office.officeName }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ office.pillar }}</p>
        </div>
        <AppBadge variant="primary">
          {{ office.assignmentType }}
        </AppBadge>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">BSC Entries:</span>
          <p class="font-semibold text-gray-900">{{ office.totalEntries || 0 }}</p>
        </div>
        <div>
          <span class="text-gray-600">Completion:</span>
          <p class="font-semibold text-green-600">{{ office.completion || 0 }}%</p>
        </div>
      </div>

      <div class="text-xs text-gray-500">
        Last updated: {{ office.lastUpdated || 'Never' }}
      </div>

      <div class="pt-4 border-t border-gray-200">
        <AppButton variant="outline" size="sm" full-width @click="$emit('view', office)">
          View Details
        </AppButton>
      </div>
    </div>
  </AppCard>
</template>

<script setup>
import AppCard from '@/components/common/AppCard.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'

defineProps({
  office: {
    type: Object,
    required: true
  }
})

defineEmits(['view'])
</script>
