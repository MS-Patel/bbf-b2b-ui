

# B2B Conversion + Investor Read-Only Impersonation Views

Strip B2C self-service surface, but **keep a minimal, read-only Investor UI** so RM/Admin can impersonate a client and see exactly what that client sees. Add the missing Reconciliation Module.

## Decisions

- **Keep** (read-only, impersonation-only): Investor Dashboard, Portfolio (+ holding detail), Transactions, Goals, Tax, Profile/KYC view. These are reachable **only** when `useImpersonationStore.client` is set, launched from the RM Client Roster.
- **Delete** (true B2C self-service, no impersonation value): `signup`, Explore + scheme detail, all 4 Order wizards (lumpsum/SIP/redeem/switch), AI Insights, public landing investor copy.
- **Guard**: every kept investor route's `beforeLoad` requires `impersonating != null` for non-investor roles. No direct logins land here.
- **Banner**: existing `ImpersonationBanner` already handles the read-only chrome. All write CTAs (Invest, Start SIP, Add Bank, Add Nominee, New Goal) hidden when `readOnly`.

## Build plan

### 1. Strip pure B2C surface
**Delete**:
- `src/routes/signup.tsx`
- `src/routes/app.investor.explore.tsx`, `app.investor.explore.$schemeId.tsx`
- `src/routes/app.investor.orders.{lumpsum,sip,redeem,switch}.tsx`
- `src/routes/app.investor.insights.tsx`
- `src/features/{orders,schemes,insights}/` (folders + types)
- `src/types/{orders,scheme,insights}.ts`

### 2. Lock surviving investor routes to impersonation
Edit `beforeLoad` in each kept investor route (`app.investor.index`, `portfolio`, `portfolio.$holdingId`, `transactions`, `goals`, `tax`, `profile`):
```ts
const { user } = useAuthStore.getState();
const impersonating = useImpersonationStore.getState().client;
if (!impersonating) throw redirect({ to: ROLE_HOME[user.role] });
```
(Drops the "allow real investor" branch — there are no real investors in B2B.)

### 3. Hide all write actions under impersonation
Audit kept investor pages and remove/hide CTAs that no longer have a target:
- Dashboard: drop "Invest now" / "Explore funds" buttons (already gated by `readOnly`, just clean dead links)
- Portfolio + holding detail: drop "Invest more / Redeem / Switch" buttons
- Goals: drop "New goal" + `GoalWizardDialog` mount → delete `src/features/goals/components/goal-wizard-dialog.tsx` + `src/features/goals/schemas.ts`
- Profile: drop "Add bank / Add nominee" dialogs → delete `src/features/kyc/components/{add-bank-dialog,add-nominee-dialog}.tsx` + `src/features/kyc/schemas.ts`

Keep the read-only data displays (tables, charts, KYC timeline, bank list, nominee list).

### 4. Auth + nav cleanup
- `src/types/auth.ts` — narrow `UserRole` to `"admin" | "rm" | "distributor"`
- `src/features/auth/schemas.ts` — drop investor from `ROLE_OPTIONS`, delete `signupSchema`
- `src/features/auth/api.ts` — drop `signup()` + `useSignupMutation()`, remove investor mock user
- `src/features/auth/role-routes.ts` — drop `investor` key from `ROLE_HOME`
- `src/config/navigation.ts` — remove `investorNav` entirely (sidebar never shows investor section; impersonated views are reached via RM client drill-down, not sidebar)
- `src/routes/login.tsx` — drop investor option, remove "Create account" link
- `src/routes/index.tsx` — rewrite as B2B partner landing (Admin / RM / Distributor strip, single CTA → `/login`)

### 5. RM → impersonation entry point
Verify `src/routes/app.rm.clients.tsx` "View as client" action calls `useImpersonationStore.start(client)` then `navigate({ to: "/app/investor" })`. Same wiring usable from Admin Users page (add an action there too).

### 6. Add Reconciliation Module (missing B2B feature)
- `src/types/reconciliation.ts` — `ReconciliationFile`, `ReconciliationError`
- `src/features/reconciliation/{fixtures.ts, api.ts, schemas.ts}` — mock query/mutation hooks
- `src/features/reconciliation/components/{upload-wizard.tsx, error-grid.tsx}`
- `src/routes/app.admin.reconciliation.tsx` — files table + upload wizard + per-file error sheet
- Already linked from `navigation.ts` admin section

## Files

**Delete** (~15 files): signup, explore (×2), orders (×4), insights route, `features/{orders,schemes,insights}`, `features/goals/components/goal-wizard-dialog.tsx`, `features/goals/schemas.ts`, `features/kyc/components/add-{bank,nominee}-dialog.tsx`, `features/kyc/schemas.ts`, related types.

**Create**: `src/types/reconciliation.ts`, `src/features/reconciliation/{api.ts,fixtures.ts,schemas.ts}`, `src/features/reconciliation/components/{upload-wizard.tsx,error-grid.tsx}`, `src/routes/app.admin.reconciliation.tsx`.

**Edit**: 7 surviving investor routes (tighten `beforeLoad`, strip write CTAs), `src/routes/{index,login}.tsx`, `src/types/auth.ts`, `src/features/auth/{schemas,api,role-routes}.ts`, `src/config/navigation.ts`, `src/routes/app.rm.clients.tsx` (verify impersonation wiring), `src/routes/app.admin.users.tsx` (add "View as" action).

## Verification

- `/login` shows only Admin / RM / Distributor
- `/signup`, `/app/investor/explore*`, `/app/investor/orders/*`, `/app/investor/insights` → 404
- Sidebar never shows investor entries
- RM → Clients → "View as client" → lands on `/app/investor` with banner, all write CTAs hidden, charts + tables render
- Direct visit to `/app/investor` without impersonation → redirects to role home
- `/app/admin/reconciliation` → upload wizard + files grid + error drill-down all work (mock)
- `bun run build` passes; no leftover imports to deleted modules

