import {
  Candidate,
  CandidateFormTemplate,
  EmailTemplate,
  JobOpening,
  RecruitmentStage,
  Teammate,
  UserProfile,
  UserRole
} from '../types';
import {
  INITIAL_ADMIN_USER,
  INITIAL_CANDIDATES,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_FORM_TEMPLATES,
  INITIAL_JOB_OPENINGS,
  INITIAL_TEAMMATES
} from '../data/initialData';
import { normalizeEmail } from '../utils/helpers';

const STORAGE_KEYS = {
  CANDIDATES: 'candidateflow_candidates_v1',
  TEAMMATES: 'candidateflow_teammates_v1',
  JOBS: 'candidateflow_jobs_v1',
  FORM_TEMPLATES: 'candidateflow_form_templates_v1',
  EMAIL_TEMPLATES: 'candidateflow_email_templates_v1',
  ACTIVE_USER: 'candidateflow_active_user_v1',
  FIREBASE_CONFIG: 'candidateflow_firebase_config_v1'
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Listener callback error:', e);
    }
  });
}

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// In-memory caches backed by localStorage
let candidatesCache: Candidate[] | null = null;
let teammatesCache: Teammate[] | null = null;
let jobsCache: JobOpening[] | null = null;
let formTemplatesCache: CandidateFormTemplate[] | null = null;
let emailTemplatesCache: EmailTemplate[] | null = null;
let activeUserCache: UserProfile | null = null;

export const StorageService = {
  // --- Active User & Auth ---
  getActiveUser(): UserProfile {
    if (activeUserCache) return activeUserCache;
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (stored) {
      try {
        activeUserCache = JSON.parse(stored);
        return activeUserCache!;
      } catch (e) {
        console.error('Error parsing active user', e);
      }
    }
    activeUserCache = INITIAL_ADMIN_USER;
    return activeUserCache;
  },

  setActiveUser(user: UserProfile) {
    activeUserCache = user;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
    notifyListeners();
  },

  // --- Candidates ---
  getCandidates(): Candidate[] {
    if (candidatesCache) return candidatesCache;
    const stored = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
    if (stored) {
      try {
        candidatesCache = JSON.parse(stored);
        return candidatesCache!;
      } catch (e) {
        console.error('Error parsing candidates', e);
      }
    }
    candidatesCache = [...INITIAL_CANDIDATES];
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidatesCache));
    return candidatesCache;
  },

  saveCandidates(candidates: Candidate[]) {
    candidatesCache = candidates;
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
    notifyListeners();
  },

  addCandidate(candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'stageHistory' | 'callLogs' | 'emailLogs'>): Candidate {
    const candidates = this.getCandidates();
    const nowIso = new Date().toISOString();
    
    const newCandidate: Candidate = {
      ...candidateData,
      id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stageHistory: [
        {
          stage: candidateData.stage,
          enteredAt: nowIso,
          updatedBy: this.getActiveUser().name,
          notes: 'Candidate created'
        }
      ],
      callLogs: [],
      emailLogs: [],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    candidates.unshift(newCandidate);
    this.saveCandidates(candidates);
    return newCandidate;
  },

  updateCandidate(id: string, updates: Partial<Candidate>, notesForHistory?: string): Candidate | null {
    const candidates = this.getCandidates();
    const index = candidates.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const current = candidates[index];
    const nowIso = new Date().toISOString();

    let updatedHistory = [...(current.stageHistory || [])];
    let callPendingStartedAt = current.callPendingStartedAt;
    let stageEnteredAt = current.stageEnteredAt;

    // Check if stage changed
    if (updates.stage && updates.stage !== current.stage) {
      stageEnteredAt = nowIso;
      updatedHistory.unshift({
        stage: updates.stage,
        enteredAt: nowIso,
        updatedBy: this.getActiveUser().name,
        notes: notesForHistory || `Moved to ${updates.stage}`
      });

      if (updates.stage === 'Call Pending' && !callPendingStartedAt) {
        callPendingStartedAt = nowIso;
      } else if (['Call Completed', 'Withdrawn', 'Closed'].includes(updates.stage)) {
        // timer stops
      }
    }

    const updatedCandidate: Candidate = {
      ...current,
      ...updates,
      stageHistory: updatedHistory,
      callPendingStartedAt: updates.callPendingStartedAt !== undefined ? updates.callPendingStartedAt : callPendingStartedAt,
      stageEnteredAt: updates.stageEnteredAt || stageEnteredAt,
      updatedAt: nowIso
    };

    candidates[index] = updatedCandidate;
    this.saveCandidates(candidates);
    return updatedCandidate;
  },

  deleteCandidate(id: string): boolean {
    const candidates = this.getCandidates();
    const filtered = candidates.filter((c) => c.id !== id);
    if (filtered.length !== candidates.length) {
      this.saveCandidates(filtered);
      return true;
    }
    return false;
  },

  /**
   * Check for duplicate candidate by normalized email + LinkedIn job opening
   */
  checkDuplicate(email: string, jobOpening: string, excludeId?: string): Candidate | null {
    const normalizedTargetEmail = normalizeEmail(email);
    const candidates = this.getCandidates();
    return (
      candidates.find(
        (c) =>
          c.id !== excludeId &&
          normalizeEmail(c.email) === normalizedTargetEmail &&
          (c.linkedInJobOpening.toLowerCase() === jobOpening.toLowerCase() ||
            c.jobTitle.toLowerCase() === jobOpening.toLowerCase())
      ) || null
    );
  },

  // --- Teammates ---
  getTeammates(): Teammate[] {
    if (teammatesCache) return teammatesCache;
    const stored = localStorage.getItem(STORAGE_KEYS.TEAMMATES);
    if (stored) {
      try {
        teammatesCache = JSON.parse(stored);
        return teammatesCache!;
      } catch (e) {
        console.error('Error parsing teammates', e);
      }
    }
    teammatesCache = [...INITIAL_TEAMMATES];
    localStorage.setItem(STORAGE_KEYS.TEAMMATES, JSON.stringify(teammatesCache));
    return teammatesCache;
  },

  saveTeammates(teammates: Teammate[]) {
    teammatesCache = teammates;
    localStorage.setItem(STORAGE_KEYS.TEAMMATES, JSON.stringify(teammates));
    notifyListeners();
  },

  addTeammate(teammate: Omit<Teammate, 'id'>): Teammate {
    const teammates = this.getTeammates();
    const newTeammate: Teammate = {
      ...teammate,
      id: `tm-${Date.now()}`
    };
    teammates.push(newTeammate);
    this.saveTeammates(teammates);
    return newTeammate;
  },

  updateTeammate(id: string, updates: Partial<Teammate>): Teammate | null {
    const teammates = this.getTeammates();
    const index = teammates.findIndex((t) => t.id === id);
    if (index === -1) return null;
    teammates[index] = { ...teammates[index], ...updates };
    this.saveTeammates(teammates);
    return teammates[index];
  },

  // --- Job Openings ---
  getJobOpenings(): JobOpening[] {
    if (jobsCache) return jobsCache;
    const stored = localStorage.getItem(STORAGE_KEYS.JOBS);
    if (stored) {
      try {
        jobsCache = JSON.parse(stored);
        return jobsCache!;
      } catch (e) {
        console.error('Error parsing jobs', e);
      }
    }
    jobsCache = [...INITIAL_JOB_OPENINGS];
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobsCache));
    return jobsCache;
  },

  saveJobOpenings(jobs: JobOpening[]) {
    jobsCache = jobs;
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    notifyListeners();
  },

  addJobOpening(job: Omit<JobOpening, 'id' | 'createdAt'>): JobOpening {
    const jobs = this.getJobOpenings();
    const newJob: JobOpening = {
      ...job,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    jobs.unshift(newJob);
    this.saveJobOpenings(jobs);
    return newJob;
  },

  updateJobOpening(id: string, updates: Partial<JobOpening>): JobOpening | null {
    const jobs = this.getJobOpenings();
    const index = jobs.findIndex((j) => j.id === id);
    if (index === -1) return null;
    jobs[index] = { ...jobs[index], ...updates };
    this.saveJobOpenings(jobs);
    return jobs[index];
  },

  // --- Form Templates ---
  getFormTemplates(): CandidateFormTemplate[] {
    if (formTemplatesCache) return formTemplatesCache;
    const stored = localStorage.getItem(STORAGE_KEYS.FORM_TEMPLATES);
    if (stored) {
      try {
        formTemplatesCache = JSON.parse(stored);
        return formTemplatesCache!;
      } catch (e) {
        console.error('Error parsing form templates', e);
      }
    }
    formTemplatesCache = [...INITIAL_FORM_TEMPLATES];
    localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(formTemplatesCache));
    return formTemplatesCache;
  },

  saveFormTemplates(templates: CandidateFormTemplate[]) {
    formTemplatesCache = templates;
    localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(templates));
    notifyListeners();
  },

  updateFormTemplate(id: string, updates: Partial<CandidateFormTemplate>): CandidateFormTemplate | null {
    const templates = this.getFormTemplates();
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return null;
    templates[index] = { ...templates[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveFormTemplates(templates);
    return templates[index];
  },

  addFormTemplate(template: Omit<CandidateFormTemplate, 'id' | 'createdAt' | 'updatedAt'>): CandidateFormTemplate {
    const templates = this.getFormTemplates();
    const nowIso = new Date().toISOString();
    const newTpl: CandidateFormTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    templates.push(newTpl);
    this.saveFormTemplates(templates);
    return newTpl;
  },

  // --- Email Templates ---
  getEmailTemplates(): EmailTemplate[] {
    if (emailTemplatesCache) return emailTemplatesCache;
    const stored = localStorage.getItem(STORAGE_KEYS.EMAIL_TEMPLATES);
    if (stored) {
      try {
        emailTemplatesCache = JSON.parse(stored);
        return emailTemplatesCache!;
      } catch (e) {
        console.error('Error parsing email templates', e);
      }
    }
    emailTemplatesCache = [...INITIAL_EMAIL_TEMPLATES];
    localStorage.setItem(STORAGE_KEYS.EMAIL_TEMPLATES, JSON.stringify(emailTemplatesCache));
    return emailTemplatesCache;
  },

  saveEmailTemplates(templates: EmailTemplate[]) {
    emailTemplatesCache = templates;
    localStorage.setItem(STORAGE_KEYS.EMAIL_TEMPLATES, JSON.stringify(templates));
    notifyListeners();
  },

  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
    const templates = this.getEmailTemplates();
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return null;
    templates[index] = { ...templates[index], ...updates };
    this.saveEmailTemplates(templates);
    return templates[index];
  },

  // --- Call Logging ---
  addCallLog(candidateId: string, logData: {
    callDate: string;
    callTime: string;
    durationMinutes: number;
    outcome: any;
    notes: string;
    markCompleted?: boolean;
  }) {
    const candidates = this.getCandidates();
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return null;

    const activeUser = this.getActiveUser();
    const nowIso = new Date().toISOString();

    const callLog = {
      id: `clog-${Date.now()}`,
      candidateId,
      teammateId: activeUser.id,
      teammateName: activeUser.name,
      callDate: logData.callDate,
      callTime: logData.callTime,
      durationMinutes: logData.durationMinutes,
      outcome: logData.outcome,
      notes: logData.notes,
      createdAt: nowIso
    };

    const newLogs = [callLog, ...(cand.callLogs || [])];
    const updates: Partial<Candidate> = {
      callLogs: newLogs,
      lastContactDate: nowIso
    };

    if (logData.markCompleted || logData.outcome === 'Completed') {
      updates.stage = 'Call Completed';
    }

    return this.updateCandidate(candidateId, updates, `Call logged: ${logData.outcome} (${logData.durationMinutes}m)`);
  },

  // --- Email Logging ---
  addEmailLog(candidateId: string, logData: {
    templateId: string;
    templateTitle: string;
    recipientEmail: string;
    subject: string;
    content: string;
  }) {
    const candidates = this.getCandidates();
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return null;

    const activeUser = this.getActiveUser();
    const nowIso = new Date().toISOString();

    const emailLog = {
      id: `elog-${Date.now()}`,
      candidateId,
      templateId: logData.templateId,
      templateTitle: logData.templateTitle,
      sentBy: activeUser.name,
      sentAt: nowIso,
      recipientEmail: logData.recipientEmail,
      subject: logData.subject,
      content: logData.content
    };

    const newLogs = [emailLog, ...(cand.emailLogs || [])];
    return this.updateCandidate(candidateId, {
      emailLogs: newLogs,
      lastContactDate: nowIso
    }, `Email recorded: ${logData.templateTitle}`);
  },

  // --- Bulk CSV Import ---
  bulkImportCandidates(newCandidates: Array<Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'stageHistory' | 'callLogs' | 'emailLogs'>>): {
    importedCount: number;
    candidates: Candidate[];
  } {
    const currentCandidates = this.getCandidates();
    const activeUser = this.getActiveUser();
    const nowIso = new Date().toISOString();

    const created: Candidate[] = newCandidates.map((data, idx) => ({
      ...data,
      id: `cand-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      stageHistory: [
        {
          stage: data.stage || 'New Candidate',
          enteredAt: nowIso,
          updatedBy: `${activeUser.name} (CSV Import)`,
          notes: 'Imported via Bulk CSV Upload'
        }
      ],
      callLogs: [],
      emailLogs: [],
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    const merged = [...created, ...currentCandidates];
    this.saveCandidates(merged);
    return {
      importedCount: created.length,
      candidates: merged
    };
  },

  // --- Reset to Initial Data ---
  resetToSampleData() {
    candidatesCache = [...INITIAL_CANDIDATES];
    teammatesCache = [...INITIAL_TEAMMATES];
    jobsCache = [...INITIAL_JOB_OPENINGS];
    formTemplatesCache = [...INITIAL_FORM_TEMPLATES];
    emailTemplatesCache = [...INITIAL_EMAIL_TEMPLATES];
    activeUserCache = INITIAL_ADMIN_USER;

    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidatesCache));
    localStorage.setItem(STORAGE_KEYS.TEAMMATES, JSON.stringify(teammatesCache));
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobsCache));
    localStorage.setItem(STORAGE_KEYS.FORM_TEMPLATES, JSON.stringify(formTemplatesCache));
    localStorage.setItem(STORAGE_KEYS.EMAIL_TEMPLATES, JSON.stringify(emailTemplatesCache));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(activeUserCache));

    notifyListeners();
  }
};
