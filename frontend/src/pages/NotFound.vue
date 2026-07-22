<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <h1 class="not-found-title">404</h1>
      <h2 class="not-found-heading">Page Not Found</h2>
      <p class="not-found-desc">The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.</p>
      <router-link to="/" class="btn btn-primary btn-lg not-found-btn">Go Home</router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  perspective: 800px;
}
.not-found-content {
  text-align: center;
  transform-style: preserve-3d;
}
.not-found-title {
  font-size: 120px;
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1;
  margin: 0 0 8px;
  transform-style: preserve-3d;
  transform: translateZ(40px) rotateX(2deg);
  text-shadow:
    0 1px 0 color-mix(in srgb, var(--color-primary) 60%, transparent),
    0 2px 0 color-mix(in srgb, var(--color-primary) 50%, transparent),
    0 4px 8px color-mix(in srgb, var(--color-primary) 25%, transparent),
    0 8px 16px color-mix(in srgb, var(--color-primary) 15%, transparent),
    0 16px 32px color-mix(in srgb, var(--color-primary) 10%, transparent);
}
.not-found-heading {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  transform: translateZ(20px);
}
.not-found-desc {
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin: 0 0 28px;
  transform: translateZ(10px);
}
.not-found-btn {
  transform-style: preserve-3d;
  transform: translateZ(15px);
}
.not-found-btn:hover {
  transform: translateZ(25px) scale(1.04);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--color-primary) 45%, transparent), 0 2px 6px rgba(0, 0, 0, 0.15);
}
.not-found-btn:active {
  transform: translateZ(5px) scale(0.97);
}
</style>
