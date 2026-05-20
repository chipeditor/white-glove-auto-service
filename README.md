# White Glove Auto Service

Premium vehicle intake, inspection, delivery assurance, and service workflow platform.

## Architecture

```
white-glove-auto-service/
├── packages/
│   ├── web/              Next.js 16 + React + TypeScript + Tailwind CSS
│   ├── shared/           Shared TypeScript types and constants
│   └── supabase/         Database migrations, RLS policies, seed data
├── ios/
│   └── WhiteGlove/       SwiftUI native iOS app (iOS 17+)
└── docs/                 Architecture documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 16, React, TypeScript, Tailwind CSS |
| iOS | SwiftUI, MVVM, iOS 17+ |
| Backend | Supabase (Auth, Database, Storage, Realtime) |
| Database | PostgreSQL with Row Level Security |
| Storage | Supabase Storage (signed URLs) |

## Getting Started

### Web App

```bash
cd packages/web
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs with mock data — no Supabase connection required for the demo UI.

### Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in order:

```bash
# In Supabase SQL Editor or via CLI:
packages/supabase/migrations/00001_initial_schema.sql
packages/supabase/migrations/00002_rls_policies.sql
packages/supabase/seed/seed.sql
```

### iOS App

Open `ios/WhiteGlove/` as a Swift Package in Xcode 15+. Requires iOS 17.

## Phase 1 Scope

- Authentication and organization management
- User roles (Super Admin, Shop Admin, Service Advisor, Technician, Delivery Specialist, Customer)
- Vehicle intake with 4-step wizard (Vehicle → Customer → Service → Inspection)
- Cosmetic and mechanical inspections with section-based checklists
- Photo/video media uploads
- Service request tracking with status pipeline
- Delivery checklists
- Notification scaffold (concierge-style messages)
- Audit event logging
- Affiliate recommendation placeholders
- PDF report placeholders

## Status Pipeline

**Vehicle:** `intake_started` → `intake_completed` → `in_service` → `awaiting_approval` → `ready_for_delivery` → `delivered`

**Service Request:** `draft` → `submitted` → `awaiting_customer_approval` → `approved` → `in_progress` → `quality_control` → `ready_for_delivery` → `completed`

## Project Structure

### Shared Types (`packages/shared/`)
- TypeScript interfaces for all database entities
- Enum types matching PostgreSQL enums
- Joined/view types for common queries
- Status labels, colors, and display constants

### Database (`packages/supabase/`)
- 18 tables with full schema
- Row Level Security policies on every table
- Organization-scoped multi-tenancy
- Append-only audit event log
- Automatic `updated_at` triggers

### Web Components (`packages/web/src/components/`)
- `layout/` — AppShell, Sidebar, PageHeader
- `ui/` — Button, StatusBadge, StatCard, ProgressStepper, EmptyState, AffiliateCard
- `vehicle/` — VehicleCard, VehicleTable
- `inspection/` — InspectionSectionCard, InspectionItemRow
- `checklist/` — ChecklistItemRow, ChecklistProgress
- `notification/` — NotificationItem

## Design System

Dark graphite palette with steel blue accents. Premium, calm, media-centric aesthetic.

| Token | Value |
|-------|-------|
| Background | `#0d0d14` |
| Card | `#1a1a2e` |
| Border | `#2a2a40` |
| Accent Blue | `#4a90d9` |
| Success Green | `#34c759` |
| Warning Amber | `#ffb340` |
| Danger Red | `#e94560` |
