<template>
  <AppCard>
    <div class="space-y-3">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900">{{ entry.kpi }}</h4>
          <p class="text-sm text-gray-600 mt-1">{{ entry.goal }}</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <AppBadge :variant="getPerspectiveBadgeVariant(entry.perspective)">
            {{ entry.perspective }}
          </AppBadge>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Strategic Objective:</span>
          <p class="font-medium text-gray-900 mt-1">{{ entry.strategicObjective }}</p>
        </div>
        <div>
          <span class="text-gray-600">2026 Target:</span>
          <p class="font-medium text-gray-900 mt-1">{{ entry.target2026 }}</p>
        </div>
      </div>

      <div class="flex gap-2 pt-2 border-t border-gray-200">
        <AppButton size="sm" variant="outline" @click="$emit('edit', entry)">
          Edit
        </AppButton>
        <AppButton size="sm" variant="danger" @click="$emit('delete', entry)">
          Delete
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
  entry: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])

const getPerspectiveBadgeVariant = (perspective) => {
  const variants = {
    'Stakeholders': 'primary',
    'Process Excellence': 'info',
    'Talents, Learning & Growth': 'success',
    'Financial': 'warning'
  }
  return variants[perspective] || 'default'
}
</script>
