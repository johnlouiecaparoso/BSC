import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import AuthLayout from '@/layouts/AuthLayout.vue'
import OfficeLayout from '@/layouts/OfficeLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage.vue'
import RegisterPage from '@/pages/auth/RegisterPage.vue'

// Office Pages
import OfficeDashboard from '@/pages/office/OfficeDashboard.vue'
import OfficeProfile from '@/pages/office/OfficeProfile.vue'
import BSCSetupPage from '@/pages/office/BSCSetupPage.vue'
import QuarterlyDataPage from '@/pages/office/QuarterlyDataPage.vue'
import NotificationsPage from '@/pages/office/NotificationsPage.vue'

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard.vue'
import OfficesListPage from '@/pages/admin/OfficesListPage.vue'
import OfficeDetailPage from '@/pages/admin/OfficeDetailPage.vue'
import AnalyticsPage from '@/pages/admin/AnalyticsPage.vue'
import ApprovalsPage from '@/pages/admin/ApprovalsPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: LoginPage,
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: '/register',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'Register',
        component: RegisterPage,
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: '/office',
    component: OfficeLayout,
    meta: { requiresAuth: true, role: 'office' },
    children: [
      {
        path: 'dashboard',
        name: 'OfficeDashboard',
        component: OfficeDashboard
      },
      {
        path: 'profile',
        name: 'OfficeProfile',
        component: OfficeProfile
      },
      {
        path: 'offices',
        name: 'BSCSetup',
        component: BSCSetupPage
      },
      {
        path: 'bsc-setup',
        redirect: '/office/offices'
      },
      {
        path: 'quarterly/:quarter',
        name: 'QuarterlyData',
        component: QuarterlyDataPage,
        props: true
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: NotificationsPage
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard
      },
      {
        path: 'offices',
        name: 'OfficesList',
        component: OfficesListPage
      },
      {
        path: 'offices/:officeId',
        name: 'OfficeDetail',
        component: OfficeDetailPage,
        props: true
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: AnalyticsPage
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: ApprovalsPage
      },
      {
        path: 'notifications',
        name: 'AdminNotifications',
        component: NotificationsPage
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.matched.find(record => record.meta.role)?.meta.role

  // If route doesn't require auth, allow access
  if (!requiresAuth) {
    // If user is already authenticated and trying to access login/register
    if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
      // Redirect to appropriate dashboard based on role
      if (authStore.role === 'office') {
        next('/office/dashboard')
      } else if (authStore.role === 'admin') {
        next('/admin/dashboard')
      } else {
        next()
      }
    } else {
      next()
    }
    return
  }

  // Route requires authentication
  if (!authStore.isAuthenticated) {
    // Try to fetch current user if not authenticated
    try {
      await authStore.fetchCurrentUser()
    } catch (error) {
      // If fetch fails, redirect to login
      next('/login')
      return
    }
  }

  // Check if user is authenticated after fetch attempt
  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check role-based access
  if (requiredRole && authStore.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's role
    if (authStore.role === 'office') {
      next('/office/dashboard')
    } else if (authStore.role === 'admin') {
      next('/admin/dashboard')
    } else {
      next('/login')
    }
    return
  }

  // All checks passed
  next()
})

export default router
