<template>
  <div class="dash-header">
    <div class="dash-header-left">
      <div class="dash-greeting">
        <span class="greeting-time">{{ timeGreeting }}</span>
        <h1 class="greeting-name">{{ authStore.user?.name?.split(' ')[0] || 'Student' }}</h1>
        <p class="greeting-tagline">{{ greetingTagline }}</p>
      </div>
      <div class="dash-date">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        {{ todayDate }}
      </div>
    </div>
    <div class="dash-streak-badge" v-if="streak >= 3">
      <TrendingUp class="w-[12px] h-[12px]" />
      <span>{{ streakMessage }}</span>
    </div>
    <router-link to="/attendance" class="dash-checkin-btn" ref="checkinBtnRef" @mousemove="onCheckinMove">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      <span>Check In</span>
    </router-link>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { TrendingUp } from 'lucide-vue-next';

const authStore = useAuthStore();
const checkinBtnRef = ref(null);

const props = defineProps({
  streak: {
    type: Number,
    required: true
  },
  todayDate: {
    type: String,
    required: true
  }
});

const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

const timeGreeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

const greetingTagline = computed(() => {
  const h = new Date().getHours();
  const name = authStore.user?.name?.split(' ')[0] || 'Student';
  const day = dayName;
  if (h < 5) return `${name}, burning the midnight oil?`;
  if (h < 9) return `Ready to kick off ${day}, ${name}?`;
  if (h < 12) return `Let's make ${day} productive, ${name}`;
  if (h < 14) return `Keep the momentum going, ${name}`;
  if (h < 17) return `Crushing it this ${day} afternoon, ${name}`;
  if (h < 21) return `${day} evening — time to wrap up strong, ${name}`;
  return `Great focus today, ${name}. Rest up.`;
});

const streakMessage = computed(() => {
  if (props.streak >= 10) return `🔥 ${props.streak}-day streak! You're on fire!`;
  if (props.streak >= 5) return `⚡ ${props.streak}-day streak! Keep it going!`;
  if (props.streak >= 3) return `✨ ${props.streak} days strong! Nice momentum!`;
  return `Start your streak today!`;
});

function onCheckinMove(e) {
  const btn = e.currentTarget;
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  btn.style.setProperty('--mx', x + '%');
  btn.style.setProperty('--my', y + '%');
}
</script>

<style scoped>
/* ── HEADER ── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dash-header-left {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
}

.dash-greeting {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.greeting-time {
  font-size: 15px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.greeting-name {
  font-size: 44px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.greeting-tagline {
  font-size: 18px;
  color: var(--color-text-tertiary);
  font-weight: 400;
  margin-top: 2px;
  line-height: 1.3;
}

.dash-date {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-quaternary);
  padding: var(--space-1) var(--space-3);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  white-space: nowrap;
}

.dash-streak-badge {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(30, 64, 175, 0.08));
  border: 1px solid rgba(217, 119, 6, 0.2);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-accent);
  white-space: nowrap;
  animation: streakPulse 2s ease-in-out infinite;
}
@keyframes streakPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.2); }
  50% { box-shadow: 0 0 0 4px rgba(217, 119, 6, 0); }
}

.dash-checkin-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.dash-checkin-btn:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 24px var(--color-primary-glow);
}

.dash-checkin-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.2) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.dash-checkin-btn:hover::after {
  opacity: 1;
}

@media (max-width: 1440px) {
  .greeting-name { font-size: 36px; }
  .greeting-tagline { font-size: 16px; }
}

@media (max-width: 1280px) {
  .greeting-name { font-size: 30px; }
  .greeting-tagline { font-size: 14px; }
  .greeting-time { font-size: 13px; }
  .dash-streak-badge { font-size: 12px; padding: var(--space-1) var(--space-3); }
}

@media (max-width: 768px) {
  .dash-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .dash-header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .greeting-name {
    font-size: 28px;
  }
  .dash-streak-badge {
    font-size: 11px;
    padding: 6px 12px;
  }
  .dash-date {
    font-size: 11px;
    padding: 6px 12px;
  }
}

@media (max-width: 480px) {
  .greeting-name { font-size: 22px; }
  .greeting-tagline { font-size: 14px; }
  .greeting-time { font-size: 12px; }
  .dash-checkin-btn { font-size: 13px; padding: 8px 14px; }
}
</style>
