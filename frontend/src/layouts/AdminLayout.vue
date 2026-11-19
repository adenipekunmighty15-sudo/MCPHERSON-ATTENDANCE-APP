<template>
  <div class="admin-layout">
    <a href="#admin-content" class="skip-link">Skip to admin content</a>
    <div class="admin-bg">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
    </div>
    <aside class="admin-sidebar" :class="{ show: mobileOpen }">
      <div class="sidebar-header">
        <router-link to="/admin/portal/dashboard" class="sidebar-logo">
          <div class="logo-icon"><Logo :size="28" /></div>
          <div class="sidebar-logo-text"><span class="logo-title">MCU</span><span class="logo-sub">Admin</span></div>
        </router-link>
      </div>
      <nav class="sidebar-nav" aria-label="Admin navigation">
        <div class="nav-group-label">Management</div>
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }" :aria-current="isActive(item.path) ? 'page' : undefined">
          <span class="nav-icon" v-safe-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user" @click="router.push('/admin/portal/dashboard')">
          <div class="sidebar-avatar">{{ authStore.user?.name?.charAt(0) || 'A' }}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ authStore.user?.name || 'Admin' }}</span>
            <span class="sidebar-user-role">{{ authStore.user?.role || 'admin' }}</span>
          </div>
        </div>
        <button class="sidebar-logout" @click="handleLogout" title="Sign Out"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>
      </div>
    </aside>
    <div class="admin-main">
      <header class="admin-topbar">
        <button class="menu-btn" @click="mobileOpen = !mobileOpen" :aria-expanded="mobileOpen" aria-label="Toggle menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>
        <nav aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li class="breadcrumb-item"><router-link to="/admin/portal/dashboard" class="breadcrumb-link">Admin</router-link><span class="breadcrumb-sep" aria-hidden="true">/</span></li>
            <li class="breadcrumb-item"><span class="breadcrumb-current" aria-current="page">{{ pageTitle }}</span></li>
          </ol>
        </nav>
        <span class="semester-pill">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>
          {{ semesterLabel }}
        </span>
        <div class="topbar-right">
          <router-link to="/" class="topbar-link" title="Back to Student Portal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span class="topbar-link-text">Student Portal</span>
          </router-link>
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
                <strong>{{ authStore.user?.name || 'Admin' }}</strong>
                <small>{{ profileRoleLabel }}</small>
              </span>
              <svg class="profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div v-if="profileOpen" class="profile-dropdown" role="menu">
              <div class="profile-dropdown-head">
                <strong>{{ authStore.user?.name || 'Admin' }}</strong>
                <span>{{ authStore.user?.email || '—' }}</span>
              </div>
              <router-link to="/admin/portal/dashboard" role="menuitem" @click="profileOpen = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                Admin console
              </router-link>
              <router-link to="/" role="menuitem" @click="profileOpen = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                Student portal
              </router-link>
              <button type="button" role="menuitem" @click="handleLogout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main id="admin-content" class="admin-content" tabindex="-1">
        <router-view v-slot="{ Component, route: r }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="r.path" />
          </transition>
        </router-view>
      </main>
    </div>
    <div class="sidebar-overlay" :class="{ show: mobileOpen }" @click="mobileOpen = false" />
    <nav class="bottom-nav">
      <router-link v-for="item in mobileNavItems" :key="item.path" :to="item.path" class="bottom-nav-item" :class="{ active: isActive(item.path) }">
        <span class="bn-icon" v-safe-html="item.icon"></span>
        <span class="bn-label">{{ item.label }}</span>
      </router-link>
      <button @click="handleLogout" class="bottom-nav-item" aria-label="Sign Out">
        <span class="bn-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
        <span class="bn-label">Logout</span>
      </button>
    </nav>
  </div>
</template><script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Logo from '../components/Logo.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileOpen = ref(false)
const profileOpen = ref(false)

const pageTitle = computed(() => route.meta?.title || 'Admin')
const profileInitial = computed(() => (authStore.user?.name || authStore.user?.email || 'A').charAt(0).toUpperCase())
const profileRoleLabel = computed(() => authStore.user?.role === 'super_admin' ? 'Super Admin' : 'Administrator')
const semesterLabel = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const semester = now.getMonth() >= 6 ? 'First Semester' : 'Second Semester'
  return `${year}/${String(year + 1).slice(-2)} · ${semester}`
})

function closeProfileOnOutside(event) {
  if (profileOpen.value && !event.target?.closest?.('.profile-menu-wrap')) profileOpen.value = false
}

onMounted(() => window.addEventListener('click', closeProfileOnOutside))
onUnmounted(() => window.removeEventListener('click', closeProfileOnOutside))

const navItems = [
  { path: '/admin/portal/dashboard', label: 'Dashboard', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
  { path: '/admin/portal/university-admin', label: 'University Admin', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>' },
]

const mobileNavItems = [
  { path: '/admin/portal/dashboard', label: 'Dashboard', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
  { path: '/admin/portal/university-admin', label: 'Manage', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>' },
]

function isActive(path) {
  if (path === route.path) return true
  if (route.path.startsWith(path)) return true
  return false
}

async function handleLogout() {
  await authStore.logout()
  router.push('/admin/portal/login')
}
</script><style scoped>
.admin-layout { display: flex; min-height: 100dvh; background: var(--color-bg); position: relative; }
.skip-link { position: absolute; top: -100%; left: 8px; z-index: 10000; padding: 8px 16px; background: var(--color-primary); color: #fff; font-size: 14px; font-weight: 700; border-radius: 0 0 8px 8px; text-decoration: none; transition: top 0.2s; }
.skip-link:focus { top: 0; }
.admin-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.bg-orb { position: absolute; border-radius: 50%; filter: blur(120px); }
.orb-1 { top: -15%; left: -5%; width: 35%; height: 35%; background: radial-gradient(circle, rgba(30,64,175,0.12), transparent 70%); animation: orbFloat 25s ease-in-out infinite; }
.orb-2 { bottom: -10%; right: -5%; width: 30%; height: 30%; background: radial-gradient(circle, rgba(217,119,6,0.08), transparent 70%); animation: orbFloat 30s ease-in-out infinite reverse; }
@keyframes orbFloat { 0%,100% { transform: translate(0,0) scale(1); } 25% { transform: translate(30px,-40px) scale(1.1); } 50% { transform: translate(-20px,20px) scale(0.9); } 75% { transform: translate(40px,30px) scale(1.05); } }
.admin-sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 240px; background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; z-index: 100; transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
.sidebar-header { display: flex; align-items: center; padding: 16px; min-height: 64px; border-bottom: 1px solid var(--color-border); }
.sidebar-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.logo-icon { display: flex; align-items: center; justify-content: center; color: var(--color-primary); }
.sidebar-logo-text { display: flex; flex-direction: column; }
.logo-title { font-size: 16px; font-weight: 800; color: var(--color-text-primary); line-height: 1.2; }
.logo-sub { font-size: 10px; font-weight: 600; color: var(--color-text-tertiary); letter-spacing: 0.5px; }
.sidebar-nav { flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.nav-group-label { font-size: 9px; font-weight: 700; color: var(--color-text-quaternary); text-transform: uppercase; letter-spacing: 1.2px; padding: 12px 8px 4px; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; min-height: 40px; color: var(--color-text-tertiary); text-decoration: none; font-size: 13px; font-weight: 500; transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
.nav-item:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.nav-item.active { background: var(--color-primary-soft); color: var(--color-primary); font-weight: 600; }
.nav-icon { flex-shrink: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
.sidebar-footer { padding: 12px; border-top: 1px solid var(--color-border); display: flex; align-items: center; gap: 8px; }
.sidebar-user { flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px; border-radius: 8px; transition: background 0.2s; }
.sidebar-user:hover { background: var(--color-primary-soft); }
.sidebar-avatar { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); color: #fff; font-size: 13px; font-weight: 700; border-radius: 8px; }
.sidebar-user-info { display: flex; flex-direction: column; min-width: 0; }
.sidebar-user-name { font-size: 13px; font-weight: 700; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-user-role { font-size: 10px; font-weight: 600; color: var(--color-text-quaternary); text-transform: uppercase; letter-spacing: 0.5px; }
.sidebar-logout { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border); border-radius: 8px; background: transparent; color: var(--color-text-quaternary); cursor: pointer; transition: all 0.2s; }
.sidebar-logout:hover { background: var(--color-error-soft); color: var(--color-error); border-color: transparent; }
.admin-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; min-height: 100dvh; position: relative; z-index: 1; }
.admin-topbar { height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 20px; margin: 10px 14px 0; border-radius: var(--radius-lg); background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)) saturate(160%); border: 1px solid var(--color-border); box-shadow: var(--glass-shadow); position: sticky; top: 10px; z-index: 101; }
.menu-btn { display: none; }
.breadcrumb-list { display: flex; align-items: center; gap: 8px; list-style: none; margin: 0; padding: 0; }
.breadcrumb-item { display: flex; align-items: center; gap: 8px; }
.breadcrumb-link { font-size: 13px; font-weight: 500; color: var(--color-text-tertiary); text-decoration: none; }
.breadcrumb-link:hover { color: var(--color-primary); }
.breadcrumb-sep { font-size: 13px; color: var(--color-border-strong); }
.breadcrumb-current { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
.topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.topbar-link { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; color: var(--color-text-tertiary); text-decoration: none; font-size: 12px; font-weight: 500; transition: all 0.2s; }
.topbar-link:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.topbar-link-text { display: none; }
.topbar-logout { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border); border-radius: 8px; background: transparent; color: var(--color-text-quaternary); cursor: pointer; transition: all 0.2s; }
.topbar-logout:hover { background: var(--color-error-soft); color: var(--color-error); border-color: transparent; }
.admin-content { flex: 1; padding: 20px 24px; }
.sidebar-overlay { display: none; position: fixed; inset: 0; z-index: 99; background: rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.35s ease; pointer-events: none; }
.sidebar-overlay.show { display: block; opacity: 1; pointer-events: auto; }
.bottom-nav { display: none; }
@media (min-width: 1025px) { .topbar-link-text { display: inline; } }
@media (max-width: 768px) {
  .admin-sidebar { transform: translateX(-100%); }
  .admin-sidebar.show { transform: translateX(0); }
  .admin-main { margin-left: 0; }
  .menu-btn { display: flex; width: 36px; height: 36px; align-items: center; justify-content: center; background: none; border: 1px solid var(--color-border); color: var(--color-text-tertiary); cursor: pointer; border-radius: 9px; }
  .sidebar-overlay { display: block; }
  .admin-content { padding: 16px; padding-bottom: 90px; }
  .admin-topbar { margin: 8px 8px 0; padding: 0 14px; }
  .bottom-nav { display: flex; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--glass-bg); backdrop-filter: blur(24px) saturate(180%); border: 1px solid var(--color-border-accent); border-radius: 18px; padding: 6px 8px; gap: 4px; box-shadow: 0 4px 24px rgba(0,0,0,0.2); z-index: 1000; align-items: center; width: calc(100% - 32px); max-width: 420px; }
  .bottom-nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; text-decoration: none; color: var(--color-text-quaternary); padding: 8px 10px; border-radius: 12px; flex: 1; transition: all 0.25s var(--ease-spring); }
  .bottom-nav-item.active { color: var(--color-primary); background: var(--color-primary-muted); }
  .bn-icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; }
  .bn-label { font-size: 10px; font-weight: 700; }
}
.page-enter-active { animation: pageIn 0.35s cubic-bezier(0.16,1,0.3,1); }
.page-leave-active { animation: pageOut 0.2s cubic-bezier(0.16,1,0.3,1); }
@keyframes pageIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes pageOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-8px) scale(0.98); } }
@media (prefers-reduced-motion: reduce) { .admin-layout *, .admin-layout *::before, .admin-layout *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }

.admin-sidebar {
  background: #0f172a;
  border-right-color: rgba(226, 232, 240, 0.1);
}
.admin-sidebar .logo-icon { color: #fbbf24; }
.admin-sidebar .logo-title,
.admin-sidebar .sidebar-user-name { color: #f8fafc; }
.admin-sidebar .logo-sub,
.admin-sidebar .sidebar-user-role,
.admin-sidebar .nav-group-label { color: rgba(226, 232, 240, 0.58); }
.admin-sidebar .nav-item { color: rgba(226, 232, 240, 0.72); }
.admin-sidebar .nav-item:hover { background: rgba(248, 250, 252, 0.08); color: #f8fafc; }
.admin-sidebar .nav-item.active { background: #f59e0b; color: #0f172a; font-weight: 700; }
.admin-sidebar .sidebar-footer { border-top-color: rgba(226, 232, 240, 0.12); }
.admin-sidebar .sidebar-avatar { background: #f59e0b; color: #0f172a; }
.admin-sidebar .sidebar-logout { border-color: rgba(226, 232, 240, 0.18); color: rgba(226, 232, 240, 0.72); }
.admin-sidebar .sidebar-logout:hover { background: rgba(248, 113, 113, 0.14); color: #fca5a5; }
.admin-layout .bottom-nav { background: rgba(15, 23, 42, 0.97); border-color: rgba(226, 232, 240, 0.14); }
.admin-layout .bottom-nav-item { color: rgba(226, 232, 240, 0.72); }
.admin-layout .bottom-nav-item.active { background: #f59e0b; color: #0f172a; }

/* === CITADEL ADMIN SHELL REFINEMENT === */
.admin-layout {
  background: var(--color-bg);
}

.admin-bg {
  opacity: 0.5;
}

.admin-sidebar {
  background: #0F172A;
  border-right-color: rgba(226, 232, 240, 0.08);
}

.admin-sidebar .logo-icon {
  color: #F59E0B;
}

.admin-sidebar .nav-item.active {
  background: rgba(245, 158, 11, 0.14);
  color: #FBBF24;
}

.admin-topbar {
  background: var(--glass-bg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.semester-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 9999px;
  background: var(--color-accent-soft);
  border: 1px solid rgba(217, 119, 6, 0.18);
  color: #B45309;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
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
  background: #F59E0B;
  color: #0F172A;
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
  width: 230px;
  padding: 8px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  animation: adminMenuIn 180ms var(--ease-out) both;
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

@keyframes adminMenuIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 900px) {
  .semester-pill {
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
