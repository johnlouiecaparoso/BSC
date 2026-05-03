<template>
  <div class="max-w-3xl">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Office Profile</h1>
      <p class="text-gray-600 mt-1">Manage your office information</p>
    </div>

    <AppCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <AppInput
          v-model="formData.officeName"
          label="Office Name"
          placeholder="Enter office name"
          :error="errors.officeName"
          required
        />

        <AppInput
          v-model="formData.pillar"
          label="Pillar"
          placeholder="Enter pillar"
          :error="errors.pillar"
        />

        <div>
          <AppSelect
            v-model="formData.assignmentType"
            label="Assignment Type"
            placeholder="Select assignment type"
            :options="assignmentTypeOptions"
          />
        </div>

        <div class="flex gap-3">
          <AppButton type="submit" variant="primary" :loading="isLoading">
            Save Changes
          </AppButton>
          <AppButton type="button" variant="outline" @click="resetForm">
            Cancel
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import { useOfficeStore } from '@/stores/officeStore'
import { useAuthStore } from '@/stores/authStore'

const toast = useToast()
const officeStore = useOfficeStore()
const authStore = useAuthStore()

const formData = reactive({
  officeName: '',
  pillar: '',
  assignmentType: ''
})

const errors = reactive({
  officeName: '',
  pillar: ''
})

const assignmentTypeOptions = ['Strategic', 'Core', 'Support']

const isLoading = ref(false)

const normalizeAssignmentType = (value) => {
  if (!value) return ''

  const selected = value.split(',').map(type => type.trim().toLowerCase())

  if (selected.includes('strategic')) return 'Strategic'
  if (selected.includes('core')) return 'Core'
  if (selected.includes('support')) return 'Support'

  return ''
}

onMounted(async () => {
  if (authStore.user) {
    await officeStore.fetchProfile(authStore.user.id)
    if (officeStore.profile) {
      formData.officeName = officeStore.profile.officeName || ''
      formData.pillar = officeStore.profile.pillar || ''
      formData.assignmentType = normalizeAssignmentType(officeStore.profile.assignmentType)
    }
  }
})

const handleSubmit = async () => {
  if (!formData.officeName) {
    errors.officeName = 'Office name is required'
    return
  }

  isLoading.value = true
  try {
    await officeStore.updateProfile(authStore.user.id, {
      officeName: formData.officeName,
      pillar: formData.pillar,
      assignmentType: formData.assignmentType
    })

    toast.success('Profile updated successfully!')
  } catch (error) {
    toast.error('Failed to update profile')
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  if (officeStore.profile) {
    formData.officeName = officeStore.profile.officeName || ''
    formData.pillar = officeStore.profile.pillar || ''
    formData.assignmentType = normalizeAssignmentType(officeStore.profile.assignmentType)
  }
}
</script>
