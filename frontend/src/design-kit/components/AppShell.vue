<template>
  <div class="dk-shell">
    <aside class="dk-shell__sidebar">
      <div class="dk-shell__brand">
        <slot name="brand">
          <div class="dk-shell__logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="6" fill="var(--color-brass)"/>
              <path d="M7 14l4 4 10-10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="dk-shell__name">McPherson</span>
          </div>
        </slot>
      </div>
      <nav class="dk-shell__nav">
        <slot name="nav" />
      </nav>
      <div class="dk-shell__footer">
        <slot name="footer" />
      </div>
    </aside>
    <main class="dk-shell__main">
      <div class="dk-shell__content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.dk-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-parchment-500);
}
.dk-shell__sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-width-kit, 260px);
  background: var(--color-parchment-100);
  border-right: 1px solid var(--color-ink-100);
  display: flex;
  flex-direction: column;
  z-index: 40;
}
.dk-shell__brand {
  padding: 20px 20px 12px;
  border-bottom: 1px solid var(--color-ink-100);
}
.dk-shell__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-ink-900);
}
.dk-shell__nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px;
}
.dk-shell__footer {
  padding: 12px;
  border-top: 1px solid var(--color-ink-100);
}
.dk-shell__main {
  margin-left: var(--sidebar-width-kit, 260px);
  flex: 1;
  min-height: 100vh;
}
.dk-shell__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 36px;
}

@media (max-width: 768px) {
  .dk-shell__sidebar { width: 100%; position: relative; min-height: auto; }
  .dk-shell__main { margin-left: 0; }
  .dk-shell__content { padding: 20px 16px; }
}
</style>
