<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Outer shield -->
    <path d="M50 2L96 22V54C96 75 76 91 50 99C24 91 4 75 4 54V22L50 2Z" fill="#1D4ED8" stroke="#60A5FA" stroke-width="2"/>
    <!-- Inner panel -->
    <path d="M50 14L84 30V52C84 68 69 81 50 88C31 81 16 68 16 52V30L50 14Z" fill="#0F172A" stroke="#3B82F6" stroke-width="0.5"/>
    <!-- Chevron accent -->
    <path d="M50 20L72 32V48C72 58 62 66 50 71C38 66 28 58 28 48V32L50 20Z" fill="#60A5FA" opacity="0.15"/>
    <!-- MCU text -->
    <text x="50" y="56" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" letter-spacing="0.5" fill="#FFFFFF">MCU</text>
    <!-- Star -->
    <text x="50" y="74" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#60A5FA">★</text>
    <!-- Year -->
    <text x="50" y="86" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="6" fill="#94A3B8" letter-spacing="1">2025</text>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 48 }
})
</script>
