<template>
  <div>
    <div v-if="materials.length === 0" class="text-center py-12">
      <p class="text-sm font-semibold" style="color: #96A0B5;">No study materials yet</p>
      <p class="text-xs mt-1" style="color: #B8C0D0;">Upload a PDF to generate study materials and podcast audio</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="m in materials" :key="m.id"
        class="rounded-2xl p-4 border transition-all"
        style="background: #FFFFFF; border-color: #E2E6ED;"
      >
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :style="{ background: m.podcastUrl ? '#F0FDF4' : '#EDEDED', color: m.podcastUrl ? '#10B981' : '#96A0B5' }">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate" style="color: #0F1E3D;">{{ m.title }}</p>
            <p class="text-xs mt-0.5" style="color: #96A0B5;">
              {{ m.flashcardCount || 0 }} flashcards
              <template v-if="m.podcastUrl">&middot; Podcast ready</template>
            </p>

            <!-- Audio player if podcast exists -->
            <div v-if="m.podcastUrl" class="mt-3">
              <audio :src="m.podcastUrl" controls class="w-full h-8 rounded-lg" style="background: #EDEDED;">
                Your browser doesn't support audio playback.
              </audio>
            </div>

            <!-- Generate button -->
            <button v-else @click="generatePodcast(m)"
              :disabled="generatingId === m.id"
              class="mt-3 px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all inline-flex items-center gap-2 podcast-btn"
              :style="{
                background: generatingId === m.id ? '#EDEDED' : '#0F1E3D',
                color: generatingId === m.id ? '#96A0B5' : '#FFFFFF',
              }"
            >
              <svg v-if="generatingId === m.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              {{ generatingId === m.id ? 'Generating…' : 'Generate Podcast' }}
            </button>
            <p v-if="m.podcastError" class="mt-2 text-[11px]" style="color: #EF4444;">{{ m.podcastError }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../lib/api'

const emit = defineEmits(['podcast-generated'])

const materials = ref([])
const generatingId = ref(null)

onMounted(async () => {
  await loadMaterials()
})

async function loadMaterials() {
  try {
    const res = await api.get('/study-materials')
    materials.value = (res.data || []).map(m => ({
      id: m.id,
      title: m.title,
      flashcardCount: m.flashcardCount || 0,
      podcastUrl: m.podcastUrl || '',
      podcastError: null,
    }))
  } catch (e) {
    console.warn('[PodcastAudio] Load failed:', e)
  }
}

async function generatePodcast(m) {
  generatingId.value = m.id
  m.podcastError = null
  try {
    const res = await api.post(`/study-materials/${m.id}/podcast`)
    if (res.data?.success && res.data?.data?.url) {
      m.podcastUrl = res.data.data.url
    } else if (res.data?.success && res.data?.data?.audioUrl) {
      m.podcastUrl = res.data.data.audioUrl
    } else if (res.data?.data?.url) {
      m.podcastUrl = res.data.data.url
    } else {
      m.podcastError = 'Podcast generated but no audio URL returned'
    }
    emit('podcast-generated', m.id)
  } catch (err) {
    m.podcastError = err.response?.data?.error || err.message || 'Generation failed'
  } finally {
    generatingId.value = null
  }
}
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 800ms linear infinite;
}
audio::-webkit-media-controls-panel {
  background: #EDEDED;
}
.podcast-btn:hover:not(:disabled) {
  background: #1A2D52 !important;
}
.podcast-btn:disabled {
  cursor: not-allowed;
}
</style>
