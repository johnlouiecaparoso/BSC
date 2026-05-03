<template>
  <div class="space-y-6">
    <AppCard title="Office Information">
      <div class="grid grid-cols-2 gap-6">
        <div>
          <span class="text-sm text-gray-600">Office Name:</span>
          <p class="font-semibold text-gray-900 mt-1">{{ office.officeName }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-600">Pillar:</span>
          <p class="font-semibold text-gray-900 mt-1">{{ office.pillar }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-600">Assignment Type:</span>
          <p class="font-semibold text-gray-900 mt-1">{{ office.assignmentType }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-600">Total BSC Entries:</span>
          <p class="font-semibold text-gray-900 mt-1">{{ office.totalEntries || 0 }}</p>
        </div>
      </div>
    </AppCard>

    <AppCard title="BSC Entries Summary">
      <AppTable
        :columns="bscColumns"
        :data="office.bscEntries || []"
      >
        <template #cell-perspective="{ value }">
          <AppBadge :variant="getPerspectiveBadgeVariant(value)">
            {{ value }}
          </AppBadge>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup>
import AppCard from '@/components/common/AppCard.vue'
import AppTable from '@/components/common/AppTable.vue'
import AppBadge from '@/components/common/AppBadge.vue'

defineProps({
  office: {
    type: Object,
    required: true
  }
})

const bscColumns = [
  { key: 'goal', label: 'Goal' },
  { key: 'perspective', label: 'Perspective' },
  { key: 'strategicObjective', label: 'Strategic Objective' },
  { key: 'kpi', label: 'KPI / Strategic Measure' },
  { key: 'target2026', label: '2026 Target' }
]

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
