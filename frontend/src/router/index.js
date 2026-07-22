import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../pages/AuthCallback.vue'),
    meta: { title: 'Completing Sign In' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue'),
    meta: { guest: true, title: 'Sign In' },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../pages/Signup.vue'),
    meta: { guest: true, title: 'Create Account' },
  },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    meta: { auth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../pages/Dashboard.vue'),
        meta: { title: 'Dashboard', icon: 'LayoutDashboard' },
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('../pages/Attendance.vue'),
        meta: { title: 'Attendance', icon: 'ClipboardCheck' },
      },
      {
        path: 'timetable',
        name: 'Timetable',
        component: () => import('../pages/Timetable.vue'),
        meta: { title: 'Timetable', icon: 'Calendar' },
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('../pages/Courses.vue'),
        meta: { title: 'Courses', icon: 'BookOpen' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../pages/Profile.vue'),
        meta: { title: 'Profile', icon: 'User' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../pages/Settings.vue'),
        meta: { title: 'Settings', icon: 'Settings' },
      },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('../pages/Chat.vue'),
        meta: { title: 'AI Council', icon: 'MessageSquare' },
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('../pages/Messages.vue'),
        meta: { title: 'Messages', icon: 'MessageCircle' },
      },
      {
        path: 'face-registration',
        name: 'FaceRegistration',
        component: () => import('../pages/FaceRegistration.vue'),
        meta: { title: 'Face Registration', icon: 'ScanFace' },
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../pages/AdminDashboard.vue'),
        meta: { title: 'Admin Console', icon: 'ShieldAlert' },
      },
      {
        path: 'university-admin',
        name: 'UniversityAdmin',
        component: () => import('../pages/UniversityAdmin.vue'),
        meta: { title: 'University Admin', icon: 'Landmark' },
      },
      {
        path: 'live-tracking',
        name: 'LiveTracking',
        component: () => import('../pages/LiveTracking.vue'),
        meta: { title: 'Live Tracking', icon: 'Map' },
      },
      {
        path: 'study-hub',
        name: 'StudyHub',
        component: () => import('../pages/StudyHub.vue'),
        meta: { title: 'Study Hub', icon: 'Library' },
      },
      {
        path: 'study-dashboard',
        name: 'StudyDashboard',
        component: () => import('../components/study/StudyDashboard.vue'),
        meta: { title: 'Study Dashboard', icon: 'BarChart3' },
      },
      {
        path: 'study-groups',
        name: 'StudyGroups',
        component: () => import('../components/study/StudyGroupManager.vue'),
        meta: { title: 'Study Groups', icon: 'Users' },
      },
      {
        path: 'study-plan',
        name: 'StudyPlan',
        component: () => import('../pages/StudyPlan.vue'),
        meta: { title: 'Study Plan', icon: 'ClipboardList' },
      },
      {
        path: 'flashcards/:materialId?',
        name: 'flashcard-review',
        component: () => import('../components/study/FlashcardReview.vue'),
        meta: { title: 'Flashcard Review' },
      },
      {
        path: 'podcast-generator/:materialId?',
        name: 'podcast-generator',
        component: () => import('../pages/PodcastGenerator.vue'),
        meta: { title: 'Podcast Generator' },
      },
      {
        path: 'study-groups/:groupId',
        name: 'study-group-detail',
        component: () => import('../pages/StudyGroupDetail.vue'),
        meta: { title: 'Study Group' },
      },
    ],
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../pages/ForgotPassword.vue'),
    meta: { title: 'Reset Password' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFound.vue'),
    meta: { title: '404' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    try { await authStore.initializeAuth() } catch (e) { console.warn('[Router] Auth init failed:', e) }
  }

  document.title = to.meta.title ? `${to.meta.title} — MCU` : 'MCU'

  if (to.meta.auth && !authStore.isAuthenticated) return next('/login')
  if (to.meta.guest && authStore.isAuthenticated) return next('/')
  next()
})

export default router
