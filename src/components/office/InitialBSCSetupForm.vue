<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">Offices</h2>
      <p class="text-gray-600 text-lg">Complete the setup to start managing your KPIs for {{ office?.officeName }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Office Information Section -->
      <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-lg border border-blue-200">
        <h3 class="text-xl font-bold text-blue-900 mb-6">Assigned Office / Unit Information</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-semibold text-blue-900 mb-2">Assigned Office / Unit</label>
            <div class="bg-white p-3 rounded border border-blue-300">
              <p class="text-gray-900 font-medium">{{ office?.officeName }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-blue-900 mb-2">Pillar</label>
            <div class="bg-white p-3 rounded border border-blue-300">
              <p class="text-gray-900 font-medium">{{ office?.pillar || 'Not specified' }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-blue-900 mb-2">Assignment Type</label>
            <div class="bg-white p-3 rounded border border-blue-300">
              <p class="text-gray-900 font-medium">{{ office?.assignmentType || 'Not specified' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI Information Section -->
      <div class="border-t border-gray-200 pt-8">
        <h3 class="text-xl font-bold text-gray-900 mb-6">KPI / Strategic Measure Details</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            label="2026 Target (from BSC)"
            placeholder="e.g., 1 Policy, 100%"
            :error="errors.target2026"
            required
            @blur="validateField('target2026')"
            class="md:col-span-2"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="border-t border-gray-200 pt-6 flex gap-4">
        <AppButton type="button" variant="outline" @click="$emit('cancel')">
          Cancel
        </AppButton>
        <AppButton type="submit" variant="primary" size="lg" :loading="isLoading">
          Save & Proceed to Quarterly Data
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import * as yup from 'yup'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
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
