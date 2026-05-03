<template>
  <AppCard title="Alerts — Entries with Issues but No Focal Person">
    <!-- Desktop Table View -->
    <div class="hidden md:block overflow-x-auto">
      <AppTable
        :columns="columns"
        :data="alerts"
      >
        <template #cell-officeName="{ value }">
          <span class="font-medium text-gray-900">{{ value }}</span>
        </template>

        <template #cell-issue="{ value }">
          <p class="text-sm text-gray-600 line-clamp-2 whitespace-normal max-w-xs">{{ value }}</p>
        </template>

        <template #cell-quarter="{ value }">
          <AppBadge variant="info">{{ value?.toUpperCase() }}</AppBadge>
        </template>

        <template #actions="{ row }">
          <AppButton
            variant="primary"
            size="sm"
            @click="$emit('assign-focal-person', row)"
          >
            Assign Focal Person
          </AppButton>
        </template>

        <template #empty>
          <div class="flex flex-col items-center justify-center py-8">
            <svg class="w-12 h-12 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-gray-600 text-center">No alerts — All entries with issues have assigned focal persons</p>
          </div>
        </template>
      </AppTable>
    </div>

    <!-- Mobile Card View -->
    <div class="md:hidden">
      <div v-if="alerts.length === 0" class="flex flex-col items-center justify-center py-8">
        <svg class="w-12 h-12 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600 text-center px-4">No alerts — All entries with issues have assigned focal persons</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(alert, index) in alerts"
          :key="index"
          class="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-gray-900 truncate">{{ alert.officeName }}</p>
              <p class="text-sm text-gray-600 mt-1 break-words">{{ alert.kpi }}</p>
            </div>
            <AppBadge variant="info" class="flex-shrink-0">{{ alert.quarter?.toUpperCase() }}</AppBadge>
          </div>

          <div v-if="alert.issue">
            <p class="text-xs font-medium text-gray-500 uppercase mb-1">Issue</p>
            <p class="text-sm text-gray-700 break-words">{{ alert.issue }}</p>
          </div>

          <AppButton
            variant="primary"
            size="sm"
            full-width
            @click="$emit('assign-focal-person', alert)"
          >
            Assign Focal Person
          </AppButton>
        </div>
      </div>
    </div>
  </AppCard>
</template>

<script setup>
import AppCard from '@/components/common/AppCard.vue'
import AppTable from '@/components/common/AppTable.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'

defineProps({
  alerts: {
    type: Array,
    default: () => []
  }
})

defineEmits(['assign-focal-person'])

const columns = [
  { key: 'officeName', label: 'Office Name' },
  { key: 'kpi', label: 'KPI' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'issue', label: 'Issue Summary' }
]
</script>
