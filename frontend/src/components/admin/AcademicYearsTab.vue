<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Academic Years</h3>
      <button @click="openCreate" class="flex items-center gap-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add
      </button>
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
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Start Date</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">End Date</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Current</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Status</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]/50">
            <tr v-for="item in items" :key="item.id" class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-medium">{{ item.name }}</td>
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
              <td colspan="6" class="p-6 text-center text-[var(--color-text-tertiary)] text-sm">No academic years found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-[var(--color-text-primary)]">{{ editingId ? 'Edit Academic Year' : 'Create Academic Year' }}</h3>
          <button @click="closeModal" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="save" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Name *</label>
            <input v-model="form.name" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Start Date *</label>
            <input v-model="form.start_date" type="date" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">End Date *</label>
            <input v-model="form.end_date" type="date" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_current" type="checkbox" id="ay-current" class="rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:ring-[#93C5FD]" />
            <label for="ay-current" class="text-sm text-[var(--color-text-primary)]">Current Academic Year</label>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="ay-active" class="rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:ring-[#93C5FD]" />
            <label for="ay-active" class="text-sm text-[var(--color-text-primary)]">Active</label>
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const API = '/api/admin'

const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const form = ref({ name: '', start_date: '', end_date: '', is_current: false, is_active: true })

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function fetchItems() {
  loading.value = true
  try {
    const res = await fetch(`${API}/academic-years`, { headers: { Authorization: `Bearer ${authStore.token}` } })
    if (!res.ok) throw new Error('Failed to fetch')
    items.value = await res.json()
  } catch (e) { alert('Error loading academic years: ' + e.message) }
  finally { loading.value = false }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', start_date: '', end_date: '', is_current: false, is_active: true }
  showModal.value = true
}

function openEdit(item) {
  editingId.value = item.id
  form.value = { name: item.name, start_date: item.start_date ? item.start_date.slice(0, 10) : '', end_date: item.end_date ? item.end_date.slice(0, 10) : '', is_current: item.is_current, is_active: item.is_active }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function save() {
  try {
    const body = { ...form.value }
    const url = editingId.value ? `${API}/academic-years/${editingId.value}` : `${API}/academic-years`
    const method = editingId.value ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Save failed')
    closeModal()
    await fetchItems()
  } catch (e) { alert('Error saving academic year: ' + e.message) }
}

function confirmDelete(item) {
  if (!confirm(`Delete academic year "${item.name}"? This action cannot be undone.`)) return
  deleteItem(item.id)
}

async function deleteItem(id) {
  try {
    const res = await fetch(`${API}/academic-years/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authStore.token}` } })
    if (!res.ok) throw new Error('Delete failed')
    await fetchItems()
  } catch (e) { alert('Error deleting academic year: ' + e.message) }
}

onMounted(fetchItems)
</script>
