# Components Directory - Architecture & Organization

## Directory Structure

```
src/components/
├── ui/                          # ✅ NEW: Unified UI component library
│   ├── Button.vue               # Primary action component
│   ├── Card.vue                 # Content container with slots
│   ├── Modal.vue                # Dialog/modal component
│   ├── Alert.vue                # Status/notification component
│   ├── Badge.vue                # Small status labels
│   ├── Input.vue                # Unified form input
│   ├── Select.vue               # Dropdown/select component
│   └── README.md                # UI component documentation
│
├── layout/                       # ✅ NEW: Layout helper components
│   ├── PageHeader.vue           # Standardized page header
│   ├── PageContent.vue          # Page content wrapper
│   └── README.md                # Layout component documentation
│
├── Layout.vue                   # Main app layout (sidebar + topbar)
├── Background.vue               # ✅ CONSOLIDATED: Unified background component
├── CommandPalette.vue           # Global search/command palette
├── ThemeToggle.vue              # Light/dark theme switcher
├── Logo.vue                     # App logo component
├── Toast.vue                    # Toast notification system
├── ErrorBoundary.vue            # Error boundary component
├── LoadingScreen.vue            # Loading/skeleton states
│
├── admin/                       # Admin-specific components
├── study/                       # Study feature components
│
├── Advanced components (less frequently used)
│   ├── CampusMap3D.vue
│   ├── GeofenceAttendance.vue
│   ├── StudentIDCard.vue
│   ├── ModalFace.vue
│   ├── AIChatInput.vue
│   ├── TableRow.vue
│   └── CountUp.vue
│
├── index.js                     # ✅ Component export/barrel file
└── README.md                    # This file
```

---

## Component Categories

### 1. **UI Components** (`ui/`)
Basic, reusable building blocks for user interfaces.

- **Button.vue** - Actions and interactions
- **Card.vue** - Content containers
- **Modal.vue** - Important dialogs
- **Alert.vue** - Notifications/status
- **Badge.vue** - Small labels
- **Input.vue** - Text inputs
- **Select.vue** - Dropdowns

**Usage:** Import and use directly in templates (auto-registered globally)

```vue
<Button variant="primary">Click me</Button>
<Card hover>Content</Card>
<Alert type="success">Success!</Alert>
```

### 2. **Layout Components** (`layout/`)
Components for organizing page structure.

- **PageHeader.vue** - Title, subtitle, and actions
- **PageContent.vue** - Content wrapper with consistent spacing

**Usage:** Wrap all page content with these

```vue
<PageContent>
  <PageHeader title="Page Title">
    <template #actions>
      <Button>Action</Button>
    </template>
  </PageHeader>
  
  <!-- Page content -->
</PageContent>
```

### 3. **Core Components**
Essential app-level components.

- **Layout.vue** - Main app shell (sidebar, topbar, content area)
- **Background.vue** - Unified background animations (orbs, grid, neural network)
- **CommandPalette.vue** - Global search/command input
- **ThemeToggle.vue** - Light/dark mode switcher
- **Toast.vue** - System notifications
- **ErrorBoundary.vue** - Error handling
- **LoadingScreen.vue** - Loading/skeleton UI

### 4. **Feature Components**
Components for specific features.

- `admin/` - Admin console tabs
- `study/` - Study features
- Advanced 3D/interactive components

---

## Key Improvements Over Previous Structure

### ✅ Before
- 27 scattered components at root level
- No clear organization
- Inconsistent naming patterns
- Mixed concerns (UI, layout, features)
- Duplicate code (multiple background components)
- No unified component library

### ✅ After
- **Organized by concern:** UI, Layout, Core, Features
- **Consistent patterns:** All UI components follow same structure
- **Single responsibility:** Each component does one thing well
- **Consolidated:** Similar components merged (e.g., Background2D/3D/Neural → Background)
- **Auto-registered:** All components available globally
- **Documented:** Style guide + migration guide + examples
- **Maintainable:** Easy to find, extend, and update components

---

## Using Components

### Auto-Registration
All components in `index.js` are automatically registered globally in `main.js`:

```vue
<!-- ✅ Available anywhere - no import needed -->
<Button>Click</Button>
<Card>Content</Card>
<Alert>Message</Alert>
```

### Manual Import (if needed)
```vue
<script setup>
import { Button, Card, Modal } from '@/components'
// Or import specific component
import Button from '@/components/ui/Button.vue'
</script>
```

---

## Component Props & Events

### Universal Props
Most components accept standard HTML attributes via `v-bind="$attrs"`:

```vue
<!-- Pass through standard attributes -->
<Button id="submit-btn" data-test="submit" class="custom-class" />
<Input id="email-input" name="email" autocomplete="email" />
```

### Controlled State
Components use `v-model` for state management:

```vue
<Input v-model="username" />
<Select v-model="department" />
<Modal v-model="isOpen" />
```

---

## Styling & Customization

### Component Variants
Each component has preset variants (no custom CSS needed):

```vue
<!-- Button variants -->
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>

<!-- Card variants -->
<Card variant="default">Default</Card>
<Card variant="elevated">Elevated</Card>

<!-- Alert types -->
<Alert type="success">Success</Alert>
<Alert type="error">Error</Alert>
```

### Sizing
Components support multiple sizes:

```vue
<!-- Button sizes -->
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

<!-- Badge sizes -->
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>
```

### Tailwind Integration
Combine with Tailwind utility classes for layout:

```vue
<div class="flex gap-4">
  <Button variant="ghost">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>

<div class="grid grid-cols-2 gap-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</div>
```

---

## Creating New Components

When you need a new component:

1. **Determine type:** Is it UI, Layout, or Feature-specific?
2. **Check existing components:** Could you extend an existing one?
3. **Place in appropriate folder:**
   - UI component? → `ui/ComponentName.vue`
   - Layout helper? → `layout/ComponentName.vue`
   - Feature-specific? → `admin/` or `study/` folder
   - Core app component? → Root `components/` directory

4. **Follow patterns:**
   ```vue
   <template>
     <!-- Template -->
   </template>

   <script setup>
   defineProps({
     // Document all props with types and defaults
   })
   defineEmits(['event-name'])
   </script>

   <style scoped>
   /* Scoped styles - use CSS variables for theming */
   .component {
     background: var(--color-bg-secondary);
     color: var(--color-text-primary);
   }
   </style>
   ```

5. **Export from index.js:**
   ```js
   export { default as ComponentName } from './path/ComponentName.vue'
   ```

6. **Document in STYLE_GUIDE.md**

---

## Color System

All components use CSS custom properties for theming (light/dark mode support).

**Primary Colors:**
- `--color-primary` - Brand color
- `--color-primary-soft` - Soft background
- `--color-primary-light` - Lighter variant
- `--color-primary-dark` - Darker variant

**Status Colors:**
- `--color-success` - Success states
- `--color-error` - Error/danger states
- `--color-warning` - Warning states
- `--color-info` - Informational states

**Semantic:**
- `--color-bg` - Main background
- `--color-bg-secondary` - Secondary background
- `--color-text-primary` - Primary text
- `--color-text-secondary` - Secondary text
- `--color-border` - Borders

Set in `src/index.css` with light/dark variants.

---

## Responsive Design

All components are mobile-first and responsive:

- Buttons adapt to screen size
- Cards stack on mobile
- Forms use full width on small screens
- Modal respects viewport constraints
- Touch-friendly sizing

Tested on:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)

---

## Accessibility

Components follow WCAP 2.1 guidelines:

- Semantic HTML (`<button>`, `<label>`, etc.)
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Color contrast (WCAG AA)
- Screen reader support

---

## Dark Mode Support

All components automatically support light/dark themes:

- Set `data-theme="dark"` on root element
- Or use class `dark` on `html`
- CSS variables automatically switch
- No component changes needed

```vue
<!-- Dark mode toggle handled by ThemeToggle component -->
<ThemeToggle />
```

---

## Migration from Old Structure

See [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) for detailed examples of updating pages.

Quick reference:
- `.btn` → `<Button>`
- `.card` → `<Card>`
- Custom inputs → `<Input>`, `<Select>`
- Inline alerts → `<Alert>`
- Status labels → `<Badge>`
- Inline modals → `<Modal>`

---

## Performance

Components are optimized for performance:

- **Tree-shakeable** - Only exported components are included
- **Lazy-loaded** - Admin/study components imported as needed
- **Minimal re-renders** - Proper prop/event handling
- **CSS-in-JS** - Scoped styles prevent conflicts
- **Animation-friendly** - GPU-accelerated transforms

---

## Testing Components

Example test structure:

```js
// Button.test.js
import { mount } from '@vue/test-utils'
import Button from '@/components/ui/Button.vue'

describe('Button', () => {
  it('renders primary variant', () => {
    const wrapper = mount(Button, {
      props: { variant: 'primary' },
      slots: { default: 'Click me' }
    })
    expect(wrapper.find('button').classes()).toContain('btn-primary')
  })

  it('emits click event', () => {
    const wrapper = mount(Button)
    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

---

## Documentation Files

- **STYLE_GUIDE.md** - Comprehensive component documentation with examples
- **MIGRATION_GUIDE.md** - How to update existing pages (before/after)
- **components/ui/README.md** - UI component details
- **components/layout/README.md** - Layout component details

---

## Questions?

- Check `STYLE_GUIDE.md` for usage examples
- Look at component source files for implementation details
- Review existing pages that use components correctly
- Check test files for usage patterns

---

**Last Updated:** 2026-07-15  
**Component Count:** 30+ documented components  
**Architecture Pattern:** Modular, scalable, single-responsibility
