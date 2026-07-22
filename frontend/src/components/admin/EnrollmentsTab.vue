<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Enrollments</h3>
      <div class="flex items-center gap-3">
        <input v-model="courseFilter" placeholder="Course ID..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-36" />
        <input v-model="semesterFilter" placeholder="Semester ID..." class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] w-36" />
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
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Student</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Email</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Admission #</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Course</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Semester</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Status</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Grade</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">GP</th>
              <th class="p-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]/50">
            <tr v-for="item in items" :key="item.id" class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors">
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-medium">{{ item.user_name || item.user_id }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.user_email || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-mono text-xs">{{ item.admission_number || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.course_name || item.course_id }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.semester_id }}</td>
              <td class="p-3">
                <span :class="enrollmentStatusClass(item.status)" class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">{{ item.status || 'active' }}</span>
              </td>
              <td class="p-3 text-sm text-[var(--color-text-primary)] font-mono">{{ item.grade || '-' }}</td>
              <td class="p-3 text-sm text-[var(--color-text-primary)]">{{ item.grade_point ?? '-' }}</td>
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <button @click="openGradeEdit(item)" class="text-[var(--color-primary)] hover:text-purple-300 text-xs font-semibold bg-purple-500/10 px-2 py-1 rounded-lg">Grade</button>
                  <button @click="openEdit(item)" class="text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] text-xs font-semibold bg-[var(--color-primary-soft)] px-2 py-1 rounded-lg">Edit</button>
                  <button v-if="authStore.user?.role === 'super_admin'" @click="confirmDelete(item)" class="text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] text-xs font-semibold bg-red-500/10 px-2 py-1 rounded-lg">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="9" class="p-6 text-center text-[var(--color-text-tertiary)] text-sm">No enrollments found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal && !showGradeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-[var(--color-text-primary)]">{{ editingId ? 'Edit Enrollment' : 'Create Enrollment' }}</h3>
          <button @click="closeModal" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="save" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">User ID *</label>
            <input v-model="form.user_id" required class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
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
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Academic Year ID</label>
            <input v-model="form.academic_year_id" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-primary)] rounded-lg transition-colors">{{ editingId ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Grade Modal -->
    <div v-if="showGradeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80">
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-[var(--color-text-primary)]">Update Grade</h3>
          <button @click="closeGradeModal" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="saveGrade" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Grade</label>
            <input v-model="gradeForm.grade" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Grade Point</label>
            <input v-model="gradeForm.grade_point" type="number" step="0.01" min="0" max="5" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1">Status</label>
            <select v-model="gradeForm.status" class="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="closeGradeModal" class="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-primary)] rounded-lg transition-colors">Save</button>
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
const showGradeModal = ref(false)
const editingId = ref(null)
const gradeEditingId = ref(null)
const courseFilter = ref('')
const semesterFilter = ref('')
const form = ref({ user_id: '', course_id: '', semester_id: '', academic_year_id: '' })
const gradeForm = ref({ grade: '', grade_point: '', status: 'active' })

function enrollmentStatusClass(status) {
  if (status === 'completed') return 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]'
  if (status === 'dropped') return 'bg-[var(--color-error-soft)] text-[var(--color-text-primary)]'
  if (status === 'incomplete') return 'bg-[var(--color-gold-soft)] text-[var(--color-text-primary)]'
  return 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]'
}

async function fetchItems() {
  loading.value = true
  try {
    const params = {}
    if (courseFilter.value) params.course_id = courseFilter.value
    if (semesterFilter.value) params.semester_id = semesterFilter.value
    const { data } = await api.get('/admin/enrollments', { params })
    items.value = data
  } catch (e) { alert('Error loading enrollments: ' + (e.response?.data?.message || e.message)) }
  finally { loading.value = false }
}

function openCreate() {
  editingId.value = null
  form.value = { user_id: '', course_id: '', semester_id: '', academic_year_id: '' }
  showModal.value = true
}

function openEdit(item) {
  editingId.value = item.id
  form.value = { user_id: item.user_id || '', course_id: item.course_id || '', semester_id: item.semester_id || '', academic_year_id: item.academic_year_id || '' }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

function openGradeEdit(item) {
  gradeEditingId.value = item.id
  gradeForm.value = { grade: item.grade || '', grade_point: item.grade_point ?? '', status: item.status || 'active' }
  showGradeModal.value = true
}

function closeGradeModal() {
  showGradeModal.value = false
  gradeEditingId.value = null
}

async function save() {
  try {
    const body = { ...form.value }
    if (editingId.value) {
      await api.put(`/admin/enrollments/${editingId.value}`, body)
    } else {
      await api.post('/admin/enrollments', body)
    }
    closeModal()
    await fetchItems()
  } catch (e) { alert('Error saving enrollment: ' + (e.response?.data?.message || e.message)) }
}

async function saveGrade() {
  try {
    const body = { ...gradeForm.value }
    if (body.grade_point !== '') body.grade_point = Number(body.grade_point)
    await api.put(`/admin/enrollments/${gradeEditingId.value}`, body)
    closeGradeModal()
    await fetchItems()
  } catch (e) { alert('Error saving grade: ' + (e.response?.data?.message || e.message)) }
}

function confirmDelete(item) {
  if (!confirm(`Delete enrollment for "${item.user_name || item.user_id}"? This action cannot be undone.`)) return
  deleteItem(item.id)
}

async function deleteItem(id) {
  try {
    await api.delete(`/admin/enrollments/${id}`)
    await fetchItems()
  } catch (e) { alert('Error deleting enrollment: ' + (e.response?.data?.message || e.message)) }
}

watch([courseFilter, semesterFilter], () => { fetchItems() })
onMounted(fetchItems)
</script>
