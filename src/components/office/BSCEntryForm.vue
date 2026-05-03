<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div v-if="office" class="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
      <h4 class="text-sm font-semibold text-blue-900 mb-3">Office Information</h4>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-blue-700">Office:</span>
          <p class="font-medium text-blue-900">{{ office.officeName }}</p>
        </div>
        <div>
          <span class="text-blue-700">Pillar:</span>
          <p class="font-medium text-blue-900">{{ office.pillar || 'Not set' }}</p>
        </div>
        <div>
          <span class="text-blue-700">Assignment Type:</span>
          <p class="font-medium text-blue-900">{{ office.assignmentType || 'Not set' }}</p>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-200 pt-4">
      <h4 class="text-sm font-semibold text-gray-900 mb-4">KPI Details</h4>
      <div class="space-y-4">
        <AppInput
          v-model="formData.goal"
          label="Goal"
          placeholder="Enter goal"
          :error="errors.goal"
          required
          @blur="validateField('goal')"
        />

        <AppSelect
          v-model="formData.perspective"
          label="Perspective"
          placeholder="Select perspective"
          :options="perspectiveOptions"
          :error="errors.perspective"
          required
          @change="validateField('perspective')"
        />

        <AppInput
          v-model="formData.strategicObjective"
          label="Strategic Objective"
          placeholder="Enter strategic objective"
          :error="errors.strategicObjective"
          required
          @blur="validateField('strategicObjective')"
        />

        <AppInput
          v-model="formData.kpi"
          label="KPI / Strategic Measure"
          placeholder="Enter KPI or strategic measure"
          :error="errors.kpi"
          required
          @blur="validateField('kpi')"
        />

        <AppInput
          v-model="formData.target2026"
          label="2026 Target from BSC"
          placeholder="Enter 2026 target (e.g., 1 Policy, 100)"
          :error="errors.target2026"
          required
          @blur="validateField('target2026')"
        />
      </div>
    </div>

    <div class="flex gap-3 pt-4">
      <AppButton type="button" variant="outline" @click="$emit('cancel')">
        Cancel
      </AppButton>
      <AppButton type="submit" variant="primary" :loading="isLoading">
        {{ entry ? 'Update' : 'Save' }}
      </AppButton>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import * as yup from 'yup'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  entry: {
    type: Object,
    default: null
  },
  office: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

const perspectiveOptions = [
  'Stakeholders',
  'Process Excellence',
  'Talents, Learning & Growth',
  'Financial'
]

const formData = reactive({
  goal: '',
  perspective: '',
  strategicObjective: '',
  kpi: '',
  target2026: ''
})

const errors = reactive({
  goal: '',
  perspective: '',
  strategicObjective: '',
  kpi: '',
  target2026: ''
})

const validationSchema = yup.object({
  goal: yup.string().required('Goal is required'),
  perspective: yup.string().required('Perspective is required'),
  strategicObjective: yup.string().required('Strategic objective is required'),
  kpi: yup.string().required('KPI is required'),
  target2026: yup.string().required('2026 target is required')
})

watch(() => props.entry, (newEntry) => {
  if (newEntry) {
    formData.goal = newEntry.goal || ''
    formData.perspective = newEntry.perspective || ''
    formData.strategicObjective = newEntry.strategicObjective || ''
    formData.kpi = newEntry.kpi || ''
    formData.target2026 = newEntry.target2026 || ''
  }
}, { immediate: true })

const validateField = async (field) => {
  try {
    await validationSchema.validateAt(field, formData)
    errors[field] = ''
  } catch (error) {
    errors[field] = error.message
  }
}

const handleSubmit = async () => {
  try {
    await validationSchema.validate(formData, { abortEarly: false })

    Object.keys(errors).forEach(key => {
      errors[key] = ''
    })

    emit('submit', { ...formData })
  } catch (error) {
    if (error.inner) {
      error.inner.forEach((err) => {
        errors[err.path] = err.message
      })
    }
  }
}
</script>
