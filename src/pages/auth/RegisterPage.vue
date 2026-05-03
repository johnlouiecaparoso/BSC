<template>
  <div>
    <h2 class="text-2xl font-bold text-emerald mb-6">Register Your Office</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <AppInput
        v-model="formData.fullName"
        type="text"
        label="Full Name"
        placeholder="Enter your full name"
        :error="errors.fullName"
        required
        @blur="validateField('fullName')"
      />

      <AppInput
        v-model="formData.email"
        type="email"
        label="Email Address"
        placeholder="Enter your email"
        :error="errors.email"
        required
        @blur="validateField('email')"
      />

      <AppCombobox
        v-model="formData.officeName"
        label="Office/College/Unit Name"
        placeholder="Type or select your office name"
        :options="officeOptions"
        :error="errors.officeName"
        required
        @blur="validateField('officeName')"
      />

      <AppInput
        v-model="formData.password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        :error="errors.password"
        required
        @blur="validateField('password')"
      />

      <AppInput
        v-model="formData.confirmPassword"
        type="password"
        label="Confirm Password"
        placeholder="Confirm your password"
        :error="errors.confirmPassword"
        required
        @blur="validateField('confirmPassword')"
      />

      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :loading="isLoading"
      >
        Register
      </AppButton>
    </form>

    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        Already have an account?
        <router-link to="/login" class="text-primary-500 hover:text-primary-700 font-medium">
          Login here
        </router-link>
      </p>
    </div>

    <AppModal v-model:show="showSuccessModal" title="Registration Submitted" :closable="false">
      <div class="text-center py-4">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Registration Successful!</h3>
        <p class="text-gray-600 mb-6">
          Your registration is pending admin approval. You will receive a notification once your account has been approved.
        </p>
        <AppButton variant="primary" @click="goToLogin">
          Go to Login
        </AppButton>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'
import AppInput from '@/components/common/AppInput.vue'
import AppCombobox from '@/components/common/AppCombobox.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Predefined office/college/unit options
const officeOptions = [
  'OVPAA',
  'VPRDIE',
  'CEGS',
  'OPQMS',
  'CCIS',
  'ARO',
  'Agak Center',
  'VPEO',
  'DSFM',
  'AUN-QA Core Team',
  'PQA CAT Champions',
  'IA Committee Members',
  'Graduate School',
  'OVPEO',
  'OSFFT',
  'OSWE',
  'OAS',
  'HRMS',
  'MIS',
  'Engineering and Construction Unit',
  'Housing and Residential Services Unit',
  'RDI Services Office',
  'Extension Services'
]

const formData = reactive({
  fullName: '',
  email: '',
  officeName: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  fullName: '',
  email: '',
  officeName: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const showSuccessModal = ref(false)

const validationSchema = yup.object({
  fullName: yup.string().required('Full name is required').min(3, 'Full name must be at least 3 characters'),
  email: yup.string().required('Email is required').email('Invalid email address'),
  officeName: yup.string().required('Office name is required').min(2, 'Office name must be at least 2 characters'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match')
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

    isLoading.value = true

    await authStore.register({
      fullName: formData.fullName,
      email: formData.email,
      officeName: formData.officeName,
      password: formData.password
    })

    showSuccessModal.value = true
  } catch (error) {
    if (error.inner) {
      error.inner.forEach((err) => {
        errors[err.path] = err.message
      })
    } else {
      toast.error(error.message || 'Registration failed. Please try again.')
    }
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>
