<template>
  <section class="venue-manager" aria-labelledby="venues-title">
    <header class="section-header">
      <div>
        <h2 id="venues-title">Campus venues</h2>
        <p>Manage venue coordinates and the GPS radius used for attendance verification.</p>
      </div>
      <span class="section-count">{{ venues.length }} venues</span>
    </header>

    <p v-if="error" class="notice notice-error" role="alert">{{ error }}</p>
    <p v-if="notice" class="notice notice-success" role="status">{{ notice }}</p>

    <form class="venue-form" @submit.prevent="saveVenue">
      <div class="form-heading">
        <h3>{{ editingId ? 'Edit venue' : 'Add a venue' }}</h3>
        <button v-if="editingId" type="button" class="text-button" @click="resetForm">Cancel edit</button>
      </div>
      <div class="form-grid">
        <label>
          Venue name
          <input v-model.trim="form.name" required maxlength="160" placeholder="Lecture Hall B" />
        </label>
        <label>
          Room code
          <input v-model.trim="form.roomCode" required maxlength="80" placeholder="LH-B" />
        </label>
        <label>
          Latitude
          <input v-model.number="form.latitude" type="number" step="any" min="-90" max="90" required placeholder="6.000000" />
        </label>
        <label>
          Longitude
          <input v-model.number="form.longitude" type="number" step="any" min="-180" max="180" required placeholder="3.000000" />
        </label>
        <label>
          GPS geofence radius (metres)
          <input v-model.number="form.radiusMeters" type="number" min="10" max="1000" required />
        </label>
      </div>
      <button class="primary-button" type="submit" :disabled="saving">
        {{ saving ? 'Saving…' : editingId ? 'Save venue' : 'Add venue' }}
      </button>
    </form>

    <div v-if="loading" class="empty-state" role="status">Loading campus venues…</div>
    <div v-else-if="venues.length" class="venue-list">
      <article v-for="venue in venues" :key="venue.id" class="venue-row">
        <div class="venue-marker"><MapPin :size="18" /></div>
        <div class="venue-info">
          <strong>{{ venue.name }}</strong>
          <span>{{ venue.roomCode || 'No room code' }}</span>
          <small>{{ coordinate(venue.latitude) }}, {{ coordinate(venue.longitude) }}</small>
        </div>
        <span class="radius-badge">{{ venue.radiusMeters == null ? 'Radius not set' : `${venue.radiusMeters} m radius` }}</span>
        <button type="button" class="edit-button" @click="editVenue(venue)">Edit</button>
      </article>
    </div>
    <div v-else class="empty-state">
      <MapPin :size="20" />
      <span>No campus venues are configured yet. Add one above to enable venue-based GPS verification.</span>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { MapPin } from 'lucide-vue-next'
import api from '../../lib/api'

const venues = ref([])
const loading = ref(true)
const saving = ref(false)
const editingId = ref('')
const error = ref('')
const notice = ref('')
const form = reactive({
  name: '',
  roomCode: '',
  latitude: '',
  longitude: '',
  radiusMeters: 50,
})

function apiError(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback
}

async function loadVenues() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/venues')
    venues.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = apiError(err, 'Could not load campus venues.')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = ''
  form.name = ''
  form.roomCode = ''
  form.latitude = ''
  form.longitude = ''
  form.radiusMeters = 50
}

function editVenue(venue) {
  error.value = ''
  notice.value = ''
  editingId.value = String(venue.id)
  form.name = venue.name || ''
  form.roomCode = venue.roomCode || ''
  form.latitude = venue.latitude ?? ''
  form.longitude = venue.longitude ?? ''
  form.radiusMeters = venue.radiusMeters ?? 50
}

async function saveVenue() {
  error.value = ''
  notice.value = ''
  const payload = {
    name: form.name.trim(),
    roomCode: form.roomCode.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    radiusMeters: Number(form.radiusMeters),
  }
  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude) || !Number.isFinite(payload.radiusMeters)) {
    error.value = 'Enter valid latitude, longitude and geofence radius values.'
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      await api.put(`/venues/${encodeURIComponent(editingId.value)}`, payload)
      notice.value = 'Venue details updated.'
    } else {
      await api.post('/venues', payload)
      notice.value = 'Venue added.'
    }
    resetForm()
    await loadVenues()
  } catch (err) {
    error.value = apiError(err, 'Could not save this venue.')
  } finally {
    saving.value = false
  }
}

function coordinate(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(5) : '—'
}

onMounted(loadVenues)
</script>

<style scoped>
.venue-manager { display: grid; gap: 18px; }
.section-header, .form-heading, .venue-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.section-header h2, .form-heading h3 { margin: 0; color: var(--color-text-primary); font-size: 16px; font-weight: 750; }
.section-header p { margin: 5px 0 0; color: var(--color-text-tertiary); font-size: 12px; }
.section-count, .radius-badge { border-radius: 999px; padding: 6px 9px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 10px; font-weight: 750; white-space: nowrap; }
.venue-form { padding: 18px; border: 1px solid var(--color-border); border-radius: 14px; background: var(--color-surface-elevated); }
.form-heading { margin-bottom: 14px; }
.text-button { padding: 4px; border: 0; background: transparent; color: var(--color-primary); font-size: 11px; font-weight: 700; cursor: pointer; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
.form-grid label { display: grid; gap: 6px; color: var(--color-text-secondary); font-size: 11px; font-weight: 650; }
.form-grid input { width: 100%; min-height: 40px; padding: 8px 10px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); color: var(--color-text-primary); font: inherit; }
.form-grid input:focus { border-color: var(--color-primary-light); outline: none; box-shadow: var(--focus-ring); }
.primary-button, .edit-button { min-height: 36px; padding: 0 13px; border: 0; border-radius: 9px; color: #fff; background: var(--color-primary); font-size: 11px; font-weight: 750; cursor: pointer; }
.primary-button:disabled { opacity: 0.6; cursor: wait; }
.venue-list { display: grid; gap: 8px; }
.venue-row { justify-content: flex-start; padding: 13px; border: 1px solid var(--color-border); border-radius: 12px; background: var(--color-surface); }
.venue-marker { width: 36px; height: 36px; display: grid; flex: 0 0 auto; place-items: center; border-radius: 10px; background: var(--color-primary-soft); color: var(--color-primary); }
.venue-info { display: grid; flex: 1; min-width: 0; gap: 3px; }
.venue-info strong { overflow: hidden; color: var(--color-text-primary); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.venue-info span, .venue-info small { color: var(--color-text-tertiary); font-size: 10px; }
.radius-badge { color: var(--color-warning); background: var(--color-warning-soft); }
.edit-button { min-height: 32px; color: var(--color-primary); background: var(--color-primary-soft); }
.notice { margin: 0; padding: 11px 13px; border-radius: 10px; font-size: 12px; }
.notice-error { color: var(--color-error); background: var(--color-error-soft); }
.notice-success { color: var(--color-success); background: var(--color-success-soft); }
.empty-state { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 72px; padding: 16px; border: 1px dashed var(--color-border-strong); border-radius: 12px; color: var(--color-text-tertiary); font-size: 12px; text-align: center; }
@media (max-width: 640px) {
  .section-header { align-items: flex-start; }
  .form-grid { grid-template-columns: 1fr; }
  .venue-row { flex-wrap: wrap; }
  .venue-info { flex-basis: calc(100% - 55px); }
  .radius-badge { margin-left: 46px; }
}
</style>
