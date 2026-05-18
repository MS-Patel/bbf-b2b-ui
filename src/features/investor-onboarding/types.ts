// UI-only types for the Investor Onboarding workflow. No backend / API dependencies.

export type StepKey =
  | "identity"
  | "kyc"
  | "fatca"
  | "bank"
  | "nominees"
  | "risk"
  | "relationship"
  | "documents"
  | "review";

export type StepValidity = "complete" | "current" | "error" | "locked" | "pending";

export type InvestorType = "individual" | "joint" | "minor" | "nri" | "corporate";
export type HoldingType = "single" | "anyone_or_survivor" | "joint" | "former_or_survivor";

export interface JointHolder {
  id: string;
  fullName: string;
  pan: string;
  relation: string;
}

export interface Guardian {
  fullName: string;
  relation: string;
  pan?: string;
  mobile?: string;
}

export interface IdentityData {
  pan: string;
  panLookupStatus: "idle" | "checking" | "verified" | "duplicate" | "invalid";
  duplicateInvestorId?: string;
  investorType: InvestorType;
  holdingType: HoldingType;
  dateOfBirth?: string;
  incorporationDate?: string;
  fullName: string;
  mobile: string;
  email: string;
  guardian?: Guardian;
  jointHolders: JointHolder[];
}

export type KycStatus = "pending" | "verified" | "rejected" | "expired";

export interface KycEvent {
  id: string;
  at: string;
  label: string;
  tone: "success" | "warning" | "destructive" | "info" | "muted";
  note?: string;
}

export interface KycData {
  status: KycStatus;
  provider: "NDML" | "CVL" | "CAMS";
  referenceId?: string;
  lastCheckedAt?: string;
  rejectionReason?: string;
  events: KycEvent[];
  consentAck: boolean;
}

export interface TaxResidency {
  id: string;
  country: string;
  tin: string;
  tinUnavailableReason?: string;
}

export type FatcaClassification = "individual" | "non_financial_entity" | "financial_institution";

export interface FatcaData {
  residencies: TaxResidency[];
  classification: FatcaClassification;
  pep: boolean;
  usPerson: boolean;
  declarationAck: boolean;
  // advanced
  crsControllingPerson?: boolean;
  giinNumber?: string;
}

export type BankAccountType = "savings" | "current" | "nro" | "nre";
export type BankVerifyStatus = "unverified" | "verifying" | "verified" | "failed";

export interface BankAccount {
  id: string;
  bankName: string;
  branch: string;
  ifsc: string;
  accountNumber: string;
  accountType: BankAccountType;
  holderName: string;
  primary: boolean;
  active: boolean;
  verifyStatus: BankVerifyStatus;
  ifscLookupStatus: "idle" | "checking" | "found" | "invalid";
}

export interface Nominee {
  id: string;
  fullName: string;
  relation: string;
  dateOfBirth?: string;
  sharePct: number;
  isMinor: boolean;
  guardian?: Guardian;
}

export type RiskLevel = "Conservative" | "Moderate" | "Aggressive";

export interface RiskQuestion {
  id: string;
  group: "horizon" | "tolerance" | "experience" | "goals";
  question: string;
  options: { label: string; score: number }[];
}

export interface RiskData {
  answers: Record<string, number>; // questionId -> score
  computedLevel?: RiskLevel;
  overrideLevel?: RiskLevel;
  overrideNote?: string;
}

export interface RelationshipData {
  franchiseId?: string;
  branchId?: string;
  distributorId?: string;
  rmId?: string;
  subBrokerCode?: string;
  euin?: string;
}

export type DocStatus = "missing" | "uploading" | "uploaded" | "verifying" | "verified" | "rejected";

export interface DocumentItem {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  status: DocStatus;
  fileName?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  rejectionReason?: string;
  progress?: number;
}

export interface ConsentState {
  termsAck: boolean;
  dataProcessingAck: boolean;
  declarationAck: boolean;
  marketingOptIn: boolean;
}

export interface OnboardingDraft {
  draftId: string;
  identity: IdentityData;
  kyc: KycData;
  fatca: FatcaData;
  banks: BankAccount[];
  nominees: Nominee[];
  risk: RiskData;
  relationship: RelationshipData;
  documents: DocumentItem[];
  consent: ConsentState;
  lastSavedAt?: string;
  createdAt: string;
}

export interface StepDefinitionUI {
  key: StepKey;
  index: number;
  label: string;
  description: string;
}

export interface StepProgress {
  key: StepKey;
  status: StepValidity;
  errorCount: number;
  completeCount: number;
  totalCount: number;
}
