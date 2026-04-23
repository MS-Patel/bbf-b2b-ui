

# Investor Onboarding Flow (Admin / RM / Distributor)

A partner-driven onboarding pipeline where Admin, RM, or Distributor can **invite** an investor, **collect KYC** on their behalf (or send a magic link), **track progress** through a Kanban funnel, and **convert** the verified investor into an active client. No B2C self-signup — this is the B2B way to bring an investor onto the platform.

## Scope

### Capabilities (per role)
- **RM**: invite leads, drive KYC for own assigned leads, view own funnel.
- **Distributor**: invite leads under their ARN, view own funnel, hand off to RM if needed.
- **Admin**: see all leads platform-wide, reassign owner, force-approve / reject KYC, view audit trail.

### Funnel stages (reuse existing `LeadStage`)
`lead → kyc_started → kyc_in_review → verified → first_invest`

## Build plan

### 1. Shared onboarding feature module — `src/features/onboarding/`
- `types.ts` — extend `OnboardingLead` with `ownerId`, `ownerRole`, `ownerName`, `assignedRm?`, `pan?`, `phone?`, `notes?`, `kycChecklist: { pan, aadhaar, bank, nominee, fatca, esign }` (each `pending | submitted | verified | rejected`), `rejectionReason?`, `inviteSentAt?`, `inviteLink?` (mock UUID).
- `fixtures.ts` — seed ~30 leads spread across stages, assigned to mixed RMs/distributors. Move `RM_LEADS_FIXTURE` here and re-export from `rm/fixtures.ts` for backward compat.
- `api.ts` — TanStack Query hooks against in-memory store (mock):
  - `useLeadsQuery({ scope: "mine" | "all", ownerId? })`
  - `useLeadQuery(id)`
  - `useInviteLeadMutation()` — creates lead at stage `lead`, generates magic link
  - `useUpdateKycChecklistMutation()` — flips checklist items, advances stage automatically
  - `useAdvanceStageMutation()` — explicit stage transition with optimistic update
  - `useReassignLeadMutation()` — Admin only
  - `useRejectLeadMutation()` — Admin only, sets rejectionReason
- `schemas.ts` — Zod for invite form (name, email, phone, PAN optional, source, assignedRm optional) and KYC update (file/field per checklist item).

### 2. Shared UI components — `src/features/onboarding/components/`
- `invite-lead-dialog.tsx` — react-hook-form + Zod, single dialog reused by all roles. Generates a mock magic link on submit and copies to clipboard via toast.
- `lead-detail-sheet.tsx` — slide-out Sheet with tabs:
  - **Profile** (name, email, phone, PAN, source, owner, timestamps)
  - **KYC checklist** — 6 rows (PAN, Aadhaar, Bank, Nominee, FATCA, e-Sign), each with status badge + action menu (mark submitted / verified / rejected). Auto-advances stage when thresholds met.
  - **Activity** — timeline of stage changes (mocked from `updatedAt` history).
  - Footer actions: Approve & convert, Reject (with reason), Reassign (Admin only).
- `lead-kanban.tsx` — extracted from current RM onboarding page; 5 columns, draggable optional (skip drag for v1, use stage action menu on each card). Card click opens `lead-detail-sheet`.
- `lead-table.tsx` — alternative tabular view with filters (stage, owner, source, date range), used by Admin.
- `onboarding-stats.tsx` — 4 KPI cards (Total leads, In review, Verified MTD, Conversion %).

### 3. Routes

**RM** — rewrite `src/routes/app.rm.onboarding.tsx`:
- `PageHeader` with "Invite client" button → `InviteLeadDialog`
- `OnboardingStats` (scoped to current RM)
- Tabs: **Kanban** (default) / **Table**
- Both views scoped to `useLeadsQuery({ scope: "mine", ownerId: user.id })`
- Card/row click → `LeadDetailSheet`

**Distributor** — new `src/routes/app.distributor.onboarding.tsx`:
- Same layout as RM but scoped to distributor's leads
- Add nav entry in `distributorNav` (`config/navigation.ts`): `{ label: "Onboarding", to: "/app/distributor/onboarding", icon: ShieldCheck }`
- Update Distributor Overview to surface lead count

**Admin** — new `src/routes/app.admin.onboarding.tsx`:
- Platform-wide view, `useLeadsQuery({ scope: "all" })`
- Filters: owner role (RM/Distributor), specific owner (combobox), stage, source, date range
- Default to **Table** view (data density); Kanban available as toggle
- Per-row actions: View, Reassign, Reject
- Add nav entry in `adminNav` Operations section between Users and Reconciliation

### 4. Conversion → impersonation handoff
When a lead reaches `verified` and Admin/RM clicks **Approve & convert**:
- Mock-create a `ClientLite` and add to `RM_CLIENTS_FIXTURE` in-memory
- Toast: "Client created — open as client?"
- Action button starts impersonation via `useImpersonationStore.start(client)` and navigates to `/app/investor`
- Lead stage advances to `first_invest` once the impersonated session places a (mock) order — out of scope for v1, just mark `verified` → `first_invest` manually via stage menu.

### 5. Notifications wiring
Hook `useInviteLeadMutation` and `useAdvanceStageMutation` to push entries into existing `notifications` fixture (in-memory) so the bell shows "New lead invited" / "KYC verified for X". Reuse existing `useNotificationsQuery`.

### 6. Cleanup
- Update `src/types/rm.ts` to re-export `OnboardingLead` from `@/features/onboarding/types` (avoid duplication).
- Drop the read-only Kanban inside `app.rm.onboarding.tsx` — replaced by new shared component.

## Files

**Create**
- `src/features/onboarding/types.ts`
- `src/features/onboarding/fixtures.ts`
- `src/features/onboarding/api.ts`
- `src/features/onboarding/schemas.ts`
- `src/features/onboarding/components/invite-lead-dialog.tsx`
- `src/features/onboarding/components/lead-detail-sheet.tsx`
- `src/features/onboarding/components/lead-kanban.tsx`
- `src/features/onboarding/components/lead-table.tsx`
- `src/features/onboarding/components/onboarding-stats.tsx`
- `src/routes/app.distributor.onboarding.tsx`
- `src/routes/app.admin.onboarding.tsx`

**Edit**
- `src/routes/app.rm.onboarding.tsx` — replace with shared components
- `src/config/navigation.ts` — add Distributor + Admin Onboarding entries
- `src/types/rm.ts` — re-export from onboarding types
- `src/features/rm/fixtures.ts` — drop `RM_LEADS_FIXTURE` (or keep as re-export)
- `src/features/rm/api.ts` — `useRmLeadsQuery` becomes a thin wrapper over `useLeadsQuery({ scope: "mine" })`

## Verification
- RM `/app/rm/onboarding` shows Kanban + "Invite client" works end-to-end (toast with magic link)
- Click any card → sheet opens, flipping all 6 KYC items to "verified" auto-advances stage to `verified`
- "Approve & convert" creates a client, toast offers impersonation, RM lands on `/app/investor` with banner
- Distributor `/app/distributor/onboarding` mirrors RM scoped to distributor's own leads
- Admin `/app/admin/onboarding` sees all leads, can filter by owner role, reassign a lead's owner, reject with reason
- Sidebar shows new entries for Distributor and Admin
- Notifications bell increments on invite / verification events
- `bun run build` passes

