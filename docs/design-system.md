# 🎨 MS Teams Tools Suite - Design System

## 📋 Mục lục
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
- [Patterns](#patterns)
- [AI Guidelines](#ai-guidelines)

---

## 🎨 Color Palette

### Primary Colors (Teams Brand)
```css
--teams-purple: #6264A7    /* Primary brand color */
--teams-blue: #2E8BE6      /* Secondary accent */
--teams-green: #107C10     /* Success states */
--teams-orange: #F59E0B    /* Warning states */
--teams-red: #DC2626       /* Error states */
```

### Semantic Colors
```css
/* Status Colors */
.status-success: bg-green-50 text-green-700 border-green-200
.status-warning: bg-yellow-50 text-yellow-700 border-yellow-200
.status-error: bg-red-50 text-red-700 border-red-200
.status-info: bg-blue-50 text-blue-700 border-blue-200

/* Webhook Status */
.webhook-success: bg-green-100 text-green-600
.webhook-failed: bg-red-100 text-red-600
.webhook-teams-sent: bg-green-50 text-green-700 border-green-200
```

---

## 📝 Typography

### Font Sizes (Consistent Scale)
```css
/* Headers */
.text-page-title: text-2xl font-bold text-gray-900
.text-section-title: text-lg font-medium text-gray-900
.text-card-title: text-base font-medium text-gray-900

/* Body Text */
.text-body: text-sm text-gray-700
.text-meta: text-xs text-gray-500
.text-caption: text-xs text-gray-400

/* Interactive */
.text-link: text-teams-purple hover:text-teams-purple/80
.text-button: text-sm font-medium
```

### Typography Hierarchy
1. **Page Title**: `text-2xl font-bold` (Dashboard, Webhooks, etc.)
2. **Section Title**: `text-lg font-medium` (Recent Activity, Tools Overview)
3. **Card Title**: `text-base font-medium` (Tool names, Event types)
4. **Body Text**: `text-sm` (Descriptions, content)
5. **Meta Info**: `text-xs` (Timestamps, IDs, secondary info)

---

## 📐 Spacing & Layout

### Container Patterns
```css
/* Page Container */
.page-container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

/* Content Spacing */
.content-spacing: space-y-6
.section-spacing: space-y-4
.item-spacing: space-y-2

/* Card Padding */
.card-padding-lg: p-6
.card-padding-md: p-4
.card-padding-sm: p-3
```

### Grid Systems
```css
/* Dashboard Grid */
.stats-grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
.content-grid: grid grid-cols-1 lg:grid-cols-2 gap-6

/* List Items */
.list-compact: space-y-2
.list-comfortable: space-y-3
.list-spacious: space-y-4
```

---

## 🧩 Components

### 1. Cards
```tsx
// Standard Card
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-medium text-gray-900 mb-4">Title</h3>
  <div className="space-y-4">Content</div>
</div>

// Compact Card (for lists)
<div className="border border-gray-100 rounded-md p-3 hover:bg-gray-50 transition-colors">
  Content
</div>
```

### 2. Status Badges
```tsx
// Success
<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-600">
  success
</span>

// Teams Message Sent
<div className="flex items-center space-x-1 bg-green-50 border border-green-200 rounded px-2 py-0.5">
  <span className="text-green-600 text-xs">💬</span>
  <span className="text-xs text-green-700 font-medium">Teams sent</span>
</div>
```

### 3. Loading States
```tsx
// Page Loading
<div className="flex items-center justify-center py-12">
  <div className="text-center">
    <div className="w-8 h-8 border-4 border-teams-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    <p className="text-gray-600">Loading...</p>
  </div>
</div>

// Inline Loading
<div className="w-4 h-4 border-2 border-teams-purple border-t-transparent rounded-full animate-spin"></div>
```

### 4. Buttons
```tsx
// Primary
<button className="bg-teams-purple hover:bg-teams-purple/90 text-white font-medium py-2 px-4 rounded-lg transition-colors">
  Primary Action
</button>

// Secondary
<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
  Secondary Action
</button>
```

---

## 🔄 Patterns

### 1. List Items (Webhooks, Tools, etc.)
```tsx
<div className="space-y-2">
  {items.map((item) => (
    <div key={item.id} className="border border-gray-100 rounded-md p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="text-base flex-shrink-0">{icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
              <span className="text-xs text-gray-400">from</span>
              <span className="text-xs text-gray-600 font-medium">{source}</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <p className="text-xs text-gray-500">{meta}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {statusBadge}
          {additionalInfo}
        </div>
      </div>
      {errorMessage && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  ))}
</div>
```

### 2. Page Header
```tsx
<div className="mb-6">
  <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
  <p className="text-gray-600 mt-1">{pageDescription}</p>
</div>
```

### 3. Stats Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
</div>
```

---

## 🤖 AI Guidelines

### Khi generate code, LUÔN LUÔN sử dụng:

#### 1. **Consistent Class Names**
```tsx
// ✅ ĐÚNG - Sử dụng pattern chuẩn
<div className="border border-gray-100 rounded-md p-3 hover:bg-gray-50 transition-colors">

// ❌ SAI - Không consistent
<div className="border-gray-200 rounded-lg p-4 hover:bg-gray-100">
```

#### 2. **Typography Scale**
```tsx
// ✅ ĐÚNG - Sử dụng scale chuẩn
<h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
<h2 className="text-lg font-medium text-gray-900">Section Title</h2>
<h3 className="text-sm font-medium text-gray-900">Card Title</h3>
<p className="text-xs text-gray-500">Meta info</p>

// ❌ SAI - Random sizes
<h1 className="text-3xl font-semibold">Title</h1>
<p className="text-base">Meta</p>
```

#### 3. **Status Colors**
```tsx
// ✅ ĐÚNG - Sử dụng semantic colors
<span className="bg-green-100 text-green-600">success</span>
<span className="bg-red-100 text-red-600">failed</span>

// ❌ SAI - Random colors
<span className="bg-emerald-200 text-emerald-800">success</span>
```

#### 4. **Spacing Pattern**
```tsx
// ✅ ĐÚNG - Consistent spacing
<div className="space-y-2">        // Compact lists
<div className="space-y-4">        // Section spacing
<div className="space-y-6">        // Page content spacing

// ❌ SAI - Random spacing
<div className="space-y-3">
<div className="space-y-5">
```

#### 5. **Loading States**
```tsx
// ✅ ĐÚNG - Sử dụng teams-purple
<div className="w-4 h-4 border-2 border-teams-purple border-t-transparent rounded-full animate-spin"></div>

// ❌ SAI - Random colors
<div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
```

### 🎯 **Checklist cho mọi component:**

- [ ] Sử dụng `border-gray-100` cho borders nhẹ
- [ ] Sử dụng `border-gray-200` cho borders đậm hơn
- [ ] Sử dụng `rounded-md` cho compact items, `rounded-lg` cho cards lớn
- [ ] Sử dụng `p-3` cho compact, `p-6` cho cards lớn
- [ ] Sử dụng `space-y-2` cho lists, `space-y-6` cho page content
- [ ] Sử dụng `text-teams-purple` cho links và primary actions
- [ ] Sử dụng `hover:bg-gray-50` cho interactive items
- [ ] Sử dụng `transition-colors` cho smooth interactions
- [ ] Sử dụng `text-xs` cho meta info, `text-sm` cho content
- [ ] Sử dụng `font-medium` cho titles, `font-bold` cho page headers

### 📝 **Template cho AI:**

Khi tạo component mới, sử dụng template này:

```tsx
// Page Layout
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  {/* Page Header */}
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="text-gray-600 mt-1">{description}</p>
  </div>

  {/* Content */}
  <div className="space-y-6">
    {/* Cards/Sections */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">{sectionTitle}</h2>
      
      {/* List Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-100 rounded-md p-3 hover:bg-gray-50 transition-colors">
            {/* Item content */}
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

---

## 🔧 Implementation

### 1. Tạo Custom CSS Classes
Thêm vào `globals.css`:

```css
@layer components {
  /* Layout */
  .page-layout {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
  }
  
  .page-header {
    @apply mb-6;
  }
  
  .page-title {
    @apply text-2xl font-bold text-gray-900;
  }
  
  .page-description {
    @apply text-gray-600 mt-1;
  }
  
  /* Cards */
  .card-standard {
    @apply bg-white border border-gray-200 rounded-lg p-6 shadow-sm;
  }
  
  .card-compact {
    @apply border border-gray-100 rounded-md p-3 hover:bg-gray-50 transition-colors;
  }
  
  /* Lists */
  .list-compact {
    @apply space-y-2;
  }
  
  .list-comfortable {
    @apply space-y-4;
  }
  
  /* Status */
  .status-success {
    @apply bg-green-100 text-green-600;
  }
  
  .status-failed {
    @apply bg-red-100 text-red-600;
  }
  
  .teams-badge {
    @apply flex items-center space-x-1 bg-green-50 border border-green-200 rounded px-2 py-0.5;
  }
}
```

### 2. Component Templates
Tạo folder `components/templates/` với các template chuẩn.

### 3. Linting Rules
Thêm ESLint rules để enforce design system.

---

**🎯 Mục tiêu: Mọi trang trong website đều có cùng look & feel, spacing, colors, và patterns!** 