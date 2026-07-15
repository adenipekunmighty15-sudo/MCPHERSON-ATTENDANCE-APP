<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Users</h3>
      <div class="flex items-center gap-3">
        <select v-model="roleFilter" class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]">
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
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
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Email</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Role</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Department</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Level</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">CGPA</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Status</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]/50">
            <tr v-for="item in items" :key="item.id" class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-medium">{{ item.name }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.email }}</td>
              <td class="p-3">
                <span :class="roleClass(item.role)" class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">{{ item.role }}</span>
              </td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.department || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.level || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.cgpa ?? '-' }}</td>
              <td class="p-3">
                <span :class="item.is_active !== false ? 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]' : 'bg-[var(--color-error-soft)] text-[var(--color-text-primary)]'" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{ item.is_active !== false ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="p-3">
                <button @click="openEdit(item)" class="text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] text-xs font-semibold bg-[var(--color-primary-soft)] px-2 py-1 rounded-lg">Edit</button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="8" class="p-6 text-center text-[var(--color-text-tertiary)] text-sm">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Edit User - {{ editName }}</h3>
          <button @click="closeModal" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="save" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Role</label>
            <select v-model="form.role" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]">
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Faculty ID</label>
            <input v-model="form.faculty_id" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Department</label>
            <input v-model="form.department" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Level</label>
            <input v-model="form.level" type="number" min="100" max="900" step="100" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="user-active" class="rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:ring-[#93C5FD]" />
            <label for="user-active" class="text-sm text-[var(--color-text-primary)]">Active</label>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-primary)] rounded-lg transition-colors">Update</button>
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
const editingId = ref(null)
const editName = ref('')
const roleFilter = ref('')
const form = ref({ role: 'student', faculty_id: '', department: '', level: '', is_active: true })

function roleClass(role) {
  if (role === 'super_admin') return 'bg-[var(--color-error-soft)] text-[var(--color-text-primary)]'
  if (role === 'admin') return 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]'
  if (role === 'lecturer') return 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
  return 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]'
}

async function fetchItems() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (roleFilter.value) params.set('role', roleFilter.value)
    const qs = params.toString() ? '?' + params.toString() : ''
    const res = await fetch(`${API}/users${qs}`, { headers: { Authorization: `Bearer ${authStore.token}` } })
    if (!res.ok) throw new Error('Failed to fetch')
    items.value = await res.json()
  } catch (e) { alert('Error loading users: ' + e.message) }
  finally { loading.value = false }
}

function openEdit(item) {
  editingId.value = item.id
  editName.value = item.name
  form.value = { role: item.role || 'student', faculty_id: item.faculty_id || '', department: item.department || '', level: item.level || '', is_active: item.is_active !== false }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function save() {
  try {
    const body = { ...form.value }
    if (body.level) body.level = Number(body.level)
    const res = await fetch(`${API}/users/${editingId.value}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Save failed')
    closeModal()
    await fetchItems()
  } catch (e) { alert('Error saving user: ' + e.message) }
}

watch(roleFilter, () => { fetchItems() })
onMounted(fetchItems)
</script>
