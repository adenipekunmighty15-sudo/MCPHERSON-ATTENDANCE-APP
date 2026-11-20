<template>
  <div class="app-root">
    <ScrollProgress />
    <LoadingScreen v-if="!loadingStore.isAppReady" :loading="true" />
    <template v-else>
      <router-view />
      <Toast />
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useLoadingStore } from './stores/loading'
import { useTheme } from './composables/useTheme'
import LoadingScreen from './components/LoadingScreen.vue'
import Toast from './components/Toast.vue'
import ScrollProgress from './components/premium/ScrollProgress.vue'

const authStore = useAuthStore()
const loadingStore = useLoadingStore()
const { init: initTheme } = useTheme()
let loadingTimer

onMounted(async () => {
  initTheme()
  loadingTimer = setTimeout(() => {
    if (!loadingStore.isAppReady) loadingStore.markAppReady()
  }, 10000)
  await authStore.ready
  clearTimeout(loadingTimer)
  loadingStore.markAppReady()
})

onUnmounted(() => clearTimeout(loadingTimer))
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  background: var(--color-bg);
}
</style>
