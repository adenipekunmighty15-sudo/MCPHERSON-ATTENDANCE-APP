<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Lecturer Courses</h3>
      <div class="flex items-center gap-3">
        <input v-model="lecturerFilter" placeholder="Filter by lecturer ID..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-48" />
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
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Lecturer ID</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Course ID</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Code</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Title</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Role</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Status</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]/50">
            <tr v-for="item in items" :key="item.id" class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-mono text-xs">{{ item.lecturer_id }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-mono text-xs">{{ item.course_id }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-mono">{{ item.course_code || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-medium">{{ item.course_title || '-' }}</td>
              <td class="p-3">
                <span :class="roleBadgeClass(item.role)" class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">{{ item.role || 'instructor' }}</span>
              </td>
              <td class="p-3">
                <span :class="item.is_active !== false ? 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]' : 'bg-[var(--color-error-soft)] text-[var(--color-text-primary)]'" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{ item.is_active !== false ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="p-3">
                <button v-if="authStore.user?.role === 'super_admin'" @click="confirmDelete(item)" class="text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] text-xs font-semibold bg-red-500/10 px-2 py-1 rounded-lg">Delete</button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="7" class="p-6 text-center text-[var(--color-text-tertiary)] text-sm">No lecturer courses found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Assign Lecturer to Course</h3>
          <button @click="closeModal" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="save" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Lecturer ID *</label>
            <input v-model="form.lecturer_id" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Course ID *</label>
            <input v-model="form.course_id" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Semester ID</label>
            <input v-model="form.semester_id" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Role</label>
            <select v-model="form.role" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]">
              <option value="instructor">Instructor</option>
              <option value="assistant">Assistant</option>
              <option value="coordinator">Coordinator</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-primary)] rounded-lg transition-colors">Assign</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const API = '/api/admin'

const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const lecturerFilter = ref('')
const form = ref({ lecturer_id: '', course_id: '', semester_id: '', role: 'instructor' })

function roleBadgeClass(role) {
  if (role === 'coordinator') return 'bg-[var(--color-gold-soft)] text-[var(--color-text-primary)]'
  if (role === 'assistant') return 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]'
  return 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
}

async function fetchItems() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (lecturerFilter.value) params.set('lecturer_id', lecturerFilter.value)
    const qs = params.toString() ? '?' + params.toString() : ''
    const res = await fetch(`${API}/lecturer-courses${qs}`, { headers: { Authorization: `Bearer ${authStore.token}` } })
    if (!res.ok) throw new Error('Failed to fetch')
    items.value = await res.json()
  } catch (e) { alert('Error loading lecturer courses: ' + e.message) }
  finally { loading.value = false }
}

function openCreate() {
  form.value = { lecturer_id: '', course_id: '', semester_id: '', role: 'instructor' }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function save() {
  try {
    const body = { ...form.value }
    const res = await fetch(`${API}/lecturer-courses`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Save failed')
    closeModal()
    await fetchItems()
  } catch (e) { alert('Error assigning lecturer: ' + e.message) }
}

function confirmDelete(item) {
  if (!confirm(`Remove lecturer assignment? This action cannot be undone.`)) return
  deleteItem(item.id)
}

async function deleteItem(id) {
  try {
    const res = await fetch(`${API}/lecturer-courses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authStore.token}` } })
    if (!res.ok) throw new Error('Delete failed')
    await fetchItems()
  } catch (e) { alert('Error deleting assignment: ' + e.message) }
}

watch(lecturerFilter, () => { fetchItems() })
onMounted(fetchItems)
</script>
