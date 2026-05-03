<template>
  <div class="flex h-screen bg-gray-50">
    <AppSidebar @logout="handleLogout">
      <div class="space-y-1">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :class="getLinkClasses(link.to)"
        >
          <component :is="link.icon" class="w-5 h-5" />
          <span>{{ link.label }}</span>
          <!-- Badge for notifications -->
          <span
            v-if="link.to === '/office/notifications' && unreadCount > 0"
            class="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </router-link>
      </div>

      <!-- User Profile Section -->
      <template #footer>
        <div class="border-t border-primary-800 pt-4 pb-2">
          <div class="flex items-center gap-3 px-2 mb-4">
            <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {{ userInitials }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ userName }}</p>
              <p class="text-xs text-gray-400 truncate">{{ userEmail }}</p>
            </div>
          </div>
          <button
            class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white border border-primary-700 hover:bg-primary-800 transition-colors"
            @click="handleLogout"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </template>
    </AppSidebar>

    <div class="flex-1 ml-64 flex flex-col">
      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  BarChart3,
  Bell
} from 'lucide-vue-next'
import AppSidebar from '@/components/common/AppSidebar.vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const navLinks = [
  { to: '/office/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/office/offices', label: 'Offices', icon: ClipboardList },
  { to: '/office/quarterly/q1', label: 'Quarterly Data', icon: BarChart3 },
  { to: '/office/notifications', label: 'Notifications', icon: Bell }
]

const unreadCount = computed(() => notificationStore.unreadCount)

const userName = computed(() => authStore.user?.fullName || authStore.user?.full_name || 'User')
const userEmail = computed(() => authStore.user?.email || '')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const getLinkClasses = (to) => {
  const base = 'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
  const isActive = route.path === to || route.path.startsWith(to + '/')
  const active = 'bg-primary-500/20 text-gold'
  const inactive = 'text-gray-300 hover:bg-primary-800 hover:text-white'

  return `${base} ${isActive ? active : inactive}`
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
