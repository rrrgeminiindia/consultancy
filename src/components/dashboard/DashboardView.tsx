import React from 'react';
import {
  Candidate,
  Teammate,
  RecruitmentStage,
  UserRole,
  ResumeStatus,
  CandidateFormStatus
} from '../../types';
import {
  Users,
  UserPlus,
  FileClock,
  PhoneCall,
  CheckCircle,
  AlertOctagon,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { getCandidateAlertStatus, formatTimeInStage } from '../../utils/helpers';
import { CandidateTable } from '../candidates/CandidateTable';

interface DashboardViewProps {
  candidates: Candidate[];
  teammates: Teammate[];
  userRole: UserRole;
  currentUserId: string;
  onSelectCandidate: (candidate: Candidate) => void;
  onUpdateStage: (candidateId: string, stage: RecruitmentStage) => void;
  onQuickToggleResume: (candidateId: string, status: ResumeStatus) => void;
  onQuickToggleForm: (candidateId: string, status: CandidateFormStatus) => void;
  onNavigateToEmails: () => void;
  onNavigateToCandidates: () => void;
  searchQuery: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  candidates,
  teammates,
  userRole,
  currentUserId,
  onSelectCandidate,
  onUpdateStage,
  onQuickToggleResume,
  onQuickToggleForm,
  onNavigateToEmails,
  onNavigateToCandidates,
  searchQuery
}) => {
  // Teammate view restriction
  const scopedCandidates =
    userRole === 'TEAMMATE'
      ? candidates.filter((c) => c.assignedTeammateId === currentUserId)
      : candidates;

  // Calculate metrics
  const totalCandidates = scopedCandidates.length;
  const newCandidates = scopedCandidates.filter((c) => c.stage === 'New Candidate').length;
  const documentsPending = scopedCandidates.filter(
    (c) => c.stage === 'Documents Pending' || (c.resumeStatus === 'Pending' || c.candidateFormStatus === 'Pending')
  ).length;
  const readyForCall = scopedCandidates.filter((c) => c.stage === 'Ready for Teammate Call').length;
  const callsPending = scopedCandidates.filter((c) => c.stage === 'Call Pending').length;
  const callsCompleted = scopedCandidates.filter((c) => c.stage === 'Call Completed').length;

  // Overdue follow-ups calculation
  const candidatesWithAlerts = scopedCandidates.map((c) => ({
    candidate: c,
    alert: getCandidateAlertStatus(c)
  }));

  const overdueFollowUps = candidatesWithAlerts.filter((item) => item.alert.status === 'Overdue');
  const approachingFollowUps = candidatesWithAlerts.filter((item) => item.alert.status === 'Approaching');

  return (
    <div className="space-y-6">
      {/* Welcome & Context Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
              {userRole === 'ADMIN' ? 'Recruitment Operations Desk' : 'Teammate Screening Workspace'}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Candidate<span className="text-teal-400">Flow</span> Assistant
          </h1>
          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
            Manage Candidates. Track Progress. Never Miss a Follow-Up.
            {userRole === 'ADMIN'
              ? ' Full visibility across candidate intakes, missing document checklists, teammate allocations, and follow-up deadlines.'
              : ' Prioritize your assigned applicant screenings, maintain call logs, and ensure zero delayed follow-ups.'}
          </p>
        </div>
      </div>

      {/* 7 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Total Candidates */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCandidates}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active in CRM</p>
        </div>

        {/* 2. New Candidates */}
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">New</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{newCandidates}</div>
          <p className="text-[11px] text-blue-600 mt-0.5">Needs Outreach</p>
        </div>

        {/* 3. Documents Pending */}
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Docs Due</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <FileClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-900">{documentsPending}</div>
          <p className="text-[11px] text-amber-600 mt-0.5">Resume / Form</p>
        </div>

        {/* 4. Ready for Call */}
        <div className="bg-white p-4 rounded-xl border border-teal-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-teal-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ready Call</span>
            <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-900">{readyForCall}</div>
          <p className="text-[11px] text-teal-600 mt-0.5">Docs Verified</p>
        </div>

        {/* 5. Calls Pending */}
        <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Call In Queue</span>
            <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">{callsPending}</div>
          <p className="text-[11px] text-purple-600 mt-0.5">Timer Active</p>
        </div>

        {/* 6. Calls Completed */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{callsCompleted}</div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Screens Finished</p>
        </div>

        {/* 7. Overdue Follow-ups (HIGHLIGHTED IN RED) */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            overdueFollowUps.length > 0
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 text-rose-900 animate-pulse'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue (&gt;48h)</span>
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{overdueFollowUps.length}</div>
          <p className="text-[11px] font-semibold text-rose-600 mt-0.5">Immediate Action</p>
        </div>
      </div>

      {/* Dedicated Follow-Up Alerts Section (Overdue in Red, Approaching in Yellow) */}
      {(overdueFollowUps.length > 0 || approachingFollowUps.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Active Follow-Up Deadlines & Delays
                </h3>
                <p className="text-xs text-slate-500">
                  Call pending timer: Yellow at 24 hours, Red overdue at 48 hours.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToEmails}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open Follow-Up Email Templates</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Overdue (>48h) Cards */}
            {overdueFollowUps.map(({ candidate, alert }) => (
              <div
                key={candidate.id}
                className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 flex flex-col justify-between hover:border-rose-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white">
                        <AlertOctagon className="w-3 h-3" /> Overdue: {Math.floor(alert.hoursElapsed)} Hours in Call Pending
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                        {candidate.fullName}
                      </h4>
                      <p className="text-xs text-slate-600">{candidate.jobTitle}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-white/70 p-2.5 rounded-lg border border-rose-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assigned Teammate:</span>
                      <span className="font-semibold text-slate-800">
                        {candidate.assignedTeammateName || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Candidate Phone:</span>
                      <span className="font-mono text-slate-800 font-semibold">
                        {candidate.contactNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-rose-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700 font-medium">
                    Recommended: Send Template G (48h Overdue)
                  </span>
                  <button
                    onClick={() => onSelectCandidate(candidate)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <span>Log Call / Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Approaching (>24h) Cards */}
            {approachingFollowUps.map(({ candidate, alert }) => (
              <div
                key={candidate.id}
                className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col justify-between hover:border-amber-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white">
                        <Clock className="w-3 h-3" /> Approaching: {Math.floor(alert.hoursElapsed)} Hours in Queue
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                        {candidate.fullName}
                      </h4>
                      <p className="text-xs text-slate-600">{candidate.jobTitle}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-white/70 p-2.5 rounded-lg border border-amber-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assigned Teammate:</span>
                      <span className="font-semibold text-slate-800">
                        {candidate.assignedTeammateName || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone Number:</span>
                      <span className="font-mono text-slate-800 font-semibold">
                        {candidate.contactNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-800 font-medium">
                    Call deadline expires at 48h
                  </span>
                  <button
                    onClick={() => onSelectCandidate(candidate)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <span>Record Call Attempt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Table Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Candidates Pipeline</h2>
            <p className="text-xs text-slate-500">
              Complete candidate list with multi-column filtering, quick stage adjustments, and alert monitors.
            </p>
          </div>
        </div>

        <CandidateTable
          candidates={scopedCandidates}
          teammates={teammates}
          userRole={userRole}
          currentUserId={currentUserId}
          onSelectCandidate={onSelectCandidate}
          onUpdateStage={onUpdateStage}
          onQuickToggleResume={onQuickToggleResume}
          onQuickToggleForm={onQuickToggleForm}
          externalSearch={searchQuery}
        />
      </div>
    </div>
  );
};
