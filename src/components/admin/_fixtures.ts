import type { AuditEntry } from "./audit-trail";
import type { TimelineItem } from "./timeline";
import type { StepDefinition } from "./step-form";
import type { UploadZoneFile } from "./upload-zone";

export const SHOWCASE_STEPS: StepDefinition[] = [
  { id: "identity", label: "Identity", description: "PAN, name, DOB" },
  { id: "kyc", label: "KYC & FATCA", description: "Verification + tax residency" },
  { id: "holding", label: "Holding Structure" },
  { id: "bank", label: "Bank Accounts" },
  { id: "nominees", label: "Nominees" },
  { id: "risk", label: "Risk Profile" },
  { id: "relationship", label: "Relationship Assignment" },
  { id: "review", label: "Review & Submit" },
];

export const SHOWCASE_TIMELINE: TimelineItem[] = [
  {
    id: "1",
    tone: "success",
    title: "Order placed",
    meta: "12 Mar, 09:14",
    body: "₹50,000 lump-sum into HDFC Flexi Cap Fund — Reg Growth",
  },
  {
    id: "2",
    tone: "success",
    title: "Sent to BSE Star MF",
    meta: "12 Mar, 09:14",
    body: "Reference: BSE-93421/2026",
  },
  { id: "3", tone: "info", title: "Awaiting allocation", meta: "12 Mar, 13:30" },
  { id: "4", tone: "muted", title: "RTA confirmation pending" },
];

export const SHOWCASE_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    actor: "Priya Sharma",
    actorRole: "RM",
    action: "updated risk profile for",
    target: "Anil Kumar",
    at: "Today, 11:42",
    tone: "info",
    before: { riskScore: 58, bucket: "Moderate" },
    after: { riskScore: 72, bucket: "Aggressive" },
  },
  {
    id: "a2",
    actor: "System",
    action: "reconciled folio",
    target: "12345678/01",
    at: "Today, 03:00",
    tone: "success",
    note: "CAMS feed processed, 0 exceptions.",
  },
  {
    id: "a3",
    actor: "Rohit Mehta",
    actorRole: "Admin",
    action: "approved KYC for",
    target: "Sunita Rao",
    at: "Yesterday, 18:05",
    tone: "success",
  },
];

export const SHOWCASE_UPLOAD_FILES: UploadZoneFile[] = [
  { id: "u1", name: "CAMS_NAV_2026-03-12.csv", size: 184_320, progress: 100, status: "done" },
  { id: "u2", name: "scheme_master_q1.xlsx", size: 96_842, progress: 64, status: "uploading" },
  { id: "u3", name: "amc_codes.json", size: 4_120, status: "error", error: "Unsupported format" },
];
