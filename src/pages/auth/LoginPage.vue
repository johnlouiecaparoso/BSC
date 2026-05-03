<template>
  <div>
    <h2 class="text-2xl font-bold text-emerald mb-6">Login to Your Account</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <AppInput
        v-model="formData.email"
        type="email"
        label="Email Address"
        placeholder="Enter your email"
        :error="errors.email"
        required
        @blur="validateField('email')"
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

      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :loading="isLoading"
      >
        Login
      </AppButton>
    </form>

    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        Don't have an account?
        <router-link to="/register" class="text-primary-500 hover:text-primary-700 font-medium">
          Register here
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import * as yup from 'yup'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const formData = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const isLoading = ref(false)

const validationSchema = yup.object({
  email: yup.string().required('Email is required').email('Invalid email address'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters')
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
    errors.email = ''
    errors.password = ''

    isLoading.value = true

    const response = await authStore.login(formData.email, formData.password)

    if (authStore.isAuthenticated) {
      toast.success('Login successful!')

      if (authStore.role === 'office') {
        router.push('/office/dashboard')
      } else if (authStore.role === 'admin') {
        router.push('/admin/dashboard')
      }
    } else {
      toast.error('Invalid credentials. Please try again.')
    }
  } catch (error) {
    if (error.inner) {
      error.inner.forEach((err) => {
        errors[err.path] = err.message
      })
    } else {
      toast.error(error.message || 'Login failed. Please try again.')
    }
  } finally {
    isLoading.value = false
  }
}
</script>
