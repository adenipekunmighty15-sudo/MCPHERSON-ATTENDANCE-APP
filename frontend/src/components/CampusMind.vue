<template>
  <div class="campus-mind-wrapper">
    <ProactiveMind :visible="proactiveVisible" @close="proactiveVisible = false" @update="onInsightUpdate" />
    <div
      class="campus-mind"
      :class="{ 'has-unread': mindStore.unreadCount > 0 }"
      @click="handleClick"
    >
      <div class="mind-orb">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4c0 2-1.5 3.5-2.5 4.5A4.5 4.5 0 0 0 12 14" />
          <circle cx="12" cy="18" r="1" />
          <path d="M12 22v-2" />
        </svg>
      </div>
      <span v-if="mindStore.unreadCount > 0" class="unread-badge badge-3d-red">{{ mindStore.unreadCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMindStore } from '../stores/mind'
import ProactiveMind from './ProactiveMind.vue'

const mindStore = useMindStore()
const proactiveVisible = ref(false)

let proactiveTimer = null

function handleClick() {
  if (proactiveVisible.value) {
    proactiveVisible.value = false
    return
  }
  if (mindStore.proactiveUnread) {
    proactiveVisible.value = true
    mindStore.proactiveUnread = false
  } else {
    mindStore.expanded = !mindStore.expanded
    if (mindStore.expanded) mindStore.unread = false
  }
}

function onInsightUpdate(count) {
  if (count > 0 && !proactiveVisible.value) {
    mindStore.proactiveUnread = true
  }
}

onMounted(() => {
  mindStore.fetchProactiveInsights()
  mindStore.connectSSE()
  proactiveTimer = setInterval(() => mindStore.fetchProactiveInsights(), 60000)
})

onUnmounted(() => {
  mindStore.disconnectSSE()
  if (proactiveTimer) clearInterval(proactiveTimer)
})
</script>

<style scoped>
.campus-mind {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: mind-float 3s ease-in-out infinite;
}

.campus-mind:hover {
  transform: translateZ(20px) scale3d(1.1, 1.1, 1.1);
  animation-play-state: paused;
}

.campus-mind:active {
  transform: translateZ(8px) scale3d(0.95, 0.95, 0.95);
}

.mind-orb {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  box-shadow:
    0 4px 12px rgba(29, 78, 216, 0.4),
    0 8px 24px rgba(29, 78, 216, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.campus-mind:hover .mind-orb {
  box-shadow:
    0 8px 24px rgba(29, 78, 216, 0.5),
    0 16px 48px rgba(29, 78, 216, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 20px;
  text-align: center;
}

@keyframes mind-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
