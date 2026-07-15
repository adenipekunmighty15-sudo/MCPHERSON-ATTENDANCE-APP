<template>
  <div class="study-group-detail-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Groups
      </button>
      <div></div>
    </div>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading study group...</p>
    </div>

    <div v-else-if="group" class="group-content">
      <!-- Group Header -->
      <div class="group-header card card-hover">
        <div class="header-content">
          <h1 class="group-name">{{ group.name }}</h1>
          <p class="group-desc">{{ group.description }}</p>
        </div>
        <div class="header-actions">
          <button v-if="!isCreator" class="leave-btn" @click="confirmLeave">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21v-4a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v4M9 11h6m3-3h4"/>
            </svg>
            Leave Group
          </button>
        </div>
      </div>

      <!-- Group Stats -->
      <div class="stats-grid">
        <div class="stat-card card card-hover">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <p class="stat-label">Members</p>
            <p class="stat-value">{{ group.memberCount || 0 }}</p>
          </div>
        </div>
        <div class="stat-card card card-hover">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <p class="stat-label">Shared Materials</p>
            <p class="stat-value">{{ materials.length }}</p>
          </div>
        </div>
      </div>

      <!-- Shared Materials -->
      <div class="materials-section">
        <div class="section-header">
          <h2 class="section-title">Shared Study Materials</h2>
          <button v-if="isCreator" class="add-btn" @click="showShareModal = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Share Material
          </button>
        </div>

        <div v-if="!materials.length" class="empty-state">
          <p>No materials shared yet</p>
          <button v-if="isCreator" class="empty-action-btn" @click="showShareModal = true">Share Your First Material</button>
        </div>

        <div v-else class="materials-grid">
          <div v-for="material in materials" :key="material.id" class="material-card card card-hover">
            <div class="card-header">
              <h3 class="material-title">{{ material.title }}</h3>
              <span class="shared-by">by {{ material.creator_name }}</span>
            </div>
            <p class="material-summary">{{ material.summary?.substring(0, 100) }}...</p>
            <div class="material-stats">
              <span>{{ material.flashcard_count }} flashcards</span>
              <span>Shared {{ formatDate(material.shared_at) }}</span>
            </div>
            <button class="study-btn" @click="studyMaterial(material.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21"/>
              </svg>
              Study
            </button>
          </div>
        </div>
      </div>

      <!-- Share Modal -->
      <Teleport to="body" v-if="showShareModal">
        <div class="modal-overlay" @click.self="showShareModal = false">
          <div class="modal card card-hover">
            <div class="modal-header">
              <h2 class="modal-title">Share Material with Group</h2>
              <button class="close-btn" @click="showShareModal = false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Select Material to Share</label>
                <select v-model="selectedMaterialId" class="form-input">
                  <option value="">Choose a material...</option>
                  <option v-for="m in sharableMaterials" :key="m.id" :value="m.id">
                    {{ m.title }}
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="showShareModal = false">Cancel</button>
              <button class="btn-primary" @click="shareMaterial" :disabled="!selectedMaterialId">Share Material</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../lib/api'

const router = useRouter()
const route = useRoute()
const groupId = route.params.groupId

const authStore = useAuthStore()

const group = ref(null)
const materials = ref([])
const sharableMaterials = ref([])
const loading = ref(false)
const error = ref('')
const showShareModal = ref(false)
const selectedMaterialId = ref('')

const isCreator = computed(() => {
  if (!group.value) return false
  return group.value.creator_id === authStore.user?.id
})

async function loadGroupDetails() {
  loading.value = true
  error.value = ''
  try {
    // This would load from an endpoint that doesn't exist yet
    // For now, we'll get materials
    const response = await api.get(`/study-groups/${groupId}/materials`)
    const { data } = response
    materials.value = data || response || []
  } catch (err) {
    console.error('Failed to load group details:', err)
    error.value = 'Failed to load group details'
  } finally {
    loading.value = false
  }
}

async function loadSharableMaterials() {
  try {
    const { data } = await api.get('/study-materials')
    sharableMaterials.value = data || []
  } catch (err) {
    console.error('Failed to load materials:', err)
  }
}

async function shareMaterial() {
  try {
    await api.post(`/study-groups/${groupId}/share/${selectedMaterialId.value}`)
    showShareModal.value = false
    selectedMaterialId.value = ''
    await loadGroupDetails()
  } catch (err) {
    console.error('Failed to share material:', err)
    alert('Failed to share material')
  }
}

function studyMaterial(materialId) {
  router.push({ name: 'flashcard-review', params: { materialId } })
}

function formatDate(date) {
  if (!date) return 'recently'
  return new Date(date).toLocaleDateString()
}

function confirmLeave() {
  if (confirm('Are you sure you want to leave this group?')) {
    leaveGroup()
  }
}

async function leaveGroup() {
  try {
    await api.delete(`/study-groups/${groupId}/leave`)
    router.push({ name: 'StudyGroups' })
  } catch (err) {
    console.error('Failed to leave group:', err)
    alert('Failed to leave group')
  }
}

function goBack() {
  router.back()
}

onMounted(async () => {
  group.value = {
    id: groupId,
    name: 'Study Group',
    description: 'Collaborate and study together',
    memberCount: 0,
    creator_id: authStore.user?.id || null,
  }
  await Promise.all([loadGroupDetails(), loadSharableMaterials()])
})
</script>

<style scoped>
.study-group-detail-page {
  padding: 20px;
  min-height: 100vh;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.error-banner {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #EF4444;
  margin-bottom: 20px;
  font-size: 13px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.group-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-header {
  padding: 24px;
  border-radius: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.header-content {
  flex: 1;
}

.group-name {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.group-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.leave-btn {
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.leave-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 32px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.materials-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.add-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.empty-state {
  padding: 40px;
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  color: var(--color-text-tertiary);
}

.empty-action-btn {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
}

.empty-action-btn:hover {
  opacity: 0.9;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.material-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.material-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.card-header {
  margin-bottom: 12px;
}

.material-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.shared-by {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.material-summary {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  line-height: 1.4;
}

.material-stats {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;
}

.study-btn {
  padding: 8px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.study-btn:hover {
  opacity: 0.9;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 90%;
  max-width: 500px;
  padding: 24px;
  border-radius: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.modal-body {
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 8px 16px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--color-background);
}

.btn-primary {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
