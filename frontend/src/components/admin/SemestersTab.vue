<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Semesters</h3>
      <div class="flex items-center gap-3">
        <input v-model="ayFilter" placeholder="Filter by AY ID..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-48" />
        <button @click="openCreate" class="flex items-center gap-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <span class="text-[var(--color-text-secondary)] text-sm">Loading...</span>
    </div>

    <div v-else class="bg-[var(--color-surface)]/60 border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[var(--color-bg)]/40 border-b border-[var(--color-border)]">
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Name</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Academic Year</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Type</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Start</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">End</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Current</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Status</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]/50">
            <tr v-for="item in items" :key="item.id" class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-medium">{{ item.name }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.academic_year_name || item.academic_year_id || '-' }}</td>
              <td class="p-3 text-sm capitalize text-[var(--color-text-primary)]">{{ item.type || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.start_date ? formatDate(item.start_date) : '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.end_date ? formatDate(item.end_date) : '-' }}</td>
              <td class="p-3">
                <span v-if="item.is_current" class="bg-[var(--color-gold-soft)] text-[var(--color-text-primary)] px-2 py-0.5 rounded-full text-xs font-semibold">Current</span>
                <span v-else class="text-[var(--color-text-tertiary)] text-xs">-</span>
              </td>
              <td class="p-3">
                <span :class="item.is_active ? 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]' : 'bg-[var(--color-error-soft)] text-[var(--color-text-primary)]'" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{ item.is_active ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <button @click="openEdit(item)" class="text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] text-xs font-semibold bg-[var(--color-primary-soft)] px-2 py-1 rounded-lg">Edit</button>
                  <button v-if="authStore.user?.role === 'super_admin'" @click="confirmDelete(item)" class="text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] text-xs font-semibold bg-red-500/10 px-2 py-1 rounded-lg">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="8" class="p-6 text-center text-[var(--color-text-tertiary)] text-sm">No semesters found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-[var(--color-text-primary)]">{{ editingId ? 'Edit Semester' : 'Create Semester' }}</h3>
          <button @click="closeModal" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="save" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Academic Year ID *</label>
            <input v-model="form.academic_year_id" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Name *</label>
            <input v-model="form.name" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Type *</label>
            <select v-model="form.type" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]">
              <option value="">Select...</option>
              <option value="first">First</option>
              <option value="second">Second</option>
              <option value="summer">Summer</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Start Date *</label>
            <input v-model="form.start_date" type="date" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">End Date *</label>
            <input v-model="form.end_date" type="date" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Registration Start</label>
            <input v-model="form.registration_start" type="date" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Registration End</label>
            <input v-model="form.registration_end" type="date" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Exam Start</label>
            <input v-model="form.exam_start" type="date" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Exam End</label>
            <input v-model="form.exam_end" type="date" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_current" type="checkbox" id="sem-current" class="rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:ring-[#93C5FD]" />
            <label for="sem-current" class="text-sm text-[var(--color-text-primary)]">Current Semester</label>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="sem-active" class="rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:ring-[#93C5FD]" />
            <label for="sem-active" class="text-sm text-[var(--color-text-primary)]">Active</label>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-primary)] rounded-lg transition-colors">{{ editingId ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../lib/api'

const authStore = useAuthStore()

const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const ayFilter = ref('')
const form = ref({ academic_year_id: '', name: '', type: '', start_date: '', end_date: '', registration_start: '', registration_end: '', exam_start: '', exam_end: '', is_current: false, is_active: true })

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function fetchItems() {
  loading.value = true
  try {
    const params = {}
    if (ayFilter.value) params.academic_year_id = ayFilter.value
    const { data } = await api.get('/admin/semesters', { params })
    items.value = data
  } catch (e) { alert('Error loading semesters: ' + (e.response?.data?.message || e.message)) }
  finally { loading.value = false }
}

function openCreate() {
  editingId.value = null
  form.value = { academic_year_id: '', name: '', type: '', start_date: '', end_date: '', registration_start: '', registration_end: '', exam_start: '', exam_end: '', is_current: false, is_active: true }
  showModal.value = true
}

function openEdit(item) {
  editingId.value = item.id
  form.value = {
    academic_year_id: item.academic_year_id || '',
    name: item.name,
    type: item.type || '',
    start_date: item.start_date ? item.start_date.slice(0, 10) : '',
    end_date: item.end_date ? item.end_date.slice(0, 10) : '',
    registration_start: item.registration_start ? item.registration_start.slice(0, 10) : '',
    registration_end: item.registration_end ? item.registration_end.slice(0, 10) : '',
    exam_start: item.exam_start ? item.exam_start.slice(0, 10) : '',
    exam_end: item.exam_end ? item.exam_end.slice(0, 10) : '',
    is_current: item.is_current,
    is_active: item.is_active
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function save() {
  try {
    const body = { ...form.value }
    if (editingId.value) {
      await api.put(`/admin/semesters/${editingId.value}`, body)
    } else {
      await api.post('/admin/semesters', body)
    }
    closeModal()
    await fetchItems()
  } catch (e) { alert('Error saving semester: ' + (e.response?.data?.message || e.message)) }
}

function confirmDelete(item) {
  if (!confirm(`Delete semester "${item.name}"? This action cannot be undone.`)) return
  deleteItem(item.id)
}

async function deleteItem(id) {
  try {
    await api.delete(`/admin/semesters/${id}`)
    await fetchItems()
  } catch (e) { alert('Error deleting semester: ' + (e.response?.data?.message || e.message)) }
}

watch(ayFilter, () => { fetchItems() })
onMounted(fetchItems)
</script>
