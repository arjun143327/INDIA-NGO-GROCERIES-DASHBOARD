# Product Requirements Document: NGO School Grocery Usage Dashboard

## Overview
This product is a role-based web application that allows a school to record grocery stock received and daily consumption, while the NGO monitors inventory health, refill needs, and usage trends through a realtime dashboard. The recommended MVP stack is React on the frontend with Supabase for authentication, Postgres data storage, row-level security, and realtime updates, which keeps the build small and practical for a first production-style rollout.[cite:25][cite:15][cite:17]

The core operating model is simple: the school is the data-entry location, and the NGO is the monitoring location. Both use the same hosted application, but each sees different interfaces and permissions based on user role.[cite:15][cite:21]

## Problem Statement
The school receives groceries and uses them every day for meal preparation, but without a structured digital system it becomes hard to know current stock, consumption rate, and upcoming refill needs. This creates a risk of stockouts, delayed purchases, inaccurate reporting, and limited visibility for the NGO that funds or supervises the operation.

The NGO needs a way to see what the school is consuming, what is running low, and whether the stock levels are healthy, without waiting for manual messages or spreadsheet sharing. Realtime syncing is especially valuable because Supabase supports listening to database changes from client applications, allowing the NGO dashboard to reflect new school entries quickly.[cite:17]

## Goals
- Give school staff a simple workflow to add stock and record daily usage.
- Give the NGO a live dashboard with current stock, item-wise consumption, and low-stock alerts.
- Ensure users only access data they are allowed to see through database-level access control.[cite:15][cite:18][cite:21]
- Keep the MVP low-cost and deployable on free tiers at the beginning; Supabase Free includes 2 free projects, 500 MB database size, 50,000 monthly active users, 2 million realtime messages, and 200 peak realtime connections.[cite:26]

## Non-Goals
The MVP will not include purchase approvals, vendor management, accounting, invoice uploads, offline sync, predictive analytics, or mobile apps. These can be considered after the core stock-and-usage workflow is stable in real usage.

## Users and Roles
### School Staff
School staff are responsible for entering groceries received and logging daily consumption. They should only be able to create and view records for their own school.[cite:15][cite:21]

### NGO Admin
NGO admins need visibility into stock position, low-stock alerts, refill needs, and historical usage. They should be able to view records across the school or schools under management, and optionally manage master item settings in a later phase.[cite:15][cite:21]

## User Stories
### School Staff
- As a school staff member, I want to log groceries received so the system knows what stock came in.
- As a school staff member, I want to enter daily usage for items such as rice, oil, and vegetables so the stock balance stays updated.
- As a school staff member, I want to see recent entries so I can confirm what was recorded.

### NGO Admin
- As an NGO admin, I want to see current stock levels so I can understand whether the kitchen has enough supplies.
- As an NGO admin, I want to see low-stock and critical-stock items so I know what needs refill soon.
- As an NGO admin, I want the dashboard to update in realtime when the school logs new usage or stock entry so I do not depend on manual refresh or phone follow-up.[cite:17][cite:49]

## Functional Requirements
### Authentication
- The system must support login for school staff and NGO admin users.
- The system should use Supabase Auth for user authentication because it is already integrated with React-oriented quickstarts and works well with row-level authorization patterns.[cite:44][cite:15]

### Role-Based Access
- The system must assign each user a role and associated school identifier.
- The database must enforce row-level access using RLS policies, not just frontend route guards. Supabase documents RLS as policy-based row access control supporting SELECT, INSERT, UPDATE, and DELETE rules, with helpers such as `auth.uid()` and `auth.jwt()`.[cite:15][cite:21][cite:18]

### Item Master
- School or NGO admin should be able to maintain a list of inventory items.
- Each item must include at least: item name, unit, threshold quantity, active status, and school association.

### Stock Entry
- School staff must be able to add a stock entry whenever groceries are received.
- Each stock entry must include item, quantity added, date, optional note, and user who entered it.

### Usage Entry
- School staff must be able to log daily usage.
- Each usage log must include item, quantity used, date, optional meal type, optional note, and user who entered it.

### Current Stock Calculation
- The system must calculate current stock as total stock added minus total usage logged.
- The NGO dashboard must show this as the current balance per item.

### Dashboard and Reports
- NGO dashboard must show item-wise stock balance.
- NGO dashboard must show low-stock alerts based on threshold quantity.
- NGO dashboard should show recent stock and usage activity.
- NGO dashboard should show simple daily or weekly trend charts for major items.

### Realtime Updates
- The NGO dashboard must reflect school-side changes in near realtime.
- Supabase supports two approaches for realtime database changes: Broadcast, which is the recommended method for scalability and security, and Postgres Changes, which is simpler and requires less setup for an MVP.[cite:17][cite:49]
- The MVP should start with Postgres Changes for simplicity, then move to Broadcast later if usage volume grows.[cite:17]

## Non-Functional Requirements
### Security
- All sensitive tables must have RLS enabled.[cite:21]
- School users must not see or edit another school's data.
- NGO users must have read access appropriate to their scope.

### Reliability
- The system should support normal browser-based use on school and NGO laptops with reliable internet.
- Because free-tier Supabase projects may be paused after inactivity and have quota-based limits, the MVP is suitable for pilot and early usage but may need a paid upgrade if the NGO depends on it daily at production level.[cite:26]

### Performance
- The dashboard should load current stock and latest entries within a few seconds on a standard broadband connection.
- Realtime updates should appear shortly after insert or update events are committed.[cite:17]

### Usability
- Data-entry forms must be simple enough for non-technical staff.
- The NGO dashboard should prioritize low-stock visibility, refill urgency, and latest updates over complex analytics.

## Proposed Tech Stack
| Layer | Recommended Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Supabase provides React quickstarts and client integration guidance.[cite:43] |
| Styling | Tailwind CSS or CSS Modules | Fast UI development with low complexity. |
| Auth | Supabase Auth | Easy integration with React and user/session management.[cite:44] |
| Database | Supabase Postgres | Structured relational data is a good fit for stock, usage, users, and schools.[cite:25] |
| Authorization | Supabase RLS | Database-level access control with policies.[cite:15][cite:21] |
| Realtime | Supabase Realtime | Supports listening to database changes; Postgres Changes is simplest for MVP.[cite:17] |
| Hosting | Vercel | Suitable for frontend deployment of a React app. |

## Data Model
### `schools`
- `id`
- `name`
- `location`

### `profiles`
- `id` (same as auth user id)
- `name`
- `role`
- `school_id`

### `inventory_items`
- `id`
- `school_id`
- `name`
- `unit`
- `threshold_qty`
- `is_active`
- `created_at`

### `stock_entries`
- `id`
- `school_id`
- `item_id`
- `qty_added`
- `entry_date`
- `notes`
- `created_by`
- `created_at`

### `usage_logs`
- `id`
- `school_id`
- `item_id`
- `qty_used`
- `used_on`
- `meal_type`
- `notes`
- `created_by`
- `created_at`

### Optional View: `current_stock_view`
This SQL view can compute current stock from stock entries and usage logs so the NGO dashboard can read one aggregated source instead of recomputing values entirely in the frontend.

## Page-Level Scope
### Shared
- Login page

### School App
- Dashboard with current item status and recent entries
- Add stock page or modal
- Add usage page or modal
- Entry history page

### NGO App
- Summary dashboard
- Low-stock alerts page or section
- Usage trends page
- Recent activity table

## Realtime Architecture
When school staff insert a new row into `stock_entries` or `usage_logs`, the NGO dashboard should receive a realtime event and refresh the relevant sections. Supabase documents that realtime can be implemented by subscribing to database changes, and that Postgres Changes can stream INSERT or UPDATE events after the table is added to the realtime publication.[cite:17][cite:49]

For the MVP, subscribe the NGO dashboard to:
- `stock_entries` for received grocery updates
- `usage_logs` for daily consumption updates
- optionally `inventory_items` if thresholds or item names change

## API / Client Flow
1. User logs in through Supabase Auth.[cite:44]
2. App reads profile and role.
3. School staff submits stock or usage form.
4. Data is inserted into Postgres through Supabase client.
5. RLS validates whether that user can insert the row.[cite:15][cite:21]
6. NGO dashboard listens for changes and refreshes visible metrics.[cite:17]

## MVP Success Metrics
- School staff can successfully log stock entries and usage logs without admin intervention.
- NGO admin can see current stock balance for all active items.
- NGO admin can identify low-stock items without contacting the school manually.
- New school entries appear on the NGO dashboard in near realtime.[cite:17]
- Pilot usage remains inside free-tier limits during early rollout; Supabase Free includes 2 million realtime messages and 200 peak realtime connections.[cite:26]

## Risks and Constraints
### Free Tier Limits
Supabase Free is enough for an MVP, but the project has limits on database size, realtime messages, and peak realtime connections. If the NGO starts using the app heavily or expects guaranteed production stability, an upgrade may be needed later.[cite:26]

### Data Quality
The dashboard is only as accurate as the entries recorded by school staff. Training, clear item naming, and simple forms are important to reduce mistakes.

### Permission Mistakes
Role-based apps often appear correct in the UI but still fail if database policies are weak. RLS must be tested with multiple user accounts and school scopes before deployment.[cite:18][cite:21]

## Delivery Plan
### Phase 1: Foundation
- Create Supabase project
- Define tables
- Add auth
- Add profile and role mapping
- Enable RLS and write core policies

### Phase 2: School Operations
- Build stock entry form
- Build usage entry form
- Build recent history page

### Phase 3: NGO Visibility
- Build stock summary dashboard
- Build low-stock alert cards
- Build recent activity table
- Build basic usage trend charts

### Phase 4: Realtime and Deployment
- Enable realtime subscriptions on required tables.[cite:17]
- Connect NGO dashboard listeners.
- Deploy frontend on Vercel.
- Pilot with real user accounts.

## Acceptance Criteria
- A school staff user can log in and add stock entries only for their assigned school.
- A school staff user can log daily usage only for their assigned school.
- An NGO admin can log in and view stock, usage, and alerts.
- Users cannot access unauthorized rows because table access is restricted by RLS policies.[cite:15][cite:21]
- New school entries appear on the NGO dashboard in near realtime through Supabase realtime subscriptions.[cite:17]
- The MVP can operate on free tiers during pilot usage, within the documented quotas for database size, monthly active users, realtime messages, and connections.[cite:26]

## Recommendation
The best MVP implementation path is React + Supabase + Vercel rather than MERN. This reduces backend setup effort while still supporting authentication, relational data, row-level permissions, and realtime dashboard updates in a way that is aligned with the product's immediate needs.[cite:43][cite:44][cite:15]
