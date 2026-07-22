<template>
  <div
    :class="[
      'ui-card',
      `ui-card-${variant}`,
      { 'ui-card-hover': hover, 'ui-card-bordered': bordered }
    ]"
  >
    <div v-if="$slots.header" class="ui-card-header">
      <slot name="header" />
    </div>

    <div class="ui-card-body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="ui-card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'subtle', 'elevated'].includes(v)
  },
  hover: {
    type: Boolean,
    default: false
  },
  bordered: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.ui-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out);
}

.ui-card-default {
  box-shadow: var(--shadow-sm);
}

.ui-card-subtle {
  background: var(--color-bg-alt);
  border-color: transparent;
}

.ui-card-elevated {
  box-shadow: var(--shadow-lg);
}

.ui-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-accent);
}

.ui-card-bordered {
  border-width: 2px;
}

.ui-card-header {
  padding: var(--card-padding-sm);
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
  font-size: var(--text-base);
}

.ui-card-body {
  padding: var(--card-padding-sm);
}

.ui-card-footer {
  padding: var(--space-4) var(--card-padding-sm);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-alt);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

[data-theme="dark"] .ui-card-hover:hover {
  box-shadow: var(--shadow-xl);
}
</style>
