import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  async function login(email, password) {
    isLoading.value = true
    try {
      const response = await authService.login(email, password)
      user.value = response.user
      role.value = response.role
      isAuthenticated.value = !!response.user
      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function register(userData) {
    isLoading.value = true
    try {
      const response = await authService.register(userData)
      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      await authService.logout()
      user.value = null
      role.value = null
      isAuthenticated.value = false
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCurrentUser() {
    isLoading.value = true
    try {
      const response = await authService.getCurrentUser()
      user.value = response.user
      role.value = response.role
      isAuthenticated.value = !!response.user
      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    fetchCurrentUser
  }
})
