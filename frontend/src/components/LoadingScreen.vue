<template>
  <Transition name="fade">
    <div v-if="loading" class="fixed inset-0 z-[99999] bg-[#F8FAFF] overflow-hidden" style="perspective: 1200px;">
      <div class="flex h-full">
        <aside class="hidden lg:flex w-[280px] flex-col border-r border-[rgba(0,102,255,0.08)] bg-white p-5 gap-5" style="transform-style: preserve-3d;">
          <div class="flex items-center gap-3 px-3">
            <div class="w-9 h-9 rounded-xl bg-[rgba(0,102,255,0.08)] skeleton-pulse"></div>
            <div class="space-y-2">
              <div class="w-28 h-3 rounded bg-[rgba(0,102,255,0.08)] skeleton-pulse"></div>
              <div class="w-20 h-2 rounded bg-[rgba(0,102,255,0.05)] skeleton-pulse"></div>
            </div>
          </div>
          <div class="h-10 rounded-xl bg-[rgba(0,102,255,0.05)] skeleton-pulse mx-3"></div>
          <div class="flex-1 space-y-1 px-3">
            <div v-for="i in 7" :key="i" class="flex items-center gap-3 px-3 py-2.5">
              <div class="w-5 h-5 rounded-lg bg-[rgba(0,102,255,0.07)] skeleton-pulse"></div>
              <div class="h-3 flex-1 rounded bg-[rgba(0,102,255,0.07)] skeleton-pulse" :style="{ width: (60 + (i * 5) % 31) + '%' }"></div>
            </div>
          </div>
          <div class="space-y-1 px-3">
            <div v-for="i in 2" :key="'b'+i" class="flex items-center gap-3 px-3 py-2.5">
              <div class="w-5 h-5 rounded-lg bg-[rgba(0,102,255,0.07)] skeleton-pulse"></div>
              <div class="h-3 flex-1 rounded bg-[rgba(0,102,255,0.07)] skeleton-pulse"></div>
            </div>
          </div>
        </aside>
        <div class="flex-1 flex flex-col min-w-0">
          <header class="h-[72px] flex items-center justify-between px-6 border-b border-[rgba(0,102,255,0.08)] bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div class="flex items-center gap-4">
              <div class="w-48 h-10 rounded-xl bg-[rgba(0,102,255,0.05)] skeleton-pulse"></div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-[rgba(0,102,255,0.07)] skeleton-pulse"></div>
              <div class="w-8 h-8 rounded-full bg-[rgba(0,102,255,0.07)] skeleton-pulse"></div>
            </div>
          </header>
          <main class="flex-1 overflow-y-auto p-6 lg:p-8">
            <div class="max-w-[1280px] mx-auto space-y-8" style="transform-style: preserve-3d;">
              <div class="space-y-2">
                <div class="w-56 h-8 rounded-lg bg-[rgba(0,102,255,0.07)] skeleton-pulse"></div>
                <div class="w-80 h-4 rounded bg-[rgba(0,102,255,0.05)] skeleton-pulse"></div>
              </div>
              <div class="rounded-[20px] bg-white border border-[rgba(0,102,255,0.08)] p-8" style="box-shadow: none;">
                <div class="flex flex-col lg:flex-row gap-8">
                  <div class="lg:w-1/3 space-y-4">
                    <div class="w-full aspect-[1.586] rounded-2xl bg-[rgba(0,102,255,0.05)] skeleton-pulse"></div>
                    <div class="space-y-2">
                      <div class="w-full h-3 rounded bg-[rgba(0,102,255,0.05)] skeleton-pulse"></div>
                      <div class="w-3/4 h-3 rounded bg-[rgba(0,102,255,0.05)] skeleton-pulse"></div>
                    </div>
                  </div>
                  <div class="lg:w-2/3 space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                      <div v-for="i in 4" :key="'stat'+i" class="rounded-2xl bg-[rgba(0,102,255,0.04)] border border-[rgba(0,102,255,0.06)] p-5 skeleton-pulse">
                        <div class="w-12 h-3 rounded bg-[rgba(0,102,255,0.07)] mb-3"></div>
                        <div class="w-16 h-7 rounded bg-[rgba(0,102,255,0.07)]"></div>
                      </div>
                    </div>
                    <div class="space-y-3">
                      <div class="w-32 h-4 rounded bg-[rgba(0,102,255,0.06)] skeleton-pulse"></div>
                      <div v-for="i in 3" :key="'sched'+i" class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-[rgba(0,102,255,0.05)] skeleton-pulse"></div>
                        <div class="flex-1 space-y-2">
                          <div class="w-48 h-3 rounded bg-[rgba(0,102,255,0.06)] skeleton-pulse"></div>
                          <div class="w-32 h-2 rounded bg-[rgba(0,102,255,0.04)] skeleton-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div v-for="i in 6" :key="'action'+i" class="rounded-2xl bg-white border border-[rgba(0,102,255,0.06)] p-5 flex flex-col items-center gap-3" style="box-shadow: none;">
                  <div class="w-10 h-10 rounded-xl bg-[rgba(0,102,255,0.07)] skeleton-pulse"></div>
                  <div class="w-16 h-3 rounded bg-[rgba(0,102,255,0.06)] skeleton-pulse"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div class="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-lg rounded-2xl px-6 py-3 border border-[rgba(0,102,255,0.1)]" style="box-shadow: none;">
        <div v-for="i in 5" :key="'nav'+i" class="w-10 h-10 rounded-xl bg-[rgba(0,102,255,0.06)] skeleton-pulse"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false }
})
</script>

<style scoped>
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.5; transform: scale3d(1, 1, 1); }
  50% { opacity: 1; transform: scale3d(1.02, 1.02, 1.02); }
}

.skeleton-pulse {
  animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  transform-style: preserve-3d;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
