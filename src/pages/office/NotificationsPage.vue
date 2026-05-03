<template>
  <div class="max-w-4xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Notifications</h1>
        <p class="text-gray-600 mt-1">Stay updated with important information</p>
      </div>
      <AppButton
        v-if="notificationStore.notifications.length > 0"
        variant="outline"
        @click="handleMarkAllRead"
      >
        Mark All as Read
      </AppButton>
    </div>

    <div v-if="notificationStore.notifications.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
      <p class="text-gray-600">You're all caught up! No new notifications at this time.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :class="getNotificationClasses(notification.isRead)"
        @click="handleNotificationClick(notification)"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <div :class="getIconClasses(notification.type)">
              <svg v-if="notification.type === 'approval'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else-if="notification.type === 'focal_person'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="font-semibold text-gray-900">{{ notification.title }}</p>
                <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
                <p class="text-xs text-gray-500 mt-2">{{ notification.createdAt }}</p>
              </div>
              <div v-if="!notification.isRead" class="flex-shrink-0 ml-4">
                <div class="w-2 h-2 bg-primary-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import AppButton from '@/components/common/AppButton.vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'

const toast = useToast()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.user) {
    await notificationStore.fetchNotifications(authStore.user.id)
  }
})

const getNotificationClasses = (isRead) => {
  const base = 'bg-white border rounded-lg p-4 cursor-pointer transition-colors'
  const unread = 'border-primary-200 hover:bg-primary-50'
  const read = 'border-gray-200 hover:bg-gray-50'

  return `${base} ${isRead ? read : unread}`
}

const getIconClasses = (type) => {
  const base = 'w-12 h-12 rounded-full flex items-center justify-center'

  const types = {
    approval: 'bg-green-100 text-green-600',
    focal_person: 'bg-blue-100 text-blue-600',
    default: 'bg-gray-100 text-gray-600'
  }

  return `${base} ${types[type] || types.default}`
}

const handleNotificationClick = async (notification) => {
  if (!notification.isRead) {
    await notificationStore.markAsRead(notification.id)
  }
}

const handleMarkAllRead = async () => {
  await notificationStore.markAllAsRead()
  toast.success('All notifications marked as read')
}
</script>
