## On-Behalf-Of Purchase / Investment Flow

A partner-driven order placement workflow where Admin, RM, or Distributor can place a **lump-sum**, **SIP**, **switch**, or **redeem** order on behalf of a verified investor, review a confirmation summary, and track the resulting order in a register. Mirrors the existing onboarding feature module pattern (typed mocks, role-scoped routes, kanban/table views).

### What the user will see

**1. New "Investments" / "Orders" entry in each partner sidebar**
- Admin → `/app/admin/orders` (all orders, all clients)
- RM → `/app/rm/orders` (orders for RM's clients)
- Distributor → `/app/distributor/orders` (orders for distributor's clients)

**2. Orders register page (per role, scoped)**
- Stats strip: Today's gross investment, SIPs registered today, Pending verification, Failed
- Filter bar: client search, order type (lump-sum / SIP / switch / redeem), status, date range, AMC
- DataTable of orders: client, scheme, type, amount, units, NAV, status, placed-by, placed-at
- Row actions: View ticket, Cancel pending, Retry failed
- Primary CTA: **"New order"** (opens client picker)

**3. New-order flow (drawer / sheet, 3 steps)**

**Step 1 — Client picker**
- Searchable list of eligible clients (KYC verified only)
- Shows KYC status, risk profile, AUM
- Admin sees all clients; RM sees own roster; Distributor sees own clients
- Blocks selection of non-verified clients with an inline reason

**Step 2 — Order ticket**
- Order-type tabs: **Lump-sum**, **SIP**, **Switch**, **Redeem**
- Scheme search (typeahead, AMC + scheme name + plan, with category badge)
- For Lump-sum: amount (with quick-pick chips ₹5k/10k/25k/50k/1L), folio (existing or new), payment mode (Net banking / UPI / NEFT)
- For SIP: amount, frequency (Monthly / Quarterly), SIP date (1–28), tenure (months or "perpetual"), first debit date, mandate (existing UMRN dropdown or new mandate flow stub)
- For Switch: source scheme + units/all, target scheme
- For Redeem: source scheme, units/amount/all, payout bank
- Live calculation panel: indicative units (amount / latest NAV), exit-load warning, cut-off time banner (3 PM equity / 1:30 PM liquid)
- Risk check: warn if scheme risk > client risk profile (acknowledge checkbox)

**Step 3 — Confirmation & consent**
- Summary card of all order details
- Compliance checkboxes: "Investor consent received via call/email", "Risk profile acknowledged", "Cut-off awareness"
- Optional reference note (call ID, email subject)
- "Place order" CTA → toast with order ID, drawer closes, register refreshes
- New row appears in register with status `pending` (auto-advances to `processing` then `completed` for demo)

**4. Empty / error states**
- Client picker empty: "No verified clients yet — invite via Onboarding"
- Scheme picker no match: "No schemes match — check master data sync"
- Failed order row exposes reason + Retry

**5. Notifications bell**
- Increments on order placed and on terminal status (completed / failed)

### Technical implementation

**New types** (`src/types/orders.ts`)
- `OrderType = "lump_sum" | "sip" | "switch" | "redeem"`
- `OrderStatus = "draft" | "pending" | "processing" | "completed" | "failed" | "cancelled"`
- `PlacedByRole = "admin" | "rm" | "distributor"`
- `Order` interface with: id, clientId/Name, schemeCode/Name, amc, type, status, amount, units, nav, folio, sipFrequency?, sipDate?, sipTenure?, mandateId?, switchTargetCode?, payoutMode?, placedBy {id,name,role}, placedAt, settledAt?, failureReason?, consent flags
- `SchemeLite` interface (code, name, amc, category, latestNav, navAsOf, riskBand, exitLoadDays, cutoffTime)
- `MandateLite` (umrn, bank, maxAmount, status)

**New feature module** `src/features/orders/`
- `fixtures.ts` — 80 seeded orders across statuses/types, ~40 schemes (reuse names from `src/features/transactions/fixtures.ts`), 6 mandates per sample client
- `schemas.ts` — zod schemas: `lumpSumOrderSchema`, `sipOrderSchema`, `switchOrderSchema`, `redeemOrderSchema` (PAN, amount min ₹500/₹100 SIP, SIP date 1–28, tenure ≥6, etc.)
- `api.ts` — typed hooks (real wiring stubs in comments):
  - `useOrdersQuery({ scope: "all" | "rm" | "distributor", ownerId? })` (placeholder: GET `/orders/`)
  - `useOrderQuery(id)`
  - `useEligibleClientsQuery({ scope, ownerId })` — filters KYC-verified from `RM_CLIENTS_FIXTURE`
  - `useSchemesQuery({ search, category? })` — filters scheme fixture
  - `useMandatesQuery(clientId)`
  - `usePlaceOrderMutation()` (POST `/orders/`) — adds to in-memory store, simulates `pending → processing → completed` over 3s, emits notification
  - `useCancelOrderMutation()` and `useRetryOrderMutation()`
- `components/`
  - `order-stats.tsx` — 4 KPI cards
  - `orders-table.tsx` — DataTable column set + status badge mapping
  - `client-picker.tsx` — sheet step 1
  - `order-ticket.tsx` — sheet step 2 with type tabs and dynamic form (react-hook-form + zod)
  - `order-confirmation.tsx` — sheet step 3 with consent checkboxes
  - `place-order-sheet.tsx` — orchestrates the 3 steps with internal state machine
  - `scheme-combobox.tsx` — typeahead built on existing `Command` primitive
  - `cutoff-banner.tsx` — small alert showing applicable cut-off

**New routes**
- `src/routes/app.admin.orders.tsx` — admin scope, filter by `placedByRole`
- `src/routes/app.rm.orders.tsx` — RM scope, owner = current RM id
- `src/routes/app.distributor.orders.tsx` — distributor scope
- All three routes use `beforeLoad` role guard (mirroring `app.rm.clients.tsx`) and reuse the same `OrdersRegister` shared component with a `scope` prop

**Navigation** (`src/config/navigation.ts`)
- Admin → Operations: add **"Orders"** (icon `ShoppingCart`) before Onboarding
- RM → Clients: add **"Orders"** after Client Roster
- Distributor → Business: add **"Orders"** after Onboarding

**Cross-module integrations**
- `useConvertLeadMutation` in onboarding currently lands the RM at `/app/investor`; extend with a toast action "Place first order" linking to `/app/rm/orders?newOrderFor={clientId}` (read query param to pre-open the sheet on the chosen client)
- Notifications: append via existing `notifBus` pattern (clone the small helper or import from a shared notifications util — implementation will inline a similar bus in orders module to stay decoupled, mirroring onboarding)

**Acceptance criteria**
- Each role sees their scoped Orders page from sidebar; non-matching role gets redirected by `beforeLoad`
- Clicking "New order" opens a 3-step sheet that validates per step before allowing Next
- Placing an order inserts a `pending` row that auto-progresses to `completed`; a SIP shows `Active SIP` badge after registration
- Risk override requires explicit checkbox; consent checkboxes block submission until ticked
- Cancel works only on `pending`; Retry only on `failed`
- Admin can filter by RM/Distributor who placed the order; RM/Distributor cannot see other partners' orders
- `bun run build` passes