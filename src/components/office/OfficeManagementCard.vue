<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
    <div class="space-y-4">
      <!-- Office Info -->
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-gray-900">{{ office.officeName }}</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Pillar:</span>
            <p class="font-medium text-gray-900">{{ office.pillar || 'Not set' }}</p>
          </div>
          <div>
            <span class="text-gray-600">Assignment Type:</span>
            <p class="font-medium text-gray-900">{{ office.assignmentType || 'Not set' }}</p>
          </div>
        </div>
      </div>

      <!-- KPI Count -->
      <div class="bg-blue-50 p-3 rounded border border-blue-200">
        <p class="text-sm text-blue-900">
          <strong>{{ kpiCount }}</strong> KPI {{ kpiCount === 1 ? 'entry' : 'entries' }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 pt-2">
        <AppButton
          variant="primary"
          size="sm"
          full-width
          @click="$emit('add-kpi')"
        >
          Add KPI Entry
        </AppButton>
        <AppButton
          variant="outline"
          size="sm"
          @click="$emit('edit')"
          title="Edit office information"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </AppButton>
        <AppButton
          variant="outline"
          size="sm"
          @click="$emit('delete')"
          title="Delete office"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  office: {
    type: Object,
    required: true
  },
  kpiCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['add-kpi', 'edit', 'delete'])
</script>
