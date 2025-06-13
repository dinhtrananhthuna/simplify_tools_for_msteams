# 📁 Project Structure

## Overview
Dự án MS Teams Tools Suite được cấu trúc theo Next.js App Router best practices với TypeScript và Shadcn/ui.

## Directory Structure

```
simplify_tools_for_msteams/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout với Toaster
│   ├── page.tsx                 # Homepage
│   ├── globals.css              # Global styles với Shadcn/ui + custom Teams styles
│   ├── admin/                   # Admin panel routes
│   │   ├── layout.tsx          # Admin layout wrapper
│   │   ├── dashboard/          # Dashboard page
│   │   ├── tools/              # Tools management
│   │   │   └── pr-notifier/    # PR Notifier configuration
│   │   ├── auth/               # Teams authentication
│   │   ├── settings/           # Global settings
│   │   └── webhooks/           # Webhook management
│   └── api/                     # API routes
│       ├── auth/teams/         # Teams OAuth endpoints
│       ├── teams/chats/        # Teams chat APIs
│       ├── tools/pr-notifier/  # PR Notifier APIs
│       ├── webhooks/           # Webhook handlers
│       └── debug/              # Debug utilities
│
├── components/                   # Shared React components
│   ├── ui/                      # Shadcn/ui components
│   │   ├── toast.tsx           # Toast notifications
│   │   ├── toaster.tsx         # Toast provider
│   │   ├── button.tsx          # Button component
│   │   ├── input.tsx           # Input component
│   │   ├── loading.tsx         # Loading components
│   │   └── status-badge.tsx    # Status badge component
│   ├── layout/                  # Layout components
│   │   └── admin-layout.tsx    # Reusable admin layout
│   ├── forms/                   # Form components (empty - future use)
│   └── features/                # Feature-specific components (empty - future use)
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts             # Toast hook from Shadcn/ui
│
├── lib/                         # Utility functions & configurations
│   ├── utils.ts                 # CN utility for class merging
│   ├── db.ts                    # Database utilities
│   ├── auth.ts                  # Authentication utilities
│   ├── teams.ts                 # Teams API integration (complex)
│   └── teams-simple.ts          # Simplified Teams API (preferred)
│
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All type definitions
│
├── scripts/                      # Database & utility scripts
│   ├── setup-db.ts             # Local development setup
│   └── setup-production-db.ts  # Production setup
│
└── docs/                        # Documentation
    ├── project-overview.md      # Project overview
    └── project-structure.md     # This file
```

## Key Improvements Made

### ✅ **Next.js Best Practices**
- ✅ Proper App Router structure
- ✅ Path aliases (`@/` instead of relative paths)
- ✅ Server/Client components properly marked
- ✅ Consistent import patterns

### ✅ **Component Organization**
- ✅ Shadcn/ui components in `components/ui/`
- ✅ Layout components separated in `components/layout/`
- ✅ Reusable AdminLayout component
- ✅ Prepared structure for forms and features

### ✅ **TypeScript & Tooling**
- ✅ All imports use path aliases
- ✅ Proper TypeScript configuration
- ✅ Type checking passes without errors
- ✅ Consistent component patterns

### ✅ **UI/UX Improvements**
- ✅ Shadcn/ui Toast notifications (professional)
- ✅ Consistent Teams purple branding
- ✅ Proper loading states
- ✅ Accessible components with ARIA

### ✅ **Code Quality**
- ✅ No duplicate code
- ✅ Consistent naming conventions
- ✅ Proper separation of concerns
- ✅ Clean import structure

## Component Usage Examples

### Using Toast Notifications
```tsx
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

// Success toast
toast({
  variant: 'success',
  title: 'Thành công!',
  description: 'Dữ liệu đã được lưu'
})

// Error toast
toast({
  variant: 'destructive', 
  title: 'Lỗi!',
  description: 'Không thể kết nối'
})
```

### Using Button Component
```tsx
import { Button } from '@/components/ui/button'

<Button variant="teams" size="lg">
  Save Configuration
</Button>
```

### Using Loading Components
```tsx
import { Loading, LoadingSpinner } from '@/components/ui/loading'

<Loading text="Đang tải dữ liệu..." />
<LoadingSpinner size="sm" />
```

## Path Aliases

All imports should use path aliases defined in `tsconfig.json`:

- `@/` → Root directory
- `@/components/*` → Components
- `@/lib/*` → Utilities
- `@/types/*` → Type definitions
- `@/hooks/*` → Custom hooks
- `@/app/*` → App directory

## Files Status

### ✅ **Active Files**
- All files in `app/`, `components/`, `lib/`, `types/`, `hooks/`
- Both `teams.ts` and `teams-simple.ts` (different use cases)
- All API routes and pages

### 🗑️ **Removed Files** 
- Custom toast provider (replaced with Shadcn/ui)
- Custom alert component (replaced with Shadcn/ui)
- Build cache files (`tsconfig.tsbuildinfo`)

### 📦 **Dependencies**
- All required Shadcn/ui dependencies installed
- Path aliases properly configured
- TypeScript strict mode enabled

---

**🎯 Result:** Clean, maintainable codebase following Next.js best practices với professional UI components và proper TypeScript setup! 