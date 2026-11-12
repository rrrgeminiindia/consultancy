import { AlertStatus, Candidate, CandidateFormTemplate, RecruitmentStage } from '../types';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Calculates whether a candidate has an approaching (24h) or overdue (48h) follow-up alert.
 * Follow-up timer specifically tracks candidates in 'Call Pending' stage using their ISO timestamp.
 */
export function getCandidateAlertStatus(candidate: Candidate): {
  status: AlertStatus;
  hoursElapsed: number;
  badgeText: string;
  isTimerActive: boolean;
} {
  // If stage is Call Completed, Withdrawn, or Closed, timer is inactive
  if (['Call Completed', 'Withdrawn', 'Closed'].includes(candidate.stage)) {
    return {
      status: 'Normal',
      hoursElapsed: 0,
      badgeText: 'Completed / Inactive',
      isTimerActive: false
    };
  }

  // Active call pending check
  if (candidate.stage === 'Call Pending' && candidate.callPendingStartedAt) {
    const startedTime = new Date(candidate.callPendingStartedAt).getTime();
    const currentTime = Date.now();
    const hoursElapsed = Math.max(0, (currentTime - startedTime) / (1000 * 60 * 60));

    if (hoursElapsed >= 48) {
      return {
        status: 'Overdue',
        hoursElapsed,
        badgeText: `Overdue (${Math.floor(hoursElapsed)}h)`,
        isTimerActive: true
      };
    } else if (hoursElapsed >= 24) {
      return {
        status: 'Approaching',
        hoursElapsed,
        badgeText: `Needs Call (${Math.floor(hoursElapsed)}h)`,
        isTimerActive: true
      };
    } else {
      return {
        status: 'Normal',
        hoursElapsed,
        badgeText: `In Progress (${Math.floor(hoursElapsed)}h)`,
        isTimerActive: true
      };
    }
  }

  // Also check if nextFollowUpDate is in the past for any stage
  if (candidate.nextFollowUpDate) {
    const followUpTime = new Date(candidate.nextFollowUpDate).getTime();
    const currentTime = Date.now();
    if (currentTime > followUpTime) {
      const hoursOverdue = (currentTime - followUpTime) / (1000 * 60 * 60);
      if (hoursOverdue >= 24) {
        return {
          status: 'Overdue',
          hoursElapsed: hoursOverdue,
          badgeText: `Follow-up Overdue`,
          isTimerActive: false
        };
      } else {
        return {
          status: 'Approaching',
          hoursElapsed: hoursOverdue,
          badgeText: `Follow-up Due`,
          isTimerActive: false
        };
      }
    }
  }

  return {
    status: 'Normal',
    hoursElapsed: 0,
    badgeText: 'On Track',
    isTimerActive: false
  };
}

/**
 * Format relative time in current stage
 */
export function formatTimeInStage(isoDateString?: string | null): string {
  if (!isoDateString) return 'Just now';
  const timestamp = new Date(isoDateString).getTime();
  if (isNaN(timestamp)) return 'Recently';

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return '< 1 min';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m`;
  return `${diffDays}d ${diffHours % 24}h`;
}

/**
 * Formats full readable dates
 */
export function formatDate(isoDateString?: string | null): string {
  if (!isoDateString) return '—';
  const d = new Date(isoDateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(isoDateString?: string | null): string {
  if (!isoDateString) return '—';
  const d = new Date(isoDateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Returns missing required and optional fields for a candidate given their form template
 */
export function getMissingFormFields(
  candidate: Candidate,
  template?: CandidateFormTemplate
): { missingRequired: string[]; missingOptional: string[]; completedCount: number; totalCount: number } {
  if (!template || !template.fields) {
    return { missingRequired: [], missingOptional: [], completedCount: 0, totalCount: 0 };
  }

  const responses = candidate.formResponses || {};
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  let completedCount = 0;

  for (const field of template.fields) {
    const val = responses[field.name];
    const isProvided = val !== undefined && val !== null && String(val).trim() !== '';

    if (isProvided) {
      completedCount++;
    } else {
      if (field.required) {
        missingRequired.push(field.label);
      } else {
        missingOptional.push(field.label);
      }
    }
  }

  return {
    missingRequired,
    missingOptional,
    completedCount,
    totalCount: template.fields.length
  };
}

/**
 * Checks if documents are completed (Resume and Candidate Form received)
 */
export function areDocumentsComplete(candidate: Candidate): boolean {
  return candidate.resumeStatus === 'Received' && candidate.candidateFormStatus === 'Received';
}

/**
 * Interpolates email template placeholders
 */
export function interpolateEmail(
  templateText: string,
  candidate?: Candidate,
  recruiterName: string = 'Alex Mercer'
): string {
  if (!candidate) return templateText;

  let text = templateText;
  text = text.replace(/\[Candidate Name\]/g, candidate.fullName || 'Candidate');
  text = text.replace(/\[Job Title\]/g, candidate.jobTitle || 'Role');
  text = text.replace(/\[Location\]/g, candidate.jobLocation || 'Company Location');
  text = text.replace(/\[Teammate Name\]/g, candidate.assignedTeammateName || 'Our Technical Recruiter');
  text = text.replace(/\[Recruiter Name\]/g, recruiterName);

  return text;
}
