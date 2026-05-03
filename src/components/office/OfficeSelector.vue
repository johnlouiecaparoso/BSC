<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Select Office</h2>
      <p class="text-gray-600">Choose an office to manage its BSC entries</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="office in offices"
        :key="office.id"
        :class="[
          'p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg',
          selectedOfficeId === office.id
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-primary-300'
        ]"
        @click="selectOffice(office.id)"
      >
        <div class="space-y-3">
          <div>
            <h3 class="font-semibold text-lg text-gray-900">{{ office.officeName }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ office.pillar || 'No Pillar' }}</p>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Assignment Type:</span>
              <span class="font-medium text-gray-900">{{ office.assignmentType || 'N/A' }}</span>
            </div>
          </div>

          <div class="pt-3 border-t border-gray-200">
            <p class="text-xs text-gray-500">Click to select this office</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedOfficeId" class="pt-4">
      <AppButton variant="primary" size="lg" full-width @click="handleProceed">
        Proceed with {{ selectedOfficeData?.officeName }}
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  offices: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['office-selected', 'proceed'])

const selectedOfficeId = ref(null)

const selectedOfficeData = computed(() => {
  return props.offices.find(office => office.id === selectedOfficeId.value)
})

const selectOffice = (officeId) => {
  selectedOfficeId.value = officeId
  emit('office-selected', officeId)
}

const handleProceed = () => {
  if (selectedOfficeId.value) {
    emit('proceed', selectedOfficeId.value)
  }
}
</script>
