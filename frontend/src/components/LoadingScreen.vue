<template>
  <Transition name="fade-load">
    <div v-if="loading" class="ls-root">
      <div class="ls-layout">
        <aside class="ls-sidebar">
          <div class="ls-sidebar-header">
            <div class="ls-logo">
              <div class="sk-block" style="width:32px;height:32px;border-radius:10px" />
              <div class="sk-block" style="width:80px;height:10px;border-radius:5px" />
            </div>
          </div>
          <div class="ls-divider" />
          <div v-for="g in 3" :key="g" class="ls-nav-group">
            <div class="sk-block" style="width:50px;height:8px;border-radius:4px" />
            <div v-for="i in 3" :key="'n'+g+i" class="ls-nav-item">
              <div class="sk-block" style="width:20px;height:20px;border-radius:6px" />
              <div class="sk-block" :style="{ width: (55+i*10)+'px', height:10, borderRadius:'5px' }" />
            </div>
          </div>
          <div class="ls-spacer" />
          <div class="ls-sidebar-footer">
            <div class="ls-nav-item">
              <div class="sk-block" style="width:20px;height:20px;border-radius:6px" />
              <div class="sk-block" style="width:60px;height:10px;border-radius:5px" />
            </div>
          </div>
        </aside>
        <div class="ls-main">
          <header class="ls-topbar">
            <div class="sk-block" style="width:180px;height:14px;border-radius:7px" />
            <div class="ls-topbar-right">
              <div class="sk-block" style="width:36px;height:36px;border-radius:10px" />
              <div class="sk-block" style="width:36px;height:36px;border-radius:50%" />
            </div>
          </header>
          <main class="ls-content">
            <div class="ls-content-inner">
              <div class="ls-page-header">
                <div class="sk-block" style="width:200px;height:22px;border-radius:8px" />
                <div class="sk-block" style="width:280px;height:12px;border-radius:6px" />
              </div>
              <div class="ls-hero-card">
                <div class="ls-hero-layout">
                  <div class="ls-hero-left">
                    <div class="sk-block ls-card-sk" style="padding-bottom:60%">
                      <div class="sk-overlay" />
                    </div>
                    <div class="sk-block" style="width:100%;height:10px;border-radius:5px" />
                  </div>
                  <div class="ls-hero-right">
                    <div class="ls-metrics-grid">
                      <div v-for="i in 4" :key="'m'+i" class="sk-block ls-metric-sk">
                        <div class="sk-overlay" />
                        <div class="sk-block" style="width:40px;height:10px;border-radius:5px" />
                        <div class="sk-block" style="width:60px;height:28px;border-radius:8px" />
                      </div>
                    </div>
                    <div class="ls-timeline-sk">
                      <div class="sk-block" style="width:100px;height:12px;border-radius:6px" />
                      <div v-for="i in 3" :key="'t'+i" class="ls-tl-row">
                        <div class="sk-block" style="width:40px;height:40px;border-radius:10px" />
                        <div class="ls-tl-text">
                          <div class="sk-block" style="width:160px;height:10px;border-radius:5px" />
                          <div class="sk-block" style="width:100px;height:8px;border-radius:4px" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="ls-actions">
                <div v-for="i in 4" :key="'a'+i" class="sk-block ls-action-sk">
                  <div class="sk-overlay" />
                  <div class="sk-block" style="width:36px;height:36px;border-radius:10px" />
                  <div class="sk-block" style="width:50px;height:10px;border-radius:5px" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div class="ls-bottom-nav">
        <div v-for="i in 5" :key="'bn'+i" class="sk-block" style="width:40px;height:40px;border-radius:10px" />
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
.ls-root {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: var(--color-bg);
  overflow: hidden;
}

.ls-layout {
  display: flex;
  height: 100%;
}

.ls-sidebar {
  display: none;
  width: var(--sidebar-width, 280px);
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: var(--space-4);
  gap: var(--space-1);
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .ls-sidebar { display: flex; }
}

.ls-sidebar-header {
  padding: var(--space-1) var(--space-2);
}

.ls-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.ls-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-2) 0;
}

.ls-nav-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) 0;
}

.ls-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-1) var(--space-2);
}

.ls-spacer {
  flex: 1;
}

.ls-sidebar-footer {
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.ls-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ls-topbar {
  height: var(--topbar-height, 72px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.ls-topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.ls-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

.ls-content-inner {
  max-width: var(--page-max-width, 1280px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.ls-page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ls-hero-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  overflow: hidden;
}

.ls-hero-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

@media (min-width: 1024px) {
  .ls-hero-layout { flex-direction: row; }
  .ls-hero-left { width: 33.333%; }
  .ls-hero-right { width: 66.666%; }
}

.ls-hero-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ls-hero-right {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.ls-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.ls-timeline-sk {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ls-tl-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.ls-tl-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.ls-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .ls-actions { grid-template-columns: repeat(4, 1fr); }
}

.ls-bottom-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

@media (min-width: 1024px) {
  .ls-bottom-nav { display: none; }
}

/* Skeletons */
.sk-block {
  position: relative;
  overflow: hidden;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
}

.sk-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
  animation: skShimmerLoad 1.8s ease-in-out infinite;
}

.ls-card-sk,
.ls-metric-sk,
.ls-action-sk {
  position: relative;
  overflow: hidden;
}

@keyframes skShimmerLoad {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.fade-load-enter-active,
.fade-load-leave-active {
  transition: opacity 0.35s ease;
}

.fade-load-enter-from,
.fade-load-leave-to {
  opacity: 0;
}
</style>
