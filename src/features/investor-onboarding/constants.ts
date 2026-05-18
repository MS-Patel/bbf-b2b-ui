import type { RiskQuestion, StepDefinitionUI } from "./types";

export const ONBOARDING_STEPS: StepDefinitionUI[] = [
  { key: "identity", index: 1, label: "Identity", description: "PAN, type & holders" },
  { key: "kyc", index: 2, label: "KYC & Compliance", description: "NDML verification" },
  { key: "fatca", index: 3, label: "FATCA & Taxation", description: "Tax residency" },
  { key: "bank", index: 4, label: "Bank Accounts", description: "Payouts & debits" },
  { key: "nominees", index: 5, label: "Nominees", description: "Allocation up to 100%" },
  { key: "risk", index: 6, label: "Risk Profile", description: "Suitability assessment" },
  { key: "relationship", index: 7, label: "Relationships", description: "RM, distributor, branch" },
  { key: "documents", index: 8, label: "Documents", description: "PAN, cheque, proof" },
  { key: "review", index: 9, label: "Review & Submit", description: "Audit & consent" },
];

export const INVESTOR_TYPE_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "joint", label: "Joint" },
  { value: "minor", label: "Minor" },
  { value: "nri", label: "NRI" },
  { value: "corporate", label: "Corporate / Non-Individual" },
] as const;

export const HOLDING_TYPE_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "anyone_or_survivor", label: "Anyone or Survivor" },
  { value: "joint", label: "Joint" },
  { value: "former_or_survivor", label: "Former or Survivor" },
] as const;

export const BANK_ACCOUNT_TYPES = [
  { value: "savings", label: "Savings" },
  { value: "current", label: "Current" },
  { value: "nre", label: "NRE" },
  { value: "nro", label: "NRO" },
] as const;

export const RELATION_OPTIONS = [
  "Spouse",
  "Son",
  "Daughter",
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Guardian",
  "Other",
];

export const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Canada",
  "Germany",
];

export const FATCA_CLASSIFICATIONS = [
  { value: "individual", label: "Individual" },
  { value: "non_financial_entity", label: "Non-Financial Entity (NFE)" },
  { value: "financial_institution", label: "Financial Institution" },
] as const;

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: "q_horizon",
    group: "horizon",
    question: "What is your investment horizon?",
    options: [
      { label: "Less than 1 year", score: 1 },
      { label: "1 – 3 years", score: 2 },
      { label: "3 – 5 years", score: 3 },
      { label: "More than 5 years", score: 4 },
    ],
  },
  {
    id: "q_tolerance",
    group: "tolerance",
    question: "If your portfolio dropped 20% in a month, you would…",
    options: [
      { label: "Exit immediately to preserve capital", score: 1 },
      { label: "Reduce equity exposure", score: 2 },
      { label: "Stay invested and review", score: 3 },
      { label: "Add more capital", score: 4 },
    ],
  },
  {
    id: "q_experience",
    group: "experience",
    question: "Investment experience in market-linked products",
    options: [
      { label: "None", score: 1 },
      { label: "Less than 2 years", score: 2 },
      { label: "2 – 5 years", score: 3 },
      { label: "More than 5 years", score: 4 },
    ],
  },
  {
    id: "q_goal",
    group: "goals",
    question: "Primary investment objective",
    options: [
      { label: "Capital preservation", score: 1 },
      { label: "Regular income", score: 2 },
      { label: "Balanced growth", score: 3 },
      { label: "Aggressive long-term growth", score: 4 },
    ],
  },
];

export const REQUIRED_DOCUMENTS: { key: string; label: string; description: string; required: boolean }[] = [
  { key: "pan", label: "PAN card", description: "Clear scan or photograph of PAN", required: true },
  { key: "cheque", label: "Cancelled cheque", description: "For bank account validation", required: true },
  { key: "address", label: "Address proof", description: "Aadhaar / Passport / Driving licence", required: true },
];

export const OPTIONAL_DOCUMENTS: { key: string; label: string; description: string; required: boolean }[] = [
  { key: "fatca", label: "FATCA declaration", description: "Signed declaration form", required: false },
  { key: "signature", label: "Signature specimen", description: "Optional — speeds up activation", required: false },
];
