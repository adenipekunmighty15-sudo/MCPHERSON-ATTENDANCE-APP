# UI Component Library - Migration Guide

## Quick Overview

The app now has a unified, well-organized component library to replace all scattered UI elements. This document guides you through migrating existing pages to use the new components.

---

## What Changed

### Before (Scattered Styles)
```vue
<!-- Old approach - scattered, inconsistent -->
<template>
  <div class="page">
    <h1>My Page</h1>
    <button class="btn btn-primary">Action</button>
    <div class="card card-hover p-5">
      <p style="background:var(--color-primary-soft);padding:16px">Status</p>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 20px; }
</style>
```

### After (Unified Components)
```vue
<!-- New approach - consistent, reusable -->
<template>
  <PageContent>
    <PageHeader title="My Page">
      <template #actions>
        <Button variant="primary">Action</Button>
      </template>
    </PageHeader>
    
    <Card hover>
      <Alert type="info">Status message</Alert>
    </Card>
  </PageContent>
</template>
```

---

## Component Availability

All components are **auto-registered globally**. You don't need to import them in your templates:

```vue
<!-- ✅ Just use the component - no import needed! -->
<Button>Click me</Button>
<Card>Content</Card>
<Alert type="success">Success!</Alert>
```

If you need to import for script usage:
```vue
<script setup>
import { Button, Card, Alert } from '@/components'
</script>
```

---

## Migration by Component Type

### 1. Buttons

**Old:**
```vue
<button class="btn btn-primary">Save</button>
<button class="btn btn-secondary btn-sm">Cancel</button>
<button :style="{ background: 'var(--color-primary)' }">Delete</button>
```

**New:**
```vue
<Button variant="primary">Save</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger">Delete</Button>
```

**Available Variants:** `primary`, `secondary`, `ghost`, `danger`, `success`, `warning`  
**Available Sizes:** `xs`, `sm`, `md`, `lg`, `xl`

---

### 2. Cards

**Old:**
```vue
<div class="card p-5">Content</div>
<div class="card card-hover card-bordered">Hoverable card</div>
<div :style="{ background: 'var(--color-bg-secondary)' }">Custom card</div>
```

**New:**
```vue
<Card>Content</Card>
<Card hover bordered>Hoverable card</Card>
<Card variant="elevated">Elevated card</Card>
```

**With Header/Footer:**
```vue
<Card>
  <template #header>
    <h2>Card Title</h2>
  </template>
  
  <p>Card content here</p>
  
  <template #footer>
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </template>
</Card>
```

---

### 3. Forms & Input

**Old:**
```vue
<div>
  <label>Username</label>
  <input type="text" v-model="username" placeholder="Enter..." />
</div>
<p v-if="error" style="color: #ef4444">{{ error }}</p>
```

**New:**
```vue
<Input 
  v-model="username" 
  label="Username" 
  placeholder="Enter username"
  :error="error"
  hint="3-20 characters"
/>

<Select
  v-model="department"
  label="Department"
  :options="departmentOptions"
/>
```

---

### 4. Alerts & Notifications

**Old:**
```vue
<div :style="{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '8px' }">
  <p>Success message</p>
</div>
```

**New:**
```vue
<Alert type="success" title="Success" closable @close="hideAlert">
  Your changes have been saved.
</Alert>

<Alert type="error" title="Error">
  Something went wrong. Please try again.
</Alert>

<Alert type="warning">
  This action cannot be undone.
</Alert>
```

**Available Types:** `success`, `error`, `warning`, `info`

---

### 5. Status Badges

**Old:**
```vue
<span :style="{ background: 'var(--color-primary-soft)', padding: '4px 12px' }">
  Active
</span>
```

**New:**
```vue
<Badge variant="primary">Active</Badge>
<Badge variant="success" size="sm">Approved</Badge>
<Badge variant="error">Critical</Badge>
```

**Available Variants:** `primary`, `secondary`, `success`, `error`, `warning`, `info`  
**Available Sizes:** `sm`, `md`, `lg`

---

### 6. Modals

**Old:**
```vue
<div v-if="showModal" class="modal-overlay" @click="showModal = false">
  <div class="modal-content" @click.stop>
    <h2>Modal Title</h2>
    <p>Modal content</p>
    <button @click="showModal = false">Close</button>
  </div>
</div>
```

**New:**
```vue
<Modal v-model="showModal" title="Modal Title">
  <p>Modal content</p>
  
  <template #footer>
    <Button variant="ghost" @click="showModal = false">Cancel</Button>
    <Button @click="saveChanges">Save</Button>
  </template>
</Modal>

<script setup>
const showModal = ref(false)
</script>
```

---

### 7. Page Layout

**Old:**
```vue
<template>
  <div class="page-wrapper">
    <h1>Page Title</h1>
    <div class="page-content">
      <!-- content -->
    </div>
  </div>
</template>

<style scoped>
.page-wrapper { padding: 32px; }
.page-content { max-width: 1400px; }
</style>
```

**New:**
```vue
<template>
  <PageContent>
    <PageHeader 
      title="Page Title"
      subtitle="Optional subtitle"
    >
      <template #actions>
        <Button variant="primary">Add New</Button>
      </template>
    </PageHeader>

    <!-- Your content here -->
  </PageContent>
</template>
```

---

## Step-by-Step Migration Example

### Before
```vue
<template>
  <div class="profile-page">
    <div class="header">
      <h1>Profile Settings</h1>
      <button class="btn btn-secondary" @click="cancel">Cancel</button>
      <button class="btn btn-primary" @click="save">Save</button>
    </div>

    <div class="form-section">
      <div class="form-group">
        <label>Full Name</label>
        <input v-model="name" type="text" placeholder="Enter name" />
      </div>

      <div class="form-group">
        <label>Department</label>
        <select v-model="department">
          <option>Select...</option>
          <option value="cs">Computer Science</option>
          <option value="eng">Engineering</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="alert-error">
      {{ error }}
    </div>

    <div v-if="success" class="alert-success">
      Changes saved successfully!
    </div>
  </div>
</template>

<style scoped>
.profile-page { padding: 32px; }
.header { display: flex; justify-content: space-between; margin-bottom: 24px; }
.form-section { margin: 20px 0; }
.form-group { margin-bottom: 16px; }
.alert-error { background: rgba(239, 68, 68, 0.1); color: #dc2626; padding: 16px; }
.alert-success { background: rgba(16, 185, 129, 0.1); color: #047857; padding: 16px; }
</style>
```

### After
```vue
<template>
  <PageContent narrow>
    <PageHeader 
      title="Profile Settings"
      subtitle="Manage your account information"
    >
      <template #actions>
        <Button variant="ghost" @click="cancel">Cancel</Button>
        <Button variant="primary" @click="save">Save Changes</Button>
      </template>
    </PageHeader>

    <Card>
      <Input
        v-model="name"
        label="Full Name"
        placeholder="Enter your full name"
        required
      />

      <Select
        v-model="department"
        label="Department"
        placeholder="Select department"
        :options="[
          { label: 'Computer Science', value: 'cs' },
          { label: 'Engineering', value: 'eng' }
        ]"
      />
    </Card>

    <Alert 
      v-if="error" 
      type="error" 
      title="Error" 
      closable
      @close="error = null"
    >
      {{ error }}
    </Alert>

    <Alert 
      v-if="success" 
      type="success" 
      title="Success"
      closable
      @close="success = null"
    >
      Your changes have been saved successfully!
    </Alert>
  </PageContent>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')
const department = ref('')
const error = ref(null)
const success = ref(null)

function cancel() {
  // Handle cancel
}

function save() {
  // Handle save
}
</script>
```

---

## Common Patterns

### Form with Validation
```vue
<Card>
  <template #header>
    <h2>Sign Up</h2>
  </template>

  <div class="form-space">
    <Input
      v-model="form.email"
      label="Email"
      type="email"
      :error="errors.email"
      placeholder="your@email.com"
      required
      @blur="validateEmail"
    />

    <Input
      v-model="form.password"
      label="Password"
      type="password"
      :error="errors.password"
      hint="At least 8 characters"
      required
    />

    <Select
      v-model="form.role"
      label="Role"
      :options="roles"
      :error="errors.role"
    />
  </div>

  <template #footer>
    <Button variant="ghost">Cancel</Button>
    <Button 
      variant="primary"
      :loading="isSubmitting"
      @click="submit"
    >
      Create Account
    </Button>
  </template>
</Card>

<style scoped>
.form-space {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
```

### Confirmation Dialog
```vue
<Modal v-model="showConfirm" title="Confirm Delete">
  <p>Are you sure you want to delete this item?</p>
  <p style="margin-top: 8px; font-size: 14px; color: var(--color-text-secondary);">
    This action cannot be undone.
  </p>

  <template #footer>
    <Button variant="ghost" @click="showConfirm = false">
      Cancel
    </Button>
    <Button 
      variant="danger"
      :loading="isDeleting"
      @click="confirmDelete"
    >
      Delete
    </Button>
  </template>
</Modal>
```

### Data Table with Actions
```vue
<Card>
  <template #header>
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2>Users</h2>
      <Button size="sm" variant="primary">Add User</Button>
    </div>
  </template>

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in users" :key="user.id">
        <td>{{ user.name }}</td>
        <td>
          <Badge :variant="user.active ? 'success' : 'warning'">
            {{ user.active ? 'Active' : 'Inactive' }}
          </Badge>
        </td>
        <td>
          <div style="display: flex; gap: 8px;">
            <Button size="sm" variant="ghost">Edit</Button>
            <Button size="sm" variant="danger">Delete</Button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</Card>
```

---

## Spacing Utilities

The app uses a 4px-based spacing scale. Use these CSS classes for consistent spacing:

- `gap-1` to `gap-20` - Gap between flex children
- `p-1` to `p-20` - Padding
- `m-1` to `m-20` - Margin
- `mt-`, `mb-`, `ml-`, `mr-` - Directional margins

Or use inline Tailwind:
```vue
<div class="p-6 gap-4">Content</div>
<div class="mt-8 mb-4">Content</div>
```

---

## Tips for Clean Migration

1. **Migrate page by page** - Don't try to refactor everything at once
2. **Use PageContent wrapper** - Every page should use this for consistent layout
3. **Replace inline styles** - Use component props instead of inline `:style`
4. **Consolidate spacing** - Use Tailwind spacing classes instead of inline values
5. **Test responsiveness** - All components are mobile-friendly by default
6. **Check dark mode** - All components support dark theme automatically

---

## Questions or Issues?

1. Check the [STYLE_GUIDE.md](../STYLE_GUIDE.md) for detailed component documentation
2. Look at existing pages that have been migrated for examples
3. Refer to component files in `src/components/ui/` and `src/components/layout/`

---

## Checklist for Your Page

- [ ] Use `PageContent` as root wrapper
- [ ] Use `PageHeader` for page title/actions
- [ ] Replace all `.btn` classes with `<Button>` component
- [ ] Replace all `.card` divs with `<Card>` component
- [ ] Replace form inputs with `<Input>` component
- [ ] Replace alerts/notifications with `<Alert>` component
- [ ] Remove inline styles for colors/backgrounds
- [ ] Remove custom page wrapper styles
- [ ] Test in light and dark modes
- [ ] Test on mobile devices
