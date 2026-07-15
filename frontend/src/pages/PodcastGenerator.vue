<template>
  <div class="podcast-generator-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <h1 class="page-title">Podcast Generator</h1>
      <div></div>
    </div>

    <div class="generator-container">
      <div class="generator-card card card-hover">
        <div class="card-header">
          <h2 class="card-title">Convert Your Study Notes to Audio</h2>
          <p class="card-subtitle">Listen to your study materials while commuting or exercising</p>
        </div>

        <div class="card-content">
          <div class="form-group">
            <label class="form-label">Select Study Material</label>
            <select v-model="selectedMaterialId" class="form-input" @change="onMaterialSelected">
              <option value="">Choose a study material...</option>
              <option v-for="material in materials" :key="material.id" :value="material.id">
                {{ material.title }}
              </option>
            </select>
          </div>

          <div v-if="selectedMaterial" class="material-preview">
            <div class="preview-header">
              <h3>{{ selectedMaterial.title }}</h3>
              <span class="preview-size">{{ formatBytes(selectedMaterial.summary?.length || 0) }}</span>
            </div>
            <p class="preview-text">{{ selectedMaterial.summary?.substring(0, 300) }}...</p>
          </div>

          <div class="options-group">
            <label class="form-label">Podcast Options</label>
            <div class="options-grid">
              <div class="option-item">
                <input type="checkbox" v-model="options.conversational" id="conversational" />
                <label for="conversational">Conversational Tone</label>
                <p class="option-desc">Makes the podcast more engaging and less monotone</p>
              </div>
              <div class="option-item">
                <input type="checkbox" v-model="options.addQuestions" id="addQuestions" />
                <label for="addQuestions">Add Quiz Questions</label>
                <p class="option-desc">Includes practice questions throughout</p>
              </div>
            </div>
          </div>

          <button 
            class="generate-btn" 
            @click="generatePodcast" 
            :disabled="!selectedMaterialId || generating"
          >
            <svg v-if="!generating" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="13" r="8"/><path d="M12 9v8M9 12h6M8 19h8"/>
            </svg>
            <div v-else class="spinner-small"></div>
            {{ generating ? 'Generating...' : 'Generate Podcast' }}
          </button>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-if="generatedPodcast" class="success-section">
            <h3>✓ Podcast Generated Successfully!</h3>
            <div class="podcast-info">
              <p><strong>Title:</strong> {{ generatedPodcast.title }}</p>
              <p><strong>Duration:</strong> {{ Math.round((generatedPodcast.script?.length || 0) / 100) }} min</p>
              <p><strong>Status:</strong> <span class="status-badge">{{ generatedPodcast.status }}</span></p>
            </div>
            <div class="action-buttons">
              <button class="btn-primary" @click="downloadPodcast">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download
              </button>
              <button class="btn-secondary" @click="sharePodcast">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <path d="M8.59 13.51a3 3 0 1 0 3.82 4.62M15.41 6.51a3 3 0 1 0-3.82-4.62"/>
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tips Section -->
      <div class="tips-card card card-hover">
        <h3 class="tips-title">💡 Tips for Better Podcasts</h3>
        <ul class="tips-list">
          <li>Use well-structured study materials with clear summaries</li>
          <li>Shorter materials (< 5000 words) generate faster podcasts</li>
          <li>Enable conversational tone for more engaging listening</li>
          <li>Listen at 1.5x speed to review faster</li>
          <li>Combine with flashcard reviews for better retention</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../lib/api'

const router = useRouter()
const materials = ref([])
const selectedMaterialId = ref('')
const selectedMaterial = ref(null)
const generating = ref(false)
const error = ref('')
const generatedPodcast = ref(null)
const options = ref({
  conversational: true,
  addQuestions: false
})

function formatBytes(bytes) {
  if (!bytes || bytes < 1) return '0 B'
  const units = ['B', 'KB', 'MB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

async function loadMaterials() {
  try {
    const response = await api.get('/study-materials')
    const { data } = response
    materials.value = data || response || []
  } catch (err) {
    console.error('Failed to load materials:', err)
  }
}

function onMaterialSelected() {
  selectedMaterial.value = materials.value.find(m => m.id === selectedMaterialId.value)
}

async function generatePodcast() {
  if (!selectedMaterialId.value) return

  generating.value = true
  error.value = ''
  
  try {
    const response = await api.post(`/study-materials/${selectedMaterialId.value}/podcast`, options.value)
    const { data, success } = response
    if (success || data) {
      generatedPodcast.value = data || response
    }
  } catch (err) {
    console.error('Failed to generate podcast:', err)
    error.value = err.message || 'Failed to generate podcast. Please try again.'
  } finally {
    generating.value = false
  }
}

function downloadPodcast() {
  alert('Podcast download feature coming soon!')
}

function sharePodcast() {
  alert('Podcast sharing feature coming soon!')
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadMaterials()
})
</script>

<style scoped>
.podcast-generator-page {
  padding: 20px;
  min-height: 100vh;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
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

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.generator-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.generator-card {
  padding: 24px;
  border-radius: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.card-header {
  margin-bottom: 24px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.card-subtitle {
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.material-preview {
  padding: 16px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preview-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.preview-size {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.preview-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
}

.option-item input {
  margin-top: 3px;
  cursor: pointer;
}

.option-item label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
}

.option-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 4px 0 0 0;
}

.generate-btn {
  padding: 12px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.generate-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #EF4444;
  font-size: 13px;
}

.success-section {
  padding: 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  color: #22C55E;
}

.podcast-info {
  font-size: 13px;
  margin: 12px 0;
}

.status-badge {
  padding: 2px 8px;
  background: rgba(34, 197, 94, 0.2);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn-primary, .btn-secondary {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #22C55E;
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: rgba(34, 197, 94, 0.2);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.btn-secondary:hover {
  background: rgba(34, 197, 94, 0.3);
}

.tips-card {
  padding: 20px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.tips-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tips-list li {
  font-size: 13px;
  color: var(--color-text-secondary);
  padding-left: 20px;
  position: relative;
}

.tips-list li:before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-weight: 600;
}
</style>
