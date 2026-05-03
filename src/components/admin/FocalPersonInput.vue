<template>
  <div class="flex items-center gap-3">
    <div class="flex-1">
      <AppInput
        v-model="localValue"
        label="Focal Person"
        placeholder="Enter focal person name"
        :disabled="isLoading"
      />
    </div>

    <div class="flex items-end gap-2">
      <AppButton
        variant="primary"
        :loading="isLoading"
        :disabled="!hasChanges"
        @click="handleSave"
      >
        Save
      </AppButton>

      <AppBadge v-if="modelValue && !hasChanges" variant="success">
        Assigned
      </AppBadge>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  recordId: {
    type: String,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const localValue = ref('')

const hasChanges = computed(() => {
  return localValue.value !== props.modelValue
})

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue || ''
}, { immediate: true })

const handleSave = () => {
  emit('save', {
    recordId: props.recordId,
    focalPerson: localValue.value
  })
  emit('update:modelValue', localValue.value)
}
</script>
