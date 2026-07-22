# UI Component Quick Start - Developer Guide

**Fast reference for implementing all UI/UX features in your pages**

---

## Quick Reference by Task

### I need to... Show loading data

```vue
<template>
  <div v-if="isLoading">
    <LoadingState message="Loading courses..." hint="This may take a moment" />
  </div>
  <div v-else>
    <!-- Your content -->
  </div>
</template>

<!-- Or use skeleton (preferred - feels faster) -->
<SkeletonLoader v-if="isLoading" variant="card" />
```

### I need to... Show no results

```vue
<EmptyState
  title="No courses found"
  description="Create your first course to get started"
>
  <Button @click="navigateTo('/create-course')">Create Course</Button>
</EmptyState>
```

### I need to... Show an error

```vue
<ErrorState
  title="Failed to load courses"
  description="Something went wrong on our end"
  error="Error: Network timeout"
/>

<!-- Or inline error -->
<Alert type="error" title="Error" closable>
  {{ error.message }}
</Alert>
```

### I need to... Show a success message

```vue
<Alert type="success" title="Success" closable>
  Your course has been saved successfully!
</Alert>
```

### I need to... Create a button

```vue
<!-- Primary (most common) -->
<Button variant="primary">Save Changes</Button>

<!-- Secondary (less important) -->
<Button variant="secondary">Cancel</Button>

<!-- Danger (destructive) -->
<Button variant="danger" @click="confirmDelete">Delete</Button>

<!-- Ghost (tertiary) -->
<Button variant="ghost">Skip</Button>

<!-- With loading state -->
<Button :loading="isSaving">Save</Button>

<!-- With icon -->
<Button>
  <Icon name="download" />
  Export
</Button>
```

### I need to... Create a form

```vue
<Card title="Create Course">
  <form @submit.prevent="saveCourse">
    <Input
      v-model="form.title"
      label="Course Title"
      required
      placeholder="e.g., Advanced Physics"
    />

    <Select
      v-model="form.department"
      label="Department"
      :options="departments"
      required
    />

    <Input
      v-model="form.description"
      label="Description"
      placeholder="Optional description"
      type="textarea"
    />

    <template #footer>
      <Button variant="ghost" @click="cancel">Cancel</Button>
      <Button variant="primary" type="submit">Create</Button>
    </template>
  </form>
</Card>

<!-- With validation -->
<Input
  v-model="form.email"
  label="Email"
  type="email"
  :error="errors.email"
  hint="student@university.edu"
  required
/>
```

### I need to... Create a card layout

```vue
<!-- Simple card -->
<Card>
  <p>Simple content</p>
</Card>

<!-- Card with sections -->
<Card>
  <template #header>
    <h3>Course Details</h3>
  </template>
  <p>Your content here</p>
  <template #footer>
    <Button>Action</Button>
  </template>
</Card>

<!-- Elevated card -->
<Card variant="elevated">
  <p>Important information</p>
</Card>
```

### I need to... Show a modal

```vue
<Modal v-model="isOpen" title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <template #footer>
    <Button variant="ghost" @click="isOpen = false">Cancel</Button>
    <Button variant="primary" @click="confirmAction">Proceed</Button>
  </template>
</Modal>

<!-- Show modal -->
<Button @click="isOpen = true">Show Modal</Button>
```

### I need to... Show page structure

```vue
<PageContent>
  <!-- Large title with actions -->
  <PageHeader title="Courses" subtitle="All available courses">
    <template #actions>
      <Button variant="primary">Add Course</Button>
    </template>
  </PageHeader>

  <!-- Your content -->
  <Card v-for="course in courses" :key="course.id">
    <template #header>{{ course.title }}</template>
    <p>{{ course.description }}</p>
  </Card>
</PageContent>
```

### I need to... Show a breadcrumb trail

```vue
<Breadcrumb
  :breadcrumbs="[
    { label: 'Dashboard', to: '/' },
    { label: 'Courses', to: '/courses' },
    { label: 'Physics 101' }
  ]"
/>
```

### I need to... Show progress

```vue
<!-- Determinate (know the value) -->
<Progress :value="fileUploadProgress" show-percentage label="Uploading..." />

<!-- Indeterminate (don't know how long) -->
<Progress :indeterminate="true" label="Processing..." />

<!-- Step-based progress -->
<Progress
  :value="currentStep"
  :steps="4"
  :current-step="currentStep"
  show-steps
  label="Step Progress"
/>
```

### I need to... Show a status

```vue
<StatusBadge status="active" label="Active" />
<StatusBadge status="pending" label="Pending Review" />
<StatusBadge status="error" label="Error" />
<StatusBadge status="inactive" label="Inactive" />
```

### I need to... Show help text

```vue
<Tooltip text="This will delete the course permanently" position="top">
  <Button variant="danger">Delete Course</Button>
</Tooltip>

<!-- Or inline help -->
<div class="help-text">
  💡 Tip: You can export attendance records as CSV
</div>
```

### I need to... Show badges/tags

```vue
<Badge variant="primary">Python</Badge>
<Badge variant="success">Verified</Badge>
<Badge variant="warning">Draft</Badge>
<Badge variant="error">Expired</Badge>

<!-- Removable badge -->
<Badge :closable="true" @close="removeTechnology">
  React
</Badge>
```

### I need to... Make something respond to theme

```vue
<!-- Everything auto-responds via CSS variables -->
<!-- Dark mode handled automatically -->

<!-- Manual control -->
<ThemeToggle />  <!-- Toggles light/dark mode -->

<!-- All colors automatically adjust -->
<!-- No per-component overrides needed -->
```

---

## Common Patterns

### Pattern 1: Load, Success, Error Flow

```vue
<template>
  <PageContent>
    <PageHeader title="My Page" />

    <!-- Loading -->
    <LoadingState v-if="loading" />

    <!-- Error -->
    <ErrorState
      v-else-if="error"
      title="Failed to load"
      :error="error"
    />

    <!-- Empty -->
    <EmptyState
      v-else-if="!items.length"
      title="No items yet"
    />

    <!-- Success -->
    <div v-else>
      <Card v-for="item in items" :key="item.id">
        {{ item.name }}
      </Card>
    </div>
  </PageContent>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])
const loading = ref(false)
const error = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    items.value = await fetchItems()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>
```

### Pattern 2: Form with Validation

```vue
<template>
  <Card title="Create Item">
    <form @submit.prevent="submit">
      <div class="form-group">
        <Input
          v-model="form.title"
          label="Title"
          required
          placeholder="Enter title"
          :error="errors.title"
        />
      </div>

      <div class="form-group">
        <Input
          v-model="form.description"
          label="Description"
          type="textarea"
          placeholder="Enter description"
          :error="errors.description"
        />
      </div>

      <!-- Form status -->
      <Alert v-if="formError" type="error" closable>
        {{ formError }}
      </Alert>

      <Alert v-if="formSuccess" type="success" closable>
        Item created successfully!
      </Alert>

      <template #footer>
        <Button variant="ghost" @click="reset">Clear</Button>
        <Button :loading="isSubmitting" type="submit">Create</Button>
      </template>
    </form>
  </Card>
</template>

<script setup>
import { ref, reactive } from 'vue'

const form = reactive({ title: '', description: '' })
const errors = reactive({})
const isSubmitting = ref(false)
const formError = ref(null)
const formSuccess = ref(false)

function validate() {
  errors.title = !form.title ? 'Title is required' : ''
  errors.description = !form.description ? 'Description is required' : ''
  return !errors.title && !errors.description
}

async function submit() {
  if (!validate()) return

  isSubmitting.value = true
  formError.value = null
  formSuccess.value = false

  try {
    await createItem(form)
    formSuccess.value = true
    reset()
  } catch (e) {
    formError.value = e.message
  } finally {
    isSubmitting.value = false
  }
}

function reset() {
  form.title = ''
  form.description = ''
  Object.keys(errors).forEach(key => { errors[key] = '' })
  formSuccess.value = false
}
</script>
```

### Pattern 3: Skeleton Loading

```vue
<template>
  <div>
    <!-- Show skeleton while loading -->
    <div v-if="loading" class="space-y-4">
      <SkeletonLoader variant="card" />
      <SkeletonLoader variant="card" />
      <SkeletonLoader variant="card" />
    </div>

    <!-- Show actual content when loaded -->
    <div v-else class="space-y-4">
      <Card v-for="item in items" :key="item.id">
        <template #header>{{ item.title }}</template>
        {{ item.description }}
      </Card>
    </div>
  </div>
</template>
```

### Pattern 4: Breadcrumb Navigation

```vue
<template>
  <PageContent>
    <Breadcrumb :breadcrumbs="breadcrumbs" />
    <PageHeader title="Current Page" />
    <!-- Content -->
  </PageContent>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Courses', to: '/courses' },
  { label: route.params.courseId }
])
</script>
```

---

## CSS Utilities Available

### Colors
```css
.text-primary        /* Primary color text */
.text-success        /* Green for success */
.text-error          /* Red for errors */
.text-warning        /* Orange for warnings */
.bg-success-soft     /* Light green background */
.border-primary      /* Primary colored border */
```

### Spacing
```css
.p-4      /* Padding */
.m-4      /* Margin */
.gap-4    /* Gap between flex/grid items */
.space-y-4 /* Vertical spacing for children */
```

### Sizing
```css
.w-full   /* Width 100% */
.max-w-2xl /* Max width 896px */
.h-12     /* Height */
```

### Typography
```css
.font-display  /* Space Grotesk */
.font-mono     /* JetBrains Mono */
.text-xl       /* Large text */
.font-bold     /* Bold weight */
```

### Animations
```css
.animate-pulse    /* Pulsing animation */
.animate-spin     /* Spinning animation */
.entrance-fade    /* Fade in animation */
.entrance-slide-up /* Slide up animation */
```

### States
```css
.hover\:shadow-lg    /* Hover effect */
.disabled\:opacity-50 /* Disabled state */
.focus\:ring-primary /* Focus ring */
```

---

## Accessibility Checklist for Each Component

### Buttons
- [ ] Has descriptive text (not just icon)
- [ ] Keyboard accessible (Tab key)
- [ ] Focus visible
- [ ] Not disabled unnecessarily

### Forms
- [ ] Labels associated with inputs (`<label for>`)
- [ ] Error messages linked via aria-describedby
- [ ] Required indicator visible
- [ ] Validation on blur, not on type

### Modals
- [ ] Focus trapped inside
- [ ] Escape key closes it
- [ ] `role="dialog"` set
- [ ] Title linked via aria-labelledby

### Navigation
- [ ] Semantic `<nav>` element
- [ ] Current page highlighted
- [ ] Keyboard navigation works
- [ ] `aria-current="page"` for active link

### Tables
- [ ] `<thead>` and `<tbody>` used
- [ ] Header row with `<th>`
- [ ] `scope="col"` on headers
- [ ] Row headers for complex tables

---

## Performance Tips

1. **Lazy load modals** - Only show when needed
2. **Use skeleton loaders** - Perceived performance feels faster
3. **Debounce search input** - Avoid excessive API calls
4. **Code split routes** - Reduce bundle size
5. **Prefers reduced motion** - Respect user preferences

---

## Dark Mode Testing

```bash
# Check what it looks like
# Go to Settings > General > Appearance > Dark
# Or enable dark mode in DevTools
```

All components automatically adapt.

---

## Troubleshooting

### Component not showing?
- Check it's imported in `components/index.js`
- Verify Vue DevTools shows it's registered
- Check for console errors

### Styles not applying?
- Use CSS variables, not hardcoded colors
- Check scoped vs global styles
- Ensure Tailwind built correctly

### Color looks wrong?
- Check if dark mode is enabled
- Verify contrast meets WCAG AA (4.5:1)
- Test with colorblind simulator

### Animation feels choppy?
- Check if prefers-reduced-motion is honored
- Verify 60fps (DevTools Performance tab)
- Reduce animation complexity

---

## Need More Help?

- See [UI_UX_BEST_PRACTICES.md](../UI_UX_BEST_PRACTICES.md) - Complete reference
- See [STYLE_GUIDE.md](../STYLE_GUIDE.md) - Detailed component docs
- See [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Before/after examples
- Check `src/components/ui/` - Implementation examples

---

**Version:** 2.0  
**Last Updated:** 2026-07-15
