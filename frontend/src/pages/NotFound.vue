<template>
  <div
    :style="{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      perspective: '800px',
    }"
  >
    <div
      :style="{
        textAlign: 'center',
        transformStyle: 'preserve-3d',
      }"
    >
      <h1
        :style="{
          fontSize: '120px',
          fontWeight: 900,
          color: 'var(--color-primary)',
          lineHeight: 1,
          margin: 0,
          marginBottom: '8px',
          transformStyle: 'preserve-3d',
          transform: 'translateZ(40px) rotateX(2deg)',
          textShadow:
            '0 1px 0 rgba(29,78,216,0.6), 0 2px 0 rgba(29,78,216,0.5), 0 4px 8px rgba(29,78,216,0.25), 0 8px 16px rgba(29,78,216,0.15), 0 16px 32px rgba(29,78,216,0.1)',
        }"
      >
        404
      </h1>
      <h2
        :style="{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1A1A2E',
          margin: 0,
          marginBottom: '8px',
          transform: 'translateZ(20px)',
        }"
      >
        Page Not Found
      </h2>
      <p
        :style="{
          fontSize: '14px',
          color: '#6B6B80',
          margin: 0,
          marginBottom: '28px',
          transform: 'translateZ(10px)',
        }"
      >
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <router-link
        to="/"
        :style="{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 28px',
          background: 'var(--color-primary)',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: 600,
          borderRadius: '10px',
          textDecoration: 'none',
          transformStyle: 'preserve-3d',
          transform: 'translateZ(15px)',
          boxShadow: 'none',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s',
          cursor: 'pointer',
        }"
        class="btn-3d"
      >
        Go Home
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.btn-3d:hover {
  transform: translateZ(25px) scale(1.04) !important;
  box-shadow: 0 6px 20px rgba(29, 78, 216, 0.45), 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}
.btn-3d:active {
  transform: translateZ(5px) scale(0.97) !important;
}
</style>
