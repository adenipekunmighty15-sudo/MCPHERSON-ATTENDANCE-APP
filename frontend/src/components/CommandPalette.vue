<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content palette">
      <div class="palette-header">
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          class="input"
          placeholder="Search commands..."
          @keydown="onKeydown"
        />
      </div>
      <div class="palette-body">
        <button
          v-for="(cmd, index) in filteredCommands"
          :key="cmd.label"
          class="palette-item"
          :class="{ active: selectedIndex === index }"
          @click="execute(cmd)"
          @mouseenter="selectedIndex = index"
        >
          <span class="palette-item__icon" v-html="sanitizeHtml(cmd.icon)"></span>
          <span class="palette-item__label">{{ cmd.label }}</span>
          <span class="palette-item__shortcut">{{ cmd.shortcut }}</span>
        </button>
        <div v-if="filteredCommands.length === 0" class="palette-empty">
          No commands found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { sanitizeHtml } from '../lib/sanitize.js'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['update:show'])

const router = useRouter()
const searchInput = ref(null)
const query = ref('')
const selectedIndex = ref(0)

const commands = [
  { label: 'Go to Dashboard', route: '/', shortcut: '⌘1', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { label: 'Mark Attendance', route: '/attendance', shortcut: '⌘2', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
  { label: 'Open Chat', route: '/chat', shortcut: '⌘3', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
  { label: 'View Timetable', route: '/timetable', shortcut: '⌘4', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { label: 'Open Study Hub', route: '/study-hub', shortcut: '⌘5', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { label: 'Create New Note', route: '/study-hub', shortcut: '⌘N', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>' },
  { label: 'Review Flashcards', route: '/study-hub', shortcut: '⌘F', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16"/><path d="M2 12h20"/></svg>' },
  { label: 'Take a Quiz', route: '/study-hub', shortcut: '⌘Q', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  { label: 'Generate Podcast', route: '/study-hub', shortcut: '⌘P', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>' },
  { label: 'View Study Progress', route: '/study-hub', shortcut: '⌘⇧P', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  { label: 'Start Focus Timer', route: '/study-hub', shortcut: '⌘T', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
  { label: 'View Profile', route: '/profile', shortcut: '⌘6', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  { label: 'Open Settings', route: '/settings', shortcut: '⌘7', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
  { label: 'View Results', route: '/results', shortcut: '⌘8', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' }
]

const filteredCommands = computed(() => {
  const q = query.value.toLowerCase()
  return commands.filter(cmd => cmd.label.toLowerCase().includes(q))
})

function onKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const cmd = filteredCommands.value[selectedIndex.value]
    if (cmd) execute(cmd)
  } else if (e.key === 'Escape') {
    close()
  }
}

function execute(cmd) {
  if (cmd.route) router.push(cmd.route)
  close()
}

function close() {
  query.value = ''
  selectedIndex.value = 0
  emit('update:show', false)
}

watch(() => props.show, (val) => {
  if (val) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})
</script>

<style scoped>
.palette {
  max-width: 520px;
  width: 90%;
  padding: 0;
  overflow: hidden;
  background: var(--color-surface-raised);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--glass-shadow);
}

.palette-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.palette-header .input {
  width: 100%;
  box-sizing: border-box;
}

.palette-body {
  max-height: 360px;
  overflow-y: auto;
  padding: 8px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  color: var(--color-text-primary);
  transition: all 0.15s var(--ease-smooth);
}

.palette-item:hover {
  background: var(--color-primary-soft);
}

.palette-item.active {
  background: var(--color-primary-muted);
  border: 1px solid var(--color-border-accent);
}

.palette-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--color-primary);
}

.palette-item__label {
  flex: 1;
  font-weight: 500;
}

.palette-item__shortcut {
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-surface-elevated);
  padding: 2px 8px;
  border-radius: 6px;
  font-family: inherit;
  border: 1px solid var(--color-border);
}

.palette-empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 14px;
}
</style>
