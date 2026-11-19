<template>
  <div class="layout" :class="{
    'sidebar-open': sidebarOpen,
    'sidebar-hover': sidebarHover,
    'sidebar-expanded': effectiveExpanded,
    'is-resizing': isResizing
  }" :style="{ '--sidebar-current': sidebarWidth + 'px' }">
    <!-- Skip link -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Dynamic Background -->
    <div class="layout-bg">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
      <div class="bg-orb orb-4"></div>
    </div>

    <!-- Slim Sidebar -->
    <aside class="sidebar" @mouseenter="onSidebarEnter" @mouseleave="sidebarHover = false">
      <div class="sidebar-header">
        <router-link to="/" class="sidebar-logo" @click="sidebarOpen = false">
          <div class="logo-icon">
            <Logo :size="28" />
          </div>
          <div class="sidebar-logo-text">
            <span class="logo-title">MCU</span>
            <span class="logo-sub">Portal</span>
          </div>
        </router-link>
          <button
            class="sidebar-collapse-btn"
            @click.stop="sidebarExpanded = !sidebarExpanded"
            :aria-label="sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
            :aria-pressed="sidebarExpanded.toString()"
            title="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m13 9-3 3 3 3"/></svg>
          </button>
      </div>

      <nav class="sidebar-nav">
        <div v-for="(group, gi) in navGroups" :key="gi" class="nav-group" role="group" :aria-label="group.label">
          <span class="nav-group-label">{{ group.label }}</span>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            @click="sidebarOpen = false"
          >
            <component :is="getIcon(item.icon)" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.badge === 'unread' && messagingStore.unreadTotal > 0" class="nav-badge" aria-live="polite" aria-atomic="true">{{ messagingStore.unreadTotal > 9 ? '9+' : messagingStore.unreadTotal }}</span>
            <div class="nav-active-bar" />
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" @click="router.push('/profile')">
          <div class="sidebar-avatar">{{ authStore.user?.name?.charAt(0) || 'U' }}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ authStore.user?.name || 'User' }}</span>
            <span class="sidebar-user-role">{{ authStore.user?.role || 'Student' }}</span>
          </div>
        </div>
        <div class="sidebar-footer-actions">
          <button class="sidebar-logout" @click="handleLogout" title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>

    <div class="sidebar-overlay" @click="sidebarOpen = false" />

    <div
      v-if="effectiveExpanded && !sidebarOpen"
      class="sidebar-resize-handle"
      @mousedown.prevent="startResize"
    ><div class="resize-grip"></div></div>

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" @click="sidebarOpen = !sidebarOpen" :aria-expanded="sidebarOpen" :aria-label="sidebarOpen ? 'Close menu' : 'Open menu'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <nav aria-label="Breadcrumb">
            <ol class="breadcrumb-list">
              <li class="breadcrumb-item">
                <router-link to="/" class="breadcrumb-link">Home</router-link>
                <span class="breadcrumb-sep" aria-hidden="true">/</span>
              </li>
              <li class="breadcrumb-item">
                <span class="breadcrumb-current" aria-current="page">{{ pageTitle }}</span>
              </li>
            </ol>
          </nav>
          <span class="portal-role">{{ portalRole }}</span>
          <span class="semester-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>
            {{ semesterLabel }}
          </span>
        </div>

        <div class="topbar-right">
          <button class="topbar-search" @click="showCommandPalette = true" title="Search (Ctrl+K)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span class="search-placeholder">Search</span>
            <kbd class="search-kbd">Ctrl+K</kbd>
          </button>
          <div v-if="isStudent" class="citadel-badges" aria-label="Student progress">
            <span class="citadel-badge streak" title="Study streak">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.4 0 7-3.1 7-7 0-4.5-4-6.5-4-11-2.5 1.5-3.5 3.5-3.5 5.5 0-1.5-1-3-2.5-4.5C9 8 5 10.5 5 15c0 3.9 2.6 7 7 7z"/></svg>
              <span class="tabular-nums">{{ gamificationStore.currentStreak || 0 }}</span>
            </span>
            <span class="citadel-badge gems" title="Wallet balance">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 7 7-7 11-7-11 7-7z"/><path d="M5 10h14"/></svg>
              <span class="tabular-nums">{{ walletStore.balance || 0 }}</span>
            </span>
          </div>
          <div class="notification-wrap">
            <button
              class="topbar-notifications"
              type="button"
              :aria-expanded="notificationsOpen"
              aria-controls="notification-popover"
              aria-label="Notifications"
              @click="toggleNotifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
              <span v-if="unreadNotifications" class="notification-count" aria-live="polite">{{ unreadNotifications > 9 ? '9+' : unreadNotifications }}</span>
            </button>
            <section v-if="notificationsOpen" id="notification-popover" class="notification-popover" aria-label="Notifications">
              <header class="notification-heading">
                <div>
                  <span class="nav-group-label">CAMPUS UPDATES</span>
                  <h2>Notifications</h2>
                </div>
                <button v-if="unreadNotifications" type="button" class="notification-mark-read" @click="markAllNotificationsRead">Mark all read</button>
              </header>
              <p v-if="notificationsLoading" class="notification-state" role="status">Loading notifications…</p>
              <p v-else-if="notificationError" class="notification-state notification-error" role="alert">{{ notificationError }}</p>
              <p v-else-if="!notificationItems.length" class="notification-state">You’re all caught up. New updates will appear here.</p>
              <div v-else class="notification-list">
                <router-link
                  v-for="notification in notificationItems.slice(0, 6)"
                  :key="notification.id"
                  :to="notificationPath(notification.link)"
                  class="notification-item"
                  :class="{ unread: !notification.read }"
                  @click.prevent="openNotification(notification)"
                >
                  <span class="notification-dot" :class="`notification-${notification.type || 'info'}`"></span>
                  <span class="notification-copy">
                    <strong>{{ notification.title }}</strong>
                    <span>{{ notification.message }}</span>
                    <small>{{ formatNotificationDate(notification.createdAt) }}</small>
                  </span>
                </router-link>
              </div>
            </section>
          </div>
          <button class="topbar-tour" @click="openWalkthrough" title="Take the app tour" aria-label="Take the app tour">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.6 9a2.5 2.5 0 1 1 4.7 1.2c-.9 1.1-2.3 1.4-2.3 3"/>
              <path d="M12 17h.01"/>
            </svg>
          </button>
          <ThemeToggle />
          <div class="profile-menu-wrap">
            <button
              class="profile-trigger"
              type="button"
              :aria-expanded="profileOpen"
              aria-haspopup="menu"
              @click="profileOpen = !profileOpen"
            >
              <span class="profile-avatar">{{ profileInitial }}</span>
              <span class="profile-meta">
                <strong>{{ authStore.user?.name || 'User' }}</strong>
                <small>{{ profileRoleLabel }}</small>
              </span>
              <svg class="profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div v-if="profileOpen" class="profile-dropdown" role="menu">
              <div class="profile-dropdown-head">
                <strong>{{ authStore.user?.name || 'User' }}</strong>
                <span>{{ authStore.user?.email || '—' }}</span>
              </div>
              <router-link to="/profile" role="menuitem" @click="profileOpen = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                My profile
              </router-link>
              <router-link to="/settings" role="menuitem" @click="profileOpen = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.05A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.05A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.05A1.7 1.7 0 0 0 20.95 10H21a2 2 0 1 1 0 4h-.05A1.7 1.7 0 0 0 19.4 15z"/></svg>
                Settings
              </router-link>
              <router-link v-if="isAdmin" to="/admin/portal/dashboard" role="menuitem" @click="profileOpen = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Admin console
              </router-link>
              <button type="button" role="menuitem" @click="handleLogout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" class="content" tabindex="-1">
        <router-view v-slot="{ Component, route: r }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="r.path" />
          </transition>
        </router-view>
      </main>
    </div>

    <CommandPalette :show="showCommandPalette" @update:show="showCommandPalette = $event" />
    <AppWalkthrough
      :show="showWalkthrough"
      :steps="walkthroughSteps"
      @skip="finishWalkthrough"
      @complete="finishWalkthrough"
    />

    <nav class="bottom-nav">
      <template v-for="item in pillNavItems" :key="item.path">
        <router-link
          v-if="item.path !== '#logout'"
          :to="item.path"
          class="bottom-nav-item"
          :class="{ active: isActive(item.path) }"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <span class="bn-icon-wrap">
            <component :is="getIcon(item.icon)" class="bottom-nav-icon" />
            <span v-if="item.badge === 'unread' && messagingStore.unreadTotal > 0" class="bn-badge" aria-live="polite" aria-atomic="true">{{ messagingStore.unreadTotal > 9 ? '9+' : messagingStore.unreadTotal }}</span>
          </span>
          <span class="bottom-nav-label">{{ item.label }}</span>
        </router-link>
        <button
          v-else
          @click="handleLogout"
          class="bottom-nav-item"
          aria-label="Sign Out"
        >
          <span class="bn-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          <span class="bottom-nav-label">Logout</span>
        </button>
      </template>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, markRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMessagingStore } from '../stores/messaging'
import { useGamificationStore } from '../stores/gamification'
import { useWalletStore } from '../stores/wallet'
import api from '../lib/api'
import CommandPalette from './CommandPalette.vue'
import ThemeToggle from './ThemeToggle.vue'
import Logo from './Logo.vue'
import AppWalkthrough from './AppWalkthrough.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const messagingStore = useMessagingStore()
const gamificationStore = useGamificationStore()
const walletStore = useWalletStore()
const sidebarOpen = ref(false)
const sidebarHover = ref(false)
const isLargeScreen = ref(window.innerWidth > 1280)
const sidebarExpanded = ref(true)
const showCommandPalette = ref(false)
const showWalkthrough = ref(false)
const profileOpen = ref(false)
const notificationsOpen = ref(false)
const notificationsLoading = ref(false)
const notificationError = ref('')
const notificationItems = ref([])
const unreadNotifications = ref(0)
const sidebarWidth = ref(Number(localStorage.getItem('sidebar-width')) || (window.innerWidth <= 1280 ? 240 : 264))
const isResizing = ref(false)
const walkthroughKey = computed(() => `mcu-walkthrough-v1:${authStore.user?.id || 'default'}`)
const walkthroughSteps = [
  {
    title: 'Welcome to your MCU portal',
    content: 'Your campus essentials are together here. This quick tour shows you where to find the tools you will use most.',
    icon: '👋',
  },
  {
    title: 'Start from your dashboard',
    content: 'See your schedule, course attendance and shortcuts at a glance. Use the sidebar or bottom navigation to move around.',
    icon: '📊',
  },
  {
    title: 'Check in for class',
    content: 'Open Attendance to join an active session. Enter the current code shown by your lecturer and allow location access when asked.',
    icon: '✅',
  },
  {
    title: 'Keep up with classes',
    content: 'Courses shows your enrolled courses and attendance. Timetable helps you see upcoming classes and their locations.',
    icon: '📅',
  },
  {
    title: 'Study your way',
    content: 'Use Study Hub for your materials and study tools. You can reopen this tour any time with the question-mark button above.',
    icon: '📚',
  },
]

const effectiveExpanded = computed(() => {
  return sidebarExpanded.value || (sidebarHover.value && window.innerWidth <= 1280)
})

function startResize() {
  isResizing.value = true
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
}

function onResize(e) {
  if (!isResizing.value) return
  const w = Math.min(480, Math.max(200, e.clientX))
  sidebarWidth.value = w
}

function stopResize() {
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem('sidebar-width', String(sidebarWidth.value))
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
}

function checkScreen() {
  isLargeScreen.value = window.innerWidth > 1280
}

const pageTitle = computed(() => route.meta?.title || 'Dashboard')
const portalRole = computed(() => authStore.user?.role === 'lecturer' ? 'LECTURER VIEW' : 'STUDENT VIEW')
const isAdmin = computed(() => ['admin', 'super_admin'].includes(authStore.user?.role))
const isStudent = computed(() => !['lecturer', 'admin', 'super_admin'].includes(authStore.user?.role))
const profileInitial = computed(() => (authStore.user?.name || authStore.user?.email || 'U').charAt(0).toUpperCase())
const profileRoleLabel = computed(() => {
  const role = authStore.user?.role
  if (role === 'super_admin') return 'Super Admin'
  if (role === 'admin') return 'Administrator'
  if (role === 'lecturer') return 'Lecturer'
  return 'Student'
})
const semesterLabel = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const semester = now.getMonth() >= 6 ? 'First Semester' : 'Second Semester'
  return `${year}/${String(year + 1).slice(-2)} · ${semester}`
})

const navGroups = computed(() => {
  const isLecturer = authStore.user?.role === 'lecturer'
  const groups = [
    {
      label: 'Core',
      items: [
        { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
        { path: '/attendance', label: isLecturer ? 'Sessions' : 'Attendance', icon: 'ClipboardCheck' },
        { path: '/timetable', label: 'Schedule', icon: 'Calendar' },
        { path: '/courses', label: 'Courses', icon: 'BookOpen' },
      ],
    },
    {
      label: 'Connect',
      items: [
        { path: '/messages', label: 'Messages', icon: 'MessageCircle', badge: 'unread' },
        { path: '/chat', label: 'AI Council', icon: 'MessageSquare' },
      ],
    },
    {
      label: 'Learning',
      items: [
        { path: '/study-hub', label: 'Study Hub', icon: 'Library' },
        { path: '/complaints', label: 'Feedback', icon: 'MessageSquare' },
      ],
    },
    {
      label: 'Account',
      items: [
        { path: '/profile', label: 'Profile', icon: 'User' },
        { path: '/settings', label: 'Settings', icon: 'Settings' },
      ],
    },
  ]
  if (['admin', 'super_admin'].includes(authStore.user?.role)) {
    groups.splice(3, 0, {
      label: 'Admin Portal',
      items: [
        { path: '/admin/portal/dashboard', label: 'Console', icon: 'Shield' },
        { path: '/admin/portal/university-admin', label: 'University Admin', icon: 'Landmark' },
      ],
    })
  }
  return groups
})

const pillNavItems = computed(() => [
  { path: '/', label: 'Home', icon: 'LayoutDashboard' },
  { path: '/attendance', label: authStore.user?.role === 'lecturer' ? 'Sessions' : 'Check In', icon: 'ClipboardCheck' },
  { path: '/messages', label: 'Messages', icon: 'MessageCircle', badge: 'unread' },
  { path: '/study-hub', label: 'Study Hub', icon: 'Library' },
  { path: '/profile', label: 'Profile', icon: 'User' },
  { path: '#logout', label: 'Logout', icon: 'LogOut' },
])

async function loadNotifications() {
  notificationsLoading.value = true
  notificationError.value = ''
  try {
    const response = await api.get('/notifications')
    notificationItems.value = Array.isArray(response.data?.notifications) ? response.data.notifications : []
    unreadNotifications.value = Number(response.data?.unread) || 0
  } catch (error) {
    notificationError.value = error?.response?.data?.error || 'Notifications could not be loaded.'
  } finally {
    notificationsLoading.value = false
  }
}

async function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value
  if (notificationsOpen.value) await loadNotifications()
}

async function markAllNotificationsRead() {
  notificationError.value = ''
  try {
    await api.put('/notifications/read-all')
    notificationItems.value = notificationItems.value.map(item => ({ ...item, read: true }))
    unreadNotifications.value = 0
  } catch (error) {
    notificationError.value = error?.response?.data?.error || 'Could not mark notifications as read.'
  }
}

async function openNotification(notification) {
  if (!notification.read) {
    notificationError.value = ''
    try {
      await api.put(`/notifications/${encodeURIComponent(notification.id)}/read`)
      notificationItems.value = notificationItems.value.map(item =>
        item.id === notification.id ? { ...item, read: true } : item
      )
      unreadNotifications.value = Math.max(0, unreadNotifications.value - 1)
    } catch (error) {
      notificationError.value = error?.response?.data?.error || 'Could not mark this notification as read.'
      return
    }
  }
  notificationsOpen.value = false
  await router.push(notificationPath(notification.link))
}

function notificationPath(link) {
  return typeof link === 'string' && link.startsWith('/') && !link.startsWith('//') ? link : '/'
}

function formatNotificationDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const icons = {
  LayoutDashboard: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' }),
  ClipboardCheck: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>' }),
  Calendar: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' }),
  BookOpen: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' }),
  Library: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>' }),
  MessageSquare: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' }),
  Shield: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' }),
  User: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }),
  Settings: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' }),
  MessageCircle: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' }),
  Landmark: markRaw({ template: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>' }),
}

function getIcon(name) {
  return icons[name] || icons.LayoutDashboard
}

function openWalkthrough() {
  showWalkthrough.value = true
}

function finishWalkthrough() {
  localStorage.setItem(walkthroughKey.value, 'complete')
  showWalkthrough.value = false
}

function onSidebarEnter() {
  if (window.innerWidth <= 1280) sidebarHover.value = true
}

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    showCommandPalette.value = true
  }
  if (e.key === 'Escape') showCommandPalette.value = false
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function closeProfileOnOutside(event) {
  if (profileOpen.value && !event.target?.closest?.('.profile-menu-wrap')) profileOpen.value = false
}

watch(sidebarOpen, (val) => {
  if (val) {
    // force a reflow to ensure CSS transitions render correctly on some browsers
    requestAnimationFrame(() => {
      const s = document.querySelector('.sidebar')
      if (s) void s.offsetWidth
    })

    watch(() => route.fullPath, () => {
      notificationsOpen.value = false
    })
  }
})

watch(() => route.fullPath, () => {
  profileOpen.value = false
})

onMounted(() => {
  loadNotifications()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', checkScreen)
  window.addEventListener('click', closeProfileOnOutside)
  messagingStore.init()
  if (isStudent.value) {
    gamificationStore.fetchProfile().catch(() => {})
    walletStore.fetchWallet().catch(() => {})
  }
  if (localStorage.getItem(walkthroughKey.value) !== 'complete') {
    showWalkthrough.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', checkScreen)
  window.removeEventListener('click', closeProfileOnOutside)
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
  messagingStore.stopPolling()
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100dvh;
  background: var(--color-bg);
  position: relative;
}

/* ==================== SKIP LINK ==================== */
.skip-link {
  position: absolute;
  top: -100%;
  left: 8px;
  z-index: 10000;
  padding: 8px 16px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 0 0 8px 8px;
  text-decoration: none;
  transition: top 0.2s ease;
}
.skip-link:focus {
  top: 0;
}

/* ==================== BACKGROUND ==================== */
.layout-bg {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  will-change: transform;
}
.orb-1 {
  top: -15%; left: -5%;
  width: 35%; height: 35%;
  background: radial-gradient(circle, rgba(30, 64, 175, 0.1), transparent 70%);
  animation: orbFloat 25s ease-in-out infinite;
}
.orb-2 {
  bottom: -10%; right: -5%;
  width: 30%; height: 30%;
  background: radial-gradient(circle, rgba(217, 119, 6, 0.08), transparent 70%);
  animation: orbFloat 30s ease-in-out infinite reverse;
}
.orb-3 {
  top: 40%; right: 10%;
  width: 20%; height: 20%;
  background: radial-gradient(circle, rgba(13, 81, 140, 0.06), transparent 70%);
  animation: orbFloat 20s ease-in-out infinite 5s;
}
.orb-4 {
  bottom: 20%; left: 15%;
  width: 15%; height: 15%;
  background: radial-gradient(circle, rgba(92, 103, 149, 0.05), transparent 70%);
  animation: orbFloat 22s ease-in-out infinite 8s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(40px, 30px) scale(1.05); }
}

/* ==================== SIDEBAR ==================== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-collapsed);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.sidebar-expanded .sidebar {
  width: var(--sidebar-current);
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 14px;
  min-height: 64px;
  border-bottom: 1px solid var(--color-border);
  gap: 4px;
}

.sidebar-collapse-btn {
  width: 28px;
  height: 28px;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-quaternary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.sidebar-expanded .sidebar-collapse-btn {
  opacity: 1;
}

.sidebar-collapse-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-border-accent);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  overflow: hidden;
}

.logo-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-width: 28px;
  justify-content: center;
}

.sidebar-logo-text {
  display: flex;
  flex-direction: column;
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease 0.15s, visibility 0.2s ease 0.15s;
}

.sidebar-expanded .sidebar-logo-text {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0.1s;
}

.logo-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.logo-sub {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: 999px;
}

.nav-group {
  margin-bottom: 2px;
}

.nav-group-label {
  display: block;
  font-size: 9px;
  font-weight: 700;
  color: var(--color-text-quaternary);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  padding: 12px 12px 4px;
  white-space: nowrap;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease 0.1s, visibility 0.15s ease 0.1s;
}

.sidebar-expanded .nav-group-label {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0.1s;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  min-height: 44px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  min-width: 0;
}

.nav-item:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s var(--ease-spring);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease 0.1s, visibility 0.2s ease 0.1s;
  flex: 1;
}

.sidebar-expanded .nav-label {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0.1s;
}

.nav-badge {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: var(--color-primary);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  opacity: 0;
  transition: opacity 0.2s ease 0.1s;
  flex-shrink: 0;
  margin-right: -4px;
}

.sidebar-expanded .nav-badge {
  opacity: 1;
}

.nav-active-bar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 0 3px 3px 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 8px var(--color-primary-glow);
}

.nav-item.active .nav-active-bar {
  transform: translateY(-50%) scaleY(1);
}

/* Footer */
.sidebar-footer {
  padding: 10px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-user {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.sidebar-user:hover {
  background: var(--color-primary-soft);
}

.sidebar-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 8px;
}

.sidebar-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease 0.15s, visibility 0.2s ease 0.15s;
}

.sidebar-expanded .sidebar-user-info {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0.1s;
}

.sidebar-user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.sidebar-user-role {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-quaternary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-logout {
  width: 32px;
  height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-quaternary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-logout:hover {
  background: var(--color-error-soft);
  color: var(--color-error);
  border-color: transparent;
}

.sidebar-footer-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.sidebar:not(.sidebar-expanded) .sidebar-footer {
  justify-content: center;
  padding: 10px 6px;
  gap: 4px;
}

.sidebar:not(.sidebar-expanded) .sidebar-user {
  flex: none;
  justify-content: center;
  padding: 0;
  gap: 0;
}

.sidebar:not(.sidebar-expanded) .sidebar-user-info {
  display: none;
}


.is-resizing .sidebar,
.is-resizing .main-area,
.is-resizing .sidebar-resize-handle {
  transition-duration: 0s !important;
}

/* ==================== SIDEBAR RESIZE HANDLE ==================== */
.sidebar-resize-handle {
  position: fixed;
  top: 0;
  left: calc(var(--sidebar-current) - 3px);
  bottom: 0;
  width: 6px;
  z-index: 101;
  cursor: ew-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, left 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.sidebar-resize-handle::before {
  content: '';
  position: absolute;
  inset: 0 -4px;
}
.sidebar-resize-handle:hover,
.sidebar-resize-handle:active {
  background: rgba(96, 165, 250, 0.15);
}
.resize-grip {
  width: 2px;
  height: 32px;
  border-radius: 999px;
  background: var(--color-border-strong);
  opacity: 0;
  transition: opacity 0.2s ease, height 0.2s ease;
}
.sidebar-resize-handle:hover .resize-grip,
.sidebar-resize-handle:active .resize-grip {
  opacity: 1;
  height: 48px;
  background: var(--color-primary);
}

/* Sidebar Overlay */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0,0,0,0.45);
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}

/* show overlay when sidebar is open (mobile) */
.sidebar-open .sidebar-overlay {
  display: block;
  pointer-events: auto;
  opacity: 1;
}

/* ==================== MAIN AREA ==================== */
.main-area {
  flex: 1;
  margin-left: var(--sidebar-collapsed);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  transition: margin-left 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ==================== TOPBAR ==================== */
.topbar {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  margin: 10px 14px 0;
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border: 1px solid var(--color-border);
  box-shadow: var(--glass-shadow);
  position: sticky;
  top: 10px;
  z-index: 101;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 9px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.menu-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-border-accent);
}

.topbar-breadcrumb,
.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: var(--color-primary);
}

.breadcrumb-sep {
  font-size: 13px;
  color: var(--color-border-strong);
  font-weight: 300;
}

.breadcrumb-current {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.topbar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  color: var(--color-text-quaternary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.topbar-search:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text-tertiary);
  background: var(--color-surface-elevated);
}

.topbar-tour {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-bg);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.topbar-tour:hover {
  border-color: var(--color-border-accent);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.search-placeholder {
  display: none;
}

.search-kbd {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 6px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 5px;
  color: var(--color-text-quaternary);
  font-family: inherit;
}

.user-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 9px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px var(--color-primary-glow);
}

.topbar-logout {
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-quaternary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.topbar-logout:hover {
  background: var(--color-error-soft);
  color: var(--color-error);
  border-color: transparent;
}

/* ==================== CONTENT ==================== */
.content {
  flex: 1;
  padding: 24px 28px 32px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content > * {
  flex: 1;
  min-height: 0;
}

/* ==================== PAGE TRANSITIONS ==================== */
.page-enter-active {
  animation: pageIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-leave-active {
  animation: pageOut 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pageOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
}

/* ==================== REDUCED MOTION ==================== */
@media (prefers-reduced-motion: reduce) {
  .layout *,
  .layout *::before,
  .layout *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .sidebar,
  .main-area,
  .sidebar-resize-handle {
    transition-duration: 0s !important;
  }
}

/* ==================== MOBILE ==================== */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: var(--sidebar-current) !important;
  }

  .sidebar-open .sidebar {
    transform: translateX(0);
    box-shadow: 16px 0 48px rgba(0, 0, 0, 0.5);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 99;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s ease;
  }

  .sidebar-open .sidebar-overlay {
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar-logo-text,
  .nav-label,
  .nav-group-label,
  .sidebar-user-info {
    opacity: 1 !important;
  }

  .main-area {
    margin-left: 0 !important;
  }

  .menu-btn {
    display: flex;
  }

  .search-placeholder,
  .search-kbd {
    display: none;
  }

  .content {
    padding: 18px 20px;
    padding-bottom: 90px;
  }

  .topbar {
    margin: 8px 8px 0;
    padding: 0 14px;
  }
}

/* ==================== LAPTOP (1025px–1440px) ==================== */
@media (max-width: 1440px) {
  .content {
    padding: 24px 28px;
  }
  .topbar {
    margin: 12px 14px 0;
    padding: 0 20px;
  }
}

@media (max-width: 1280px) {
  .sidebar-header {
    padding: 16px;
    min-height: 64px;
  }
  .sidebar-nav {
    padding: 10px;
  }
  .nav-item {
    padding: 10px 12px;
    font-size: 13px;
  }
  .nav-group-label {
    font-size: 9px;
    padding: 12px 12px 4px;
  }
  .nav-icon {
    width: 20px;
    height: 20px;
    min-width: 20px;
  }
  .sidebar-footer {
    padding: 12px;
  }
  .sidebar-avatar {
    width: 32px;
    height: 32px;
    min-width: 32px;
    font-size: 13px;
  }
  .sidebar-user-name {
    font-size: 13px;
  }
  .sidebar-user-role {
    font-size: 10px;
  }
  .sidebar-logout {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
  .content {
    padding: 24px 28px;
  }
  .topbar {
    height: 72px;
    margin: 12px 16px 0;
    padding: 0 20px;
    top: 12px;
  }
  .topbar-left {
    gap: 12px;
  }
  .breadcrumb-current {
    font-size: 16px;
  }
  .topbar-search {
    height: 36px;
    padding: 0 12px;
    font-size: 13px;
  }
  .user-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  .menu-btn {
    width: 36px;
    height: 36px;
  }
}

@media (min-width: 1025px) {
  .content {
    padding: 28px 32px;
  }

  .topbar {
    margin: 14px 18px 0;
    padding: 0 24px;
  }

  .breadcrumb-current {
    font-size: 17px;
  }
}

@media (max-width: 1024px) {
  .content {
    padding: 18px 22px;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 14px 16px;
    padding-bottom: 90px;
  }

  .menu-btn,
  .topbar-tour,
  .user-avatar,
  .topbar-logout,
  .topbar-search {
    min-width: 44px;
    min-height: 44px;
  }

  .bottom-nav-item {
    min-height: 44px;
    padding: 10px 12px;
  }

  .sidebar-collapse-btn {
    display: none;
  }
}

/* ==================== DESKTOP (generic) ==================== */
@media (min-width: 769px) {
  .search-placeholder {
    display: inline;
  }

  .sidebar-expanded .main-area {
    margin-left: var(--sidebar-current);
  }
}

/* ==================== NAV ENHANCEMENTS ==================== */
.nav-item.active .nav-active-bar {
  box-shadow: 0 0 12px var(--color-primary-glow), 0 0 24px var(--color-primary-glow);
}
.nav-item {
  position: relative;
}
.nav-badge {
  animation: navBadgePulse 2s ease-in-out infinite;
}
@keyframes navBadgePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
  50% { box-shadow: 0 0 6px 2px rgba(255,255,255,0.15); }
}

/* Content area scrollbar */
.content::-webkit-scrollbar { width: 4px; }
.content::-webkit-scrollbar-track { background: transparent; }
.content::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: 999px; }
.content::-webkit-scrollbar-thumb:hover { background: var(--color-text-tertiary); }
.content { scrollbar-width: thin; scrollbar-color: var(--color-border-strong) transparent; }

/* ==================== BOTTOM NAV ==================== */
.bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--glass-bg);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid var(--color-border-accent);
    border-radius: 18px;
    padding: 6px 8px;
    gap: 4px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05);
    z-index: 1000;
    align-items: center;
    width: calc(100% - 32px);
    max-width: 420px;
  }

  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    text-decoration: none;
    color: var(--color-text-quaternary);
    padding: 8px 10px;
    min-height: 44px;
    border-radius: 12px;
    transition: all 0.25s var(--ease-spring);
    flex: 1;
    position: relative;
  }

  .bottom-nav-item:hover {
    color: var(--color-text-secondary);
  }

  .bottom-nav-item.active {
    color: var(--color-primary);
    background: var(--color-primary-muted);
  }

  .bottom-nav-icon {
    width: 24px;
    height: 24px;
    transition: transform 0.25s var(--ease-spring);
  }

  .bottom-nav-item.active .bottom-nav-icon {
    transform: scale(1.15);
  }

  .bn-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bn-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    background: var(--color-primary);
    color: #fff;
    font-size: 7px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
    line-height: 1;
    box-shadow: 0 0 6px var(--color-primary-glow);
  }

  .bottom-nav-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
}

/* McPherson campus shell */
.layout {
  background:
    radial-gradient(ellipse at 86% 0%, rgba(217, 119, 6, 0.07), transparent 34rem),
    var(--color-bg);
}

.layout-bg {
  background-image:
    linear-gradient(rgba(30, 58, 138, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 58, 138, 0.025) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(to bottom, black, transparent 72%);
}

.bg-orb {
  display: none;
}

.sidebar {
  background: #0f172a;
  border-right-color: rgba(226, 232, 240, 0.1);
  box-shadow: 8px 0 32px rgba(15, 23, 42, 0.12);
}

.sidebar-header {
  min-height: 76px;
  padding-inline: 18px;
  border-bottom-color: rgba(226, 232, 240, 0.1);
}

.sidebar-collapse-btn {
  border-color: rgba(226, 232, 240, 0.16);
  color: rgba(226, 232, 240, 0.62);
}

.sidebar-collapse-btn:hover,
.sidebar-user:hover {
  background: rgba(248, 250, 252, 0.08);
  border-color: rgba(226, 232, 240, 0.2);
  color: #f8fafc;
}

.logo-title,
.sidebar-user-name {
  color: #f8fafc;
}

.logo-sub,
.sidebar-user-role,
.nav-group-label {
  color: rgba(226, 232, 240, 0.56);
}

.sidebar-nav {
  padding: 16px 12px;
  gap: 8px;
}

.nav-group {
  margin-bottom: 8px;
}

.nav-group-label {
  padding: 12px 12px 8px;
  letter-spacing: 0.14em;
}

.nav-item {
  min-height: 46px;
  border-radius: 12px;
  color: rgba(226, 232, 240, 0.7);
  font-weight: 550;
}

.nav-item:hover {
  background: rgba(248, 250, 252, 0.08);
  color: #f8fafc;
  transform: translateX(3px);
}

.nav-item.active,
.nav-item.active:hover {
  background: #f59e0b;
  color: #0f172a;
  font-weight: 700;
}

.nav-icon {
  width: 19px;
  height: 19px;
}

.nav-active-bar {
  display: none;
}

.nav-badge {
  background: #f87171;
  color: #0f172a;
}

.sidebar-footer {
  padding: 14px 12px;
  border-top-color: rgba(226, 232, 240, 0.1);
}

.sidebar-avatar,
.user-avatar {
  background: #f59e0b;
  color: #0f172a;
  border-radius: 11px;
}

.sidebar-logout {
  border-color: rgba(226, 232, 240, 0.14);
  color: rgba(226, 232, 240, 0.66);
}

.sidebar-logout:hover {
  background: rgba(248, 113, 113, 0.14);
  color: #fca5a5;
}

.main-area {
  min-width: 0;
}

.topbar {
  border-radius: 16px;
  border-color: var(--color-border);
  box-shadow: var(--shadow-sm);
}

.topbar-search,
.topbar-tour,
.menu-btn,
.topbar-logout,
.topbar-notifications {
  border-radius: 11px;
}

.topbar-left {
  min-width: 0;
}

.portal-role {
  padding: 6px 9px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

.topbar-right {
  gap: 8px;
}

.notification-wrap {
  position: relative;
}

.topbar-notifications {
  position: relative;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.topbar-notifications:hover {
  border-color: var(--color-border-accent);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.notification-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border: 2px solid var(--color-surface);
  border-radius: 999px;
  background: var(--color-error);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
}

.notification-popover {
  position: absolute;
  z-index: 300;
  top: calc(100% + 10px);
  right: 0;
  width: min(380px, calc(100vw - 24px));
  max-height: min(460px, calc(100dvh - 110px));
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.notification-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--color-border);
}

.notification-heading .nav-group-label {
  padding: 0;
  color: var(--color-text-tertiary);
  opacity: 1;
  visibility: visible;
}

.notification-heading h2 {
  margin: 4px 0 0;
  color: var(--color-text-primary);
  font-size: 16px;
}

.notification-mark-read {
  padding: 7px 9px;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.notification-state {
  margin: 0;
  padding: 22px 18px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.notification-error {
  color: var(--color-error);
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  color: inherit;
  text-decoration: none;
}

.notification-item:last-child {
  border-bottom: 0;
}

.notification-item:hover,
.notification-item.unread {
  background: var(--color-surface-elevated);
}

.notification-dot {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--color-info);
}

.notification-warning { background: var(--color-warning); }
.notification-error { background: var(--color-error); }
.notification-success { background: var(--color-success); }

.notification-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.notification-copy strong {
  color: var(--color-text-primary);
  font-size: 12px;
}

.notification-copy span {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.notification-copy small {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.content {
  width: 100%;
  max-width: 1600px;
  margin-inline: auto;
}

.bottom-nav {
  background: rgba(15, 23, 42, 0.97);
  border: 1px solid rgba(226, 232, 240, 0.12);
  border-radius: 20px;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.28);
}

.bottom-nav-item {
  color: rgba(226, 232, 240, 0.7);
}

.bottom-nav-item.active {
  background: #f59e0b;
  color: #0f172a;
}

.bn-badge {
  background: #f87171;
  color: #0f172a;
}

@media (max-width: 768px) {
  .topbar {
    top: 8px;
  }

  .portal-role {
    display: none;
  }

  .content {
    padding: 18px 16px 104px;
  }

  .bottom-nav {
    bottom: max(12px, env(safe-area-inset-bottom));
  }
}

/* === CITADEL SHELL REFINEMENT === */
.layout {
  background: var(--color-bg);
}

.layout-bg {
  opacity: 0.45;
}

.sidebar {
  background: #0F172A;
  border-right-color: rgba(226, 232, 240, 0.08);
}

.sidebar .logo-icon,
.sidebar .sidebar-logo {
  color: #F59E0B;
}

.sidebar .logo-title,
.sidebar .sidebar-user-name {
  color: #F8FAFC;
}

.sidebar .logo-sub,
.sidebar .sidebar-user-role,
.sidebar .nav-group-label {
  color: rgba(226, 232, 240, 0.55);
}

.sidebar .nav-item {
  color: rgba(226, 232, 240, 0.72);
}

.sidebar .nav-item:hover {
  background: rgba(248, 250, 252, 0.07);
  color: #F8FAFC;
}

.sidebar .nav-item.active {
  background: rgba(245, 158, 11, 0.14);
  color: #FBBF24;
  font-weight: 700;
}

.sidebar .nav-active-bar {
  background: #F59E0B;
}

.sidebar .sidebar-avatar {
  background: #F59E0B;
  color: #0F172A;
}

.sidebar .sidebar-logout {
  border-color: rgba(226, 232, 240, 0.16);
  color: rgba(226, 232, 240, 0.72);
}

.topbar {
  background: var(--glass-bg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.portal-role {
  background: var(--color-accent-soft);
  border: 1px solid rgba(217, 119, 6, 0.18);
  color: #B45309;
}

.semester-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 9999px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-border-accent);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.citadel-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.citadel-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 0 9px;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums lining-nums;
}

.citadel-badge.streak {
  color: #B45309;
  background: var(--color-warning-soft);
  border-color: rgba(245, 158, 11, 0.2);
}

.citadel-badge.gems {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: var(--color-border-accent);
}

.profile-menu-wrap {
  position: relative;
}

.profile-trigger {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 4px 8px 4px 4px;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.profile-trigger:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.profile-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1E3A8A, #D97706);
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 800;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
  max-width: 130px;
}

.profile-meta strong {
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.profile-meta small {
  font-size: 10px;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.profile-chevron {
  color: var(--color-text-tertiary);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 2000;
  width: 240px;
  padding: 8px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  animation: citadelMenuIn 180ms var(--ease-out) both;
}

.profile-dropdown-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px 10px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}

.profile-dropdown-head strong {
  font-size: 13px;
  color: var(--color-text-primary);
}

.profile-dropdown-head span {
  font-size: 11px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-dropdown a,
.profile-dropdown button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.profile-dropdown a:hover,
.profile-dropdown button:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.profile-dropdown button:last-child:hover {
  background: var(--color-error-soft);
  color: var(--color-error);
}

.bottom-nav {
  background: rgba(15, 23, 42, 0.96);
  border-color: rgba(226, 232, 240, 0.14);
}

.bottom-nav-item.active {
  color: #FBBF24;
  background: rgba(245, 158, 11, 0.14);
}

.bn-badge {
  background: #F59E0B;
  color: #0F172A;
}

.page-enter-active {
  animation-duration: 220ms;
}

.page-leave-active {
  animation-duration: 150ms;
}

@keyframes citadelMenuIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 900px) {
  .semester-pill,
  .citadel-badges {
    display: none;
  }
}

@media (max-width: 768px) {
  .profile-meta,
  .profile-chevron {
    display: none;
  }

  .profile-trigger {
    padding: 3px;
    border-radius: 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-dropdown {
    animation: none;
  }
}
</style>
