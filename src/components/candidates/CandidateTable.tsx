import React, { useState, useMemo, useEffect } from 'react';
import {
  Candidate,
  RecruitmentStage,
  ResumeStatus,
  CandidateFormStatus,
  IdentityVerificationStatus,
  Teammate,
  UserRole
} from '../../types';
import {
  getCandidateAlertStatus,
  formatDate,
  formatTimeInStage
} from '../../utils/helpers';
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface CandidateTableProps {
  candidates: Candidate[];
  teammates: Teammate[];
  userRole: UserRole;
  currentUserId: string;
  onSelectCandidate: (candidate: Candidate) => void;
  onUpdateStage: (candidateId: string, stage: RecruitmentStage) => void;
  onQuickToggleResume?: (candidateId: string, status: ResumeStatus) => void;
  onQuickToggleForm?: (candidateId: string, status: CandidateFormStatus) => void;
  onQuickToggleIdentity?: (candidateId: string, status: IdentityVerificationStatus) => void;
  onQuickAssignTeammate?: (candidateId: string, teammateId: string) => void;
  externalSearch?: string;
  initialJobFilter?: string;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  teammates,
  userRole,
  currentUserId,
  onSelectCandidate,
  onUpdateStage,
  onQuickToggleResume,
  onQuickToggleForm,
  onQuickToggleIdentity,
  onQuickAssignTeammate,
  externalSearch = '',
  initialJobFilter = 'ALL'
}) => {
  // Local filter states
  const [tableSearch, setTableSearch] = useState('');
  const [filterJob, setFilterJob] = useState(initialJobFilter);
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');
  const [filterTeammate, setFilterTeammate] = useState('ALL');
  const [filterAlert, setFilterAlert] = useState<'ALL' | 'OVERDUE' | 'APPROACHING' | 'NORMAL'>('ALL');
  const [sortBy, setSortBy] = useState<'applicationDate' | 'nextFollowUpDate' | 'name' | 'experience'>('applicationDate');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (initialJobFilter) {
      setFilterJob(initialJobFilter);
    }
  }, [initialJobFilter]);

  // Stages list for quick dropdown
  const stages: RecruitmentStage[] = [
    'New Candidate',
    'Initial Email Sent',
    'Documents Pending',
    'Documents Received',
    'Ready for Teammate Call',
    'Call Pending',
    'Call Completed',
    'Withdrawn',
    'Closed'
  ];
  const teammateCallStages: RecruitmentStage[] = [
    'Ready for Teammate Call',
    'Call Pending',
    'Call Completed'
  ];

  const hasActiveFilters =
    tableSearch.trim() !== '' ||
    filterJob !== 'ALL' ||
    filterLocation !== 'ALL' ||
    filterStage !== 'ALL' ||
    filterTeammate !== 'ALL' ||
    filterAlert !== 'ALL';

  const resetFilters = () => {
    setTableSearch('');
    setFilterJob('ALL');
    setFilterLocation('ALL');
    setFilterStage('ALL');
    setFilterTeammate('ALL');
    setFilterAlert('ALL');
  };

  // Distinct lists for dropdown filters
  const uniqueJobs = useMemo(() => Array.from(new Set(candidates.map((c) => c.jobTitle))), [candidates]);
  const uniqueLocations = useMemo(() => Array.from(new Set(candidates.map((c) => c.jobLocation))), [candidates]);

  // Combined search term
  const effectiveSearch = (externalSearch || tableSearch).trim().toLowerCase();

  // Filtered and sorted candidate list
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => {
        // Role-based visibility: Teammates ONLY see their assigned candidates!
        if (userRole === 'TEAMMATE' && candidate.assignedTeammateId !== currentUserId) {
          return false;
        }

        // Search match
        if (effectiveSearch) {
          const matchName = candidate.fullName.toLowerCase().includes(effectiveSearch);
          const matchEmail = candidate.email.toLowerCase().includes(effectiveSearch);
          const matchRole = candidate.jobTitle.toLowerCase().includes(effectiveSearch);
          const matchPhone = candidate.contactNumber.toLowerCase().includes(effectiveSearch);
          if (!matchName && !matchEmail && !matchRole && !matchPhone) return false;
        }

        // Job filter
        if (filterJob !== 'ALL' && candidate.jobTitle !== filterJob) return false;

        // Location filter
        if (filterLocation !== 'ALL' && candidate.jobLocation !== filterLocation) return false;

        // Stage filter
        if (filterStage !== 'ALL' && candidate.stage !== filterStage) return false;

        // Teammate filter (Admin only)
        if (filterTeammate !== 'ALL') {
          if (filterTeammate === 'UNASSIGNED') {
            if (candidate.assignedTeammateId) return false;
          } else if (candidate.assignedTeammateId !== filterTeammate) {
            return false;
          }
        }

        // Alert filter
        if (filterAlert !== 'ALL') {
          const alert = getCandidateAlertStatus(candidate);
          if (filterAlert === 'OVERDUE' && alert.status !== 'Overdue') return false;
          if (filterAlert === 'APPROACHING' && alert.status !== 'Approaching') return false;
          if (filterAlert === 'NORMAL' && alert.status !== 'Normal') return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;

        if (sortBy === 'applicationDate') {
          valA = new Date(a.applicationDate).getTime() || 0;
          valB = new Date(b.applicationDate).getTime() || 0;
        } else if (sortBy === 'nextFollowUpDate') {
          valA = a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : 9999999999999;
          valB = b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : 9999999999999;
        } else if (sortBy === 'name') {
          valA = a.fullName.toLowerCase();
          valB = b.fullName.toLowerCase();
        } else if (sortBy === 'experience') {
          valA = parseFloat(a.totalItExperience) || 0;
          valB = parseFloat(b.totalItExperience) || 0;
        }

        if (valA === valB) return 0;
        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [
    candidates,
    userRole,
    currentUserId,
    effectiveSearch,
    filterJob,
    filterLocation,
    filterStage,
    filterTeammate,
    filterAlert,
    sortBy,
    sortOrder
  ]);

  const toggleSort = (field: 'applicationDate' | 'nextFollowUpDate' | 'name' | 'experience') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStageBadgeColor = (stage: RecruitmentStage) => {
    switch (stage) {
      case 'New Candidate':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Initial Email Sent':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Documents Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Documents Received':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Ready for Teammate Call':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Call Pending':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Call Completed':
        return 'bg-green-100 text-green-800 border-green-300 font-semibold';
      case 'Withdrawn':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Closed':
        return 'bg-gray-200 text-gray-700 border-gray-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
      {/* Table Filters Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filters & Search ({filteredCandidates.length} of {candidates.length})
            </span>
          </div>

          {/* Quick Sort & Reset Options */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            )}
            <span className="text-slate-400">Sort by:</span>
            <button
              onClick={() => toggleSort('applicationDate')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium border ${
                sortBy === 'applicationDate'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Date Applied</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => toggleSort('nextFollowUpDate')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium border ${
                sortBy === 'nextFollowUpDate'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>Follow-Up Date</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Job Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
              Job Title
            </label>
            <select
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Job Titles</option>
              {uniqueJobs.map((job) => (
                <option key={job} value={job}>
                  {job}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
              Location
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
              Recruitment Stage
            </label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Stages</option>
              {stages.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>

          {/* Teammate Filter (Admin only) */}
          {userRole === 'ADMIN' ? (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Assigned Teammate
              </label>
              <select
                value={filterTeammate}
                onChange={(e) => setFilterTeammate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Teammates</option>
                <option value="UNASSIGNED">Unassigned Only</option>
                {teammates.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                View Scope
              </label>
              <div className="bg-teal-50 border border-teal-200 text-teal-800 p-2 rounded-lg font-medium text-xs">
                Assigned to you only
              </div>
            </div>
          )}

          {/* Alert Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
              Alert Status
            </label>
            <select
              value={filterAlert}
              onChange={(e) => setFilterAlert(e.target.value as any)}
              className={`w-full border rounded-lg p-2 text-xs font-semibold focus:outline-none ${
                filterAlert === 'OVERDUE'
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : filterAlert === 'APPROACHING'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Alert Levels</option>
              <option value="OVERDUE">🚨 Overdue Only (&gt;48h)</option>
              <option value="APPROACHING">⚠️ Approaching (&gt;24h)</option>
              <option value="NORMAL">✅ Normal / On Track</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
              <th className="py-3 px-3.5 sticky left-0 bg-slate-100 z-10 shadow-xs">Candidate Name</th>
              <th className="py-3 px-3">Alert Status</th>
              <th className="py-3 px-3">Recruitment Stage</th>
              <th className="py-3 px-3">Time in Stage</th>
              <th className="py-3 px-3">Resume</th>
              <th className="py-3 px-3">Candidate Form</th>
              <th className="py-3 px-3">Identity Verify</th>
              <th className="py-3 px-3">Assigned Teammate</th>
              <th className="py-3 px-3">Assignment Date</th>
              <th className="py-3 px-3">Job Title & Location</th>
              <th className="py-3 px-3">IT Experience</th>
              <th className="py-3 px-3">Date Applied</th>
              <th className="py-3 px-3">Last Contact</th>
              <th className="py-3 px-3">Next Follow-Up</th>
              <th className="py-3 px-3">Contact</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700">No candidates found</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your search queries or active filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCandidates.map((candidate) => {
                const alert = getCandidateAlertStatus(candidate);
                const isOverdue = alert.status === 'Overdue';
                const isApproaching = alert.status === 'Approaching';

                return (
                  <tr
                    key={candidate.id}
                    className={`hover:bg-slate-50/80 transition-colors group ${
                      isOverdue
                        ? 'bg-rose-50/40 border-l-4 border-l-rose-500'
                        : isApproaching
                        ? 'bg-amber-50/30 border-l-4 border-l-amber-500'
                        : ''
                    }`}
                  >
                    {/* Candidate Name (Sticky) */}
                    <td className="py-3 px-3.5 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-xs">
                      <button
                        onClick={() => onSelectCandidate(candidate)}
                        className="text-left font-bold text-slate-900 hover:text-teal-700 transition-colors flex items-center gap-1.5"
                      >
                        <span className="hover:underline">{candidate.fullName}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <p className="text-[11px] text-slate-500">{candidate.email}</p>
                    </td>

                    {/* Alert Status (Overdue in red, Approaching in yellow) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {alert.badgeText}
                        </span>
                      ) : isApproaching ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {alert.badgeText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                          <CheckCircle2 className="w-3 h-3 text-slate-400" />
                          {alert.badgeText}
                        </span>
                      )}
                    </td>

                    {/* Recruitment Stage (Quick edit dropdown) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <select
                        value={candidate.stage}
                        onChange={(e) => onUpdateStage(candidate.id, e.target.value as RecruitmentStage)}
                        disabled={userRole === 'TEAMMATE' && !teammateCallStages.includes(candidate.stage)}
                        className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-65 disabled:cursor-not-allowed ${getStageBadgeColor(
                          candidate.stage
                        )}`}
                      >
                        {(userRole === 'ADMIN'
                          ? stages
                          : teammateCallStages.includes(candidate.stage)
                          ? teammateCallStages
                          : [candidate.stage]
                        ).map((stg) => (
                          <option key={stg} value={stg} className="bg-white text-slate-900">
                            {stg}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Time in Current Stage */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTimeInStage(candidate.stageEnteredAt)}
                      </span>
                    </td>

                    {/* Resume Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={userRole !== 'ADMIN'}
                        onClick={() =>
                          userRole === 'ADMIN' &&
                          onQuickToggleResume &&
                          onQuickToggleResume(
                            candidate.id,
                            candidate.resumeStatus === 'Received' ? 'Pending' : 'Received'
                          )
                        }
                        title={userRole === 'ADMIN' ? 'Click to toggle Resume status' : 'Admin manages documents'}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                          userRole === 'ADMIN' ? 'cursor-pointer' : 'cursor-default opacity-85'
                        } ${
                          candidate.resumeStatus === 'Received'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {candidate.resumeStatus === 'Received' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-500" />
                        )}
                        <span>{candidate.resumeStatus}</span>
                      </button>
                    </td>

                    {/* Candidate Form Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={userRole !== 'ADMIN'}
                        onClick={() =>
                          userRole === 'ADMIN' &&
                          onQuickToggleForm &&
                          onQuickToggleForm(
                            candidate.id,
                            candidate.candidateFormStatus === 'Received' ? 'Pending' : 'Received'
                          )
                        }
                        title={userRole === 'ADMIN' ? 'Click to toggle Form status' : 'Admin manages documents'}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                          userRole === 'ADMIN' ? 'cursor-pointer' : 'cursor-default opacity-85'
                        } ${
                          candidate.candidateFormStatus === 'Received'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {candidate.candidateFormStatus === 'Received' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-500" />
                        )}
                        <span>{candidate.candidateFormStatus}</span>
                      </button>
                    </td>

                    {/* Identity Verification Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {userRole === 'ADMIN' && onQuickToggleIdentity ? (
                        <select
                          value={candidate.identityVerificationStatus}
                          onChange={(e) =>
                            onQuickToggleIdentity(candidate.id, e.target.value as IdentityVerificationStatus)
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer focus:outline-none ${
                            candidate.identityVerificationStatus === 'Verified'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : candidate.identityVerificationStatus === 'Not Required'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                          <option value="Not Required">Not Required</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            candidate.identityVerificationStatus === 'Verified'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : candidate.identityVerificationStatus === 'Not Required'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {candidate.identityVerificationStatus}
                        </span>
                      )}
                    </td>

                    {/* Assigned Teammate */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {userRole === 'ADMIN' && onQuickAssignTeammate ? (
                        <select
                          value={candidate.assignedTeammateId || ''}
                          onChange={(e) => onQuickAssignTeammate(candidate.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-md px-2 py-1 text-[11px] font-medium text-slate-800 focus:outline-none focus:border-teal-500"
                        >
                          <option value="">Unassigned</option>
                          {teammates.map((tm) => (
                            <option key={tm.id} value={tm.id}>
                              {tm.name}
                            </option>
                          ))}
                        </select>
                      ) : candidate.assignedTeammateName ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold">
                            {candidate.assignedTeammateName.charAt(0)}
                          </div>
                          <span>{candidate.assignedTeammateName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Assignment Date */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {formatDate(candidate.assignmentDate)}
                    </td>

                    {/* Job Title & Location */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <p className="font-semibold text-slate-800 max-w-[180px] truncate">
                        {candidate.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-500">{candidate.jobLocation}</p>
                    </td>

                    {/* Total IT Experience */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                      {candidate.totalItExperience}
                    </td>

                    {/* Date Applied */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {formatDate(candidate.applicationDate)}
                    </td>

                    {/* Last Contact */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {formatDate(candidate.lastContactDate)}
                    </td>

                    {/* Next Follow-Up */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {candidate.nextFollowUpDate ? formatDate(candidate.nextFollowUpDate) : '—'}
                    </td>

                    {/* Contact Number */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {candidate.contactNumber}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectCandidate(candidate)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50 text-slate-500 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span>
            Showing <strong className="text-slate-800">{filteredCandidates.length}</strong> candidates
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Overdue Alert (&gt;48h)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Needs Call (&gt;24h)</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Tip: Click any candidate row or name to view full profile, call notes, and history.
        </div>
      </div>
    </div>
  );
};
