# Plan: Missing Admin/RM/Distributor pages

The user spec says `src/pages/...`, but this project uses **TanStack Router file-based routing** under `src/routes/`. I'll follow the existing project convention (the rest of the codebase, navigation, and route tree all live there). Each route file will export the required `Route` for TanStack and a `default` page component, matching the user's `export default function` constraint.

## 1. Admin — Products & NAV Operations

**File:** `src/routes/app.admin.products-upload.tsx`
**Path:** `/app/admin/products-upload`

- Page header: "Products & NAV Operations".
- Two side-by-side upload cards (reusing the same visual pattern as `app.admin.master-data.tsx`):
  - **SchemeUploadForm** — CSV file picker + "Download scheme template" + AMC selector + "Upload schemes" button.
  - **NAVUploadForm** — CSV file picker + effective-date picker + "Download NAV template" + "Upload NAVs" button.
- Both forms validated with `zod` + `react-hook-form`; on submit show toast (mock backend wiring, ready to swap in real endpoints later).
- Tabs below the uploads:
  - **AMCs preview** — DataTable of `AMC_MASTER_FIXTURE` (code, name, registrar, active schemes, last NAV, status).
  - **Schemes preview** — DataTable derived from a small new fixture (scheme code, name, AMC, category, plan, NAV, NAV date).
- Add a tiny `SCHEMES_PREVIEW_FIXTURE` to `src/features/admin/fixtures.ts` and a `useSchemesPreviewQuery` hook in `src/features/admin/api.ts` to keep the data layer consistent with how every other admin page loads.

## 2. Admin — Integration Tools & Diagnostics

**File:** `src/routes/app.admin.integration-tools.tsx`
**Path:** `/app/admin/integration-tools`

- Page header: "Integration tools & diagnostics".
- Two diagnostic cards in a responsive grid:
  - **BSE PAN Check** — PAN input (zod regex `^[A-Z]{5}[0-9]{4}[A-Z]$`), "Run check" button. On submit, mocked result with green `CheckCircle2` (verified) or red `XCircle` (failed) plus details panel (name on PAN, KYC status, last verified date).
  - **NDML KYC / CKYC Status** — PAN input + KYC type select (KRA / CKYC), result panel with status indicator and registrar metadata.
- Recent diagnostics history table — last 10 lookups (PAN masked, tool used, result tone badge, run by, when). Backed by a new `INTEGRATION_TOOLS_HISTORY_FIXTURE` and `useIntegrationToolsHistoryQuery`.
- Status indicators reuse `StatusBadge` (`success` / `destructive` / `warning`).

## 3. RM — Client Comprehensive Reports

**File:** `src/routes/app.rm.client-reports.tsx`
**Path:** `/app/rm/client-reports`

- Page header: "Client comprehensive reports".
- Filter card (sticky-feeling, same density as other RM pages):
  - Client picker (Combobox-style `Select` populated from `useRmClientsQuery`).
  - Report type select: Wealth Report / P&L / Capital Gains / Transaction Statement / Holding Statement.
  - Date range — two date inputs (from / to), default last FY.
  - Format select: PDF / Excel / CSV.
  - "Generate report" (primary) and "Email to client" (secondary) buttons. Submit triggers a stubbed download: builds a small CSV/Blob in-browser so the button does something tangible, then toast confirms which backend endpoint would be called (e.g. `ExportWealthReportView`).
- Recent exports table — last 10 generated reports for this RM (client, type, period, format, status, downloaded at). Backed by a new `CLIENT_REPORTS_FIXTURE` + `useClientReportsHistoryQuery` (shared with Distributor page).

## 4. Distributor — Client Comprehensive Reports

**File:** `src/routes/app.distributor.client-reports.tsx`
**Path:** `/app/distributor/client-reports`

- Same component structure as the RM page, but:
  - Client list comes from the distributor's investors fixture.
  - Role guard checks `distributor`.
  - Page header eyebrow says "Distributor · Reports".
- Both pages share a single `ClientReportsForm` component placed at `src/features/reports/components/client-reports-form.tsx` (parameterised by `clients` + `ownerLabel`) so we don't duplicate logic.
- Shared types/fixtures live in `src/features/reports/` (`api.ts`, `fixtures.ts`, `types.ts`).

## Navigation updates

Edit `src/config/navigation.ts`:

- Admin → "Operations" section: add `Products & NAV` (icon: `Layers` or `FileSpreadsheet`).
- Admin → "System" section: add `Integration Tools` (icon: `Activity`).
- RM → "Clients" section: add `Reports` after `Orders` (icon: `FileSpreadsheet`).
- Distributor → "Business" section: add `Reports` after `Orders` (icon: `FileSpreadsheet`).

## Technical notes

- Each route uses `createFileRoute(...)` with `beforeLoad` role guard (admin / rm / distributor) plus `head()` meta — same pattern as `app.admin.master-data.tsx` / `app.rm.clients.tsx`.
- Page components are `export default function` per the user's constraint; `Route` is also exported as required by TanStack.
- All forms use `react-hook-form` + `zod` (already used across the project) with proper input validation (PAN regex, date range sanity, file type).
- All tables use `DataTable` from `src/components/data/data-table.tsx`.
- `routeTree.gen.ts` is auto-generated and will pick up the new files.
- No backend wiring yet — submit handlers are mocked (toast + optional client-side Blob download) so the UI is fully usable and ready to wire to the real DRF endpoints (`ExportWealthReportView`, `BSEPanCheckToolView`, `CheckPANStatusView`, etc.) by swapping the handler bodies.

## Out of scope (call out)

- Real backend integration (BSE / NDML / report exports) — UI is wired to mock handlers, ready to swap to `apiClient` calls.
- Persisting uploaded files anywhere — uploads are simulated.
