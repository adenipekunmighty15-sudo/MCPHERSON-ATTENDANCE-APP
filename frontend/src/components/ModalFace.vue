<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div class="bg-white rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Face ID Verification</h3>
        <button @click="$emit('close')" class="text-sm">Close</button>
      </div>
      <div class="aspect-square rounded-2xl bg-black mb-4 overflow-hidden"></div>
      <p class="text-sm text-[var(--color-text-secondary,#4A4A4A)]">Look directly into the camera and hold still.</p>
      <div class="mt-4 flex gap-3">
        <button class="flex-1 bg-[var(--color-primary,#0B4F8C)] text-white rounded-md py-2">Verify & Check In</button>
        <button class="flex-1 bg-white border rounded-md py-2">Cancel</button>
      </div>
    </div>
  </div>
</template>
