<template>
  <div class="dk-dash">
    <div class="dk-dash__header">
      <div>
        <p class="dk-dash__greeting">{{ greeting }}, Mighty</p>
        <h1 class="dk-dash__title">Attendance</h1>
      </div>
      <div class="dk-dash__meta">
        <span class="dk-dash__date">{{ date }}</span>
        <span class="dk-dash__streak">{{ streak }}d streak</span>
      </div>
    </div>

    <div class="dk-dash__ledger">
      <BaseCard flush>
        <template #header>
          <div class="dk-dash__ledger-header">
            <span class="dk-dash__ledger-title">Session Register</span>
            <StatusBadge status="present" :label="`${presentCount} present`" />
          </div>
        </template>
        <ul class="dk-ledger">
          <li v-for="s in roster" :key="s.id" class="dk-ledger__row">
            <div class="dk-ledger__who">
              <span class="dk-ledger__avatar">{{ initials(s.name) }}</span>
              <div>
                <p class="dk-ledger__name">{{ s.name }}</p>
                <p class="dk-ledger__id">{{ s.id }}</p>
              </div>
            </div>
            <StatusBadge :status="s.status" />
          </li>
        </ul>
      </BaseCard>

      <div v-if="showSeal" class="dk-dash__seal-banner">
        <AttendanceSeal time="10:32 AM" />
        <div>
          <p class="dk-dash__seal-title">You're marked present</p>
          <p class="dk-dash__seal-sub">CSC 402 · verified within venue geofence</p>
        </div>
      </div>

      <BaseButton variant="primary" size="lg" class="dk-dash__checkin" @click="showSeal = true">
        Mark My Attendance
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import StatusBadge from '../components/StatusBadge.vue'
import AttendanceSeal from '../components/AttendanceSeal.vue'

const showSeal = ref(false)

const roster = ref([
  { id: 'MCU/20/0142', name: 'Adenipekun Mighty', status: 'present' },
  { id: 'MCU/20/0198', name: 'Bola Adewale', status: 'present' },
  { id: 'MCU/21/0034', name: 'Chidera Okafor', status: 'pending' },
  { id: 'MCU/20/0271', name: 'Femi Salako', status: 'absent' },
])

const presentCount = computed(() => roster.value.filter(s => s.status === 'present').length)
const hour = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const streak = 3

function initials(name) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<style scoped>
.dk-dash { max-width: 780px; margin: 0 auto; padding: 40px 24px; }
.dk-dash__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 16px; flex-wrap: wrap; }
.dk-dash__greeting { font-size: 14px; color: var(--color-ink-400); margin: 0; }
.dk-dash__title { font-family: var(--font-display); font-size: 28px; margin: 0; color: var(--color-ink-900); }
.dk-dash__meta { display: flex; gap: 12px; font-size: 13px; color: var(--color-ink-400); }
.dk-dash__streak { color: var(--color-brass); font-weight: 600; }
.dk-dash__ledger { display: flex; flex-direction: column; gap: 16px; }
.dk-dash__ledger-header { display: flex; align-items: center; justify-content: space-between; }
.dk-dash__ledger-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--color-ink-900); }

.dk-ledger { list-style: none; margin: 0; padding: 0; }
.dk-ledger__row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--color-ink-100);
  transition: background 0.15s;
}
.dk-ledger__row:last-child { border-bottom: none; }
.dk-ledger__row:hover { background: var(--color-ink-50); }
.dk-ledger__who { display: flex; align-items: center; gap: 12px; }
.dk-ledger__avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-ink-800); color: var(--color-parchment-100);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; flex-shrink: 0;
}
.dk-ledger__name { margin: 0; font-weight: 500; color: var(--color-ink-900); }
.dk-ledger__id { margin: 0; font-size: 12px; color: var(--color-ink-300); }

.dk-dash__seal-banner {
  display: flex; align-items: center; gap: 20px;
  background: rgba(27,122,61,0.08); border: 1px solid #1B7A3D;
  border-radius: 12px; padding: 20px 24px;
}
.dk-dash__seal-title { font-weight: 600; margin: 0 0 4px; color: var(--color-ink-900); }
.dk-dash__seal-sub { font-size: 13px; color: var(--color-ink-400); margin: 0; }
.dk-dash__checkin { align-self: flex-start; }
</style>
