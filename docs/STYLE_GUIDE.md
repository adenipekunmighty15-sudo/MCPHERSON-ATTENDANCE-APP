# McPherson App - UI/UX Style Guide

## Component Library Overview

This guide documents all unified UI components and their usage patterns.

---

## UI Components

### Button Component

The `Button` component is the primary way to create buttons throughout the app. It replaces all scattered `.btn` classes.

**Props:**
- `variant`: `'primary'` | `'secondary'` | `'ghost'` | `'danger'` | `'success'` | `'warning'` (default: `'primary'`)
- `size`: `'xs'` | `'sm'` | `'md'` | `'lg'` | `'xl'` (default: `'md'`)
- `disabled`: Boolean - Disables the button
- `loading`: Boolean - Shows loading spinner
- `icon`: Component - Icon component to display
- `iconOnly`: Boolean - Only show icon (circular button)

**Examples:**

```vue
<!-- Primary button -->
<Button variant="primary">Click me</Button>

<!-- Secondary button -->
<Button variant="secondary" size="sm">Cancel</Button>

<!-- Danger button -->
<Button variant="danger" :loading="isLoading">Delete</Button>

<!-- Icon button -->
<Button icon="TrashIcon" iconOnly variant="ghost" />
```

---

### Card Component

The `Card` component provides a consistent container for content with optional header and footer.

**Props:**
- `variant`: `'default'` | `'subtle'` | `'elevated'` (default: `'default'`)
- `hover`: Boolean - Add hover lift effect (default: `false`)
- `bordered`: Boolean - Use strong border (default: `false`)

**Slots:**
- `header` - Card header content
- `default` - Card body content
- `footer` - Card footer (typically buttons)

**Examples:**

```vue
<Card hover bordered>
  <template #header>
    <h2>Card Title</h2>
  </template>

  <p>Card body content goes here</p>

  <template #footer>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save</Button>
  </template>
</Card>
```

---

### Modal Component

Teleported modal dialog for important user interactions.

**Props:**
- `modelValue`: Boolean - Show/hide modal
- `title`: String - Modal title

**Slots:**
- `default` - Modal body content
- `footer` - Modal footer (typically buttons)

**Examples:**

```vue
<template>
  <Button @click="showModal = true">Open Modal</Button>

  <Modal v-model="showModal" title="Confirm Action">
    <p>Are you sure you want to proceed?</p>

    <template #footer>
      <Button variant="ghost" @click="showModal = false">Cancel</Button>
      <Button variant="danger">Delete</Button>
    </template>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
const showModal = ref(false)
</script>
```

---

### Alert Component

For displaying system messages, errors, warnings, and success notifications.

**Props:**
- `type`: `'success'` | `'error'` | `'warning'` | `'info'` (default: `'info'`)
- `title`: String - Alert title
- `closable`: Boolean - Show close button (default: `false`)

**Events:**
- `@close` - Emitted when close button is clicked

**Examples:**

```vue
<Alert type="success" title="Success" closable @close="hideAlert">
  Your changes have been saved successfully.
</Alert>

<Alert type="error" title="Error">
  Something went wrong. Please try again.
</Alert>

<Alert type="warning">
  This action cannot be undone.
</Alert>
```

---

### Badge Component

For displaying small status labels and tags.

**Props:**
- `variant`: `'primary'` | `'secondary'` | `'success'` | `'error'` | `'warning'` | `'info'` (default: `'primary'`)
- `size`: `'sm'` | `'md'` | `'lg'` (default: `'md'`)

**Examples:**

```vue
<Badge variant="success">Active</Badge>
<Badge variant="warning" size="sm">Pending</Badge>
<Badge variant="error" size="lg">Critical</Badge>
```

---

### Input Component

Unified form input with validation support.

**Props:**
- `modelValue`: String | Number - Input value (v-model)
- `type`: String - Input type (default: `'text'`)
- `label`: String - Input label
- `placeholder`: String - Placeholder text
- `error`: String - Error message (shows when provided)
- `hint`: String - Helper text below input
- `icon`: Component - Icon to display on the right
- `disabled`: Boolean
- `required`: Boolean

**Examples:**

```vue
<template>
  <Input
    v-model="username"
    label="Username"
    placeholder="Enter your username"
    :error="errors.username"
    hint="Username must be 3-20 characters"
  />

  <Input
    v-model="password"
    type="password"
    label="Password"
    required
    @input="validatePassword"
  />
</template>

<script setup>
import { ref } from 'vue'
const username = ref('')
const password = ref('')
const errors = ref({ username: '' })
</script>
```

---

### Select Component

Unified dropdown/select input.

**Props:**
- `modelValue`: String | Number - Selected value (v-model)
- `options`: Array - Array of `{ label, value }` objects
- `label`: String - Select label
- `placeholder`: String - Placeholder text
- `error`: String - Error message
- `hint`: String - Helper text
- `disabled`: Boolean
- `required`: Boolean

**Examples:**

```vue
<Select
  v-model="department"
  :options="[
    { label: 'Computer Science', value: 'cs' },
    { label: 'Engineering', value: 'eng' },
    { label: 'Business', value: 'bus' }
  ]"
  label="Department"
  placeholder="Select department"
/>
```

---

## Layout Components

### PageHeader Component

Standard page header with title, subtitle, and action buttons.

**Props:**
- `title`: String - Page title (required)
- `subtitle`: String - Optional page subtitle

**Slots:**
- `actions` - Right-aligned action buttons
- `default` - Additional content below title

**Examples:**

```vue
<PageHeader 
  title="Courses" 
  subtitle="Manage your academic courses"
>
  <template #actions>
    <Button variant="primary">Add Course</Button>
  </template>
</PageHeader>
```

---

### PageContent Component

Wrapper for page content with consistent padding and max-width.

**Props:**
- `narrow`: Boolean - Use narrower max-width (800px) (default: `false`)

**Examples:**

```vue
<PageContent>
  <!-- Page content here -->
</PageContent>

<!-- Narrow layout for forms -->
<PageContent narrow>
  <!-- Form content here -->
</PageContent>
```

---

## Layout Structure

### Standard Page Layout

```vue
<template>
  <PageContent>
    <PageHeader 
      title="Page Title"
      subtitle="Optional subtitle"
    >
      <template #actions>
        <Button>Action</Button>
      </template>
    </PageHeader>

    <!-- Main content -->
    <div class="content-area">
      <!-- Your content here -->
    </div>
  </PageContent>
</template>
```

---

## Color System

The app uses CSS custom properties for theming. These are automatically handled but useful to know:

**Primary Colors:**
- `--color-primary`: Main brand color (blue #0B4F8C light, #60A5FA dark)
- `--color-primary-soft`: Soft background variant
- `--color-primary-light`: Lighter variant
- `--color-primary-dark`: Darker variant

**Status Colors:**
- `--color-success`: Success state (#007A33 light, #4ADE80 dark)
- `--color-error`: Error/danger state (#CC0000 light, #F87171 dark)
- `--color-warning`: Warning state (#CC7700 light, #FBBF24 dark)
- `--color-info`: Info state (#2563EB light, #60A5FA dark)

**Semantic Colors:**
- `--color-bg`: Main background
- `--color-bg-secondary`: Secondary background
- `--color-bg-tertiary`: Tertiary background
- `--color-text-primary`: Primary text
- `--color-text-secondary`: Secondary text
- `--color-border`: Border color

---

## Typography

Use semantic HTML elements and classes:

```vue
<!-- Page titles -->
<h1 class="text-4xl font-bold">Main Title</h1>

<!-- Section titles -->
<h2 class="text-2xl font-bold">Section Title</h2>

<!-- Subsection -->
<h3 class="text-lg font-semibold">Subsection</h3>

<!-- Body text -->
<p>Normal paragraph text</p>

<!-- Secondary text -->
<p class="text-sm text-gray-600">Secondary/helper text</p>
```

---

## Spacing

Use the spacing scale defined in CSS variables:

- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-5`: 20px
- `space-6`: 24px
- `space-8`: 32px
- `space-12`: 48px

Or use Tailwind classes: `p-4`, `gap-6`, `mt-8`, etc.

---

## Migration Guide

### Before (Scattered Styles)

```vue
<!-- ❌ Old scattered approach -->
<button class="btn btn-primary">Click</button>
<button class="btn btn-secondary btn-sm">Small Button</button>
<div class="card card-hover p-5">Content</div>
<div style="background:var(--color-primary-soft);padding:16px">Alert</div>
```

### After (Unified Components)

```vue
<!-- ✅ New unified approach -->
<Button variant="primary">Click</Button>
<Button variant="secondary" size="sm">Small Button</Button>
<Card hover>Content</Card>
<Alert type="info">Alert message</Alert>
```

---

## Best Practices

1. **Always use components** - Don't create custom buttons or cards, use Button and Card
2. **Use props for styling** - Don't add inline styles or custom classes for basic styling
3. **Consistent spacing** - Use the CSS variable spacing scale (`space-1` through `space-20`)
4. **Accessible colors** - Status colors have sufficient contrast in both light and dark modes
5. **Dark mode support** - All components support light/dark theme via CSS variables
6. **Mobile-first** - Components are responsive by default
7. **Icons with text** - Use icon + button/badge combinations for clarity

---

## Component Import

All components are auto-exported from `src/components/index.js`:

```vue
<script setup>
import { Button, Card, Modal, Alert, Badge, Input, Select, PageHeader, PageContent } from '@/components'
</script>
```

Or import directly:

```vue
<script setup>
import Button from '@/components/ui/Button.vue'
</script>
```

---

## Dark Mode

All components automatically support dark mode. The theme is controlled by the `data-theme` attribute on the root element. Users can toggle via `ThemeToggle` component.

**Theme CSS Variables** are automatically swapped in `[data-theme="dark"]` selector.

---

## Accessibility

All components follow WCAG 2.1 guidelines:
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus management in modals

---

## Questions or Issues?

When building new features:
1. Check if a component exists that meets your needs
2. Use existing components rather than creating new styles
3. If a component needs new features, extend it rather than creating alternatives
4. Keep styles co-located with components
5. Document any new variants or props
