<template>
  <div class="session">
    <div class="session__header stagger-1">
      <div>
        <p class="session__eyebrow">CSC 402 &middot; Software Engineering</p>
        <h1 class="session__title">Today's Session</h1>
      </div>
      <Button
        v-if="!checkedIn"
        variant="primary"
        size="lg"
        :loading="checkingIn"
        @click="handleCheckIn"
      >
        Mark my attendance
      </Button>
      <Badge v-else variant="success" class="session__badge">
        <Check class="w-4 h-4" />
        Checked In
      </Badge>
    </div>

    <div v-if="checkedIn" class="session__seal-banner stagger-2">
      <AttendanceSeal :time="checkInTime" />
      <div>
        <p class="session__seal-title">You're marked present</p>
        <p class="session__seal-sub">Recorded for CSC 402 &middot; verified within venue geofence</p>
      </div>
    </div>

    <Card variant="elevated" class="stagger-3">
      <template #header>
        <div class="session__register-header">
          <h2 class="session__register-title">Session Register</h2>
          <span class="session__register-count">
            <span class="session__count-dot"></span>
            {{ presentCount }} / {{ roster.length }} present
          </span>
        </div>
      </template>

      <ul class="ledger" role="list">
        <li
          v-for="(student, i) in roster"
          :key="student.id"
          class="ledger__row"
          :class="[`ledger--${student.status}`, `stagger-${Math.min(i + 4, 10)}`]"
        >
          <div class="ledger__who">
            <span class="ledger__avatar">{{ initials(student.name) }}</span>
            <div>
              <p class="ledger__name">{{ student.name }}</p>
              <p class="ledger__id">{{ student.matricNo }}</p>
            </div>
          </div>
          <StatusBadge :status="statusMap[student.status]" :label="student.status" />
        </li>
      </ul>

      <div v-if="!roster.length" class="ledger__empty">
        <Users class="w-8 h-8" />
        <p>No students enrolled in this session</p>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Check, Users } from 'lucide-vue-next'
import Button from '../ui/Button.vue'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'
import StatusBadge from '../ui/StatusBadge.vue'
import AttendanceSeal from './AttendanceSeal.vue'

const checkedIn = ref(false)
const checkingIn = ref(false)
const checkInTime = ref('')

const roster = ref([
  { id: 1, name: 'Adenipekun Mighty', matricNo: 'MCU/20/0142', status: 'present' },
  { id: 2, name: 'Bola Adewale', matricNo: 'MCU/20/0198', status: 'present' },
  { id: 3, name: 'Chidera Okafor', matricNo: 'MCU/21/0034', status: 'pending' },
  { id: 4, name: 'Femi Salako', matricNo: 'MCU/20/0271', status: 'absent' },
])

const statusMap = { present: 'active', pending: 'pending', absent: 'error' }

const presentCount = computed(() => roster.value.filter(s => s.status === 'present').length)

function initials(name) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

async function handleCheckIn() {
  checkingIn.value = true
  await new Promise(r => setTimeout(r, 700))
  checkInTime.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  checkedIn.value = true
  checkingIn.value = false
}
</script>

<style scoped>
.session {
  max-width: 780px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-5);
}

.session__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
  flex-wrap: wrap;
}

.session__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 var(--space-1);
}

.session__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.session__badge {
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-4);
}

.session__seal-banner {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  background: var(--color-success-soft);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-6);
}

.session__seal-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}

.session__seal-sub {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin: 0;
}

.session__register-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.session__register-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.session__register-count {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-success);
  background: var(--color-success-soft);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}

.session__count-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse-dot 2s ease-in-out infinite;
}

.ledger {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ledger__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--duration-fast) ease;
}

.ledger__row:last-child {
  border-bottom: none;
}

.ledger__row:hover {
  background: var(--color-primary-soft);
}

.ledger--pending {
  opacity: 0.75;
}

.ledger--absent .ledger__name {
  color: var(--color-text-tertiary);
}

.ledger__who {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.ledger__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 600;
  flex-shrink: 0;
  font-family: var(--font-display);
}

.ledger__name {
  margin: 0;
  font-weight: 500;
  color: var(--color-text-primary);
}

.ledger__id {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-quaternary);
  font-family: var(--font-mono);
}

.ledger__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-10) var(--space-5);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 var(--color-success); }
  50% { box-shadow: 0 0 0 6px transparent; }
}

@media (max-width: 768px) {
  .session { padding: var(--space-5) var(--space-3); }
  .session__header h1 { font-size: var(--text-xl); }
  .session__seal-banner { flex-direction: column; text-align: center; }
  .ledger__row { padding: var(--space-3) var(--space-4); }
}
</style>
