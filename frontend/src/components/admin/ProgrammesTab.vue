<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Programmes</h3>
      <div class="flex items-center gap-3">
        <input v-model="facultyFilter" placeholder="Filter faculty ID..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-44" />
        <input v-model="deptFilter" placeholder="Filter dept ID..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-44" />
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
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Code</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Department</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Faculty</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Degree</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Duration</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Status</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]/50">
            <tr v-for="item in items" :key="item.id" class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-medium">{{ item.name }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-mono">{{ item.code }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.department_name || item.department_id || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.faculty_name || item.faculty_id || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.degree_type || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.duration_years ? item.duration_years + ' yr(s)' : '-' }}</td>
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
              <td colspan="8" class="p-6 text-center text-[var(--color-text-tertiary)] text-sm">No programmes found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-[var(--color-text-primary)]">{{ editingId ? 'Edit Programme' : 'Create Programme' }}</h3>
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
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Code *</label>
            <input v-model="form.code" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Department ID</label>
            <input v-model="form.department_id" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Faculty ID</label>
            <input v-model="form.faculty_id" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Degree Type</label>
            <select v-model="form.degree_type" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]">
              <option value="">Select...</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
              <option value="Certificate">Certificate</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Duration (years)</label>
            <input v-model="form.duration_years" type="number" min="1" max="10" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Description</label>
            <textarea v-model="form.description" rows="3" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]"></textarea>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="prog-active" class="rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:ring-[#93C5FD]" />
            <label for="prog-active" class="text-sm text-[var(--color-text-primary)]">Active</label>
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
const facultyFilter = ref('')
const deptFilter = ref('')
const form = ref({ name: '', code: '', department_id: '', faculty_id: '', degree_type: '', duration_years: '', description: '', is_active: true })

async function fetchItems() {
  loading.value = true
  try {
    const params = {}
    if (facultyFilter.value) params.faculty_id = facultyFilter.value
    if (deptFilter.value) params.department_id = deptFilter.value
    const { data } = await api.get('/admin/programmes', { params })
    items.value = data
  } catch (e) { alert('Error loading programmes: ' + (e.response?.data?.message || e.message)) }
  finally { loading.value = false }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', code: '', department_id: '', faculty_id: '', degree_type: '', duration_years: '', description: '', is_active: true }
  showModal.value = true
}

function openEdit(item) {
  editingId.value = item.id
  form.value = { name: item.name, code: item.code, department_id: item.department_id || '', faculty_id: item.faculty_id || '', degree_type: item.degree_type || '', duration_years: item.duration_years || '', description: item.description || '', is_active: item.is_active }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function save() {
  try {
    const body = { ...form.value }
    if (body.duration_years) body.duration_years = Number(body.duration_years)
    if (editingId.value) {
      await api.put(`/admin/programmes/${editingId.value}`, body)
    } else {
      await api.post('/admin/programmes', body)
    }
    closeModal()
    await fetchItems()
  } catch (e) { alert('Error saving programme: ' + (e.response?.data?.message || e.message)) }
}

function confirmDelete(item) {
  if (!confirm(`Delete programme "${item.name}"? This action cannot be undone.`)) return
  deleteItem(item.id)
}

async function deleteItem(id) {
  try {
    await api.delete(`/admin/programmes/${id}`)
    await fetchItems()
  } catch (e) { alert('Error deleting programme: ' + (e.response?.data?.message || e.message)) }
}

watch([facultyFilter, deptFilter], () => { fetchItems() })
onMounted(fetchItems)
</script>
