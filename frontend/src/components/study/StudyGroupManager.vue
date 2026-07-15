<template>
  <div class="study-groups-manager">
    <div class="manager-header">
      <h1 class="manager-title">Study Groups</h1>
      <button class="create-group-btn" @click="showCreateModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Create Group
      </button>
    </div>

    <div class="groups-container">
      <!-- Create Group Modal -->
      <Teleport to="body" v-if="showCreateModal">
        <div class="modal-overlay" @click.self="showCreateModal = false">
          <div class="modal card card-hover">
            <div class="modal-header">
              <h2 class="modal-title">Create Study Group</h2>
              <button class="close-btn" @click="showCreateModal = false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Group Name</label>
                <input v-model="newGroup.name" class="form-input" placeholder="e.g., Data Science Study Group" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea v-model="newGroup.description" class="form-input" rows="3" placeholder="What is this group about?"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Course (optional)</label>
                <select v-model="newGroup.courseId" class="form-input">
                  <option value="">Select a course...</option>
                  <option v-for="course in courses" :key="course.id" :value="course.id">
                    {{ course.title }}
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="showCreateModal = false">Cancel</button>
              <button class="btn-primary" @click="createGroup" :disabled="!newGroup.name">Create Group</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Groups List -->
      <div class="groups-grid">
        <div v-for="group in groups" :key="group.id" class="group-card card card-hover">
          <div class="group-header">
            <div class="group-info">
              <h3 class="group-name">{{ group.name }}</h3>
              <p class="group-course">{{ getCourseTitle(group.courseId) }}</p>
            </div>
            <div class="group-actions">
              <button class="action-icon" @click="leaveGroup(group.id)" title="Leave group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 21v-4a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v4M9 11h6m3-3h4"/></svg>
              </button>
            </div>
          </div>
          <p class="group-desc">{{ group.description }}</p>
          <div class="group-stats">
            <span class="stat">{{ group.memberCount }} members</span>
            <span class="stat">{{ getGroupMaterialCount(group.id) }} materials shared</span>
          </div>
          <button class="view-btn" @click="viewGroup(group.id)">View Group</button>
        </div>

        <!-- Create New Group Prompt -->
        <div v-if="!groups.length" class="empty-state-card card card-hover">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-tertiary); margin-bottom: 16px">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3 class="empty-title">No study groups yet</h3>
          <p class="empty-desc">Create your first study group to collaborate with classmates</p>
          <button class="empty-btn" @click="showCreateModal = true">Create Your First Group</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../lib/api'

const router = useRouter()
const groups = ref([])
const courses = ref([])
const showCreateModal = ref(false)
const loading = ref(false)
const error = ref('')
const newGroup = ref({ name: '', description: '', courseId: '' })

const groupMaterials = new Map()

async function loadGroups() {
  try {
    loading.value = true
    const response = await api.get('/api/study-groups/my-groups')
    const { data, success } = response
    if (success || Array.isArray(data || response)) {
      groups.value = data || response || []
      // Load material counts for each group
      for (const group of groups.value) {
        await loadGroupMaterials(group.id)
      }
    }
  } catch (err) {
    console.error('Failed to load groups:', err)
    error.value = 'Could not load your study groups'
  } finally {
    loading.value = false
  }
}

async function loadGroupMaterials(groupId) {
  try {
    const response = await api.get(`/api/study-groups/${groupId}/materials`)
    const { data, success } = response
    const materials = data || response
    if (Array.isArray(materials)) {
      groupMaterials.set(groupId, materials.length)
    }
  } catch (err) {
    console.log(`Could not load materials for group ${groupId}`)
  }
}

async function loadCourses() {
  try {
    const { data } = await api.get('/api/courses')
    courses.value = data || []
  } catch (err) {
    console.error('Failed to load courses:', err)
  }
}

function getCourseTitle(courseId) {
  if (!courseId) return 'General'
  const course = courses.value.find(c => c.id === courseId)
  return course?.title || 'Course'
}

function getGroupMaterialCount(groupId) {
  return groupMaterials.get(groupId) || 0
}

async function createGroup() {
  if (!newGroup.value.name.trim()) {
    alert('Please enter a group name')
    return
  }

  try {
    loading.value = true
    const response = await api.post('/api/study-groups', {
      name: newGroup.value.name,
      description: newGroup.value.description,
      courseId: newGroup.value.courseId || null
    })
    
    const { data, success } = response
    const groupData = data || response
    
    if (groupData && groupData.id) {
      groups.value.unshift(groupData)
      showCreateModal.value = false
      newGroup.value = { name: '', description: '', courseId: '' }
      alert(`✓ Study group "${groupData.name}" created! Start inviting your classmates.`)
    }
  } catch (err) {
    console.error('Failed to create group:', err)
    alert(`Failed to create study group: ${err.message}`)
  } finally {
    loading.value = false
  }
}

async function leaveGroup(groupId) {
  if (!confirm('Are you sure you want to leave this study group?')) return
  
  try {
    await api.delete(`/api/study-groups/${groupId}/leave`)
    groups.value = groups.value.filter(g => g.id !== groupId)
    groupMaterials.delete(groupId)
  } catch (err) {
    console.error('Failed to leave group:', err)
    alert(`Failed to leave group: ${err.message}`)
  }
}

function viewGroup(groupId) {
  router.push({ name: 'study-group-detail', params: { groupId } })
}

function openCreateGroupModal() { showCreateModal.value = true }

onMounted(async () => {
  await Promise.all([loadGroups(), loadCourses()])
  window.addEventListener('show-create-group-modal', openCreateGroupModal)
})

onUnmounted(() => {
  window.removeEventListener('show-create-group-modal', openCreateGroupModal)
})
</script>

<style scoped>
.study-groups-manager {
  padding: 20px;
  min-height: 100vh;
}

.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.manager-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.create-group-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-group-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.groups-container {
  max-width: 1200px;
  margin: 0 auto;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.group-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.group-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--color-border-accent);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.group-course {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.group-actions {
  display: flex;
  gap: 4px;
}

.action-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-icon:hover {
  background: var(--color-error-soft);
  color: var(--color-error);
  border-color: var(--color-error);
}

.group-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.group-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.stat {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.view-btn {
  width: 100%;
  padding: 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.empty-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  grid-column: 1 / -1;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-tertiary);
  margin-bottom: 20px;
}

.empty-btn {
  padding: 10px 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-btn:hover {
  opacity: 0.9;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-border-accent);
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}

.btn-secondary,
.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }
}
</style>
