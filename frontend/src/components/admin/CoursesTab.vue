<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Courses</h3>
      <div class="flex items-center gap-3">
        <input v-model="deptFilter" placeholder="Dept code..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-36" />
        <input v-model="levelFilter" placeholder="Level..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-28" />
        <input v-model="facultyFilter" placeholder="Faculty ID..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-36" />
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
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Code</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Title</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Level</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Department</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Faculty</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Units</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Elective</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Status</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]/50">
            <tr v-for="item in items" :key="item.id" class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-mono">{{ item.code }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-medium">{{ item.title }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.level || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.department_code || item.department_id || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.faculty_name || item.faculty_id || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.units || '-' }}</td>
              <td class="p-3">
                <span v-if="item.is_elective" class="bg-[var(--color-gold-soft)] text-[var(--color-text-primary)] px-2 py-0.5 rounded-full text-xs font-semibold">Elective</span>
                <span v-else class="text-[var(--color-text-tertiary)] text-xs">Core</span>
              </td>
              <td class="p-3">
                <span :class="statusClass(item.status)" class="px-2 py-0.5 rounded-full text-xs font-semibold">{{ item.status || 'active' }}</span>
              </td>
              <td class="p-3">
                <button @click="openEdit(item)" class="text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] text-xs font-semibold bg-[var(--color-primary-soft)] px-2 py-1 rounded-lg">Edit</button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="9" class="p-6 text-center text-[var(--color-text-tertiary)] text-sm">No courses found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Edit Course</h3>
          <button @click="closeModal" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="save" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Faculty ID</label>
            <input v-model="form.faculty_id" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Semester ID</label>
            <input v-model="form.semester_id" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Level</label>
            <input v-model="form.level" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.is_elective" type="checkbox" id="course-elective" class="rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:ring-[#93C5FD]" />
            <label for="course-elective" class="text-sm text-[var(--color-text-primary)]">Is Elective</label>
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Status</label>
            <select v-model="form.status" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]">
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
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
import api from '../../lib/api'

const authStore = useAuthStore()

const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const deptFilter = ref('')
const levelFilter = ref('')
const facultyFilter = ref('')
const form = ref({ faculty_id: '', semester_id: '', level: '', is_elective: false, status: 'active' })

function statusClass(status) {
  if (status === 'active') return 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]'
  if (status === 'archived') return 'bg-[var(--color-error-soft)] text-[var(--color-text-primary)]'
  return 'bg-[var(--color-gold-soft)] text-[var(--color-text-primary)]'
}

async function fetchItems() {
  loading.value = true
  try {
    const params = {}
    if (deptFilter.value) params.department = deptFilter.value
    if (levelFilter.value) params.level = levelFilter.value
    if (facultyFilter.value) params.faculty_id = facultyFilter.value
    const { data } = await api.get('/admin/courses', { params })
    items.value = data
  } catch (e) { alert('Error loading courses: ' + (e.response?.data?.message || e.message)) }
  finally { loading.value = false }
}

function openEdit(item) {
  editingId.value = item.id
  form.value = { faculty_id: item.faculty_id || '', semester_id: item.semester_id || '', level: item.level || '', is_elective: item.is_elective || false, status: item.status || 'active' }
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
    await api.put(`/admin/courses/${editingId.value}`, body)
    closeModal()
    await fetchItems()
  } catch (e) { alert('Error saving course: ' + (e.response?.data?.message || e.message)) }
}

watch([deptFilter, levelFilter, facultyFilter], () => { fetchItems() })
onMounted(fetchItems)
</script>
