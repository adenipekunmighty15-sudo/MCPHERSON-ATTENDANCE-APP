<template>
  <div class="bg-2d-container">
    <!-- Floating Glowing Orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="orb orb-4"></div>
    
    <!-- Moving minimal grid -->
    <div class="grid-overlay"></div>
    
    <!-- Floating 2D Icons / Elements -->
    <div class="floating-item item-1">✧</div>
    <div class="floating-item item-2">⨯</div>
    <div class="floating-item item-3">○</div>
  </div>
</template>

<script setup>
// Pure CSS 2D Animation Component
</script>

<style scoped>
.bg-2d-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1; /* Sits above the 3D canvas which is z-index 0 */
  pointer-events: none;
}

/* Glowing Orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: float 20s infinite ease-in-out alternate;
}

.orb-1 {
  width: 400px; height: 400px;
  background: #D4A017; /* Gold */
  top: -100px; left: -100px;
  animation-duration: 25s;
}

.orb-2 {
  width: 500px; height: 500px;
  background: #00F0FF; /* Cyan */
  bottom: -150px; right: -100px;
  animation-delay: -5s;
  animation-duration: 28s;
}

.orb-3 {
  width: 300px; height: 300px;
  background: #B026FF; /* Violet */
  top: 40%; left: 60%;
  animation-delay: -10s;
  animation-duration: 22s;
}

.orb-4 {
  width: 250px; height: 250px;
  background: #1E293B; /* Slate dark contrast */
  bottom: 20%; left: 10%;
  animation-delay: -15s;
  animation-duration: 30s;
}

/* Floating micro-elements */
.floating-item {
  position: absolute;
  font-size: 24px;
  color: rgba(30, 41, 59, 0.15); /* Slate color */
  font-weight: 300;
  animation: micro-float 15s infinite linear;
}

.item-1 { top: 20%; left: 15%; animation-duration: 12s; font-size: 32px; color: rgba(212, 160, 23, 0.2); }
.item-2 { bottom: 30%; right: 20%; animation-duration: 18s; animation-direction: reverse; }
.item-3 { top: 60%; left: 75%; animation-duration: 22s; font-size: 40px; color: rgba(0, 240, 255, 0.15); }

/* Grid Overlay with parallax scrolling effect */
.grid-overlay {
  position: absolute;
  inset: -50%;
  background-image: 
    linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: grid-move 40s infinite linear;
}

/* Animations */
@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(50px, 80px) scale(1.1); }
  66% { transform: translate(-30px, 40px) scale(0.9); }
  100% { transform: translate(-80px, -20px) scale(1.05); }
}

@keyframes micro-float {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-200px) rotate(360deg); opacity: 0; }
}

@keyframes grid-move {
  0% { transform: translateY(0); }
  100% { transform: translateY(40px); }
}
</style>
