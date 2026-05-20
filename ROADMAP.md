# White Glove Auto Service — Roadmap

## Phase 1: Foundation (Current)

### Core Platform
- [x] Database schema (18 tables)
- [x] Row Level Security policies
- [x] Shared TypeScript types
- [x] Seed data with demo organization
- [x] Design system and color tokens

### Web App
- [x] App shell with sidebar navigation
- [x] Dashboard with stat cards and vehicle list
- [x] Vehicle list with search and filters
- [x] Vehicle detail with tabbed sections
- [x] Intake wizard (4-step flow)
- [x] Inspection section cards
- [x] Checklist components
- [x] Notification center
- [x] Login page
- [ ] Connect to Supabase auth
- [ ] Connect to Supabase data layer
- [ ] Media upload component
- [ ] Settings/organization page
- [ ] Admin page
- [ ] Service request detail page
- [ ] Delivery checklist page
- [ ] Report preview page

### iOS App
- [x] SwiftUI project scaffold
- [x] Model layer with Codable structs
- [x] Supabase service layer
- [x] Auth flow
- [x] Dashboard
- [x] Vehicle list and detail
- [x] Intake wizard
- [x] Inspection flow
- [x] Checklist flow
- [x] Notification center
- [ ] Connect to Supabase
- [ ] Camera/photo capture integration
- [ ] Push notification registration

### Infrastructure
- [ ] Supabase project setup
- [ ] Storage bucket configuration
- [ ] Auth email templates
- [ ] Edge functions for notifications

---

## Phase 2: Communication & Approvals

- [ ] In-app messaging (shop ↔ customer)
- [ ] Customer approval workflows
- [ ] CSR/concierge communication tools
- [ ] Email notification delivery
- [ ] SMS notification delivery (Twilio)
- [ ] Push notifications (APNs + FCM)
- [ ] PWA enhancements for web
- [ ] Customer self-service portal
- [ ] Digital signature capture
- [ ] Damage marker canvas (tap-to-mark on vehicle diagram)

## Phase 3: Intelligence & Android

- [ ] Native Android app (Kotlin/Compose)
- [ ] AI-powered inspection analysis (photo → damage detection)
- [ ] VIN decoder API integration
- [ ] Workflow intelligence (auto-status progression)
- [ ] Smart scheduling
- [ ] PDF report generation
- [ ] Analytics dashboard
- [ ] Multi-location support

## Phase 4: Commerce & Integrations

- [ ] POS/payment integration
- [ ] Accounting system connections (QuickBooks, Xero)
- [ ] Parts ordering integration
- [ ] Live affiliate recommendation engine
- [ ] SaaS subscription tiers
- [ ] Enterprise features (SSO, audit exports, compliance)
- [ ] API for third-party integrations
- [ ] Marketplace for shop templates/checklists
