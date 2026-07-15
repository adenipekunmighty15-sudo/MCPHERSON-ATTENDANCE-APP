<template>
  <tr class="hover:bg-[var(--color-surface-elevated,#F5F5F5)]/30 transition-colors">
    <td class="p-4 text-sm">{{ item.course }}</td>
    <td class="p-4 text-sm">{{ item.date }}</td>
    <td class="p-4 text-sm">{{ item.timeIn }}</td>
    <td class="p-4 text-sm"><span :class="statusClass">{{ item.status }}</span></td>
    <td class="p-4 text-sm">{{ item.method }}</td>
  </tr>
</template>

<script setup>
const props = defineProps({ item: Object })

const statusClass = computed(() => {
  const s = props.item?.status?.toLowerCase() || ''
  if (s.includes('present')) return 'text-[var(--color-success,#007A33)] font-semibold'
  if (s.includes('late')) return 'text-[var(--color-warning,#CC7700)] font-semibold'
  if (s.includes('absent')) return 'text-[var(--color-error,#CC0000)] font-semibold'
  return 'text-[var(--color-text-primary,#0B1B2B)]'
})
</script>