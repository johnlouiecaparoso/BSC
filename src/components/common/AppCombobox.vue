<template>
  <div class="w-full relative" ref="comboboxRef">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <input
        :id="inputId"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="inputClasses"
        autocomplete="off"
        @input="handleInput"
        @focus="showDropdown = true"
        @blur="handleBlur"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="showDropdown = false"
      />
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown && filteredOptions.length > 0"
      class="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg"
      :style="dropdownStyle"
    >
      <button
        v-for="(option, index) in filteredOptions"
        :key="option"
        type="button"
        :class="[
          'w-full text-left px-4 py-2 text-sm transition-colors',
          index === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-900 hover:bg-gray-50'
        ]"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option }}
      </button>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-sm text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'blur'])

const comboboxRef = ref(null)
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const dropdownStyle = ref({})

const inputId = computed(() => `combobox-${Math.random().toString(36).substring(2, 9)}`)

const inputClasses = computed(() => {
  const base = 'block w-full rounded-lg border px-4 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed'

  const errorClass = props.error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'

  return `${base} ${errorClass}`
})

const filteredOptions = computed(() => {
  if (!props.modelValue) {
    return props.options
  }
  const query = props.modelValue.toLowerCase()
  return props.options.filter(option =>
    option.toLowerCase().includes(query)
  )
})

watch(() => filteredOptions.value, () => {
  highlightedIndex.value = -1
})

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
  showDropdown.value = true
}

const handleBlur = (event) => {
  // Delay to allow click on dropdown options
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
  emit('blur', event)
}

const selectOption = (option) => {
  emit('update:modelValue', option)
  showDropdown.value = false
  highlightedIndex.value = -1
}

const highlightNext = () => {
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++
  }
}

const highlightPrev = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  }
}
</script>
