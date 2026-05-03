<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
      <h3 class="text-xl font-bold text-blue-900 mb-4">Office Information</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AppInput
          v-model="formData.officeName"
          label="Assigned Office / Unit"
          placeholder="Enter office name"
          :error="errors.officeName"
          required
          @blur="validateField('officeName')"
        />

        <AppInput
          v-model="formData.pillar"
          label="Pillar"
          placeholder="Enter pillar"
          :error="errors.pillar"
          @blur="validateField('pillar')"
        />

        <AppSelect
          v-model="formData.assignmentType"
          label="Assignment Type"
          placeholder="Select assignment type"
          :options="assignmentTypeOptions"
          :error="errors.assignmentType"
          @change="validateField('assignmentType')"
        />
      </div>
    </div>

    <div class="flex gap-4 justify-end pt-4">
      <AppButton type="button" variant="outline" @click="$emit('cancel')">
        Cancel
      </AppButton>
      <AppButton type="submit" variant="primary" :loading="isLoading">
        {{ office ? 'Update Office' : 'Add Office' }}
      </AppButton>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import * as yup from 'yup'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSelect from '@/components/common/AppSelect.vue'

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

const formData = reactive({
  officeName: '',
  pillar: '',
  assignmentType: ''
})

const errors = reactive({
  officeName: '',
  pillar: '',
  assignmentType: ''
})

const assignmentTypeOptions = ['Strategic', 'Core', 'Support']

const validationSchema = yup.object({
  officeName: yup.string().required('Office name is required'),
  pillar: yup.string(),
  assignmentType: yup.string()
})

watch(() => props.office, (newOffice) => {
  if (newOffice) {
    formData.officeName = newOffice.officeName || ''
    formData.pillar = newOffice.pillar || ''
    formData.assignmentType = newOffice.assignmentType || ''
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
