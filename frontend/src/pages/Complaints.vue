<template>
  <div class="support-page">
    <header class="support-header">
      <div>
        <span class="section-kicker">CAMPUS SUPPORT</span>
        <h1>Feedback &amp; complaints</h1>
        <p>Send a message to the university team and follow its status from your account.</p>
      </div>
      <span class="support-icon"><MessageSquareText :size="22" /></span>
    </header>

    <div class="support-grid">
      <section class="support-card" aria-labelledby="submit-title">
        <div class="card-heading">
          <div class="card-symbol"><Send :size="17" /></div>
          <div>
            <h2 id="submit-title">Submit a message</h2>
            <p>Your submission is linked to your signed-in account.</p>
          </div>
        </div>

        <p v-if="submitError" class="inline-alert alert-error" role="alert">{{ submitError }}</p>
        <p v-if="submitNotice" class="inline-alert alert-success" role="status">{{ submitNotice }}</p>

        <form class="support-form" @submit.prevent="submitComplaint">
          <label>
            Topic
            <select v-model="form.area" required>
              <option value="" disabled>Select a topic</option>
              <option value="Attendance">Attendance</option>
              <option value="Academic">Academic support</option>
              <option value="Campus facilities">Campus facilities</option>
              <option value="Account and access">Account and access</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            Subject
            <input v-model.trim="form.title" type="text" maxlength="160" placeholder="A short summary" />
          </label>
          <label>
            Details
            <textarea v-model.trim="form.message" required maxlength="5000" rows="6" placeholder="Describe the issue or feedback. Please avoid including passwords or sensitive credentials."></textarea>
            <small>{{ form.message.length }}/5000</small>
          </label>
          <button class="submit-button" type="submit" :disabled="submitting || !form.area || !form.message">
            {{ submitting ? 'Sending…' : 'Send to university team' }}
            <Send :size="15" />
          </button>
        </form>
      </section>

      <section class="support-card history-card" aria-labelledby="history-title">
        <div class="card-heading">
          <div class="card-symbol card-symbol-muted"><Clock3 :size="17" /></div>
          <div>
            <h2 id="history-title">Your submissions</h2>
            <p>Replies and status changes appear here.</p>
          </div>
        </div>

        <p v-if="loadError" class="inline-alert alert-error" role="alert">
          {{ loadError }}
          <button type="button" class="retry-button" @click="loadComplaints">Try again</button>
        </p>
        <div v-else-if="loading" class="history-state" role="status">Loading your submissions…</div>
        <div v-else-if="!complaints.length" class="history-state">
          <MessageSquareText :size="22" />
          <strong>No submissions yet</strong>
          <span>Messages you send will be listed here.</span>
        </div>
        <div v-else class="complaint-list">
          <article v-for="complaint in complaints" :key="complaint.id" class="complaint-item">
            <div class="complaint-top">
              <span class="topic-label">{{ complaint.area }}</span>
              <span class="status-label" :class="`status-${complaint.status}`">{{ formatStatus(complaint.status) }}</span>
            </div>
            <h3>{{ complaint.title || complaint.area || 'Student submission' }}</h3>
            <time :datetime="complaint.createdAt">{{ formatDate(complaint.createdAt) }}</time>
            <p class="complaint-body">{{ complaint.message }}</p>
            <div v-if="complaint.adminResponse" class="admin-reply">
              <strong>University response</strong>
              <p>{{ complaint.adminResponse }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Clock3, MessageSquareText, Send } from 'lucide-vue-next'
import api from '../lib/api'

const complaints = ref([])
const loading = ref(true)
const submitting = ref(false)
const loadError = ref('')
const submitError = ref('')
const submitNotice = ref('')
const form = reactive({ area: '', title: '', message: '' })

function apiError(error, fallback) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
}

async function loadComplaints() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/complaints')
    complaints.value = Array.isArray(data) ? data : []
  } catch (error) {
    loadError.value = apiError(error, 'Could not load your submissions.')
  } finally {
    loading.value = false
  }
}

async function submitComplaint() {
  submitError.value = ''
  submitNotice.value = ''
  if (!form.area || !form.message.trim()) {
    submitError.value = 'Choose a topic and enter details before sending.'
    return
  }

  submitting.value = true
  try {
    await api.post('/complaints', {
      area: form.area,
      title: form.title.trim(),
      message: form.message.trim(),
    })
    form.area = ''
    form.title = ''
    form.message = ''
    submitNotice.value = 'Your message was sent to the university team.'
    await loadComplaints()
  } catch (error) {
    submitError.value = apiError(error, 'Could not send your message.')
  } finally {
    submitting.value = false
  }
}

function formatStatus(status) {
  return String(status || 'open').replace('_', ' ')
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(loadComplaints)
</script>

<style scoped>
.support-page { width: min(100%, 1280px); margin: 0 auto; padding: 8px 0 32px; color: var(--color-text-primary); }
.support-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.section-kicker { color: var(--color-text-tertiary); font-size: 9px; font-weight: 800; letter-spacing: 0.16em; }
.support-header h1 { margin: 6px 0; font-family: var(--font-display); font-size: clamp(28px, 4vw, 38px); letter-spacing: -0.04em; }
.support-header p, .card-heading p { margin: 0; color: var(--color-text-tertiary); font-size: 12px; line-height: 1.6; }
.support-icon { width: 44px; height: 44px; display: grid; flex: 0 0 auto; place-items: center; border-radius: 14px; background: var(--color-accent-soft); color: var(--color-accent); }
.support-grid { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); align-items: start; gap: 16px; }
.support-card { min-width: 0; padding: 22px; border: 1px solid var(--color-border); border-radius: 16px; background: var(--color-surface); box-shadow: var(--shadow-sm); }
.card-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 18px; }
.card-symbol { width: 36px; height: 36px; display: grid; flex: 0 0 auto; place-items: center; border-radius: 11px; background: var(--color-primary-soft); color: var(--color-primary); }
.card-symbol-muted { color: var(--color-accent); background: var(--color-accent-soft); }
.card-heading h2 { margin: 0 0 3px; color: var(--color-text-primary); font-size: 15px; font-weight: 750; }
.support-form { display: grid; gap: 14px; }
.support-form label { display: grid; gap: 6px; color: var(--color-text-secondary); font-size: 11px; font-weight: 700; }
.support-form input, .support-form select, .support-form textarea { width: 100%; min-height: 42px; padding: 10px 11px; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-bg); color: var(--color-text-primary); font: inherit; font-size: 12px; }
.support-form textarea { min-height: 126px; resize: vertical; line-height: 1.5; }
.support-form input:focus, .support-form select:focus, .support-form textarea:focus { border-color: var(--color-primary-light); outline: none; box-shadow: var(--focus-ring); }
.support-form label small { justify-self: end; color: var(--color-text-tertiary); font-size: 10px; font-weight: 500; }
.submit-button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 0 15px; border: 0; border-radius: 11px; color: #fff; background: var(--color-primary); font-size: 12px; font-weight: 750; cursor: pointer; }
.submit-button:disabled { opacity: 0.55; cursor: not-allowed; }
.inline-alert { margin: 0 0 14px; padding: 10px 12px; border-radius: 10px; font-size: 11px; line-height: 1.5; }
.alert-error { color: var(--color-error); background: var(--color-error-soft); }
.alert-success { color: var(--color-success); background: var(--color-success-soft); }
.retry-button { margin-left: 8px; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 750; text-decoration: underline; cursor: pointer; }
.history-state { min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; color: var(--color-text-tertiary); font-size: 12px; text-align: center; }
.history-state strong { color: var(--color-text-secondary); }
.complaint-list { display: grid; gap: 10px; max-height: 680px; overflow: auto; }
.complaint-item { padding: 14px; border: 1px solid var(--color-border); border-radius: 12px; background: var(--color-surface-elevated); }
.complaint-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.topic-label { color: var(--color-primary); font-size: 10px; font-weight: 750; }
.status-label { padding: 5px 8px; border-radius: 999px; background: var(--color-warning-soft); color: var(--color-warning); font-size: 9px; font-weight: 750; text-transform: capitalize; }
.status-label.status-in_progress { background: var(--color-info-soft); color: var(--color-info); }
.status-label.status-resolved, .status-label.status-closed { background: var(--color-success-soft); color: var(--color-success); }
.status-label.status-rejected { background: var(--color-error-soft); color: var(--color-error); }
.complaint-item h3 { margin: 11px 0 3px; color: var(--color-text-primary); font-size: 13px; }
.complaint-item time { color: var(--color-text-tertiary); font-size: 10px; }
.complaint-body { margin: 11px 0 0; color: var(--color-text-secondary); font-size: 11px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
.admin-reply { margin-top: 12px; padding: 11px; border-left: 3px solid var(--color-accent); border-radius: 0 9px 9px 0; background: var(--color-accent-soft); }
.admin-reply strong { color: var(--color-text-primary); font-size: 10px; }
.admin-reply p { margin: 5px 0 0; color: var(--color-text-secondary); font-size: 11px; line-height: 1.55; white-space: pre-wrap; }
@media (max-width: 850px) { .support-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .support-card { padding: 16px; } }
</style>
