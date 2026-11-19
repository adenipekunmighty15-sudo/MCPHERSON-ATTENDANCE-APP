<template>
  <section class="timetable-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Academic schedule</p>
        <h1>Timetable</h1>
        <p class="page-description">Classes published to the university timetable.</p>
      </div>
      <button class="refresh-button" type="button" :disabled="loading" @click="loadTimetable">
        <svg :class="{ spinning: loading }" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
        </svg>
        Refresh
      </button>
    </header>

    <div v-if="loading && !entries.length" class="schedule-grid" aria-label="Loading timetable">
      <div v-for="index in 3" :key="index" class="day-skeleton">
        <span></span><i></i><i></i>
      </div>
    </div>
    <div v-else-if="error" class="state-card error-state" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="loadTimetable">Try again</button>
    </div>
    <div v-else-if="!dayGroups.length" class="state-card">
      <div class="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
      </div>
      <h2>No classes published</h2>
      <p>There are no timetable entries available right now. Check again later.</p>
      <button type="button" @click="loadTimetable">Refresh timetable</button>
    </div>

    <div v-else class="schedule-grid">
      <section v-for="group in dayGroups" :key="group.day" class="day-column" :aria-label="`${group.day} classes`">
        <header class="day-heading">
          <h2>{{ group.day }}</h2>
          <span>{{ group.entries.length }}</span>
        </header>
        <button
          v-for="entry in group.entries"
          :key="entry.id"
          type="button"
          class="class-card"
          @click="selectedEntry = entry"
        >
          <span class="class-time">{{ entry.time || 'Time not specified' }}</span>
          <strong>{{ entry.course || entry.course_code || 'Class' }}</strong>
          <span v-if="entry.room" class="class-detail">{{ entry.room }}</span>
          <span v-if="entry.lecturer" class="class-detail">{{ entry.lecturer }}</span>
          <span v-if="entry.type" class="class-type">{{ entry.type }}</span>
        </button>
      </section>
    </div>

    <div v-if="selectedEntry" class="modal-backdrop" @click.self="selectedEntry = null">
      <section class="details-modal" role="dialog" aria-modal="true" aria-labelledby="class-title">
        <header>
          <div>
            <p class="eyebrow">{{ selectedEntry.day || 'Class details' }}</p>
            <h2 id="class-title">{{ selectedEntry.course || selectedEntry.course_code || 'Class' }}</h2>
          </div>
          <button type="button" class="close-button" aria-label="Close details" @click="selectedEntry = null">×</button>
        </header>
        <dl>
          <div><dt>Time</dt><dd>{{ selectedEntry.time || 'Not specified' }}</dd></div>
          <div><dt>Room</dt><dd>{{ selectedEntry.room || 'Not specified' }}</dd></div>
          <div><dt>Lecturer</dt><dd>{{ selectedEntry.lecturer || 'Not specified' }}</dd></div>
          <div><dt>Type</dt><dd>{{ selectedEntry.type || 'Not specified' }}</dd></div>
        </dl>
        <button class="close-action" type="button" @click="selectedEntry = null">Close</button>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../lib/api'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const entries = ref([])
const loading = ref(true)
const error = ref('')
const selectedEntry = ref(null)

const dayGroups = computed(() => {
  const normalizeDay = value => {
    const text = String(value || '').trim().toLowerCase()
    return weekdays.find(day => text === day.toLowerCase() || text.startsWith(day.slice(0, 3).toLowerCase())) || 'Other days'
  }
  const groups = weekdays
    .map(day => ({
      day,
      entries: entries.value
        .filter(entry => normalizeDay(entry.day) === day)
        .slice()
        .sort((a, b) => String(a.time || '').localeCompare(String(b.time || ''))),
    }))
    .filter(group => group.entries.length)
  const otherEntries = entries.value
    .filter(entry => normalizeDay(entry.day) === 'Other days')
    .slice()
    .sort((a, b) => String(a.day || '').localeCompare(String(b.day || '')))
  if (otherEntries.length) groups.push({ day: 'Other days', entries: otherEntries })
  return groups
})

async function loadTimetable() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/timetable')
    if (!Array.isArray(data)) throw new Error('The server returned invalid timetable data.')
    entries.value = data
  } catch (requestError) {
    console.error('Failed to load timetable:', requestError)
    error.value = requestError?.response?.data?.error || 'Could not load the timetable. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(loadTimetable)
</script>

<style scoped>
.timetable-page {
  min-height: 100%;
  padding: clamp(16px, 3vw, 32px);
  color: var(--color-text-primary);
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 850;
  letter-spacing: -0.04em;
}

.page-description {
  margin: 7px 0 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.refresh-button,
.state-card button,
.close-action {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 750;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.refresh-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.spinning {
  animation: spin 0.9s linear infinite;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  align-items: start;
  gap: 14px;
}

.day-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 9px;
  padding: 13px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}

.day-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 3px 8px;
  border-bottom: 1px solid var(--color-border);
}

.day-heading h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
}

.day-heading span {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 800;
}

.class-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-primary);
  border-radius: 11px;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, transform 0.15s;
}

.class-card:hover {
  transform: translateY(-1px);
  border-color: var(--color-primary);
}

.class-time {
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 800;
}

.class-card strong {
  overflow-wrap: anywhere;
  font-size: 12px;
}

.class-detail,
.class-type {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.class-type {
  align-self: flex-start;
  margin-top: 2px;
  padding: 3px 7px;
  border-radius: 999px;
  background: var(--color-surface);
  text-transform: capitalize;
}

.state-card {
  display: flex;
  min-height: 250px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px dashed var(--color-border-strong);
  border-radius: 16px;
  background: var(--color-surface);
  text-align: center;
}

.state-card h2 {
  margin: 14px 0 0;
  font-size: 16px;
}

.state-card p {
  max-width: 370px;
  margin: 8px 0 16px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.error-state p {
  color: var(--color-error, #b91c1c);
}

.empty-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 15px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.empty-icon svg {
  width: 23px;
  height: 23px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.day-skeleton {
  display: flex;
  min-height: 150px;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}

.day-skeleton span,
.day-skeleton i {
  height: 14px;
  border-radius: 7px;
  background: var(--color-surface-elevated);
}

.day-skeleton span {
  width: 45%;
}

.day-skeleton i:last-child {
  width: 75%;
}

.modal-backdrop {
  position: fixed;
  z-index: 9999;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.5);
}

.details-modal {
  width: min(420px, 100%);
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: 0 20px 70px rgba(15, 23, 42, 0.2);
}

.details-modal header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.details-modal h2 {
  margin: 0;
  font-size: 18px;
}

.close-button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 21px;
}

.details-modal dl {
  display: grid;
  gap: 12px;
  margin: 22px 0;
}

.details-modal dl div {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 12px;
}

.details-modal dt {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.details-modal dd {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 11px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.close-action {
  width: 100%;
  background: var(--color-primary);
  color: #fff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 540px) {
  .page-header {
    align-items: flex-start;
  }

  .refresh-button {
    min-width: 40px;
    padding: 0 10px;
    font-size: 0;
  }

  .refresh-button svg {
    width: 18px;
    height: 18px;
  }
}
</style>
