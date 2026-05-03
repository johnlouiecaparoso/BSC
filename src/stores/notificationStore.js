import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

  async function fetchNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      notifications.value = (data || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        relatedId: n.related_id,
        createdAt: n.created_at
      }))

      return notifications.value
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  async function markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.isRead = true
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const unreadIds = notifications.value
        .filter(n => !n.isRead)
        .map(n => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (error) throw error

      notifications.value.forEach(n => {
        n.isRead = true
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  function addNotification(notification) {
    notifications.value.unshift(notification)
  }

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification
  }
})
