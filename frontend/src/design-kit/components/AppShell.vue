<template>
  <div class="shell">
    <aside class="shell__sidebar">
      <div class="shell__brand">
        <span class="shell__crest" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path d="M7.5 12.5 L10.5 15.5 L16.5 8.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="font-display">MCU</span>
      </div>

      <nav class="shell__nav">
        <a
          v-for="item in navItems"
          :key="item.label"
          class="shell__nav-link"
          :class="{ 'shell__nav-link--active': item.active }"
          :href="item.href"
        >{{ item.label }}</a>
      </nav>
    </aside>

    <main class="shell__main">
      <div class="shell__content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
defineProps({
  navItems: {
    type: Array,
    default: () => [
      { label: 'Dashboard', href: '/dashboard', active: true },
      { label: 'Attendance', href: '/attendance' },
      { label: 'Timetable', href: '/timetable' },
      { label: 'Courses', href: '/courses' },
      { label: 'Messages', href: '/messages' },
      { label: 'AI Assistant', href: '/assistant' },
      { label: 'Study Hub', href: '/study' },
      { label: 'Community', href: '/community' },
      { label: 'Profile', href: '/profile' },
      { label: 'Settings', href: '/settings' },
    ],
  },
})
</script>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: var(--color-parchment-500);
}

.shell__sidebar {
  background: var(--color-ink-700);
  color: var(--color-parchment-50);
  padding: var(--space-6) var(--space-5);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.shell__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-brass);
  margin-bottom: var(--space-8);
}

.shell__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.shell__nav-link {
  display: block;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  color: var(--color-ink-100);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background-color var(--duration-fast) ease;
}

.shell__nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-parchment-50);
}

.shell__nav-link--active {
  background: rgba(184, 134, 11, 0.16);
  color: var(--color-brass);
}

.shell__main {
  min-width: 0;
}

.shell__content {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-8) var(--space-10);
}

@media (max-width: 960px) {
  .shell {
    grid-template-columns: 1fr;
  }
  .shell__sidebar {
    display: none;
  }
  .shell__content {
    padding: var(--space-5);
  }
}
</style>
