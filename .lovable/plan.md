
# Plan — Admin UI Component Library (Phase 1)

## Approach
Components-first, extending the existing admin scaffolding. Build a single reusable library under `src/components/admin/`, document each component on a new **Components Showcase** route, then progressively adopt them across existing pages in later phases. Existing `DataTable`, `StatusBadge`, `PageHeader`, and `ComingSoonCard` are kept and re-exported through the library to avoid duplication.

## Phase 1 deliverables (this iteration)

### New reusable components — `src/components/admin/`
Each component is presentational, backend-agnostic, accepts typed props, and exports cleanly from `src/components/admin/index.ts`.

| Component | File | Notes |
|---|---|---|
| `KPIWidget` | `kpi-widget.tsx` | Title, value, delta, icon, trend sparkline slot |
| `FilterToolbar` | `filter-toolbar.tsx` | Composable container: slots for search, selects, date range, reset, export |
| `SearchBar` | `search-bar.tsx` | Debounced controlled input with icon + clear |
| `StepForm` | `step-form.tsx` | Headless stepper: steps[], currentStep, validation states (`complete \| current \| error \| pending`), Next/Back/Save Draft buttons; renders `children(step)` |
| `Timeline` | `timeline.tsx` | Vertical timeline with status dot (success/warn/error/info/muted), title, meta, body slot |
| `AuditTrail` | `audit-trail.tsx` | Specialized Timeline: actor, action, before/after diff |
| `RelationshipCard` | `relationship-card.tsx` | Avatar + name + role + relation badge + meta rows + actions |
| `InfoDrawer` | `info-drawer.tsx` | Right-side Sheet wrapper with header, sections, footer actions |
| `ConfirmationDialog` | `confirmation-dialog.tsx` | Title, description, destructive variant, async confirm |
| `UploadZone` | `upload-zone.tsx` | Drag-drop area with file list, progress, accept/maxSize props (no real upload) |
| `EmptyState` | `empty-state.tsx` | Icon + title + description + primary/secondary action |
| `ErrorState` | `error-state.tsx` | Same shape as EmptyState with destructive tone + retry |
| `BulkActionBar` | `bulk-action-bar.tsx` | Sticky bar appearing when N rows selected, action slots |
| `TabbedDetailLayout` | `tabbed-detail-layout.tsx` | Header + tabs + content frame used by Investor/Scheme/Execution detail pages |

### Re-exports (kept where they are)
- `DataTable` (already at `src/components/data/data-table.tsx`) — add row-selection + bulkActions props as optional extension.
- `StatusBadge` (already at `src/components/feedback/status-badge.tsx`).
- `PageHeader` (already at `src/components/layout/page-header.tsx`).
- `ComingSoonCard`.

### DataTable optional extensions (backward-compatible)
- `selectable?: boolean`, `onSelectionChange?: (ids: string[]) => void`
- `rowActions?: (row) => ReactNode` rendered in a trailing actions cell
- `stickyHeader?: boolean`
- No API breakage for existing callers.

### Showcase route
- File: `src/routes/app.admin.components.tsx` → `/app/admin/components`
- Section per component with: short description, props summary, live example using mock fixtures from `src/components/admin/_fixtures.ts`.
- Sidebar nav entry under **System → Components Library**.

## Out of scope (deferred to later phases)
- New pages: Franchise, Family Groups, Investor Detail tabs, Execution Detail, Scheme Detail, Document Mgmt.
- Wiring components into existing pages (Investor Onboarding → StepForm, Orders → BulkActionBar, etc.).
- Real selection/filter state in existing tables.
- Any backend / API work.

## Technical notes
- All components: `export function` named exports, no default exports, no router imports.
- Use existing shadcn primitives (Sheet, Dialog, Tabs, Progress, Avatar, Badge).
- Tailwind v4 semantic tokens only (`bg-card`, `text-muted-foreground`, etc.) — no raw hex.
- Mock data lives in a single `_fixtures.ts` next to the components for the showcase only.
- Showcase route uses standard `createFileRoute` with `beforeLoad` admin guard mirroring other admin routes; the components themselves remain router-agnostic.

## File list

**Created**
- `src/components/admin/index.ts`
- `src/components/admin/kpi-widget.tsx`
- `src/components/admin/filter-toolbar.tsx`
- `src/components/admin/search-bar.tsx`
- `src/components/admin/step-form.tsx`
- `src/components/admin/timeline.tsx`
- `src/components/admin/audit-trail.tsx`
- `src/components/admin/relationship-card.tsx`
- `src/components/admin/info-drawer.tsx`
- `src/components/admin/confirmation-dialog.tsx`
- `src/components/admin/upload-zone.tsx`
- `src/components/admin/empty-state.tsx`
- `src/components/admin/error-state.tsx`
- `src/components/admin/bulk-action-bar.tsx`
- `src/components/admin/tabbed-detail-layout.tsx`
- `src/components/admin/_fixtures.ts`
- `src/routes/app.admin.components.tsx`

**Edited**
- `src/components/data/data-table.tsx` (add optional `selectable`, `rowActions`, `stickyHeader` props)
- `src/config/navigation.ts` (add "Components Library" entry)

## Next phases (for your approval after this one ships)
1. **Investor module**: Investor List polish + Investor Detail tabbed page (Overview, KYC/FATCA, Bank, Nominees, Documents, Relationships, Risk, Transactions, SIP, Family, Audit).
2. **Onboarding**: rebuild current onboarding using `StepForm` with 8 steps + draft save.
3. **Transaction lifecycle**: Execution Detail page with `Timeline` + payload/response panels; visually separate Order Intent vs Execution Lifecycle.
4. **Organization**: Franchise pages + hierarchy display.
5. **Reconciliation**: Match Review + Exception Queue with `InfoDrawer`.
6. **Documents & Family Group** modules.
