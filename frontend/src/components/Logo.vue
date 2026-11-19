<template>
  <span
    class="mcu-logo"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <img :src="mcuLogo" alt="" />
  </span>
</template>

<script setup>
import mcuLogo from '../assets/mcu-logo.png'

defineProps({
  size: { type: Number, default: 48 },
})
</script>

<style scoped>
.mcu-logo {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 2px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.1);
}

.mcu-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
