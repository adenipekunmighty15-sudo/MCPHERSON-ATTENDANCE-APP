<template>
  <PageContent>
    <PageHeader title="Study Hub" subtitle="Your personal learning command center">
      <template #actions>
        <Button @click="showCreateModal = true" variant="primary">
          <Plus class="w-4 h-4 mr-2" />
          New Note
        </Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card v-for="s in stats" :key="s.label" class="flex items-center gap-4 p-4 stats-card">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: s.color + '15', color: s.color }">
          <span v-html="sanitizeHtml(s.icon)"></span>
        </div>
        <div>
          <div class="text-xl font-bold" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="text-xs text-gray-500">{{ s.label }}</div>
        </div>
      </Card>
    </div>

    <div class="flex flex-col md:flex-row gap-6">
      <aside class="w-full md:w-64">
        <Card class="sticky top-20 sticky-card">
            <div class="mb-4">
                <h3 class="text-sm font-semibold mb-2">TurboLearn AI</h3>
                <div class="flex flex-col gap-1">
                    <Button as="router-link" to="/study-dashboard" variant="ghost" class="justify-start">
                        <LayoutDashboard class="w-4 h-4 mr-2" /> Study Dashboard
                    </Button>
                    <Button as="router-link" to="/study-groups" variant="ghost" class="justify-start">
                        <Users class="w-4 h-4 mr-2" /> Study Groups
                    </Button>
                     <Button as="router-link" to="/study-plan" variant="ghost" class="justify-start">
                        <CalendarCheck class="w-4 h-4 mr-2" /> Spaced Repetition
                    </Button>
                </div>
            </div>

            <div>
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-sm font-semibold">Folders</h3>
                    <Button @click="showNewFolderInput = !showNewFolderInput" size="sm" variant="ghost">
                        <Plus class="w-4 h-4" />
                    </Button>
                </div>
                <div v-if="showNewFolderInput" class="flex gap-2 mb-2">
                    <Input v-model="newFolderName" placeholder="Folder name..." @keydown.enter="createFolder" />
                    <Button @click="createFolder" :disabled="!newFolderName.trim()" size="sm">
                        <Check class="w-4 h-4" />
                    </Button>
                </div>

                <div class="flex flex-col gap-1">
                    <Button @click="selectedFolder = null" variant="ghost" class="justify-start" :class="{ 'bg-primary-soft': !selectedFolder }">
                       <span class="w-2 h-2 rounded-full bg-primary mr-2"></span>
                       All Notes
                       <Badge variant="soft" class="ml-auto">{{ materials.length }}</Badge>
                    </Button>
                     <Button @click="selectedFolder = '__uncategorized__'" variant="ghost" class="justify-start" :class="{ 'bg-primary-soft': selectedFolder === '__uncategorized__' }">
                        <span class="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                        Uncategorized
                        <Badge variant="soft" class="ml-auto">{{ materials.filter(m => !m.folderId).length }}</Badge>
                    </Button>
                    <Button v-for="f in folders" :key="f.id" @click="selectedFolder = f.id" variant="ghost" class="justify-start folder-item" :class="{ 'bg-primary-soft': selectedFolder === f.id }">
                        <span class="w-2 h-2 rounded-full mr-2" :style="{ background: f.color }"></span>
                        {{ f.name }}
                        <Badge variant="soft" class="ml-auto">{{ materials.filter(m => m.folderId === f.id).length }}</Badge>
                    </Button>
                </div>
            </div>
        </Card>
      </aside>

      <div class="flex-1">
        <Input v-model="searchQuery" placeholder="Search notes..." class="mb-4">
            <template #prepend>
                <Search class="w-5 h-5 text-gray-400" />
            </template>
        </Input>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader v-for="n in 6" :key="'skel-'+n" class="h-48" />
        </div>

        <EmptyState v-else-if="filteredMaterials.length === 0"
            :title="searchQuery ? 'No results found' : 'No study notes yet'"
            :description="searchQuery ? 'Try a different search term' : 'Create your first note from a lecture, PDF, or YouTube video'">
             <template #actions>
                 <Button v-if="!searchQuery" @click="showCreateModal = true" variant="primary">
                    <Plus class="w-4 h-4 mr-2" />
                    Create Note
                </Button>
             </template>
        </EmptyState>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card v-for="m in filteredMaterials" :key="m.id" @click="openNote(m.id)" class="cursor-pointer note-card" :style="{ borderLeft: '3px solid ' + getNoteColor(m) }">
            <template #header>
                <div class="flex justify-between items-center">
                    <Badge :variant="getSourceType(m) === 'youtube' ? 'danger' : (getSourceType(m) === 'document' ? 'purple' : 'primary')">
                        {{ getSourceLabel(m) }}
                    </Badge>
                     <Button @click.stop="toggleNoteMenu(m.id, $event)" size="sm" variant="ghost">
                        <MoreVertical class="w-4 h-4" />
                    </Button>
                </div>
            </template>
            <h3 class="font-bold mb-2">{{ m.title }}</h3>
            <p class="text-sm text-gray-500 mb-4">{{ getExcerpt(m) }}</p>
            <template #footer>
                <div class="flex justify-between items-center text-xs text-gray-400">
                    <span>{{ formatDate(m.createdAt) }}</span>
                    <div class="flex gap-2">
                         <Badge v-if="m.flashcardCount" variant="blue" size="sm">{{ m.flashcardCount }} cards</Badge>
                        <Badge v-if="getQuizCount(m)" variant="indigo" size="sm">{{ getQuizCount(m) }} Q</Badge>
                    </div>
                </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <Modal v-model="showCreateModal" title="Create New Note">
        <CreateNoteModal @close="showCreateModal = false" @created="onNoteCreated" />
    </Modal>
    
    <Modal v-model="viewingNoteId" :title="viewingNote?.title || 'View Note'" size="3xl">
        <NoteViewer v-if="viewingNoteId" :noteId="viewingNoteId" @close="viewingNoteId = null" />
    </Modal>

    <div v-if="contextMenu.show" class="fixed z-50" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
        <Card class="p-2">
            <Button @click="moveToFolder(contextMenu.noteId)" variant="ghost" class="w-full justify-start">
                <Folder class="w-4 h-4 mr-2" /> Move to Folder
            </Button>
            <Button @click="deleteNote(contextMenu.noteId)" variant="ghost" class="w-full justify-start text-red-500 hover:text-red-500">
                <Trash class="w-4 h-4 mr-2" /> Delete
            </Button>
        </Card>
    </div>

  </PageContent>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Search, MoreVertical, Folder, Trash, LayoutDashboard, Users, CalendarCheck, Check } from 'lucide-vue-next'
import api from '../lib/api'
import { sanitizeHtml } from '../lib/sanitize.js'
import CreateNoteModal from '../components/study/CreateNoteModal.vue'
import NoteViewer from '../components/study/NoteViewer.vue'

import PageContent from '@/components/layout/PageContent.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import Input from '@/components/ui/Input.vue'
import Modal from '@/components/ui/Modal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

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

const viewingNote = computed(() => {
    return materials.value.find(m => m.id === viewingNoteId.value)
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

function getNoteColor(m) {
  const type = getSourceType(m)
  if (type === 'youtube') return '#EF4444'
  if (type === 'document') return '#8B5CF6'
  return 'var(--color-primary)'
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
  const folderList = folders.value.map((f, i) => `${i + 1}. ${f.name}`).join('\n')
  const choice = window.prompt('Move to folder:\n' + folderList + '\n\nEnter number (or empty for uncategorized):')
  if (choice === null) return
  const idx = parseInt(choice) - 1
  const folderId = idx >= 0 && idx < folders.value.length ? folders.value[idx].id : null
  try {
    await api.put(`/study-materials/${noteId}/folder`, { folderId })
    const m = materials.value.find(x => x.id === noteId)
    if (m) m.folderId = folderId
  } catch (e) { console.warn('[StudyHub] Move folder failed:', e) }
}

async function deleteNote(noteId) {
  closeContextMenu()
  if (!confirm('Delete this note? This cannot be undone.')) return
  try {
    await api.delete(`/study-materials/${noteId}`)
    materials.value = materials.value.filter(m => m.id !== noteId)
  } catch (e) { console.warn('[StudyHub] Delete failed:', e) }
}

async function createFolder() {
  if (!newFolderName.value.trim()) return
  try {
    const { data } = await api.post('/study-folders', { name: newFolderName.value.trim(), color: '#6366f1' })
    folders.value.push(data)
    newFolderName.value = ''
    showNewFolderInput.value = false
  } catch (e) { console.warn('[StudyHub] Create folder failed:', e) }
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
.note-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  animation: fadeInUp 0.35s var(--ease-out) both;
}
.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.note-card:nth-child(1) { animation-delay: 0s; }
.note-card:nth-child(2) { animation-delay: 0.05s; }
.note-card:nth-child(3) { animation-delay: 0.1s; }
.note-card:nth-child(4) { animation-delay: 0.15s; }
.note-card:nth-child(5) { animation-delay: 0.2s; }
.note-card:nth-child(6) { animation-delay: 0.25s; }
.note-card:nth-child(7) { animation-delay: 0.3s; }
.note-card:nth-child(8) { animation-delay: 0.35s; }
.note-card:nth-child(9) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Stats card hover */
.stats-card {
  transition: all 0.25s var(--ease-spring);
}
.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Folder item hover */
.folder-item {
  transition: all 0.2s var(--ease-out);
}
.folder-item:hover {
  transform: translateX(4px);
}

/* Sidebar card sticky enhancement */
.sticky-card {
  transition: box-shadow 0.3s ease;
}
.sticky-card:hover {
  box-shadow: var(--shadow-lg);
}
</style>
