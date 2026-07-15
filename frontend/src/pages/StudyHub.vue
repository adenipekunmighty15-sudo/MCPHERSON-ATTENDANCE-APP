<template>
  <div class="study-hub">
    <div class="study-bg">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>
    </div>

    <div class="study-content">
      <div class="study-header">
        <div class="header-left">
          <h1 class="study-title">Study Hub</h1>
          <p class="study-subtitle">Your personal learning command center</p>
        </div>
        <button class="create-btn" @click="showCreateModal = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          <span>New Note</span>
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-card" v-for="s in stats" :key="s.label">
          <div class="stat-icon" :style="{ background: s.color + '15', color: s.color }">
            <span v-html="s.icon"></span>
          </div>
          <div class="stat-info">
            <span class="stat-value" :style="{ color: s.color }">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <div class="study-layout">
        <aside class="folder-sidebar card card-hover">
          <div class="sidebar-section" style="margin-bottom: 20px;">
            <div class="sidebar-section-header">
              <span class="sidebar-section-title">TurboLearn AI</span>
            </div>
            <router-link to="/study-dashboard" class="folder-item">
              <span class="folder-dot" style="background: var(--color-primary)"></span>
              <span class="folder-name">Study Dashboard</span>
            </router-link>
            <router-link to="/study-groups" class="folder-item">
              <span class="folder-dot" style="background: #3B82F6"></span>
              <span class="folder-name">Study Groups</span>
            </router-link>
            <router-link to="/study-plan" class="folder-item">
              <span class="folder-dot" style="background: #818CF8"></span>
              <span class="folder-name">Spaced Repetition Plan</span>
            </router-link>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-header">
              <span class="sidebar-section-title">Folders</span>
              <button class="icon-btn" @click="showNewFolderInput = !showNewFolderInput" title="New Folder">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>

            <div v-if="showNewFolderInput" class="new-folder-row">
              <input v-model="newFolderName" class="new-folder-input" placeholder="Folder name..." @keydown.enter="createFolder" />
              <button class="icon-btn" @click="createFolder" :disabled="!newFolderName.trim()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>
              </button>
            </div>

            <button class="folder-item" :class="{ active: !selectedFolder }" @click="selectedFolder = null">
              <span class="folder-dot" style="background: var(--color-primary)"></span>
              <span class="folder-name">All Notes</span>
              <span class="folder-count">{{ materials.length }}</span>
            </button>

            <button class="folder-item" :class="{ active: selectedFolder === '__uncategorized__' }" @click="selectedFolder = '__uncategorized__'">
              <span class="folder-dot" style="background: #888"></span>
              <span class="folder-name">Uncategorized</span>
              <span class="folder-count">{{ materials.filter(m => !m.folderId).length }}</span>
            </button>

            <button v-for="f in folders" :key="f.id" class="folder-item"
              :class="{ active: selectedFolder === f.id }" @click="selectedFolder = f.id">
              <span class="folder-dot" :style="{ background: f.color }"></span>
              <span class="folder-name">{{ f.name }}</span>
              <span class="folder-count">{{ materials.filter(m => m.folderId === f.id).length }}</span>
            </button>
          </div>
        </aside>

        <div class="notes-area">
          <div class="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model="searchQuery" placeholder="Search notes..." class="search-input" />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div v-if="loading" class="notes-grid">
            <div v-for="n in 6" :key="'skel-'+n" class="note-card-skeleton">
              <div class="skeleton-bar" style="width:60%;height:14px"></div>
              <div class="skeleton-bar" style="width:80%;height:10px;margin-top:8px"></div>
              <div class="skeleton-bar" style="width:40%;height:10px;margin-top:6px"></div>
            </div>
          </div>

          <div v-else-if="filteredMaterials.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-tertiary)">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <h3 class="empty-title">{{ searchQuery ? 'No results found' : 'No study notes yet' }}</h3>
            <p class="empty-desc">{{ searchQuery ? 'Try a different search term' : 'Create your first note from a lecture, PDF, or YouTube video' }}</p>
            <button v-if="!searchQuery" class="create-btn" @click="showCreateModal = true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Create Note
            </button>
          </div>

          <div v-else class="notes-grid">
            <div v-for="m in filteredMaterials" :key="m.id" class="note-card card card-hover" @click="openNote(m.id)">
              <div class="note-card-header">
                <span class="note-source-badge" :class="'source-' + getSourceType(m)">
                  {{ getSourceLabel(m) }}
                </span>
                <button class="note-menu-btn" @click.stop="toggleNoteMenu(m.id, $event)" title="Options">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>
              </div>
              <h3 class="note-title">{{ m.title }}</h3>
              <p class="note-excerpt">{{ getExcerpt(m) }}</p>
              <div class="note-footer">
                <span class="note-date">{{ formatDate(m.createdAt) }}</span>
                <div class="note-badges">
                  <span v-if="m.flashcardCount" class="note-badge fc">{{ m.flashcardCount }} cards</span>
                  <span v-if="getQuizCount(m)" class="note-badge qz">{{ getQuizCount(m) }} Q</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CreateNoteModal v-if="showCreateModal" @close="showCreateModal = false" @created="onNoteCreated" />
    <NoteViewer v-if="viewingNoteId" :noteId="viewingNoteId" @close="viewingNoteId = null" />

    <Teleport to="body">
      <div v-if="contextMenu.show" class="ctx-menu card card-hover"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
        <button class="ctx-item" @click="moveToFolder(contextMenu.noteId)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Move to Folder
        </button>
        <button class="ctx-item ctx-danger" @click="deleteNote(contextMenu.noteId)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../lib/api'
import CreateNoteModal from '../components/study/CreateNoteModal.vue'
import NoteViewer from '../components/study/NoteViewer.vue'

const loading = ref(true)
const materials = ref([])
const folders = ref([])
const selectedFolder = ref(null)
const searchQuery = ref('')
const showCreateModal = ref(false)
const viewingNoteId = ref(null)
const showNewFolderInput = ref(false)
const newFolderName = ref('')
const contextMenu = ref({ show: false, x: 0, y: 0, noteId: null })

const stats = computed(() => [
  { label: 'Total Notes', value: materials.value.length, color: 'var(--color-primary)', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { label: 'Folders', value: folders.value.length, color: '#3B82F6', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' },
  { label: 'Flashcards', value: materials.value.reduce((a, m) => a + (m.flashcardCount || 0), 0), color: '#60A5FA', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/></svg>' },
  { label: 'Quizzes', value: materials.value.reduce((a, m) => a + getQuizCount(m), 0), color: '#818CF8', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>' },
])

const filteredMaterials = computed(() => {
  let list = materials.value
  if (selectedFolder.value === '__uncategorized__') {
    list = list.filter(m => !m.folderId)
  } else if (selectedFolder.value) {
    list = list.filter(m => m.folderId === selectedFolder.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m => m.title?.toLowerCase().includes(q) || (m.summary || '').toLowerCase().includes(q))
  }
  return list
})

function getQuizCount(m) {
  const q = m.quiz
  if (Array.isArray(q)) return q.length
  if (typeof q === 'string') { try { return JSON.parse(q).length } catch { return 0 } }
  return 0
}

function getSourceType(m) {
  const src = m.sourceText || ''
  if (src.includes('youtube.com') || src.includes('youtu.be')) return 'youtube'
  if (src.length > 500) return 'document'
  return 'text'
}

function getSourceLabel(m) {
  return { youtube: 'YouTube', document: 'PDF/Doc', text: 'Note' }[getSourceType(m)] || 'Note'
}

function getExcerpt(m) {
  const text = m.summary || m.sourceText || ''
  return text.replace(/[#[\]*_`>]/g, '').slice(0, 120) + (text.length > 120 ? '...' : '')
}

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  const diff = Date.now() - date.getTime()
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function openNote(id) { viewingNoteId.value = id }

function toggleNoteMenu(id, e) {
  contextMenu.value = { show: true, x: Math.min(e.clientX, window.innerWidth - 180), y: Math.min(e.clientY, window.innerHeight - 100), noteId: id }
}

function closeContextMenu() { contextMenu.value.show = false }

async function moveToFolder(noteId) {
  closeContextMenu()
  const choice = window.prompt('Move to folder:\n' + folders.value.map((f, i) => `${i + 1}. ${f.name}`).join('\n') + '\n\nEnter number (or empty for uncategorized):')
  if (choice === null) return
  const idx = parseInt(choice) - 1
  const folderId = idx >= 0 && idx < folders.value.length ? folders.value[idx].id : null
  try {
    await api.put(`/study-materials/${noteId}/folder`, { folderId })
    const m = materials.value.find(x => x.id === noteId)
    if (m) m.folderId = folderId
  } catch {}
}

async function deleteNote(noteId) {
  closeContextMenu()
  if (!confirm('Delete this note? This cannot be undone.')) return
  try {
    await api.delete(`/study-materials/${noteId}`)
    materials.value = materials.value.filter(m => m.id !== noteId)
  } catch {}
}

async function createFolder() {
  if (!newFolderName.value.trim()) return
  try {
    const { data } = await api.post('/study-folders', { name: newFolderName.value.trim(), color: '#6366f1' })
    folders.value.push(data)
    newFolderName.value = ''
    showNewFolderInput.value = false
  } catch {}
}

function onNoteCreated(note) {
  showCreateModal.value = false
  materials.value.unshift(note)
  viewingNoteId.value = note.id
}

async function loadData() {
  loading.value = true
  try {
    const [matRes, folderRes] = await Promise.allSettled([
      api.get('/study-materials'),
      api.get('/study-folders'),
    ])
    if (matRes.status === 'fulfilled') materials.value = matRes.value.data || []
    if (folderRes.status === 'fulfilled') folders.value = folderRes.value.data || []
  } catch (e) { console.error('Failed to load study data:', e) }
  loading.value = false
}

function openCreateModal() { showCreateModal.value = true }

onMounted(() => {
  loadData()
  document.addEventListener('click', closeContextMenu)
  window.addEventListener('show-create-note-modal', openCreateModal)
})
onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
  window.removeEventListener('show-create-note-modal', openCreateModal)
})
</script>

<style scoped>
.study-hub { position: relative; min-height: 100vh; }
.study-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.study-bg .bg-orb { position: absolute; border-radius: 50%; filter: blur(120px); }
.orb-1 { top: -10%; left: -5%; width: 30%; height: 30%; background: rgba(59,130,246,0.08); }
.orb-2 { top: 40%; right: -8%; width: 25%; height: 25%; background: rgba(99,102,241,0.06); }
.orb-3 { bottom: -5%; left: 30%; width: 20%; height: 20%; background: rgba(96,165,250,0.05); }
.study-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }

.study-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.study-title { font-size: 24px; font-weight: 800; color: var(--color-text-primary); letter-spacing: -0.02em; }
.study-subtitle { font-size: 13px; color: var(--color-text-tertiary); margin-top: 2px; }
.create-btn {
  display: flex; align-items: center; gap: 8px; padding: 10px 18px;
  background: var(--color-primary); color: #fff; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
}
.create-btn:hover { opacity: 0.9; transform: translateY(-1px); }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px;
  transition: all 0.2s ease;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-value { font-size: 18px; font-weight: 800; line-height: 1.1; }
.stat-label { font-size: 11px; color: var(--color-text-tertiary); }
.stat-info { display: flex; flex-direction: column; }

.study-layout { display: flex; gap: 20px; }
.folder-sidebar {
  width: 220px; flex-shrink: 0; padding: 16px; border-radius: 14px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  height: fit-content; position: sticky; top: 80px;
}
.sidebar-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.sidebar-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--color-text-tertiary); }
.icon-btn {
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--color-border); border-radius: 6px;
  color: var(--color-text-tertiary); cursor: pointer; transition: all 0.15s ease;
}
.icon-btn:hover { background: var(--color-primary-soft); color: var(--color-primary); border-color: var(--color-border-accent); }

.new-folder-row { display: flex; gap: 6px; margin-bottom: 8px; }
.new-folder-input {
  flex: 1; padding: 6px 10px; background: var(--color-surface-elevated);
  border: 1px solid var(--color-border); border-radius: 6px;
  font-size: 12px; color: var(--color-text-primary); outline: none;
}
.new-folder-input:focus { border-color: var(--color-border-accent); }

.folder-item {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px;
  background: none; border: none; border-radius: 8px; cursor: pointer;
  transition: all 0.15s ease; text-align: left;
}
.folder-item:hover { background: var(--color-primary-soft); }
.folder-item.active { background: var(--color-primary-muted); }
.folder-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.folder-name { flex: 1; font-size: 12px; font-weight: 500; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.folder-count { font-size: 10px; font-weight: 600; color: var(--color-text-tertiary); background: var(--color-surface-elevated); padding: 1px 6px; border-radius: 4px; }

.notes-area { flex: 1; min-width: 0; }
.search-bar {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 10px; margin-bottom: 16px; transition: border-color 0.2s;
}
.search-bar:focus-within { border-color: var(--color-border-accent); }
.search-input { flex: 1; background: none; border: none; outline: none; font-size: 13px; color: var(--color-text-primary); }
.search-input::placeholder { color: var(--color-text-tertiary); }
.search-clear { background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; display: flex; padding: 2px; }

.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.note-card {
  padding: 16px; border-radius: 14px; background: var(--color-surface);
  border: 1px solid var(--color-border); cursor: pointer; transition: all 0.2s ease;
}
.note-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: var(--color-border-accent); }
.note-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.note-source-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 6px; }
.source-youtube { background: rgba(255,0,0,0.1); color: #FF0000; }
.source-document { background: rgba(139,92,246,0.12); color: #8B5CF6; }
.source-text { background: var(--color-primary-soft); color: var(--color-primary); }
.note-menu-btn {
  background: none; border: none; color: var(--color-text-tertiary); cursor: pointer;
  padding: 4px; border-radius: 4px; opacity: 0; transition: all 0.15s;
}
.note-card:hover .note-menu-btn { opacity: 1; }
.note-menu-btn:hover { background: var(--color-primary-soft); }
.note-title {
  font-size: 14px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.note-excerpt {
  font-size: 12px; color: var(--color-text-tertiary); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden; margin-bottom: 12px;
}
.note-footer { display: flex; align-items: center; justify-content: space-between; }
.note-date { font-size: 10px; color: var(--color-text-tertiary); }
.note-badges { display: flex; gap: 6px; }
.note-badge { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
.note-badge.fc { background: rgba(96,165,250,0.1); color: #60A5FA; }
.note-badge.qz { background: rgba(129,140,248,0.1); color: #818CF8; }

.note-card-skeleton { padding: 16px; border-radius: 14px; background: var(--color-surface); border: 1px solid var(--color-border); }
.skeleton-bar {
  border-radius: 6px;
  background: linear-gradient(90deg, var(--color-surface-elevated) 25%, var(--color-border) 50%, var(--color-surface-elevated) 75%);
  background-size: 200% 100%; animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
.empty-icon { margin-bottom: 16px; opacity: 0.4; }
.empty-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; }
.empty-desc { font-size: 13px; color: var(--color-text-tertiary); margin-bottom: 20px; max-width: 300px; }

.ctx-menu {
  position: fixed; z-index: 9999; padding: 6px; border-radius: 10px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12); min-width: 160px;
}
.ctx-item {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px;
  background: none; border: none; border-radius: 6px; font-size: 12px; font-weight: 500;
  color: var(--color-text-secondary); cursor: pointer; transition: background 0.15s;
}
.ctx-item:hover { background: var(--color-primary-soft); }
.ctx-danger { color: var(--color-error); }
.ctx-danger:hover { background: var(--color-error-soft); }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .study-layout { flex-direction: column; }
  .folder-sidebar { width: 100%; position: static; }
  .notes-grid { grid-template-columns: 1fr; }
}
</style>

