# Product Requirements Document: NGO School Grocery Usage Dashboard
**Version:** 3.0 (Multi-Tenant Release)
**Project:** India NGO — School Grocery Management System  
**Stack:** React + Supabase + Vercel  
**Prepared by:** Intern (with AI assistance)

---

## 1. Overview

This product is a role-based web application that allows a school to record grocery stock received and daily consumption, while the NGO monitors inventory health, refill needs, and usage trends through a real-time dashboard.

The recommended MVP stack is React on the frontend with Supabase for authentication, Postgres data storage, row-level security (RLS), and real-time updates — keeping the build practical for a first production-style rollout.

The core operating model is simple: the school is the data-entry location, and the NGO is the monitoring location. Both use the same hosted application but see different interfaces and permissions based on user role.

---

## 2. Problem Statement

The school receives groceries and uses them every day for meal preparation, but without a structured digital system it is hard to know current stock, consumption rate, and upcoming refill needs. This creates a risk of stockouts, delayed purchases, inaccurate reporting, and limited visibility for the NGO that funds or supervises the operation.

The NGO needs a way to see what the school is consuming, what is running low, and whether stock levels are healthy — without waiting for manual messages or spreadsheet sharing. Real-time syncing is especially valuable because Supabase supports listening to database changes from client applications, allowing the NGO dashboard to reflect new school entries quickly.

---

## 3. Goals

- Give school staff a simple workflow to add stock and record daily usage.
- Give the NGO a live dashboard with current stock, item-wise consumption, and low-stock alerts.
- **Multi-Tenancy Support:** Allow the NGO to manage multiple schools/centers (e.g., KGBV Thally, Triplicane Shelter) from a single platform while strictly isolating data so staff only see their own center.
- Ensure users only access data they are allowed to see through robust database-level access control (RLS).
- Provide visual charts and automated expenditure tracking so the NGO admin can make informed decisions about fund allocation and grocery procurement.
- Enable Excel/PDF report generation for inventory, spending, and audits.

---

## 4. Non-Goals (MVP)

The MVP will not include:
- Purchase approvals or vendor management
- Full-scale accounting system (only basic expenditure tracking is included)
- Offline sync
- Predictive analytics or AI-based suggestions
- Mobile apps (desktop browser only for now)

These can be considered after the core stock-and-usage workflow is stable in real usage.

---

## 5. Users and Roles

### 5.1 School Staff (and Shelter Staff)
School staff are responsible for entering groceries received and logging daily consumption. Through strict Row Level Security (RLS), they can only access, create, and view records for their specific assigned center. The interface is highly simplified for non-technical users. They cannot alter critical admin settings (like low-stock thresholds).

### 5.2 NGO Admin
NGO admins need visibility into stock position, low-stock alerts, refill needs, historical usage, and expenditure trends across all operating centers. They have access to a Global Center Switcher to toggle their view between different schools/shelters. They hold exclusive permissions to manage the master item catalog, set threshold quantities, and perform price audits.

---

## 6. User Stories

### School Staff (and Shelter Staff)
- As a school staff member, I want to log groceries received so the system knows what stock came in.
- As a school staff member, I want to add new grocery items to the system if a new item is introduced.
- As a school staff member, I want to enter daily usage for items such as rice, oil, and vegetables so the stock balance stays updated.
- As a school staff member, I want to add multiple grocery items in a single daily usage submission so I don't have to submit one at a time.
- As a school staff member, I want to see recent entries so I can confirm what was recorded.

### NGO Admin
- As an NGO admin, I want to see current stock levels so I can understand whether the kitchen has enough supplies.
- As an NGO admin, I want to see low-stock and critical-stock alerts highlighted at the top of my dashboard so I know what needs refill immediately.
- As an NGO admin, I want to switch between different schools/shelters using a dropdown to monitor operations individually.
- As an NGO admin, I want to track Total Spend for restocked items and dynamically correct prices via a Master Catalog inline editor.
- As an NGO admin, I want to download multi-sheet Excel reports (Inventory Status, Spending Log, Price Audits) for external reporting.
- As an NGO admin, I want the dashboard to update in real-time when the school logs new usage or stock so I do not depend on manual refresh or phone follow-up.
- As an NGO admin, I want to see charts for daily usage trends, today's usage, stock health, and monthly comparisons.
- As an NGO admin, I want to filter usage history by date range (last 7 days, last 30 days, or custom) so I can review any period I need.

---

## 7. Functional Requirements

### 7.1 Authentication
- The system must support login with email and password for both school staff and NGO admin.
- Supabase Auth is used for session management.
- After login, the app reads the user's profile and role, then routes them to the correct interface.
- The login page is split in two halves: the left side shows the India NGO branding, and the right side shows the login form.

### 7.2 Role-Based Access
- Each user is assigned a role (school_staff or ngo_admin) and a school identifier stored in the profiles table.
- Database-level RLS policies enforce access — not just frontend route guards.
- School staff can only insert and read rows tied to their own school_id.
- NGO admins have read access to all rows within their scope and can manage item master data.

### 7.3 Item Master (Grocery Items)
- NGO admin or school staff can maintain a list of grocery items.
- Each item must include: item name, unit (kg / litres / count), low-stock threshold quantity, active status, and school association.
- Items can be added from the school staff "Inventory" tab.
- Items can be disabled (soft delete) so historical records are not broken.

### 7.4 Stock Entry (Restocking)
- School staff can record new stock received at any time via the "Add / Restock" tab.
- Each stock entry must include: item, quantity added, date, optional note, and user who entered it.
- Multiple stock entries can be added in a single session.

### 7.5 Daily Usage Entry
- School staff log daily consumption via the "Log Daily Usage" modal.
- Each usage log must include: item selected from dropdown, quantity used, unit (auto-filled), date (defaults to today), meal type, and optional note.
- Staff can add multiple items in one submission using an "Add another item" button before submitting.

### 7.6 Current Stock Calculation
- Current stock per item = total stock added minus total usage logged.
- This is computed via a Postgres view (current_stock_view) so the frontend reads one aggregated source.
- Stock balance is shown on both the school dashboard and the NGO dashboard.

### 7.7 Low-Stock Alerts
- When an item's current stock falls below its threshold_qty, it is flagged as low or critical.
- Status levels: Good (above threshold), Medium (within 20% of threshold), Critical (below threshold).
- The NGO dashboard shows a prominent red alert banner at the top listing all critical items with quantities.
- Color indicators (green / amber / red) are used on stock cards and progress bars throughout the NGO app.
- Alerts are visible only on the dashboard — no email or SMS in MVP.

### 7.8 NGO Dashboard and Charts

The NGO dashboard contains the following sections:

**Summary section**
- Total items tracked
- Number of today's entries submitted
- Count of low-stock alerts (highlighted in red)
- Last updated timestamp
- School online/offline indicator

**Today's usage table**
- Item name, quantity used today, current remaining stock, and status badge (Good / Medium / Critical)

**Stock levels page**
- Full list of all grocery items with a horizontal progress bar showing current stock vs threshold
- Color-coded: green (good), amber (medium), red (critical)

**Usage history page**
- Date range filter: Last 7 days / Last 30 days / Custom range
- Daily usage log table with columns: date, item-wise quantities

**Charts (visual representation)**

The following four chart types are included on the usage history and dashboard pages:

| Chart type | What it shows | Why it is useful |
|---|---|---|
| Line chart | Daily usage per item over selected date range | Spot trends — is consumption rising or falling? |
| Horizontal bar chart | All items used today, sorted by quantity | Compare items at a glance for a single day |
| Donut chart | Count of items in Good / Medium / Critical stock | Quick health summary for the main dashboard |
| Grouped bar chart | This month vs last month usage per item | Plan budget and procurement for the next month |

Charts are built using Recharts (React library). Color conventions: blue for current data, light blue for comparison data, green for good stock, amber for medium, red for critical.

### 7.9 Real-Time Updates
- The NGO dashboard subscribes to Supabase real-time events on the stock_entries and usage_logs tables.
- When school staff submit a new entry, the NGO dashboard updates automatically without a page refresh.
- MVP uses Postgres Changes (simpler setup). Can be upgraded to Broadcast later if usage volume grows.

---

## 8. Page-Level Scope

### Shared
- Login page (split layout: branding left, form right)

### School App (Tab Navigation)
- Global Actions: "Record Incoming Stock" and "Log Daily Usage" modals available from all tabs.
- Overview Tab — stat cards (Total Items, Low Stock, Critical), critical alerts, and inventory preview.
- Inventory Tab — full list of grocery items with search and filter, and "Add New Item" button.
- Activity Tab — recent history of stock entries and usage logs with export functionality.

### NGO App (Tab Navigation)
- Global Actions: Center Switcher dropdown (All Centers, KGBV Thally, Triplicane Shelter, etc.).
- Global Overview Tab — alert banner, metric cards, total spend, daily/item usage charts, recent activity log, and real-time price audit feed.
- Master Catalog Tab — bilingual catalog list, status/category filters, inline editor for thresholds and prices, and "Download Report" button (Excel multi-sheet).

---

## 9. UI and Design Requirements

- Desktop web app with basic responsive styling (Tailwind grids/flex)
- English language throughout
- Simple and clean — suitable for non-technical users with no training required
- Tab-based navigation for both school and NGO interfaces
- Color scheme: dark navy blue (#042C53) for branding, red for alerts, green for good stock, amber for medium stock
- Left side of login page shows India NGO logo and branding; right side shows the login form
- No mobile layout required in MVP

---

## 10. Proposed Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast setup, Supabase provides React quickstarts |
| Styling | Tailwind CSS | Fast UI development, low complexity |
| Charts | Recharts | Simple React-native chart library, good for bar, line, donut charts |
| Auth | Supabase Auth | Integrated with React, handles sessions and user roles |
| Database | Supabase Postgres | Structured relational data fits stock, usage, users, items |
| Authorization | Supabase RLS | Database-level access control with policies |
| Real-time | Supabase Realtime (Postgres Changes) | Streams INSERT/UPDATE events to NGO dashboard |
| Hosting | Vercel | Free tier, auto-deploys from GitHub |
| AI coding | Cursor | AI-assisted code editor for intern development |

---

## 11. Data Model

### `schools`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | School name |
| location | text | Optional address |

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Same as Supabase auth user id |
| name | text | Display name |
| role | text | school_staff or ngo_admin |
| school_id | uuid | Foreign key to schools |

### `inventory_items`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| school_id | uuid | Foreign key |
| name | text | e.g. Rice, Dal, Cooking Oil |
| unit | text | kg, litres, or count |
| threshold_qty | numeric | Low-stock alert threshold |
| is_active | boolean | Soft delete flag |
| created_at | timestamp | Auto-set |

### `stock_entries`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| school_id | uuid | Foreign key |
| item_id | uuid | Foreign key to inventory_items |
| qty_added | numeric | Quantity received |
| entry_date | date | Date of stock receipt |
| notes | text | Optional |
| created_by | uuid | Foreign key to profiles |
| created_at | timestamp | Auto-set |

### `usage_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| school_id | uuid | Foreign key |
| item_id | uuid | Foreign key to inventory_items |
| qty_used | numeric | Quantity consumed |
| used_on | date | Date of usage (defaults to today) |
| meal_type | text | Check constraint ('Breakfast', 'Lunch', 'Snack', 'Dinner') |
| notes | text | Optional |
| created_by | uuid | Foreign key to profiles |
| created_at | timestamp | Auto-set |

### `price_updates`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| school_id | uuid | Foreign key to schools |
| item_id | uuid | Foreign key to inventory_items |
| old_price | numeric | Previous estimated cost |
| new_price | numeric | New estimated cost |
| updated_by | uuid | Foreign key to profiles |
| created_at | timestamp | Auto-set |

### `current_stock_view` (SQL view)
A Postgres view that computes current stock per item, configured with `security_invoker = true` to respect RLS:
```sql
current_stock = SUM(stock_entries.qty_added) - SUM(usage_logs.qty_used)
```
The NGO dashboard reads from this view instead of recomputing in the frontend.

---

## 12. Real-Time Architecture

When school staff insert a new row into `stock_entries` or `usage_logs`:

1. Supabase Realtime detects the INSERT event via Postgres Changes.
2. The NGO dashboard client receives the event through its active subscription.
3. The relevant sections (today's usage table, metric cards, alert banner) refresh automatically.

Subscriptions needed on the NGO dashboard:
- `stock_entries` — for stock received updates
- `usage_logs` — for daily consumption updates
- `inventory_items` (optional) — if thresholds or item names are edited

---

## 13. API / Client Flow

1. User opens the app and logs in via Supabase Auth (email + password).
2. App reads the user's profile row to get their role and school_id.
3. User is routed to either the school interface or the NGO interface.
4. School staff fills in the daily usage form and clicks submit.
5. Data is inserted into Postgres via the Supabase JS client.
6. RLS policy validates whether that user is allowed to insert for that school_id.
7. NGO dashboard receives a real-time event and refreshes the visible metrics and tables.

---

## 14. Non-Functional Requirements

### Security
- All data tables must have RLS enabled.
- School staff must not be able to read or write another school's data.
- NGO admins have read access appropriate to their scope.
- RLS must be tested with separate user accounts before deployment.

### Reliability
- The system must support normal browser-based use on school and NGO laptops with stable internet.
- Free-tier Supabase projects may pause after inactivity — this is acceptable for the pilot phase. A paid upgrade may be needed for daily production use.

### Performance
- The dashboard should load current stock and latest entries within a few seconds on a standard broadband connection.
- Real-time updates should appear within seconds of a school-side insert event.

### Usability
- Data entry forms must be operable without any technical training.
- Dropdowns for grocery items should be pre-loaded so staff never type item names manually.
- The NGO dashboard must prioritise low-stock visibility and latest activity above all else.

---

## 15. Free Tier Limits (Supabase)

| Resource | Free tier limit |
|---|---|
| Database size | 500 MB |
| Monthly active users | 50,000 |
| Realtime messages | 2 million/month |
| Peak realtime connections | 200 |

This is sufficient for MVP and pilot usage with one school and one NGO office.

---

## 16. Risks and Constraints

### Free Tier Limits
Supabase Free is enough for MVP, but if the NGO starts using the app heavily or needs guaranteed uptime, an upgrade may be needed.

### Data Quality
The dashboard is only as accurate as the entries recorded by school staff. Simple forms, pre-loaded item dropdowns, and a confirmation screen reduce the chance of errors.

### Permission Mistakes
Role-based apps often appear correct in the UI but fail if RLS policies have gaps. All policies must be tested with real user accounts before going live.

### Internet Dependency
Real-time updates depend on both the school and NGO having active internet connections. If the school's internet drops, the NGO will not see updates until the connection is restored.

---

## 17. Delivery Plan

### Phase 1 — Foundation
- Create Supabase project
- Define all tables and the current_stock_view
- Set up Supabase Auth
- Create profile and role mapping
- Enable RLS and write core policies
- Set up React + Vite project on local machine
- Connect Supabase client to React app

### Phase 2 — School Operations
- Build login page (split layout)
- Build school home dashboard
- Build daily usage form (multi-item, with confirmation screen)
- Build add / restock form
- Build add new grocery item form
- Build recent entry history page

### Phase 3 — NGO Visibility
- Build NGO main dashboard with metric cards and alert banner
- Build today's usage table
- Build stock levels page with progress bars and colour indicators
- Build usage history page with date filter and log table
- Build all four charts (line, horizontal bar, donut, grouped bar) using Recharts
- Build manage grocery items settings page

### Phase 4 — Real-Time and Deployment
- Enable Supabase Realtime subscriptions on stock_entries and usage_logs
- Connect NGO dashboard listeners
- Test real-time updates end to end
- Deploy frontend on Vercel
- Test with real school staff and NGO admin accounts
- Pilot with live data

---

## 18. Acceptance Criteria

- A school staff user can log in and reach only the school interface.
- A school staff user can add stock entries for their assigned school only.
- A school staff user can log daily usage for multiple items in a single submission.
- An NGO admin can log in and reach the NGO dashboard.
- An NGO admin can see current stock balance, low-stock alerts, usage history, and all four chart types.
- The NGO dashboard reflects school-side submissions in near real-time without a manual page refresh.
- Users cannot access data from unauthorised schools due to RLS policies.
- The app operates within Supabase free tier limits during pilot usage.
- All forms and labels are in English and usable without technical training.

---

## 19. MVP Success Metrics

- School staff can successfully log stock and usage entries without admin intervention.
- NGO admin can identify low-stock items without contacting the school manually.
- NGO admin can view usage trends through charts and make procurement decisions based on them.
- New school entries appear on the NGO dashboard in near real-time.
- Pilot usage remains inside Supabase free-tier limits during early rollout.

---

## 20. Future Considerations (Post-MVP)

- Email or WhatsApp alerts when stock goes critical
- Budget and cost tracking per grocery item (Basic expenditure tracking is already implemented)
- Mobile-friendly layout
- Offline data entry with sync when internet is restored
- Predictive stock forecasting based on usage history
