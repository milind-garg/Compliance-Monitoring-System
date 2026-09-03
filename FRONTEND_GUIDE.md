# Frontend Development Guide — Coal Mine Governance Platform

## Claude Code Prompt (Frontend — Member A)

---

> **Instructions for Claude Code:** This guide covers the **frontend** portion of the Coal Mine Governance & Compliance Monitoring System. Read this fully before starting. Ask clarifying questions from Section 1 before implementing. Proceed phase by phase. Always test in a browser before marking anything complete.

---

## Table of Contents

1. [Clarifying Questions](#1-clarifying-questions)
2. [Frontend Overview](#2-frontend-overview)
3. [Tech Stack](#3-tech-stack)
4. [UI/UX Design Plan](#4-ui-ux-design-plan)
5. [Folder Structure](#5-folder-structure)
6. [Web App — Pages & Components](#6-web-app--pages--components)
7. [Mobile App — Screens & Offline](#7-mobile-app--screens--offline)
8. [State Management & API Layer](#8-state-management--api-layer)
9. [Page-Level Feature Checklists](#9-page-level-feature-checklists)
10. [Frontend Testing](#10-frontend-testing)
11. [Performance & Optimization](#11-performance--optimization)
12. [Development Phases (Frontend Tasks)](#12-development-phases)
13. [Git Workflow for Member A](#13-git-workflow)

---

## 1. Clarifying Questions

> **Claude Code: Ask me these before starting frontend work:**
>
> 1. Do you have any reference UI screenshots or Figma designs, or should I design from scratch using the spec below?
> 2. Is the backend already running with API docs at `/docs`? If yes, what's the base URL?
> 3. Mobile platform: React Native (Expo) for both Android + iOS, or Android-only?
> 4. Do you have brand assets (logo, color preferences) or should I use the industrial navy/orange palette defined here?
> 5. Any specific charting library preference, or should I go with Recharts as specified?
> 6. For maps — Leaflet + OpenStreetMap tiles, or do you have a Mapbox token?
> 7. Should the web app support dark mode from day one, or light-only for MVP?

---

## 2. Frontend Overview

### 2.1 What We're Building

**Web Application** — Admin dashboards, compliance management, inspections, violations, reports, maps, AI insights. Used by mine managers, subsidiary admins, and regulatory authorities on desktop/laptop.

**Mobile Application** — Field operations app for inspectors and field officers. Offline-first. Camera, GPS, checklists. Sync when connected.

### 2.2 User Roles (Frontend Impact)

| Role | Web Access | Mobile Access | Key Screens |
|------|:----------:|:-------------:|------------|
| Super Admin | Full | Optional | All pages, user management, system settings |
| Subsidiary Admin | Full (own subsidiary) | Optional | Dashboard, compliance, inspections, reports |
| Mine Manager | Full (own mine) | Optional | Dashboard, compliance, violations, contractors |
| Inspector | Partial | Primary | Inspections (conduct), violations (report) |
| Field Officer | Minimal web | Primary | Mobile: inspections, attendance, incidents |
| Contractor | Limited | Limited | Own profile, compliance status, worker attendance |
| Regulatory Authority | Read-only | No | Dashboard, reports, compliance view |

### 2.3 Key Frontend Requirements
- Works on 3G/4G connections (optimize bundle, lazy-load)
- Mobile app functions offline for up to 48 hours
- Support low-end Android devices (Android 8+, 2GB RAM)
- All timestamps displayed in IST (Asia/Kolkata)
- WCAG 2.1 AA accessibility
- Hindi + English (i18n framework from start, translations later)

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Web Framework** | Next.js 14 (App Router) + TypeScript | SSR for fast initial load on slow connections, RSC for reduced client JS |
| **UI Components** | shadcn/ui + Tailwind CSS | Accessible, customizable, no vendor lock-in, great DX |
| **State (client)** | Zustand | Lightweight, TypeScript-native, minimal boilerplate |
| **State (server)** | TanStack Query (React Query) | Caching, refetching, optimistic updates, mutation handling |
| **Charts** | Recharts | Standard charts (bar, line, donut, area). Built on D3, React-native API |
| **Custom Viz** | D3.js | GIS overlays, heat maps, complex custom visualizations |
| **Maps** | Leaflet + react-leaflet + OpenStreetMap | Free, open-source, offline tile caching possible |
| **Forms** | React Hook Form + Zod | Performant forms, schema-based validation, TypeScript inference |
| **Icons** | Lucide React | Consistent, lightweight, tree-shakeable |
| **Date/Time** | date-fns | Lightweight, tree-shakeable, IST formatting |
| **Mobile** | React Native + Expo | Cross-platform, shared types/logic with web |
| **Mobile Offline DB** | WatermelonDB | SQLite-backed, observable queries, built-in sync |
| **Mobile Secure Storage** | expo-secure-store | JWT token storage |
| **Mobile Camera** | expo-camera | Photo capture for inspections |
| **Mobile Location** | expo-location | GPS for geo-tagging |
| **E2E Testing** | Playwright | Cross-browser, reliable, built-in screenshot comparison |
| **Unit Testing** | Jest + React Testing Library | Standard, good coverage tools |
| **Linting** | ESLint + Prettier | Consistent code style |

---

## 4. UI/UX Design Plan

### 4.1 Design System

**Color Palette:**
```
Primary:      #1e3a5f (Navy Blue — governance/trust)
Primary Light:#2c5282
Primary Dark: #152a43
Accent:       #e67e22 (Orange — warnings, attention)
Success:      #27ae60 (Green — compliant, resolved)
Danger:       #e74c3c (Red — violations, critical)
Warning:      #f39c12 (Yellow — overdue, attention)
Info:         #3498db (Blue — informational)
Background:   #f8fafc
Surface:      #ffffff
Text Primary: #1a202c
Text Secondary:#64748b
Border:       #e2e8f0
```

**Typography:**
- Font: Inter (Google Fonts) — clean, professional, legible
- Headings: 600/700 weight
- Body: 400 weight
- Mono: JetBrains Mono (code, IDs)

**Spacing:** 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

**Border Radius:** 6px default, 8px cards, 12px modals

**Shadows:**
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
```

### 4.2 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Top Bar: Logo | Breadcrumbs | Mine Selector | 🔔 | 👤  │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Sidebar │          Main Content Area                   │
│  (240px) │                                              │
│          │  ┌─────────────────────────────────────────┐ │
│  📊 Dash │  │  Page Header + Actions                  │ │
│  ✅ Comply│  ├─────────────────────────────────────────┤ │
│  🔍 Inspect│ │                                         │ │
│  ⚠️ Violate│ │  Page Content                           │ │
│  👷 Contract│ │  (Tables, Forms, Charts, Maps)          │ │
│  📈 Product│ │                                         │ │
│  📄 Reports│ │                                         │ │
│  🗺️ Maps  │  │                                         │ │
│  🤖 AI    │  │                                         │ │
│  🔔 Notif │  │                                         │ │
│  ⚙️ Settings│ │                                         │ │
│          │  └─────────────────────────────────────────┘ │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  Footer (minimal): © 2026 | Version | Support          │
└─────────────────────────────────────────────────────────┘
```

- Sidebar collapses to icons on screens < 1024px
- Sidebar hidden on screens < 768px (hamburger menu)
- Content area scrolls, sidebar stays fixed
- Breadcrumbs for nested navigation

### 4.3 Component Hierarchy (shadcn/ui base)

**Install these shadcn/ui components:**
```
button, input, select, textarea, checkbox, radio-group,
label, form, dialog, sheet, dropdown-menu, popover,
table, tabs, card, badge, avatar, skeleton, toast,
alert, separator, calendar, date-picker, command,
scroll-area, tooltip, progress, switch, accordion,
pagination (custom), breadcrumb (custom)
```

### 4.4 Page Map (Web)

```
Login ─────────────────────────────────────────────────────────
  │
  ├── Dashboard (role-specific) ──────────────────────────────
  │     ├── KPI Cards (compliance rate, violations, inspections)
  │     ├── Compliance Status Chart (donut)
  │     ├── Recent Violations (table)
  │     ├── Upcoming Deadlines (list)
  │     ├── Mine Risk Heatmap (map widget)
  │     └── AI Alerts (notification cards)
  │
  ├── Compliance ─────────────────────────────────────────────
  │     ├── List View (filterable table)
  │     ├── Calendar View (deadlines)
  │     ├── Detail View (status, evidence, history)
  │     └── Approval Queue
  │
  ├── Inspections ────────────────────────────────────────────
  │     ├── Schedule View (calendar)
  │     ├── List View (all inspections)
  │     ├── Conduct Inspection (wizard/stepper)
  │     └── Inspection Report (printable)
  │
  ├── Violations ─────────────────────────────────────────────
  │     ├── List View (filterable, sortable)
  │     ├── Detail View (timeline, corrective actions)
  │     ├── Heatmap View (geo)
  │     └── Analytics (trends, by category)
  │
  ├── Contractors ────────────────────────────────────────────
  │     ├── List View
  │     ├── Profile View (score, contracts, workers)
  │     ├── Contract Management
  │     └── Worker Attendance
  │
  ├── Production ─────────────────────────────────────────────
  │     ├── Daily Reports
  │     ├── Shift-wise Data
  │     └── Equipment Utilization
  │
  ├── Reports ────────────────────────────────────────────────
  │     ├── Report Templates
  │     ├── Generated Reports
  │     └── Custom Report Builder
  │
  ├── Maps (GIS) ─────────────────────────────────────────────
  │     ├── Mine Overview Map
  │     ├── Incident Heatmap
  │     └── Inspection Coverage
  │
  ├── AI Insights ────────────────────────────────────────────
  │     ├── Risk Dashboard
  │     ├── Predictions
  │     ├── Anomaly Alerts
  │     └── Trend Analysis
  │
  ├── Notifications ──────────────────────────────────────────
  │     └── Notification Center
  │
  └── Settings ───────────────────────────────────────────────
        ├── User Management
        ├── Role Management
        ├── Mine Configuration
        ├── Notification Preferences
        └── System Settings
```

### 4.5 Mobile App Screens (React Native)

```
Login → Dashboard (simplified)
  ├── Quick Actions (FAB)
  │     ├── Report Incident
  │     ├── Start Inspection
  │     ├── Mark Attendance
  │     └── File Grievance
  ├── Inspections (offline-capable)
  │     ├── My Inspections
  │     ├── Conduct Inspection (camera, GPS, checklist)
  │     └── Sync Status
  ├── Violations
  │     ├── Report Violation (camera, GPS)
  │     └── My Assigned Actions
  ├── Attendance (geo-fenced check-in/out)
  ├── Notifications
  └── Profile & Offline Settings
```

---

## 5. Folder Structure

### 5.1 Web App (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth group (no sidebar layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Centered auth layout
│   │   │
│   │   ├── (dashboard)/              # Dashboard group (sidebar layout)
│   │   │   ├── layout.tsx            # Sidebar + topbar + auth guard
│   │   │   ├── page.tsx              # Main dashboard
│   │   │   ├── compliance/
│   │   │   │   ├── page.tsx          # List view
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx      # Detail view
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create form
│   │   │   │   └── approvals/
│   │   │   │       └── page.tsx      # Approval queue
│   │   │   ├── inspections/
│   │   │   │   ├── page.tsx          # List + calendar
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx      # Detail / report
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Schedule inspection
│   │   │   │   └── conduct/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx  # Wizard / stepper
│   │   │   ├── violations/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx      # Detail
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Report violation
│   │   │   │   └── heatmap/
│   │   │   │       └── page.tsx      # Geo heatmap
│   │   │   ├── contractors/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── production/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── maps/
│   │   │   │   └── page.tsx
│   │   │   ├── ai-insights/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx          # General settings
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── roles/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── mines/
│   │   │   │       └── page.tsx
│   │   │   └── users/
│   │   │       ├── page.tsx
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   │
│   │   ├── api/                      # BFF proxy routes (optional)
│   │   │   └── [...proxy]/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ... (all shadcn components)
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx           # Collapsible sidebar nav
│   │   │   ├── topbar.tsx            # Top bar with user menu, notifications
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── mine-selector.tsx     # Mine dropdown for multi-mine users
│   │   │   └── page-header.tsx       # Page title + action buttons
│   │   │
│   │   ├── dashboard/
│   │   │   ├── kpi-card.tsx
│   │   │   ├── compliance-donut.tsx
│   │   │   ├── recent-violations.tsx
│   │   │   ├── upcoming-deadlines.tsx
│   │   │   ├── risk-overview.tsx
│   │   │   └── ai-alerts.tsx
│   │   │
│   │   ├── compliance/
│   │   │   ├── compliance-table.tsx
│   │   │   ├── compliance-filters.tsx
│   │   │   ├── compliance-detail.tsx
│   │   │   ├── compliance-form.tsx
│   │   │   ├── evidence-upload.tsx
│   │   │   ├── approval-card.tsx
│   │   │   └── compliance-timeline.tsx
│   │   │
│   │   ├── inspections/
│   │   │   ├── inspection-table.tsx
│   │   │   ├── inspection-calendar.tsx
│   │   │   ├── inspection-wizard.tsx  # Multi-step form
│   │   │   ├── checklist-renderer.tsx # Dynamic checklist from template
│   │   │   ├── inspection-report.tsx
│   │   │   └── photo-gallery.tsx
│   │   │
│   │   ├── violations/
│   │   │   ├── violation-table.tsx
│   │   │   ├── violation-detail.tsx
│   │   │   ├── violation-form.tsx
│   │   │   ├── corrective-action-list.tsx
│   │   │   ├── violation-timeline.tsx
│   │   │   └── severity-badge.tsx
│   │   │
│   │   ├── maps/
│   │   │   ├── mine-map.tsx          # Full map with layers
│   │   │   ├── heatmap-layer.tsx
│   │   │   ├── marker-popup.tsx
│   │   │   └── map-legend.tsx
│   │   │
│   │   ├── charts/
│   │   │   ├── donut-chart.tsx
│   │   │   ├── bar-chart.tsx
│   │   │   ├── line-chart.tsx
│   │   │   ├── trend-chart.tsx
│   │   │   └── risk-gauge.tsx
│   │   │
│   │   └── shared/
│   │       ├── data-table.tsx        # Reusable table with sort/filter/paginate
│   │       ├── file-upload.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       ├── status-badge.tsx
│   │       ├── date-range-picker.tsx
│   │       ├── search-input.tsx
│   │       ├── notification-bell.tsx
│   │       ├── user-avatar.tsx
│   │       ├── permission-gate.tsx   # Renders children only if user has permission
│   │       └── error-boundary.tsx
│   │
│   ├── hooks/
│   │   ├── use-auth.ts               # Auth state, login/logout
│   │   ├── use-permissions.ts        # Permission checking
│   │   ├── use-mine-context.ts       # Current selected mine
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   ├── use-websocket.ts          # WebSocket for notifications
│   │   └── use-infinite-scroll.ts
│   │
│   ├── lib/
│   │   ├── api.ts                    # Axios/fetch wrapper with JWT handling
│   │   ├── auth.ts                   # Token management, refresh logic
│   │   ├── utils.ts                  # cn(), formatDate(), etc.
│   │   ├── validators.ts             # Zod schemas shared across forms
│   │   ├── constants.ts              # Severity levels, status options, colors
│   │   └── permissions.ts            # Permission constants, role checks
│   │
│   ├── stores/
│   │   ├── auth-store.ts             # User, tokens, permissions
│   │   ├── mine-store.ts             # Selected mine context
│   │   ├── notification-store.ts     # Unread count, recent notifications
│   │   └── ui-store.ts               # Sidebar collapsed, theme
│   │
│   ├── types/
│   │   ├── api.ts                    # API response/request types
│   │   ├── models.ts                 # User, Mine, Compliance, Inspection, etc.
│   │   ├── enums.ts                  # Status, Severity, Role enums
│   │   └── forms.ts                  # Form schema types
│   │
│   └── styles/
│       └── globals.css               # Tailwind directives + custom CSS vars
│
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── images/
│       └── empty-states/             # Illustrations for empty pages
│
├── __tests__/                        # Unit tests (mirror src structure)
├── e2e/                              # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── compliance-flow.spec.ts
│   ├── inspection-flow.spec.ts
│   └── helpers/
│       └── test-utils.ts
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── playwright.config.ts
├── jest.config.ts
├── components.json                   # shadcn/ui config
└── package.json
```

### 5.2 Mobile App (`apps/mobile/`)

```
apps/mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── InspectionListScreen.tsx
│   │   ├── ConductInspectionScreen.tsx
│   │   ├── ViolationReportScreen.tsx
│   │   ├── ViolationListScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   ├── NotificationScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── SyncStatusScreen.tsx
│   │
│   ├── components/
│   │   ├── ChecklistForm.tsx
│   │   ├── PhotoCapture.tsx
│   │   ├── LocationPicker.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── SyncIndicator.tsx
│   │   └── QuickActionFAB.tsx
│   │
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── TabNavigator.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── sync.ts                   # Offline sync engine
│   │   └── location.ts
│   │
│   ├── db/                           # WatermelonDB
│   │   ├── schema.ts
│   │   ├── models/
│   │   │   ├── Inspection.ts
│   │   │   ├── Violation.ts
│   │   │   └── Attendance.ts
│   │   └── sync.ts                   # WatermelonDB sync adapter
│   │
│   ├── stores/
│   │   ├── auth-store.ts
│   │   └── sync-store.ts
│   │
│   └── utils/
│       ├── permissions.ts
│       ├── image.ts                  # Photo compression
│       └── geofence.ts
│
├── app.json
├── eas.json
├── tsconfig.json
└── package.json
```

---

## 6. Web App — Key Component Specifications

### 6.1 Data Table Component (Reusable)

The `data-table.tsx` is used on every list page. Build it once with:
- Column definitions via props
- Server-side pagination (cursor-based)
- Column sorting (clickable headers)
- Filter bar (status, category, date range — configurable per use)
- Full-text search with debounce (300ms)
- Bulk selection + bulk actions (for admins)
- Loading skeletons
- Empty state
- Export button (CSV/Excel)
- Responsive: horizontal scroll on mobile

### 6.2 Permission Gate Component

```tsx
// Usage:
<PermissionGate permission="compliance.approve">
  <Button onClick={handleApprove}>Approve</Button>
</PermissionGate>

// Hides children if user lacks permission. 
// No FOUC — checks Zustand auth store synchronously.
```

### 6.3 File Upload Component

- Drag-and-drop zone + click to browse
- File type validation (images: jpg/png/webp, docs: pdf/doc)
- Size limit enforcement (10MB per file)
- Upload progress bar
- Preview thumbnails for images
- Multiple file support
- Integrates with S3 pre-signed URL upload flow

### 6.4 Inspection Wizard (Multi-Step Form)

5-step wizard using React Hook Form with step validation:
1. **Select Template & Location**: Template dropdown, mine selector, area name
2. **Checklist**: Dynamic form generated from template JSON — supports text, number, yes/no, select, photo capture per item
3. **Photos**: Camera capture (web: file input, mobile: expo-camera), geo-tagging auto from browser/device GPS
4. **Summary**: Review all responses, GPS coordinates, weather (optional), additional notes
5. **Submit**: Digital signature canvas, final submit

Each step validates before allowing next. Auto-save every 30 seconds to localStorage (web) or WatermelonDB (mobile). Save as draft explicitly.

### 6.5 Map Component (Leaflet)

```
Mine Map Features:
├── Base Layer: OpenStreetMap tiles
├── Mine Polygons: Boundaries drawn from PostGIS data
├── Markers:
│   ├── Violations (red/orange/yellow by severity)
│   ├── Inspections (green/yellow/red by score)
│   └── Incidents (icon markers)
├── Heat Map Layer: Violation density overlay (toggle)
├── Layer Controls: Toggle each layer on/off
├── Popup on Click: Entity summary with link to detail
├── Legend: Color meanings
└── Controls: Zoom, fullscreen, search mine
```

Use `react-leaflet` with lazy loading (`dynamic(() => import(...), { ssr: false })` in Next.js).

---

## 7. Mobile App — Offline Architecture

### 7.1 Offline-First Flow

```
User Action (e.g., submit inspection)
  │
  ├── Save to WatermelonDB (local SQLite) immediately
  │     └── Status: "pending_sync"
  │
  ├── If online:
  │     ├── POST to API
  │     ├── On success: update status to "synced"
  │     └── On failure: keep as "pending_sync"
  │
  └── If offline:
        └── Queue for sync
              └── Background sync runs when connection restored
                    ├── Upload queued records
                    ├── Upload queued photos (compressed)
                    ├── Pull latest data
                    └── Handle conflicts (server wins, but preserve local edits as draft)
```

### 7.2 WatermelonDB Schema (Key Tables)

```typescript
// Inspections (offline)
tableSchema({
  name: 'inspections',
  columns: [
    { name: 'server_id', type: 'string', isOptional: true },
    { name: 'template_id', type: 'string' },
    { name: 'mine_id', type: 'string' },
    { name: 'status', type: 'string' },  // 'draft', 'completed', 'pending_sync', 'synced'
    { name: 'responses', type: 'string' }, // JSON stringified
    { name: 'latitude', type: 'number', isOptional: true },
    { name: 'longitude', type: 'number', isOptional: true },
    { name: 'photo_paths', type: 'string' }, // JSON array of local file paths
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ]
})
```

### 7.3 Photo Handling (Mobile)
1. Capture via `expo-camera` (or pick from gallery)
2. Compress to max 1MB (quality 0.7, resize to max 1920px)
3. Save to device storage
4. On sync: upload to S3 via pre-signed URL, replace local path with S3 URL

---

## 8. State Management & API Layer

### 8.1 API Client (`lib/api.ts`)

```typescript
// Axios instance with interceptors:
// - Attach JWT from auth store
// - On 401: attempt token refresh, retry original request
// - On 401 after refresh: redirect to login
// - Base URL from env: NEXT_PUBLIC_API_URL
// - Request/response logging in dev

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});
```

### 8.2 TanStack Query Patterns

```typescript
// List query with filters
const { data, isLoading, fetchNextPage } = useInfiniteQuery({
  queryKey: ['violations', { mine_id, status, severity }],
  queryFn: ({ pageParam }) => api.get('/violations', { 
    params: { cursor: pageParam, limit: 20, mine_id, status, severity } 
  }),
  getNextPageParam: (lastPage) => lastPage.data.next_cursor,
});

// Mutation with optimistic update
const mutation = useMutation({
  mutationFn: (data) => api.post('/violations', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['violations'] });
    toast.success('Violation reported');
  },
});
```

### 8.3 Zustand Auth Store

```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  permissions: Record<string, boolean>;
  selectedMineId: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  setSelectedMine: (mineId: string) => void;
}
```

### 8.4 WebSocket for Notifications

```typescript
// Connect after login, reconnect on disconnect
// Receive: { type: 'notification', payload: { id, title, message, severity, link } }
// Update notification store: increment unread count, prepend to list
// Show toast for high-severity notifications
```

---

## 9. Page-Level Feature Checklists

### Login Page
- [ ] Email + password form with Zod validation
- [ ] Show/hide password toggle
- [ ] "Forgot password" link → forgot-password page
- [ ] Error messages for invalid credentials
- [ ] Account lockout message after 5 attempts
- [ ] Redirect to dashboard on success
- [ ] Remember me checkbox (extend session)
- [ ] Loading spinner on submit button
- [ ] Responsive (centered card layout)
- [ ] Keyboard: Enter submits form

### Dashboard
- [ ] KPI cards: compliance rate (%), open violations (count), inspections this month (count), overdue items (count)
- [ ] Each KPI card shows trend arrow (up/down vs last period)
- [ ] Compliance status donut chart (by category: safety, environment, labour, production)
- [ ] Recent violations table (top 5, columns: title, severity, mine, date, status)
- [ ] Upcoming deadlines list (next 7 days, sorted by due date)
- [ ] Mine risk score overview (bar chart or color-coded cards)
- [ ] AI alerts section (top 3 predictions/anomalies with dismiss action)
- [ ] Quick action buttons: "New Inspection", "Report Violation"
- [ ] Date range filter (last 7/30/90 days, custom)
- [ ] Mine selector dropdown (for multi-mine users; single mine auto-selects)
- [ ] Auto-refresh data every 5 minutes (TanStack Query refetchInterval)
- [ ] Role-based widget visibility (hide AI insights for field officers)
- [ ] Loading skeletons on initial load
- [ ] Error boundary per widget (one failing widget doesn't crash page)

### Compliance List Page
- [ ] Table: title, category, mine, status, due date, risk score columns
- [ ] Filters: status (multiselect), category (multiselect), mine (dropdown), date range, severity
- [ ] Search bar with debounce (300ms)
- [ ] Sort by any column (click header)
- [ ] Cursor-based pagination (20 per page)
- [ ] Bulk select + bulk actions (for admins): assign, change status
- [ ] Status badges with semantic colors
- [ ] Overdue rows highlighted (light red background)
- [ ] Export button (CSV/Excel)
- [ ] "Add New" button (role-restricted via PermissionGate)
- [ ] Empty state illustration when no results
- [ ] Loading skeletons on data fetch
- [ ] Click row → navigate to detail page

### Compliance Detail Page
- [ ] Header: title, status badge, category, regulation reference
- [ ] Timeline: status transitions with timestamp, actor name, and remarks
- [ ] Evidence section: grid of uploaded files with thumbnail preview, click to expand
- [ ] Checklist responses (if template-based): rendered read-only
- [ ] Approval section (managers only): Approve/Reject buttons with remarks textarea
- [ ] Comments thread: chronological, with user avatars
- [ ] Linked violations section (if any created from this compliance item)
- [ ] Audit log accordion (who did what when — collapsed by default)
- [ ] Edit button (role-restricted, opens inline editing or edit page)
- [ ] Print-friendly view (Ctrl+P optimized CSS)
- [ ] Breadcrumb: Dashboard > Compliance > {title}

### Inspection Wizard (Conduct Inspection)
- [ ] Step 1: Select template (dropdown), mine (dropdown), area name (text)
- [ ] Step 2: Dynamic checklist (generated from template JSON — each item renders as text/number/yes-no/select/photo)
- [ ] Step 3: Photo capture (file input on web, camera on mobile) with thumbnails
- [ ] Step 4: Summary review, GPS location (auto-captured or manual), weather (optional), notes textarea
- [ ] Step 5: Digital signature (canvas), submit button
- [ ] Stepper/progress indicator showing current step
- [ ] Save as draft button (persists to localStorage or API)
- [ ] Back/Next navigation between steps
- [ ] Validation on each step before allowing Next
- [ ] Auto-save every 30 seconds
- [ ] Confirmation dialog before leaving page with unsaved changes
- [ ] Success page after submission with link to view report

### Violation Detail Page
- [ ] Header: title, severity badge (critical=red, major=orange, minor=yellow), status badge
- [ ] Mini-map showing violation location (Leaflet, small)
- [ ] Photo gallery (lightbox on click)
- [ ] Description, root cause, regulation reference
- [ ] Timeline: full status history (open → assigned → resolved → verified)
- [ ] Corrective actions list: table with description, assignee, due date, status, evidence
- [ ] Assign/reassign button (dropdown of eligible users)
- [ ] Escalation indicator (level + auto-escalation info)
- [ ] Related inspection link (if created from inspection)
- [ ] Comments section
- [ ] Print report button (generates printable view)
- [ ] Breadcrumb: Dashboard > Violations > {title}

### Maps Page
- [ ] Full-width map (Leaflet, dynamic import with `ssr: false`)
- [ ] Layer controls panel: toggle mines, violations, inspections, attendance
- [ ] Mine boundary polygons (from PostGIS data)
- [ ] Violation markers (icon color by severity)
- [ ] Inspection markers (icon color by score range)
- [ ] Heat map toggle (violation density)
- [ ] Click marker → popup with entity summary + "View Details" link
- [ ] Search/filter by mine (dropdown)
- [ ] Legend explaining colors and icons
- [ ] Zoom controls + fullscreen button
- [ ] Date range filter for markers

### AI Insights Page
- [ ] Risk score cards per mine (color-coded: green 0-33, yellow 34-66, red 67-100)
- [ ] Risk trend chart (line chart, selectable 30/60/90 days)
- [ ] Top predicted compliance failures (table: item, mine, probability, due date)
- [ ] Anomaly alerts (cards: description, severity, affected mine/area, detected date)
- [ ] Contributing factors breakdown (horizontal bar chart per mine)
- [ ] Model confidence indicator (tooltip explaining confidence level)
- [ ] Refresh/recompute button (triggers POST to `/ai/risk-scores/compute`)
- [ ] Date range selector

### Reports Page
- [ ] Report template list (cards: name, type, description, "Generate" button)
- [ ] Generated reports list (table: name, generated date, generated by, download link)
- [ ] Custom report builder:
  - [ ] Select metrics (multi-select checkboxes)
  - [ ] Select mines (multi-select)
  - [ ] Date range picker
  - [ ] "Generate" button → async generation with progress indicator
- [ ] Download buttons (PDF, Excel)

### Notification Center
- [ ] Notification list (chronological, newest first)
- [ ] Each notification: icon, title, message, timestamp, read/unread indicator
- [ ] Click notification → navigate to relevant page
- [ ] "Mark all as read" button
- [ ] Filter: All / Unread / By type (compliance, violation, inspection, system)
- [ ] Infinite scroll pagination

### User Management (Admin)
- [ ] User table: name, email, role, organization, mine, status, last login
- [ ] Filters: role, organization, mine, status
- [ ] Add user button → form dialog (name, email, role, org, mine, temp password)
- [ ] Edit user (inline or dialog)
- [ ] Deactivate user (confirm dialog — soft delete)
- [ ] Reset password action
- [ ] Bulk import (CSV upload — stretch goal)

---

## 10. Frontend Testing

### 10.1 Unit Tests (Jest + React Testing Library)

**Target: 70% coverage**

Test these components:
```
data-table.tsx       → renders columns, sorts, filters, paginates, shows empty state
permission-gate.tsx  → shows/hides children based on permission
kpi-card.tsx         → renders value, label, trend arrow
status-badge.tsx     → renders correct color for each status
severity-badge.tsx   → renders correct color for each severity
compliance-form.tsx  → validates required fields, submits correctly
file-upload.tsx      → accepts valid files, rejects invalid, shows progress
search-input.tsx     → debounces input, calls onChange after delay
```

Test these hooks:
```
use-auth.ts          → login sets user, logout clears, refresh works
use-permissions.ts   → returns correct boolean for permission checks
use-debounce.ts      → debounces value changes correctly
```

### 10.2 E2E Tests (Playwright)

**Critical Flows:**
```typescript
// e2e/auth.spec.ts
test('login with valid credentials', ...);
test('login with invalid credentials shows error', ...);
test('logout clears session', ...);

// e2e/compliance-flow.spec.ts
test('create compliance tracking item', ...);
test('upload evidence to compliance item', ...);
test('approve compliance submission', ...);

// e2e/inspection-flow.spec.ts
test('complete inspection wizard end-to-end', ...);
test('save inspection as draft and resume', ...);

// e2e/violation-flow.spec.ts
test('report violation with photo', ...);
test('assign corrective action', ...);
test('resolve and verify violation', ...);

// e2e/dashboard.spec.ts
test('dashboard loads with KPI data', ...);
test('dashboard filters by mine', ...);
test('dashboard filters by date range', ...);
```

### 10.3 Visual Regression (Optional)

Use Playwright screenshot comparison for:
- Dashboard (desktop + mobile viewport)
- Login page
- Compliance list page
- Map page

---

## 11. Performance & Optimization

### 11.1 Bundle Optimization
- [ ] Code split per route (automatic with Next.js App Router)
- [ ] Lazy-load heavy components: maps (`dynamic(() => import(...), { ssr: false })`), charts, rich text editors
- [ ] Tree-shake icon imports: `import { AlertTriangle } from 'lucide-react'` not `import * as Icons`
- [ ] Analyze bundle with `@next/bundle-analyzer`
- [ ] Target: < 200KB initial JS (gzipped)

### 11.2 Rendering Optimization
- [ ] Use React Server Components for data-heavy pages (dashboard stats, compliance list)
- [ ] Client Components only where interactivity needed (forms, dropdowns, maps)
- [ ] Use `React.memo` on pure display components in lists
- [ ] Virtual scrolling for tables > 100 rows (TanStack Virtual)
- [ ] Debounce search/filter inputs (300ms)
- [ ] Skeleton loaders instead of spinners (perceived performance)

### 11.3 Data Fetching
- [ ] TanStack Query stale time: 5 min for dashboard, 1 min for lists
- [ ] Prefetch next page data on hover/scroll-near-bottom
- [ ] Optimistic updates for status changes (approve, assign, resolve)
- [ ] Background refetch on window focus
- [ ] Error retry with exponential backoff (3 attempts)

### 11.4 Image Optimization
- [ ] Use `next/image` for all images (auto WebP, lazy load, responsive srcset)
- [ ] Compress uploaded photos before sending (client-side, max 1MB)
- [ ] Thumbnail generation on backend for galleries

### 11.5 Mobile Optimization
- [ ] Compress photos before upload (quality 0.7, max 1920px width)
- [ ] Background sync with exponential backoff
- [ ] Minimal memory footprint (WatermelonDB lazy loading)
- [ ] Test on Android 8, 2GB RAM device/emulator
- [ ] Reduce re-renders with `React.memo` and `useMemo`

---

## 12. Development Phases (Frontend Tasks Only)

### Phase 0 (Week 1): Setup
- [ ] Initialize Next.js 14 app with TypeScript
- [ ] Install and configure: Tailwind CSS, shadcn/ui, ESLint, Prettier
- [ ] Install shadcn components (button, input, card, table, badge, dialog, sheet, toast, skeleton, tabs, dropdown-menu)
- [ ] Set up folder structure as defined above
- [ ] Create layout components: Sidebar, Topbar, PageHeader
- [ ] Create auth pages (static UI, no API): Login, Register, Forgot Password
- [ ] Set up Zustand stores (auth, mine, UI)
- [ ] Set up TanStack Query provider
- [ ] Create API client (`lib/api.ts`)
- [ ] Set up Playwright and Jest

**Verify:** `npm run dev` loads app at localhost:3000, login page renders, sidebar toggles.

### Phase 1 (Weeks 2-4): Core Pages
- [ ] Connect Login page to auth API
- [ ] Implement auth flow: login → store JWT → redirect → protected routes
- [ ] Build Dashboard: KPI cards, donut chart, violations table, deadlines
- [ ] Build Compliance: list page (DataTable), detail page, create form, approval queue
- [ ] Build User Management page (admin)
- [ ] Implement PermissionGate and role-based sidebar items
- [ ] Implement notification bell (in-app, no WebSocket yet)

**Verify:** Can login, see dashboard with real data, CRUD compliance items, approve/reject.

### Phase 2 (Weeks 5-7): Inspections & Violations
- [ ] Build Inspection: list, calendar view, conduct wizard, report view
- [ ] Build Violation: list, detail (timeline + corrective actions), report form, heatmap page
- [ ] Build Notification Center page
- [ ] Connect WebSocket for real-time notifications
- [ ] Implement toast notifications for key events

**Verify:** Full inspection wizard works. Violations display with severity colors. Notifications arrive in real time.

### Phase 3 (Weeks 8-10): Advanced
- [ ] Build Maps page (Leaflet, layers, heat map)
- [ ] Build AI Insights page (risk cards, trend charts, anomaly alerts)
- [ ] Build Reports page (template list, custom builder, download)
- [ ] Integrate OCR document upload (if backend ready)

**Verify:** Map renders with mine data. AI page shows risk scores. Reports download as PDF.

### Phase 4 (Weeks 11-12): Mobile
- [ ] Set up React Native (Expo) project
- [ ] Build Login screen with SecureStore
- [ ] Build Dashboard screen (simplified)
- [ ] Build Inspection screens (conduct inspection with camera + GPS + checklist)
- [ ] Build Violation report screen
- [ ] Build Attendance screen (geo-fenced check-in)
- [ ] Implement WatermelonDB + offline sync engine
- [ ] Implement push notifications (Expo Push)

**Verify:** Mobile login works. Inspection works offline. Syncs when online. GPS + photos captured.

### Phase 5 (Weeks 13-14): Polish
- [ ] Build Contractor pages (list, profile, contracts)
- [ ] Build Production pages (daily reports, shift data)
- [ ] Add i18n framework (next-intl) with Hindi translations for key pages
- [ ] Accessibility audit and fixes (keyboard nav, aria labels, focus management)
- [ ] Write unit tests (70% coverage)
- [ ] Write E2E tests for critical flows
- [ ] Performance optimization (bundle analysis, lazy loading, caching)

**Verify:** 70% test coverage. Lighthouse score > 90. Hindi toggle works on login + dashboard.

### Phase 6 (Weeks 15-16): Launch
- [ ] Build user guide / help tooltips
- [ ] Create demo scenario data
- [ ] UAT support (fix bugs reported during testing)
- [ ] Final responsive testing (desktop, tablet, mobile)

---

## 13. Git Workflow for Member A

### Branch Naming
```
feature/web-login-page
feature/web-dashboard
feature/web-compliance-list
feature/web-inspection-wizard
feature/web-maps-page
feature/mobile-login
feature/mobile-inspection
fix/web-sidebar-collapse
```

### Commit Convention
```
feat(web): implement login page with form validation
feat(web): add compliance list with DataTable component
feat(web): build inspection wizard (5-step form)
feat(mobile): implement offline inspection conduct
fix(web): correct sidebar collapse on tablet
style(web): update KPI card spacing
test(web): add unit tests for DataTable component
```

### PR Checklist (before requesting review)
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] Tested manually in browser (desktop + mobile viewport)
- [ ] New components have at least 1 unit test
- [ ] No hardcoded strings (use constants or i18n keys)
- [ ] No `console.log` left in code
- [ ] Responsive: tested at 375px, 768px, 1440px widths
- [ ] Accessible: keyboard navigable, proper aria labels
- [ ] Loading states handled (skeleton or spinner)
- [ ] Error states handled (error boundary or fallback UI)

---

> **To Claude Code:** After reading this document, ask the 7 clarifying questions from Section 1. Then start with Phase 0 setup. Build each component, test it in the browser, then move on. For API integration, coordinate with backend team — use mock data if API isn't ready. Every page must have loading skeletons and empty states from day one.
