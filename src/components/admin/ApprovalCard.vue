<template>
  <AppCard>
    <div class="space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">{{ approval.officeName }}</h3>
          <p class="text-sm text-gray-600 mt-1">Registered by {{ approval.registeredBy }}</p>
        </div>
        <AppBadge variant="warning">Pending</AppBadge>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Email:</span>
          <p class="font-medium text-gray-900">{{ approval.email }}</p>
        </div>
        <div>
          <span class="text-gray-600">Contact:</span>
          <p class="font-medium text-gray-900">{{ approval.contactNumber || 'N/A' }}</p>
        </div>
      </div>

      <div class="text-xs text-gray-500">
        Registered on {{ approval.registeredAt }}
      </div>

      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <AppButton
          variant="success"
          size="sm"
          :loading="isApproving"
          @click="$emit('approve', approval)"
        >
          Approve
        </AppButton>
        <AppButton
          variant="danger"
          size="sm"
          :loading="isRejecting"
          @click="$emit('reject', approval)"
        >
          Reject
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
  approval: {
    type: Object,
    required: true
  },
  isApproving: {
    type: Boolean,
    default: false
  },
  isRejecting: {
    type: Boolean,
    default: false
  }
})

defineEmits(['approve', 'reject'])
</script>
