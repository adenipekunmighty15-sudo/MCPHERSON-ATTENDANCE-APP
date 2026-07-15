<template>
  <div class="layout" :class="{
    'sidebar-open': sidebarOpen,
    'sidebar-hover': sidebarHover,
    'sidebar-expanded': effectiveExpanded,
    'sidebar-pinned': sidebarPinned
  }">
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
      </div>

      <nav class="sidebar-nav">
        <div v-for="(group, gi) in navGroups" :key="gi" class="nav-group">
          <span class="nav-group-label">{{ group.label }}</span>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="sidebarOpen = false"
          >
            <component :is="getIcon(item.icon)" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.badge === 'unread' && messagingStore.unreadTotal > 0" class="nav-badge">{{ messagingStore.unreadTotal > 9 ? '9+' : messagingStore.unreadTotal }}</span>
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
          <button class="sidebar-toggle-btn" @click="toggleSidebar" :title="sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="sidebar-logout" @click="handleLogout" title="Sign Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>

    <div class="sidebar-overlay" @click="sidebarOpen = false" />

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" @click="sidebarOpen = !sidebarOpen" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <div class="topbar-breadcrumb">
            <span class="breadcrumb-current">{{ pageTitle }}</span>
          </div>
        </div>

        <div class="topbar-right">
          <button class="topbar-search" @click="showCommandPalette = true" title="Search (Ctrl+K)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span class="search-placeholder">Search</span>
            <kbd class="search-kbd">Ctrl+K</kbd>
          </button>
          <ThemeToggle />
          <router-link to="/profile" class="user-avatar" title="Profile">
            {{ authStore.user?.name?.charAt(0) || 'U' }}
          </router-link>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component, route: r }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="r.path" />
          </transition>
        </router-view>
      </main>
    </div>

    <CommandPalette v-if="showCommandPalette" @close="showCommandPalette = false" />

    <nav class="bottom-nav">
      <router-link
        v-for="item in pillNavItems"
        :key="item.path"
        :to="item.path"
        class="bottom-nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="bn-icon-wrap">
          <component :is="getIcon(item.icon)" class="bottom-nav-icon" />
          <span v-if="item.badge === 'unread' && messagingStore.unreadTotal > 0" class="bn-badge">{{ messagingStore.unreadTotal > 9 ? '9+' : messagingStore.unreadTotal }}</span>
        </span>
        <span class="bottom-nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, markRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMessagingStore } from '../stores/messaging'
import CommandPalette from './CommandPalette.vue'
import ThemeToggle from './ThemeToggle.vue'
import Logo from './Logo.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const messagingStore = useMessagingStore()
const sidebarOpen = ref(false)
const sidebarHover = ref(false)
const isLargeScreen = ref(window.innerWidth > 1280)
const sidebarExpanded = ref(window.innerWidth > 1280)
const sidebarPinned = ref(window.innerWidth > 1280)
const showCommandPalette = ref(false)

const effectiveExpanded = computed(() => {
  return sidebarExpanded.value || (sidebarHover.value && window.innerWidth <= 1280)
})

function toggleSidebar() {
  const w = window.innerWidth
  if (w > 1280) {
    sidebarPinned.value = !sidebarPinned.value
    sidebarExpanded.value = sidebarPinned.value
  } else if (w > 768) {
    sidebarExpanded.value = !sidebarExpanded.value
  } else {
    sidebarOpen.value = !sidebarOpen.value
  }
}

function checkScreen() {
  const w = window.innerWidth
  if (w > 1280 && !sidebarPinned.value) {
    isLargeScreen.value = true
    sidebarPinned.value = true
    sidebarExpanded.value = true
  } else if (w <= 1280) {
    isLargeScreen.value = false
    sidebarPinned.value = false
  }
}

const pageTitle = computed(() => route.meta?.title || 'Dashboard')

const navGroups = [
  {
    label: 'Core',
    items: [
      { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
      { path: '/attendance', label: 'Attendance', icon: 'ClipboardCheck' },
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
    ],
  },
  {
    label: 'Admin',
    items: [
      { path: '/admin', label: 'Console', icon: 'Shield' },
      { path: '/profile', label: 'Profile', icon: 'User' },
      { path: '/settings', label: 'Settings', icon: 'Settings' },
    ],
  },
]

const pillNavItems = [
  { path: '/', label: 'Home', icon: 'LayoutDashboard' },
  { path: '/attendance', label: 'Check In', icon: 'ClipboardCheck' },
  { path: '/messages', label: 'Chat', icon: 'MessageCircle', badge: 'unread' },
  { path: '/study-hub', label: 'Study', icon: 'Library' },
  { path: '/profile', label: 'Profile', icon: 'User' },
]

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
}

function getIcon(name) {
  return icons[name] || icons.LayoutDashboard
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

watch(sidebarOpen, (val) => {
  if (val) {
    // force a reflow to ensure CSS transitions render correctly on some browsers
    requestAnimationFrame(() => {
      const s = document.querySelector('.sidebar')
      if (s) void s.offsetWidth
    })
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', checkScreen)
  messagingStore.init()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', checkScreen)
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
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
  background: radial-gradient(circle, rgba(217,119,6,0.12), transparent 70%);
  animation: orbFloat 25s ease-in-out infinite;
}
.orb-2 {
  bottom: -10%; right: -5%;
  width: 30%; height: 30%;
  background: radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%);
  animation: orbFloat 30s ease-in-out infinite reverse;
}
.orb-3 {
  top: 40%; right: 10%;
  width: 20%; height: 20%;
  background: radial-gradient(circle, rgba(251,191,36,0.06), transparent 70%);
  animation: orbFloat 20s ease-in-out infinite 5s;
}
.orb-4 {
  bottom: 20%; left: 15%;
  width: 15%; height: 15%;
  background: radial-gradient(circle, rgba(180,83,9,0.05), transparent 70%);
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
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.sidebar-expanded {
  width: var(--sidebar-width);
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 14px;
  min-height: 62px;
  border-bottom: 1px solid var(--color-border);
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
  opacity: 0;
  transition: opacity 0.2s ease 0.15s;
}

.sidebar-expanded .sidebar-logo-text {
  opacity: 1;
}

.logo-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.logo-sub {
  font-size: 9px;
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
  font-size: 8px;
  font-weight: 700;
  color: var(--color-text-quaternary);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  padding: 10px 12px 4px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.15s ease 0.1s;
}

.sidebar-expanded .nav-group-label {
  opacity: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  position: relative;
}

.nav-item:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.nav-item.active {
  background: var(--color-primary-muted);
  color: var(--color-primary);
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  min-width: 18px;
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
  opacity: 0;
  transition: opacity 0.2s ease 0.1s;
}

.sidebar-expanded .nav-label {
  opacity: 1;
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
  height: 18px;
  background: var(--color-primary);
  border-radius: 0 3px 3px 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
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
  width: 30px;
  height: 30px;
  min-width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
}

.sidebar-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  opacity: 0;
  transition: opacity 0.2s ease 0.15s;
}

.sidebar-expanded .sidebar-user-info {
  opacity: 1;
}

.sidebar-user-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-role {
  font-size: 9px;
  font-weight: 600;
  color: var(--color-text-quaternary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-logout {
  width: 30px;
  height: 30px;
  min-width: 30px;
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
  opacity: 0;
  transition: opacity 0.2s ease 0.1s;
}

.sidebar-expanded .sidebar-footer-actions {
  opacity: 1;
}

.sidebar-toggle-btn {
  width: 30px;
  height: 30px;
  min-width: 30px;
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

.sidebar-toggle-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-border-accent);
}

.sidebar-pinned .sidebar-toggle-btn svg {
  transform: rotate(180deg);
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

/* Mobile off-canvas behavior */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-110%);
    transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
    width: var(--sidebar-width);
  }
  .sidebar-open .sidebar {
    transform: translateX(0);
  }
  .main-area {
    margin-left: 0;
  }
  .menu-btn {
    display: flex;
  }
}

/* ==================== MAIN AREA ==================== */
.main-area {
  flex: 1;
  margin-left: var(--sidebar-collapsed);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ==================== TOPBAR ==================== */
.topbar {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  margin: 10px 12px 0;
  border-radius: 12px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--color-border-accent);
  box-shadow: var(--glass-shadow);
  position: sticky;
  top: 10px;
  z-index: 50;
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
  border-radius: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.menu-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-border-accent);
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-current {
  font-size: 15px;
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
  height: 34px;
  padding: 0 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
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

.search-placeholder {
  display: none;
}

.search-kbd {
  font-size: 9px;
  font-weight: 600;
  padding: 2px 5px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-quaternary);
  font-family: inherit;
}

.user-avatar {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px var(--color-primary-glow);
}

/* ==================== CONTENT ==================== */
.content {
  flex: 1;
  padding: 20px 24px;
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

/* ==================== MOBILE ==================== */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: var(--sidebar-width) !important;
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
    padding: 16px;
    padding-bottom: 90px;
  }

  .topbar {
    margin: 8px 8px 0;
    padding: 0 12px;
  }
}

/* ==================== LAPTOP & DESKTOP ==================== */
@media (min-width: 1281px) {
  .sidebar {
    width: var(--sidebar-width) !important;
  }

  .sidebar-user-info,
  .sidebar-footer-actions,
  .nav-label,
  .nav-group-label {
    opacity: 1 !important;
  }

  .sidebar-expanded .main-area {
    margin-left: var(--sidebar-width);
  }
}

@media (min-width: 1025px) {
  .content {
    padding: 24px 28px;
  }

  .topbar {
    margin: 12px 16px 0;
    padding: 0 24px;
  }

  .breadcrumb-current {
    font-size: 17px;
  }
}

@media (max-width: 1024px) {
  .content {
    padding: 16px 20px;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 12px 14px;
    padding-bottom: 90px;
  }
}

/* ==================== DESKTOP (generic) ==================== */
@media (min-width: 769px) {
  .search-placeholder {
    display: inline;
  }

  .sidebar-expanded .main-area {
    margin-left: var(--sidebar-width);
  }
}

/* ==================== BOTTOM NAV ==================== */
.bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--glass-bg);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid var(--color-border-accent);
    border-radius: 14px;
    padding: 4px 6px;
    gap: 2px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05);
    z-index: 1000;
    align-items: center;
    width: calc(100% - 32px);
    max-width: 360px;
  }

  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-decoration: none;
    color: var(--color-text-quaternary);
    padding: 6px 8px;
    border-radius: 10px;
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
    width: 20px;
    height: 20px;
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
  }

  .bottom-nav-label {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
}
</style>
