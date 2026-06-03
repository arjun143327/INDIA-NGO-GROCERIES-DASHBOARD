# AI Coding Guidance
## India NGO — School Grocery Usage Dashboard

**Version:** 1.0  
**Stack:** React + Vite · Supabase (Auth, Postgres, RLS, Realtime) · Tailwind CSS · Vercel  
**Audience:** AI coding assistants, developers  
**Last Updated:** June 2025

---

## 1. Project Overview

This is a role-based web application. Two user types exist — **school staff** and **ngo_admin** — and they share the same hosted frontend but see different pages based on their role. The backend is entirely Supabase (auth, database, RLS, realtime). There is no custom backend server.

When generating code for this project, always follow the structure, naming conventions, and patterns defined in this document. Do not invent new patterns mid-feature.

---

## 2. Tech Stack & Versions

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + Vite | Use functional components and hooks only. No class components. |
| Styling | Tailwind CSS v3 | Utility-first. No inline styles except for dynamic values (e.g. bar widths). |
| Auth | Supabase Auth | Email/password only for MVP. |
| Database | Supabase Postgres | All schema in `/supabase/migrations/`. |
| Realtime | Supabase Realtime (Postgres Changes) | Subscribe in custom hooks only. |
| Routing | React Router v6 | `<BrowserRouter>` at root. |
| State | React Context + hooks | No Redux or Zustand for MVP. |
| HTTP/DB client | `@supabase/supabase-js` v2 | Single initialised client, imported from `lib/supabase.js`. |
| Deployment | Vercel | No special config needed beyond `vite.config.js`. |

---

## 3. Project File Structure

```
/
├── public/
├── src/
│   ├── main.jsx                  # Entry point, wrap with providers
│   ├── App.jsx                   # Route definitions
│   ├── lib/
│   │   └── supabase.js           # Single Supabase client instance
│   ├── context/
│   │   └── AuthContext.jsx       # Auth state, user profile, role
│   ├── hooks/
│   │   ├── useCurrentStock.js    # Fetches current stock per school
│   │   ├── useInventoryItems.js  # Fetches active items for a school
│   │   ├── useActivityFeed.js    # Fetches recent stock + usage entries
│   │   ├── useRealtimeStock.js   # Subscribes to realtime changes (NGO)
│   │   └── useAlerts.js          # Derives low/critical items from stock
│   ├── components/
│   │   ├── layout/
│   │   │   ├── NavBar.jsx
│   │   │   ├── TabBar.jsx        # Only visible after login
│   │   │   └── PageShell.jsx     # NavBar + TabBar + <Outlet />
│   │   ├── ui/
│   │   │   ├── StatCard.jsx
│   │   │   ├── StatusPill.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── AlertStrip.jsx
│   │   │   ├── ActivityRow.jsx
│   │   │   ├── TrendBarRow.jsx
│   │   │   ├── LiveDot.jsx
│   │   │   └── Modal.jsx
│   │   └── forms/
│   │       ├── StockEntryForm.jsx
│   │       └── UsageEntryForm.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── school/
│   │   │   └── SchoolDashboard.jsx
│   │   └── ngo/
│   │       └── NgoDashboard.jsx
│   └── utils/
│       ├── stockStatus.js        # Pure status calculation functions
│       └── formatters.js         # Date, number, unit formatters
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── vite.config.js
└── tailwind.config.js
```

---

## 4. Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never hardcode these. Access via `import.meta.env.VITE_SUPABASE_URL`.

---

## 5. Supabase Client

There is exactly one Supabase client in the project. All hooks and components import from this single file.

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Rule:** Never call `createClient` anywhere else. Never instantiate a second client.

---

## 6. Auth Context

The AuthContext is the single source of truth for the logged-in user, their profile, and their role.

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

**Consuming the context:**

```js
const { profile, loading } = useAuth()
const role = profile?.role         // 'school_staff' | 'ngo_admin'
const schoolId = profile?.school_id
```

---

## 7. Routing & Role Guards

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import PageShell from './components/layout/PageShell'
import SchoolDashboard from './pages/school/SchoolDashboard'
import NgoDashboard from './pages/ngo/NgoDashboard'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RoleRoute({ role, children }) {
  const { profile } = useAuth()
  if (!profile) return null
  if (profile.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><PageShell /></RequireAuth>}>
          <Route index element={<RoleRedirect />} />
          <Route
            path="school"
            element={<RoleRoute role="school_staff"><SchoolDashboard /></RoleRoute>}
          />
          <Route
            path="ngo"
            element={<RoleRoute role="ngo_admin"><NgoDashboard /></RoleRoute>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function RoleRedirect() {
  const { profile } = useAuth()
  if (!profile) return null
  return <Navigate to={profile.role === 'ngo_admin' ? '/ngo' : '/school'} replace />
}
```

---

## 8. Database Schema

```sql
-- supabase/migrations/001_initial_schema.sql

create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null check (role in ('school_staff', 'ngo_admin')),
  school_id uuid references schools(id)
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) not null,
  name text not null,
  unit text not null,
  threshold_qty numeric not null default 10,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table stock_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) not null,
  item_id uuid references inventory_items(id) not null,
  qty_added numeric not null,
  entry_date date not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table usage_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) not null,
  item_id uuid references inventory_items(id) not null,
  qty_used numeric not null,
  used_on date not null,
  meal_type text check (meal_type in ('Breakfast', 'Lunch', 'Snack')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
```

### Current Stock View

```sql
create or replace view current_stock_view as
select
  i.school_id,
  i.id as item_id,
  i.name as item_name,
  i.unit,
  i.threshold_qty,
  coalesce(sum(se.qty_added), 0) - coalesce(sum(ul.qty_used), 0) as current_stock
from inventory_items i
left join stock_entries se on se.item_id = i.id
left join usage_logs ul on ul.item_id = i.id
where i.is_active = true
group by i.school_id, i.id, i.name, i.unit, i.threshold_qty;
```

---

## 9. Row-Level Security (RLS)

Enable RLS on all tables. Never skip this step.

```sql
-- Enable RLS
alter table profiles enable row level security;
alter table inventory_items enable row level security;
alter table stock_entries enable row level security;
alter table usage_logs enable row level security;

-- Helper: get current user's school_id from profiles
create or replace function get_my_school_id()
returns uuid language sql stable security definer as $$
  select school_id from profiles where id = auth.uid()
$$;

-- Helper: get current user's role
create or replace function get_my_role()
returns text language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- Profiles: users can only read their own profile
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

-- inventory_items: school staff see only their school's items, NGO sees all
create policy "items_select" on inventory_items
  for select using (
    get_my_role() = 'ngo_admin'
    or school_id = get_my_school_id()
  );

create policy "items_insert" on inventory_items
  for insert with check (school_id = get_my_school_id());

-- stock_entries: school staff insert/select own school, NGO reads all
create policy "stock_select" on stock_entries
  for select using (
    get_my_role() = 'ngo_admin'
    or school_id = get_my_school_id()
  );

create policy "stock_insert" on stock_entries
  for insert with check (school_id = get_my_school_id());

-- usage_logs: same pattern
create policy "usage_select" on usage_logs
  for select using (
    get_my_role() = 'ngo_admin'
    or school_id = get_my_school_id()
  );

create policy "usage_insert" on usage_logs
  for insert with check (school_id = get_my_school_id());
```

**Rule:** RLS policies are the authoritative access control layer. Frontend route guards are for UX only — they do not replace RLS. Always test with real user sessions from two different roles before shipping a feature.

---

## 10. Reusable Utility Functions

### 10.1 stockStatus — pure function, no side effects

```js
// src/utils/stockStatus.js

/**
 * Returns 'ok' | 'low' | 'critical' based on stock vs threshold.
 * @param {number} stock - current stock quantity
 * @param {number} threshold - minimum acceptable quantity
 * @returns {'ok' | 'low' | 'critical'}
 */
export function stockStatus(stock, threshold) {
  if (threshold <= 0) return 'ok'
  const ratio = stock / threshold
  if (ratio < 0.5) return 'critical'
  if (ratio < 1) return 'low'
  return 'ok'
}

/**
 * Returns a 0–100 fill percentage for the progress bar.
 * Cap is based on threshold × 1.8 so a well-stocked item fills ~80%.
 */
export function stockBarPct(stock, threshold) {
  if (threshold <= 0) return 100
  return Math.min(100, Math.round((stock / (threshold * 1.8)) * 100))
}

/**
 * Maps status to Tailwind colour classes for pills, borders, icons.
 */
export const STATUS_STYLES = {
  ok: {
    pill: 'bg-green-50 text-green-800',
    bar: 'bg-green-500',
    icon: 'text-green-700',
    strip: 'bg-green-50',
  },
  low: {
    pill: 'bg-amber-50 text-amber-800',
    bar: 'bg-amber-500',
    icon: 'text-amber-600',
    strip: 'bg-amber-50',
  },
  critical: {
    pill: 'bg-red-50 text-red-800',
    bar: 'bg-red-500',
    icon: 'text-red-600',
    strip: 'bg-red-50',
  },
}
```

### 10.2 formatters

```js
// src/utils/formatters.js

/**
 * Formats a Supabase timestamptz or ISO string to a relative label.
 * Returns "Today HH:MM", "Yesterday", or "D MMM".
 */
export function relativeDate(isoString) {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return `Today ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/**
 * Formats a number to at most 1 decimal place, removing trailing zero.
 * e.g. 3.0 → "3", 4.5 → "4.5"
 */
export function formatQty(value) {
  const n = parseFloat(value)
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
```

---

## 11. Custom Hooks

### 11.1 useCurrentStock

Fetches current stock from `current_stock_view` for the user's school (or all schools for NGO).

```js
// src/hooks/useCurrentStock.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCurrentStock() {
  const { profile } = useAuth()
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profile) return

    async function fetch() {
      setLoading(true)
      let query = supabase.from('current_stock_view').select('*')

      if (profile.role === 'school_staff') {
        query = query.eq('school_id', profile.school_id)
      }

      const { data, error } = await query
      if (error) setError(error)
      else setStock(data)
      setLoading(false)
    }

    fetch()
  }, [profile])

  return { stock, loading, error }
}
```

### 11.2 useRealtimeStock (NGO only)

Subscribes to Postgres Changes on `stock_entries` and `usage_logs`. On any INSERT, triggers a callback to refetch stock.

```js
// src/hooks/useRealtimeStock.js
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Calls onUpdate() when a new stock_entry or usage_log is inserted.
 * Only mount this hook in the NGO dashboard.
 * @param {() => void} onUpdate - callback to trigger a stock refetch
 */
export function useRealtimeStock(onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_entries' },
        onUpdate
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'usage_logs' },
        onUpdate
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [onUpdate])
}
```

**Usage in NgoDashboard:**

```jsx
const { stock, loading, refetch } = useCurrentStock()
useRealtimeStock(refetch)
```

Ensure `refetch` is a stable reference (wrap in `useCallback`) to avoid infinite re-subscription.

### 11.3 useAlerts

Derives alert items from stock data. Pure computation, no async.

```js
// src/hooks/useAlerts.js
import { useMemo } from 'react'
import { stockStatus } from '../utils/stockStatus'

/**
 * Returns critical and low items separated into two arrays.
 * @param {Array} stock - rows from current_stock_view
 */
export function useAlerts(stock) {
  return useMemo(() => {
    const critical = stock.filter(
      (item) => stockStatus(item.current_stock, item.threshold_qty) === 'critical'
    )
    const low = stock.filter(
      (item) => stockStatus(item.current_stock, item.threshold_qty) === 'low'
    )
    return { critical, low, hasAlerts: critical.length > 0 || low.length > 0 }
  }, [stock])
}
```

### 11.4 useActivityFeed

```js
// src/hooks/useActivityFeed.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useActivityFeed(limit = 10) {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    async function fetch() {
      const schoolFilter = profile.role === 'school_staff'
        ? { school_id: profile.school_id }
        : {}

      const [stockRes, usageRes] = await Promise.all([
        supabase.from('stock_entries').select(`
          id, created_at, qty_added,
          inventory_items(name, unit),
          profiles(name)
        `).match(schoolFilter).order('created_at', { ascending: false }).limit(limit),

        supabase.from('usage_logs').select(`
          id, created_at, qty_used,
          inventory_items(name, unit),
          profiles(name)
        `).match(schoolFilter).order('created_at', { ascending: false }).limit(limit),
      ])

      const stockMapped = (stockRes.data || []).map((e) => ({
        ...e,
        type: 'stock',
        qty: e.qty_added,
      }))
      const usageMapped = (usageRes.data || []).map((e) => ({
        ...e,
        type: 'usage',
        qty: e.qty_used,
      }))

      const combined = [...stockMapped, ...usageMapped]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)

      setEntries(combined)
      setLoading(false)
    }

    fetch()
  }, [profile, limit])

  return { entries, loading }
}
```

---

## 12. Reusable UI Components

### 12.1 StatusPill

```jsx
// src/components/ui/StatusPill.jsx
import { stockStatus, STATUS_STYLES } from '../../utils/stockStatus'

export function StatusPill({ stock, threshold }) {
  const status = stockStatus(stock, threshold)
  const label = { ok: 'OK', low: 'Low', critical: 'Critical' }[status]
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[status].pill}`}>
      {label}
    </span>
  )
}
```

### 12.2 ProgressBar

```jsx
// src/components/ui/ProgressBar.jsx
import { stockStatus, stockBarPct, STATUS_STYLES } from '../../utils/stockStatus'

export function ProgressBar({ stock, threshold }) {
  const status = stockStatus(stock, threshold)
  const pct = stockBarPct(stock, threshold)
  return (
    <div className="h-[5px] w-20 rounded bg-gray-200 overflow-hidden">
      <div
        className={`h-full rounded ${STATUS_STYLES[status].bar}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

### 12.3 StatCard

```jsx
// src/components/ui/StatCard.jsx
export function StatCard({ label, value, colour = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4">
      <div className={`text-[22px] font-semibold leading-none ${colour}`}>{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mt-1">{label}</div>
    </div>
  )
}
```

### 12.4 AlertStrip

```jsx
// src/components/ui/AlertStrip.jsx
import { STATUS_STYLES } from '../../utils/stockStatus'

export function AlertStrip({ item, onNotify }) {
  const isCritical = item.status === 'critical'
  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 ${STATUS_STYLES[item.status].strip}`}>
      <span className={`mt-0.5 text-base ${STATUS_STYLES[item.status].icon}`}>
        {isCritical ? '⊗' : '△'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-gray-900">{item.item_name}</p>
        <p className="text-[11px] text-gray-500">
          {item.current_stock} {item.unit} remaining · Threshold {item.threshold_qty} {item.unit}
        </p>
      </div>
      {isCritical && onNotify && (
        <button
          onClick={() => onNotify(item)}
          className="text-[11px] font-semibold border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50"
        >
          Notify
        </button>
      )}
    </div>
  )
}
```

### 12.5 Modal

```jsx
// src/components/ui/Modal.jsx
export function Modal({ title, open, onClose, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
```

### 12.6 LiveDot

```jsx
// src/components/ui/LiveDot.jsx
export function LiveDot() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-700">
      <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
      Live
    </div>
  )
}
```

---

## 13. Form Patterns

### Submit Pattern (Add Stock)

```jsx
// src/components/forms/StockEntryForm.jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export function StockEntryForm({ items, onSuccess }) {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    item_id: '',
    qty_added: '',
    entry_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function validate() {
    const e = {}
    if (!form.item_id) e.item_id = 'Select an item'
    if (!form.qty_added || Number(form.qty_added) <= 0) e.qty_added = 'Enter a valid quantity'
    if (!form.entry_date) e.entry_date = 'Select a date'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    const { error } = await supabase.from('stock_entries').insert({
      school_id: profile.school_id,
      item_id: form.item_id,
      qty_added: Number(form.qty_added),
      entry_date: form.entry_date,
      notes: form.notes || null,
      created_by: profile.id,
    })
    setSaving(false)

    if (!error) onSuccess()
  }

  return (
    // Form fields here, calling handleSubmit on Save button click
    // Show errors[field] below each field as a small red text
    null
  )
}
```

**Rules for all forms:**
- Always validate before calling Supabase insert.
- Never send empty strings to Postgres — use `|| null` for optional fields.
- Disable the Save button while `saving` is true.
- Call `onSuccess()` (which closes the modal and triggers a refetch) only on success.
- Never use `<form>` elements with `onSubmit`. Use `<button onClick={handleSubmit}>` instead.

---

## 14. Page Component Structure

Each page follows this pattern:

```jsx
// src/pages/school/SchoolDashboard.jsx
import { useState, useCallback } from 'react'
import { useCurrentStock } from '../../hooks/useCurrentStock'
import { useActivityFeed } from '../../hooks/useActivityFeed'
import { useAlerts } from '../../hooks/useAlerts'
import { useAuth } from '../../context/AuthContext'

export default function SchoolDashboard() {
  const { profile } = useAuth()
  const { stock, loading, refetch } = useCurrentStock()
  const { entries } = useActivityFeed()
  const { critical, low, hasAlerts } = useAlerts(stock)
  const [modalOpen, setModalOpen] = useState(null) // 'stock' | 'usage' | null

  function closeModal() {
    setModalOpen(null)
    refetch()   // Refresh stock after a new entry
  }

  if (loading) return <LoadingShimmer />

  return (
    <>
      {/* Stat cards */}
      {/* Action buttons */}
      {/* Alerts card (conditional) */}
      {/* Stock table */}
      {/* Activity feed */}
      {/* Modals */}
    </>
  )
}
```

**Rules:**
- Each page owns its own modal open/close state.
- Data fetching is delegated entirely to hooks. Pages do not call `supabase` directly.
- `refetch` from each hook triggers a fresh query. Call it after any successful insert.

---

## 15. Supabase Realtime Subscription Rules

- Only subscribe in the NGO dashboard. School staff do not need realtime.
- Always unsubscribe on component unmount by returning the cleanup from `useEffect`.
- Use a named channel string (`'stock-changes'`) — not a UUID — so the channel is predictable.
- Do not subscribe to `UPDATE` or `DELETE` events in the MVP. Only `INSERT` is needed.
- If the component re-renders, the subscription must not re-create unless `onUpdate` changes. Wrap `onUpdate` in `useCallback` with appropriate deps.

---

## 16. Error Handling Conventions

- Every Supabase call must destructure `{ data, error }` and check `error` before using `data`.
- On read errors: log the error and show a muted inline message "Could not load data. Try refreshing."
- On write errors: show the error message in a small red block below the form's action buttons.
- Never `throw` inside async hooks — catch and set state instead.
- Never expose raw Supabase error messages to the user. Map them to plain English.

---

## 17. Coding Conventions

- **Component naming:** PascalCase (`StockTable`, `AlertStrip`).
- **Hook naming:** camelCase prefixed with `use` (`useCurrentStock`).
- **Utility function naming:** camelCase (`stockStatus`, `formatQty`).
- **Prop naming:** camelCase, no abbreviations (`onSuccess` not `onOk`, `threshold` not `thresh`).
- **No default exports from utility files.** Use named exports only.
- **Default exports only for page and component files** (one component per file).
- **No `any` props.** Define what each component expects explicitly in JSDoc or PropTypes if not using TypeScript.
- **No magic numbers.** Extract constants: `const CRITICAL_RATIO = 0.5` in `stockStatus.js`.
- **No commented-out code** in committed files.
- Keep components under 150 lines. If longer, extract sub-components.

---

## 18. What Not to Build in MVP

Do not generate code for any of the following unless explicitly asked:

- Purchase approval workflows
- Vendor management
- Invoice or document uploads
- Offline sync or service workers
- Predictive analytics or ML features
- Mobile app (React Native)
- Push notifications
- Multi-language (i18n) support
- Dark mode toggle
- Admin panel for user management (handle via Supabase dashboard)

---

## 19. Testing Checklist Before Shipping

Before marking any feature as done, verify:

- [ ] School staff user can only see and insert data for their own `school_id`
- [ ] NGO admin user can see data for all schools
- [ ] A school staff user from School A cannot query data from School B (test with direct Supabase JS calls)
- [ ] Inserting a stock entry or usage log triggers the NGO dashboard realtime update
- [ ] Modal form validates all required fields before inserting
- [ ] Stock status (OK / Low / Critical) updates correctly after new entries
- [ ] All Supabase errors are caught and surfaced to the user
- [ ] Free-tier limits are not exceeded during pilot (500 MB DB, 2M realtime messages, 200 peak connections)

---

*End of AI Coding Guidance*
