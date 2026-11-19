<template>
  <section class="complaints-manager" aria-labelledby="complaints-title">
    <header class="section-header">
      <div>
        <h2 id="complaints-title">Student complaints</h2>
        <p>Review submissions, update status and provide a response to the student.</p>
      </div>
      <label class="filter-label">
        Status
        <select v-model="statusFilter" aria-label="Filter complaints by status">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
    </header>

    <p v-if="error" class="notice notice-error" role="alert">{{ error }}</p>
    <p v-if="notice" class="notice notice-success" role="status">{{ notice }}</p>
    <div v-if="loading" class="empty-state" role="status">Loading student submissions…</div>
    <div v-else-if="filteredComplaints.length" class="complaint-list">
      <article v-for="complaint in filteredComplaints" :key="complaint.id" class="complaint-card">
        <div class="complaint-topline">
          <div class="complaint-meta">
            <span class="status-pill" :class="`status-${complaint.status}`">{{ statusLabel(complaint.status) }}</span>
            <span class="priority-pill" :class="`priority-${complaint.priority || 'medium'}`">{{ complaint.priority || 'Priority not set' }}</span>
            <time :datetime="complaint.createdAt">{{ formatDate(complaint.createdAt) }}</time>
          </div>
          <span class="complaint-area">{{ complaint.area || 'General' }}</span>
        </div>
        <h3>{{ complaint.title || 'Student submission' }}</h3>
        <p class="complaint-author">Submitted by {{ complaint.studentName || 'Student' }}</p>
        <p class="complaint-message">{{ complaint.message }}</p>

        <div class="response-fields">
          <label>
            Status
            <select v-model="drafts[complaint.id].status">
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label>
            Response to student
            <textarea v-model="drafts[complaint.id].adminResponse" maxlength="5000" rows="3" placeholder="Write an update for the student…"></textarea>
          </label>
        </div>
        <div v-if="saveErrors[complaint.id]" class="notice notice-error" role="alert">{{ saveErrors[complaint.id] }}</div>
        <footer class="complaint-footer">
          <span>{{ complaint.userId || 'Student ID unavailable' }}</span>
          <button type="button" class="save-button" :disabled="savingId === complaint.id" @click="saveComplaint(complaint)">
            {{ savingId === complaint.id ? 'Saving…' : 'Save update' }}
          </button>
        </footer>
      </article>
    </div>
    <div v-else class="empty-state">
      <MessageSquareText :size="20" />
      <span>{{ complaints.length ? 'No complaints match this status.' : 'There are no student complaints to review.' }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { MessageSquareText } from 'lucide-vue-next'
import api from '../../lib/api'

const complaints = ref([])
const drafts = ref({})
const saveErrors = ref({})
const statusFilter = ref('all')
const loading = ref(true)
const savingId = ref('')
const error = ref('')
const notice = ref('')

const filteredComplaints = computed(() => statusFilter.value === 'all'
  ? complaints.value
  : complaints.value.filter(item => item.status === statusFilter.value))

function apiError(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback
}

async function loadComplaints() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/admin/complaints', { params: { limit: 100 } })
    complaints.value = Array.isArray(data) ? data : []
    drafts.value = Object.fromEntries(complaints.value.map(item => [item.id, {
      status: item.status || 'open',
      adminResponse: item.adminResponse || '',
    }]))
  } catch (err) {
    error.value = apiError(err, 'Could not load student complaints.')
  } finally {
    loading.value = false
  }
}

async function saveComplaint(complaint) {
  error.value = ''
  notice.value = ''
  saveErrors.value = { ...saveErrors.value, [complaint.id]: '' }
  savingId.value = complaint.id
  try {
    const draft = drafts.value[complaint.id]
    const { data } = await api.patch(`/admin/complaints/${encodeURIComponent(complaint.id)}`, {
      status: draft.status,
      adminResponse: draft.adminResponse,
    })
    complaints.value = complaints.value.map(item => item.id === complaint.id
      ? { ...item, ...data, status: data?.status || draft.status, adminResponse: data?.adminResponse ?? draft.adminResponse }
      : item)
    notice.value = 'Complaint update saved.'
  } catch (err) {
    saveErrors.value = { ...saveErrors.value, [complaint.id]: apiError(err, 'Could not save this complaint update.') }
  } finally {
    savingId.value = ''
  }
}

function statusLabel(status) {
  return String(status || 'open').replace('_', ' ')
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(loadComplaints)
</script>

<style scoped>
.complaints-manager { display: grid; gap: 16px; }
.section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.section-header h2 { margin: 0; color: var(--color-text-primary); font-size: 16px; font-weight: 750; }
.section-header p { margin: 5px 0 0; color: var(--color-text-tertiary); font-size: 12px; }
.filter-label, .response-fields label { display: grid; gap: 6px; color: var(--color-text-secondary); font-size: 10px; font-weight: 700; }
.filter-label select, .response-fields select, .response-fields textarea { min-height: 38px; padding: 8px 10px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); color: var(--color-text-primary); font: inherit; }
.complaint-list { display: grid; gap: 12px; }
.complaint-card { display: grid; gap: 12px; padding: 16px; border: 1px solid var(--color-border); border-radius: 14px; background: var(--color-surface); }
.complaint-topline, .complaint-meta, .complaint-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.complaint-meta { flex-wrap: wrap; justify-content: flex-start; color: var(--color-text-tertiary); font-size: 10px; }
.status-pill, .priority-pill { padding: 5px 8px; border-radius: 999px; font-size: 9px; font-weight: 750; text-transform: capitalize; }
.status-open { color: var(--color-warning); background: var(--color-warning-soft); }
.status-in_progress { color: var(--color-info); background: var(--color-info-soft); }
.status-resolved, .status-closed { color: var(--color-success); background: var(--color-success-soft); }
.status-rejected { color: var(--color-error); background: var(--color-error-soft); }
.priority-high, .priority-urgent { color: var(--color-error); background: var(--color-error-soft); }
.priority-medium { color: var(--color-warning); background: var(--color-warning-soft); }
.priority-low { color: var(--color-text-tertiary); background: var(--color-surface-elevated); }
.complaint-area { color: var(--color-primary); font-size: 10px; font-weight: 750; }
.complaint-card h3 { margin: 0; color: var(--color-text-primary); font-size: 14px; }
.complaint-author { margin: -7px 0 0; color: var(--color-text-tertiary); font-size: 10px; }
.complaint-message { margin: 0; color: var(--color-text-secondary); font-size: 12px; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
.response-fields { display: grid; grid-template-columns: minmax(150px, 0.3fr) minmax(0, 1fr); gap: 12px; padding-top: 12px; border-top: 1px solid var(--color-border); }
.response-fields textarea { resize: vertical; }
.response-fields select:focus, .response-fields textarea:focus, .filter-label select:focus { border-color: var(--color-primary-light); outline: none; box-shadow: var(--focus-ring); }
.complaint-footer { padding-top: 4px; color: var(--color-text-tertiary); font-size: 10px; }
.save-button { min-height: 36px; padding: 0 13px; border: 0; border-radius: 9px; background: var(--color-primary); color: #fff; font-size: 11px; font-weight: 750; cursor: pointer; }
.save-button:disabled { opacity: 0.6; cursor: wait; }
.notice { margin: 0; padding: 10px 12px; border-radius: 10px; font-size: 11px; }
.notice-error { color: var(--color-error); background: var(--color-error-soft); }
.notice-success { color: var(--color-success); background: var(--color-success-soft); }
.empty-state { min-height: 100px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 1px dashed var(--color-border-strong); border-radius: 12px; color: var(--color-text-tertiary); font-size: 12px; text-align: center; }
@media (max-width: 640px) {
  .section-header { flex-direction: column; }
  .response-fields { grid-template-columns: 1fr; }
  .complaint-topline { align-items: flex-start; }
}
</style>
