<template>
  <div class="w-full">
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>

    <div class="flex gap-2">
      <div class="flex-1">
        <input
          v-model="localValue"
          type="text"
          :placeholder="placeholder"
          :class="inputClasses"
          @input="handleInput"
          @blur="handleBlur"
        />
        <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
      </div>

      <AppButton
        v-if="isValid && localValue"
        variant="outline"
        size="md"
        type="button"
        @click="openLink"
      >
        Open Link
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { isValidURL } from '@/utils/urlValidator'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Means of Verification / MOV (URL)'
  },
  placeholder: {
    type: String,
    default: 'Enter URL starting with http:// or https://'
  }
})

const emit = defineEmits(['update:modelValue', 'input'])

const localValue = ref('')
const error = ref('')

const isValid = computed(() => {
  if (!localValue.value) return true
  return isValidURL(localValue.value)
})

const inputClasses = computed(() => {
  const base = 'block w-full rounded-lg border px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors'

  const errorClass = error.value
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'

  return `${base} ${errorClass}`
})

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
}, { immediate: true })

const handleInput = () => {
  emit('update:modelValue', localValue.value)
  emit('input', localValue.value)
  error.value = ''
}

const handleBlur = () => {
  if (localValue.value && !isValid.value) {
    error.value = 'Please enter a valid URL starting with http:// or https://'
  } else {
    error.value = ''
  }
}

const openLink = () => {
  if (isValid.value && localValue.value) {
    window.open(localValue.value, '_blank')
  }
}
</script>
