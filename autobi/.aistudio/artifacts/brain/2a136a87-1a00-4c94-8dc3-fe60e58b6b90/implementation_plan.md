# AutoBI: Smart Car Sales & Inventory System (نظام مبيعات ومخزون السيارات الذكي)

AutoBI is a cloud-based SaaS automotive ERP and Business Intelligence platform tailored for car dealerships and multi-branch showrooms. It unites everyday showroom operations—digital vehicle passports, inventory aging, sales CRM pipelines, trade-in valuations, and multi-currency invoicing—with executive BI margin analytics, automated 45-day aging alerts, and Google Gemini AI magic features (Natural Language Copilot, Multimodal VIN/Document OCR, and 1K/2K/4K Studio Car Visualizer).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions were confirmed during the interactive interview:
> - **Bilingual Interface**: Full bilingual support with instant toggle between Arabic (RTL, right-to-left alignment, localized automotive vocabulary) and English (LTR).
> - **Pre-Seeded Showroom Fleet**: Premium multi-brand inventory profile (luxury sedans, performance SUVs, electric crossovers, and commercial utility vehicles) with realistic cost breakdowns, accident histories, multi-currency values, and varying days-on-lot ages (from fresh 4-day arrivals to stagnant 65+ day inventory).
> - **Showroom Studio AI Imagery**: Integrated Showroom Studio leveraging Google Gemini vision models with 1K, 2K, and 4K resolution toggles, producing showroom-grade marketing renders and social media assets for vehicles in inventory.

---

## 1. Overview & Core Concept

### What It Does
AutoBI addresses the core operational pain points of modern car dealerships: fragmented paperwork, sluggish trade-in appraisal, capital locked in aging inventory, and opaque financial margins. 

The platform provides:
1. **Digital Vehicle Passport (بطاقة المركبة الرقمية)**: Complete VIN-indexed passports containing cumulative costs (purchase price, shipping, customs, reconditioning/maintenance), accident records, and odometer progression.
2. **Multi-Role RBAC (صلاحيات ثلاثية المستوى)**: Strict separation between **Employee (موظف)** (front-end data entry, quotations, lead intake; strictly blocked from viewing purchase costs and margins), **Authorized/Supervisor (مخول)** (trade-in deal approvals, inter-branch vehicle transfers, cost visibility), and **Manager/Admin (مدير)** (unrestricted audit logs, full margin control, BI analytics).
3. **Data Ingestion & Field Mobility**: Bulk Excel/CSV engine for fleet migration, standard manual forms, and a responsive Mobile/Tablet Field App for showroom lot inspections and trade-in appraisals.
4. **AI Magic Engine (Gemini 3.8 Flash & Multimodal Vision)**:
   - **System AI Copilot**: Floating conversational assistant translating colloquial Arabic and English questions (e.g., *"شنو السيارات اللي صارلها أكثر من 40 يوم بالمعرض؟"* or *"Show me today's profit margin"*) into real-time queries.
   - **VIN & Document OCR**: Optical character recognition that parses photos of VIN plates, registration cards, or import papers into digital passport fields in under 3 seconds.
   - **Showroom Studio**: High-resolution (1K/2K/4K) generative studio renders for car listings and promotional campaigns.
5. **Real-time BI Dashboards & KPIs**:
   - Price Elasticity Indicator (معامل حساسية السعر) vs. Days on Lot velocity.
   - Valuation Variance Rate (معدل التباين التثميني) comparing trade-in estimated purchase prices to final sales prices.
   - Stagnant Capital Ratio (% of total working capital frozen in >60 day vehicles) and Daily Holding Cost.
   - Sales Pipeline Drop-off Rate & Channel Attribution.
   - Front-End vs. Back-End (F&I: financing, insurance, warranties) profit splits.
   - Automated aging alerts for vehicles approaching or exceeding 45 days on lot.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme
- **Color Discipline (60-30-10)**:
  - *Dominant Canvas (60%)*: Crisp White `#FFFFFF` and Subtle Cool Slate `#F8FAFC`.
  - *Structural Surfaces (30%)*: Deep Navy `#0F172A` / `#1E3A8A` for structural sidebar navigation, table headers, and high-contrast metric headers.
  - *Action & Prosperity Accent (10%)*: Emerald Green `#10B981` / `#22C55E` for positive ROI, approved deals, and primary actions, balanced with Royal Blue `#3B82F6` for interactive links and active filters.
- **Typography & Tabular Discipline**:
  - Headings & Navigation: `Plus Jakarta Sans` (English) and modern Arabic system typography (`Cairo` / `Tajawal` / `system-ui`).
  - Financial Metrics, VINs, Dates, Odometer: Strictly `font-mono tabular-nums` for rock-solid vertical alignment.
- **Zero-Pill & Metadata Restraint**:
  - Unboxed metadata separated by quiet middots (`·` / `|`).
  - Segmented tab controls with functional button states rather than static badge sandwiches.
  - No decorative pulsing dots or pseudo-technical clutter (`//`, `>_`).

### Key User Flows
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. INTAKE & PASSPORT:                                                       │
│    Camera/Upload VIN plate ──> Multimodal OCR ──> Auto-fill Vehicle Passport │
│                                                                             │
│ 2. FIELD LOT INSPECTION:                                                    │
│    Tablet view ──> Reconditioning check ──> Trade-In Valuation Calculator    │
│                                                                             │
│ 3. SALES & CRM PIPELINE:                                                    │
│    Lead ──> Test Drive ──> Negotiation ──> Closed Deal ──> F&I Split Invoice │
│                                                                             │
│ 4. BI ANALYTICS & COPILOT:                                                  │
│    Ask AI in Arabic/English ──> Instant Query ──> KPI Charts & 45d Alerts   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

- **Relational Integrity (PostgreSQL-Compatible Data Engine)**:
  - *Chosen Approach*: Strictly normalized schema with foreign keys, index on VIN, 1-to-1 invoice constraint (preventing duplicate car sales), and an immutable `Audit_Logs` table. Implemented with an in-memory/embedded relational store in the Express backend, with full SQL/relational semantics and client state synchronization.
  - *Why*: Guarantees zero double-booking of vehicles and satisfies strict accounting audits.
- **Server-Side Gemini Integration**:
  - *Chosen Approach*: All Gemini API interactions (Copilot chat, OCR multimodal document parsing, high-resolution Studio image generation) run through backend proxy endpoints (`/api/gemini/*`) using the modern `@google/genai` SDK with `GEMINI_API_KEY`.
  - *Why*: Follows AI Studio security rules (no client-side API key exposure) and allows server-authoritative query execution.
- **RBAC Enforcement**:
  - *Chosen Approach*: Server middleware and UI context masks purchase costs (`purchase_price`, `customs`, `shipping_fees`, `front_end_profit`, `margin_percentage`) when the active user role is `Employee`. Role switcher in the header enables testing across Employee, Authorized Supervisor, and Manager perspectives.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           BROWSER CLIENT (React)                          │
├───────────────────────────────────────────────────────────────────────────┤
│  Top Bar Contract: [AutoBI Brand] ── [Nav Links] ── [Language & Role]    │
│  Main Viewport (Bilingual RTL/LTR):                                       │
│  ├── 1. Executive BI Dashboard (Recharts: Margins, Aging, Capital Lock)   │
│  ├── 2. Inventory Management & Digital Vehicle Passports                  │
│  ├── 3. Sales Pipeline & CRM (Kanban Stage Flow: Lead to Closed)          │
│  ├── 4. Invoicing, Multi-Currency & Contracts (1-to-1 Vehicle Lock)       │
│  ├── 5. Bulk CSV/Excel Migration & Ingestion Engine                       │
│  ├── 6. Tablet/Mobile Field Inspection & Trade-In App                     │
│  ├── 7. Showroom Studio (Gemini 1K/2K/4K Visualizer)                      │
│  ├── 8. Audit Logs & User RBAC Console                                    │
│  └── Floating AI Copilot Widget (Multi-Turn Chat + Quick Questions)       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ REST API / JSON
┌─────────────────────────────────────▼─────────────────────────────────────┐
│                           EXPRESS NODE.JS SERVER                          │
├───────────────────────────────────────────────────────────────────────────┤
│  Middleware: Role Authorization (Employee / Authorized / Manager)         │
│  Routes:                                                                  │
│  ├── /api/vehicles (CRUD, Filters, Passport, Aging calculation)          │
│  ├── /api/deals & /api/customers (CRM pipeline stages)                    │
│  ├── /api/invoices (Multi-currency, Front/Back-End Profit, 1-to-1 check) │
│  ├── /api/import-csv (Bulk validation and insertion)                      │
│  ├── /api/bi/metrics (Aggregated KPIs, Elasticity, Stagnant Capital)      │
│  ├── /api/audit-logs (Immutable user audit logging)                       │
│  ├── /api/gemini/copilot (Gemini 3.8 Flash NL-to-Query assistant)         │
│  ├── /api/gemini/ocr (Multimodal VIN plate & document extraction)        │
│  └── /api/gemini/studio-render (1K/2K/4K Studio asset generation)         │
├─────────────────────────────────────┬─────────────────────────────────────┤
│  Relational Database Engine         │  Google Gemini GenAI SDK             │
│  (Tables: Users, Roles, Branches,   │  (gemini-3.8-flash, gemini-3.1-lite,│
│   Vehicles, Vehicle_Costs, History, │   gemini-nano-banana-2.1 / preview) │
│   Customers, Deals, Invoices, Logs) │                                     │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

### Relational Schema Blueprint
- **`Roles`**: `id`, `name` ('Employee', 'Authorized', 'Manager'), `permissions` (JSON).
- **`Users`**: `id`, `name`, `email`, `role_id` (FK), `avatar`, `created_at`.
- **`Branches`**: `id`, `branch_name` (e.g., Central Showroom, North Lot, Logistics Center), `location`.
- **`Vehicles`**: `id`, `vin` (UNIQUE, indexed), `branch_id` (FK), `make`, `model`, `year`, `mileage`, `transmission`, `fuel_type`, `color`, `status` ('Available', 'Sold', 'Reserved', 'In-Transit'), `days_on_lot`, `created_at`.
- **`Vehicle_Costs`**: `vehicle_id` (1-to-1 FK), `purchase_price`, `shipping_fees`, `customs`, `reconditioning_cost`, `total_cost`.
- **`Vehicle_History`**: `vehicle_id` (1-to-1 FK), `accidents_record` (text/count), `maintenance_history` (JSON), `odometer_readings` (JSON).
- **`Customers`**: `id`, `full_name`, `phone`, `email`, `acquisition_channel` ('Walk-In', 'Instagram', 'Google Search', 'Referral', 'Showroom Event').
- **`Deals`**: `id`, `customer_id` (FK), `vehicle_id` (FK), `employee_id` (FK), `pipeline_stage` ('Lead', 'Test Drive', 'Negotiation', 'Closed'), `deal_value`, `notes`, `updated_at`.
- **`Invoices`**: `id`, `vehicle_id` (UNIQUE 1-to-1 FK), `customer_id` (FK), `final_sale_price`, `currency` ('USD', 'SAR', 'AED', 'IQD'), `exchange_rate`, `front_end_profit`, `back_end_profit` (financing/insurance/warranty), `created_at`.
- **`Audit_Logs`**: `id`, `user_id` (FK), `action_type` ('PRICE_EDIT', 'INVOICE_CREATE', 'VEHICLE_TRANSFER', 'BULK_IMPORT', 'ROLE_CHANGE'), `details` (JSON), `timestamp`.

---

## 5. Execution Steps Once Approved

1. **Step 1: Relational Data Layer & Server Infrastructure**
   - Configure Express full-stack backend with normalized schema, sample seed dataset (multi-brand premium fleet with complete costs, historical maintenance, and aging metrics), and audit middleware.
2. **Step 2: Core ERP Modules & Ingestion Engines**
   - Build Digital Vehicle Passport, lot management, bulk CSV/Excel importer (with downloadable template and validation preview), and mobile/tablet field inspection mode.
3. **Step 3: RBAC & Multi-Currency Sales Invoicing**
   - Implement role security (masking sensitive financial margins for Employees), 1-to-1 invoice constraint, and multi-currency exchange conversion.
4. **Step 4: AI Copilot, Multimodal OCR & Studio Image Generation**
   - Connect backend Gemini endpoints for multi-turn Arabic/English conversational queries, instant VIN camera/document parsing, and high-resolution Studio renders (1K/2K/4K).
5. **Step 5: Executive BI Dashboard & 45-Day Aging Alerts**
   - Build interactive Recharts dashboards (Price Elasticity, Capital Stagnation, F&I Profit Split, Acquisition Attribution) and persistent 45-day lot aging notification engine.
