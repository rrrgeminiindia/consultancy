export type RecruitmentStage =
  | 'New Candidate'
  | 'Initial Email Sent'
  | 'Documents Pending'
  | 'Documents Received'
  | 'Ready for Teammate Call'
  | 'Call Pending'
  | 'Call Completed'
  | 'Withdrawn'
  | 'Closed';

export type ResumeStatus = 'Pending' | 'Received';
export type CandidateFormStatus = 'Pending' | 'Received';
export type IdentityVerificationStatus = 'Pending' | 'Verified' | 'Not Required';

export type AlertStatus = 'Normal' | 'Approaching' | 'Overdue';

export type CallOutcome =
  | 'Connected'
  | 'Left Voicemail'
  | 'No Answer / Busy'
  | 'Rescheduled'
  | 'Completed'
  | 'Unreachable';

export type UserRole = 'ADMIN' | 'TEAMMATE';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title?: string;
}

export interface Teammate {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  avatar?: string;
  active: boolean;
  maxCapacity: number;
}

export interface CallLog {
  id: string;
  candidateId: string;
  teammateId: string;
  teammateName: string;
  callDate: string; // YYYY-MM-DD
  callTime: string; // HH:mm
  durationMinutes: number;
  outcome: CallOutcome;
  notes: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  candidateId: string;
  templateId: string;
  templateTitle: string;
  sentBy: string;
  sentAt: string;
  recipientEmail: string;
  subject: string;
  content: string;
}

export interface StageHistoryItem {
  stage: RecruitmentStage;
  enteredAt: string;
  updatedBy: string;
  notes?: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  jobTitle: string;
  jobLocation: string;
  totalItExperience: string; // e.g. "6 years" or "8.5 years"
  relevantExperience: string;
  currentLocation: string;
  workAuthorization: string; // e.g. "US Citizen", "Green Card", "H1B", "Work Permit", "Citizen"
  currentEmployer: string;
  noticePeriod: string; // e.g. "Immediate", "2 weeks", "30 days"
  applicationDate: string; // ISO date string
  linkedInJobOpening: string;
  assignedTeammateId: string | null;
  assignedTeammateName: string | null;
  assignmentDate: string | null;
  
  // Workflow & Document statuses
  stage: RecruitmentStage;
  resumeStatus: ResumeStatus;
  candidateFormStatus: CandidateFormStatus;
  identityVerificationStatus: IdentityVerificationStatus;
  
  // Tracking
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  callPendingStartedAt: string | null; // ISO timestamp when entered 'Call Pending'
  stageEnteredAt: string; // ISO timestamp when entered current stage
  
  // Configurable form fields responses (fieldId -> value)
  formResponses?: Record<string, string>;
  
  notes: string;
  stageHistory: StageHistoryItem[];
  callLogs: CallLog[];
  emailLogs: EmailLog[];
  createdAt: string;
  updatedAt: string;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Remote' | 'Hybrid';
  active: boolean;
  formTemplateId: string;
  description?: string;
  requiredExperienceYears: number;
  openingsCount: number;
  createdAt: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'email' | 'tel' | 'textarea';
  required: boolean;
  options?: string[]; // for select type
  placeholder?: string;
}

export interface CandidateFormTemplate {
  id: string;
  title: string;
  jobOpeningId?: string; // specific job or 'default'
  description: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  key: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  title: string;
  description: string;
  subject: string;
  body: string;
  recommendedStage: RecruitmentStage;
}
