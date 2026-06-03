# UI/UX Design Specification
## India NGO — School Grocery Usage Dashboard

**Version:** 1.0  
**Product:** NGO School Grocery Usage Dashboard  
**Audience:** Designers, Frontend Developers  
**Last Updated:** June 2025

---

## 1. Design Philosophy

This product serves two distinct audiences: **non-technical school staff** logging daily grocery stock and usage, and **NGO administrators** monitoring inventory health across schools. The design must prioritise clarity and speed over visual richness. Every element earns its place.

**Core principles:**

- **Simplicity first.** School staff may have limited digital literacy. Forms must be obvious without training.
- **Information hierarchy over decoration.** The NGO dashboard must answer "what needs my attention?" within 3 seconds of loading.
- **Trust through consistency.** Colours carry meaning — red always means critical, amber always means low, green always means healthy. Never use them decoratively.
- **Mobile-aware but desktop-first.** Staff use laptops or tablets. The layout must be clean at 1024px and above, and not break below 768px.

---

## 2. Brand & Visual Identity

Aligned with India NGO's existing identity at [indiango.org](https://indiango.org).

### 2.1 Colour Palette

| Token | Hex | Usage |
|---|---|---|
| `--green-dark` | `#145c32` | Navigation bar, primary headings, primary buttons |
| `--green-mid` | `#1a6b3c` | Active tab indicators, icon accents, positive values |
| `--green-pale` | `#e8f4ee` | Table row hover, success badge backgrounds |
| `--amber` | `#d97706` | Low-stock badges, log-usage button, warning indicators |
| `--amber-bg` | `#fef3c7` | Warning badge backgrounds, alert strip backgrounds |
| `--red` | `#dc2626` | Critical-stock badges, critical alert icons |
| `--red-bg` | `#fee2e2` | Critical badge backgrounds, critical alert strip backgrounds |
| `--text-primary` | `#111111` | Body text, table content, form values |
| `--text-secondary` | `#555555` | Labels, metadata, muted hints |
| `--surface` | `#ffffff` | Card backgrounds, modal backgrounds |
| `--surface-alt` | `#f7f7f6` | Page background |
| `--border` | `rgba(0,0,0,0.09)` | Card borders, table dividers, input borders |

**Rule:** Never use green, amber, or red for purely decorative purposes. Colour encodes stock status and should remain predictable throughout the interface.

### 2.2 Typography

| Use | Font | Weight | Size |
|---|---|---|---|
| All UI text | Inter | 400, 500, 600 | Varies |
| Page title | Inter | 600 | 16px |
| Card section title | Inter | 600 | 13px |
| Table header | Inter | 600 | 10px (uppercase, letter-spacing 0.4px) |
| Table body | Inter | 400 | 12px |
| Stat number | Inter | 600 | 22px |
| Stat label | Inter | 500 | 11px (uppercase, letter-spacing 0.3px) |
| Button | Inter | 600 | 12px |
| Form label | Inter | 500 | 11px |
| Form input | Inter | 400 | 12px |
| Alert title | Inter | 600 | 12px |
| Alert description | Inter | 400 | 11px |

**No decorative fonts.** Inter is sufficient across all contexts here.

### 2.3 Spacing & Shape

- **Border radius:** 8px for cards, modals, inputs, buttons. 10px for pills/badges.
- **Card padding:** 14px vertical, 16px horizontal.
- **Section gap:** 14px between cards. 16px between major sections.
- **Table cell padding:** 10px vertical, 16px horizontal.
- **Border width:** 1px for cards, modals, inputs. No shadow — borders define surfaces.
- **Input height:** 34px.
- **Button height:** 32px (standard), 26px (small/inline).

---

## 3. Layout Structure

### 3.1 Global Shell

```
┌─────────────────────────────────────────────────────┐
│  NAV BAR (52px, dark green)                         │
│  [Logo] India NGO · Grocery Tracker  [User Avatar]  │
├─────────────────────────────────────────────────────┤
│  TAB BAR (44px, white, border-bottom)               │
│  [ School Staff ]  [ NGO Admin ]                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PAGE CONTENT (padding: 20px)                       │
│  background: #f7f7f6                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3.2 Navigation Bar

- Background: `--green-dark` (`#145c32`)
- Height: 52px
- Left: Logo mark (28×28px white rounded square with green SVG icon) + product name + school/role sub-label
- Right: User avatar circle + user name
- The sub-label under the product name changes by active tab: "GPS Tiruvallur — School View" vs "NGO Admin — All Schools"

### 3.3 Tab Bar

- Background: white, 1px bottom border in `--border`
- Tabs: 44px height, 20px horizontal padding
- Active tab: `--green-mid` text colour + 2px bottom border in `--green-mid`
- Inactive tab: `--text-secondary`, no border
- Font: 13px Inter 500 inactive, 600 active

---

## 4. School Staff Page

### 4.1 Purpose

School staff land here after login. They need to:
1. See if anything is critically low (and act immediately)
2. Log incoming stock deliveries
3. Log daily usage after meals

### 4.2 Page Layout

```
Page Title + Sub-label
Action Buttons Row          [Add Stock]  [Log Usage]
Stat Cards Row (3 cards)
Alerts Card (conditional)
Current Stock Table Card
Recent Entries Card
```

### 4.3 Stat Cards

Three equal-width cards in a row. Each card contains:
- Large number (22px, 600 weight) in status colour
- Label below (11px, uppercase, muted)

| Card | Value colour | Label |
|---|---|---|
| Total Items | `--green-mid` | "Total Items" |
| Low Stock | `--amber` | "Low Stock" |
| Critical | `--red` | "Critical" |

### 4.4 Action Buttons

Two buttons, left-aligned, placed above the alerts card:
- **Add Stock** — primary green button (`--green-mid` background, white text)
- **Log Usage** — outline button (white background, border, dark text)

Both open a modal form (see Section 6).

### 4.5 Alerts Card (Conditional)

Only shown when one or more items are Low or Critical. Hidden entirely when all items are OK.

- Card title: "Needs Attention" with a warning triangle icon in `--green-mid`
- Each alert is a horizontal strip inside the card, separated by a 1px border
- Critical strips: `#fff9f9` background, red circle-alert icon, red title
- Low strips: `#fffbf0` background, amber triangle-alert icon, dark amber title
- Strip content: item name (bold), and a description line "X kg remaining · Threshold Y kg"

### 4.6 Current Stock Table

Full-width table card with columns:

| Column | Width | Notes |
|---|---|---|
| Item | flex | Font-weight 500 |
| In Stock | fixed | Shows value + unit |
| Threshold | fixed | Muted text colour |
| Level | 80px | Progress bar, 5px height |
| Status | fixed | Pill badge |

**Progress bar fill colour:** green (OK), amber (Low), red (Critical). Bar width is proportional to `stock / (threshold × 1.8)`, capped at 100%.

**Status pill:**
- OK: green-pale background, dark green text
- Low: amber-bg background, dark amber text
- Critical: red-bg background, dark red text

Table rows have a 1px bottom border. Last row has no border. Row hover: `#fafaf9` background.

### 4.7 Recent Entries

A list of the last 5–10 stock-in and usage entries. Each row:
- Coloured dot (green = stock in, amber = usage out)
- Item name (font-weight 500)
- Quantity (green for +, amber for −, font-weight 600)
- Relative timestamp (muted, right-aligned)

---

## 5. NGO Admin Dashboard

### 5.1 Purpose

NGO admins need to monitor without intervening in daily operations. The dashboard must:
1. Surface critical and low-stock items immediately
2. Show stock levels across all items
3. Show daily and weekly consumption trends
4. Show recent activity from school staff entries in near realtime

### 5.2 Page Layout

```
Page Title                                [Live indicator]
Stat Cards Row (4 cards)
┌──────────────────────┬──────────────────────────────┐
│ Alerts Card          │ Weekly Usage Trend Card       │
│ All Items Table Card │ Recent Activity Card          │
└──────────────────────┴──────────────────────────────┘
```

Two-column layout. Left column: Alerts + All Items table. Right column: Trend bars + Activity feed.

### 5.3 Stat Cards (4 cards)

| Card | Colour | Label |
|---|---|---|
| Items Tracked | default | "Items Tracked" |
| Low Stock | `--amber` | "Low Stock" |
| Critical | `--red` | "Critical" |
| 7-Day Usage | `--green-mid` | "7-Day Usage (kg/L)" |

### 5.4 Live Indicator

Small pulsing green dot with "Live" text in `--green-mid`, placed top-right of the page header row. Pulses with a CSS opacity animation (1.5s cycle). Represents that the dashboard listens to Supabase realtime events.

### 5.5 Alerts Card

Same strip-based pattern as the School view alerts card, with one addition: Critical items show a small "Notify" outline button on the right side of the strip, allowing the NGO admin to trigger a notification to the school.

If no items are critical or low, show a single muted line: "All items are at healthy levels."

### 5.6 All Items Table

Three-column compact table: Item name, Stock (value + unit), Status pill. Same pill logic as the school table.

### 5.7 Weekly Usage Trend

Horizontal bar chart, one row per day of the week (Mon–Sun). Each row:
- Day label (30px wide, 11px muted text)
- Bar: full-width background in `#f3f4f6`, green fill proportional to that day's total usage vs the week's peak
- Value label (right-aligned, 11px, font-weight 500)

This is a purely visual, non-interactive bar chart. No tooltips required in the MVP.

### 5.8 Recent Activity Card

Identical in structure to the school recent entries list. Shows the same last 5 entries from all schools. Label: "Recent Activity."

---

## 6. Modal Forms

Both "Add Stock" and "Log Usage" use the same modal container. The modal opens centred over the page with a dark backdrop (`rgba(0,0,0,0.4)`). Clicking the backdrop closes the modal.

### 6.1 Modal Container

- Max width: 360px
- Border radius: 10px
- White background, 1px border
- Header strip (14px padding, 1px bottom border): title text (14px, 600) + close × button
- Body: 16px padding, form fields, action buttons

### 6.2 Add Stock Form

| Field | Type | Required |
|---|---|---|
| Item | Select (from inventory_items) | Yes |
| Quantity | Number input | Yes |
| Date | Date picker, default today | Yes |
| Notes | Text input | No |

Two-column grid: Item + Quantity on row 1, Date on row 2 (full width or paired with an empty slot). Notes full width below.

### 6.3 Log Usage Form

Same fields as Add Stock, plus an additional field in row 2:

| Field | Type | Required |
|---|---|---|
| Item | Select | Yes |
| Quantity | Number input | Yes |
| Date | Date picker, default today | Yes |
| Meal Type | Select (Lunch / Breakfast / Snack) | No |
| Notes | Text input | No |

### 6.4 Form Action Buttons

Right-aligned at the bottom of the modal:
- **Cancel** — outline button, closes modal
- **Save** (green primary button) — submits the form

---

## 7. Status Logic

These rules are applied consistently across all views.

| Condition | Status | Colour | Label |
|---|---|---|---|
| `stock >= threshold` | OK | Green | "OK" |
| `stock < threshold AND stock >= threshold × 0.5` | Low | Amber | "Low" |
| `stock < threshold × 0.5` | Critical | Red | "Critical" |

Progress bar fill percentage: `min(100, stock / (threshold × 1.8) × 100)`

---

## 8. Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| ≥ 1024px | Full two-column NGO layout, 3-column stat grid for school |
| 768px – 1023px | Two-column NGO layout collapses to single column, 2-column stat grid |
| < 768px | All layouts single column, stat grid wraps to 2 columns, tables scroll horizontally |

---

## 9. States & Edge Cases

### Empty States
- If no entries exist in Recent Entries: show a muted line "No entries yet. Use the buttons above to log stock or usage."
- If no alerts exist: hide the Alerts card on the school view entirely. On the NGO view, show the "All items healthy" message.

### Loading State
- Cards render with a light grey shimmer placeholder on initial load.
- Realtime updates do not show a loading state — the table updates in place.

### Form Validation
- Required fields show a red outline on submit if empty.
- Quantity must be a positive number. Show an inline error "Enter a valid quantity" below the field.

### Realtime Update Indicator
- When a new row arrives from Supabase realtime, the "Recent Activity" card briefly highlights the new row with a `--green-pale` background that fades after 1.5 seconds.

---

## 10. Accessibility

- All interactive elements have visible focus states (2px green outline).
- Colour is never the sole indicator of status — pill labels (OK / Low / Critical) accompany every colour.
- Icon-only elements (close button ×, avatar) have `aria-label` attributes.
- Decorative icons have `aria-hidden="true"`.
- Form inputs have associated `<label>` elements.
- Minimum touch target size: 32×32px.

---

## 11. Component Inventory

| Component | Used In |
|---|---|
| NavBar | All pages |
| TabBar | All pages |
| StatCard | School overview, NGO dashboard |
| DataTable | Stock table (both views) |
| StatusPill | Stock table, alert strips |
| ProgressBar | Stock table level column |
| AlertStrip | Alerts card (both views) |
| ActivityRow | Recent entries, recent activity |
| TrendBarRow | NGO weekly usage |
| Modal | Add Stock form, Log Usage form |
| FormField | All modals |
| LiveDot | NGO header |

---

*End of UI/UX Design Specification*
