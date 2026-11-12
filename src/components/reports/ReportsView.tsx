import React from 'react';
import { Candidate, RecruitmentStage, Teammate } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileCheck,
  PhoneCall
} from 'lucide-react';
import { getCandidateAlertStatus } from '../../utils/helpers';

interface ReportsViewProps {
  candidates: Candidate[];
  teammates: Teammate[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ candidates, teammates }) => {
  const stages: RecruitmentStage[] = [
    'New Candidate',
    'Initial Email Sent',
    'Documents Pending',
    'Documents Received',
    'Ready for Teammate Call',
    'Call Pending',
    'Call Completed'
  ];

  const total = candidates.length || 1;

  // Funnel counts
  const stageCounts = stages.map((stg) => ({
    stage: stg,
    count: candidates.filter((c) => c.stage === stg).length,
    percentage: Math.round((candidates.filter((c) => c.stage === stg).length / total) * 100)
  }));

  // Document completion metrics
  const docsCompleteCount = candidates.filter(
    (c) => c.resumeStatus === 'Received' && c.candidateFormStatus === 'Received'
  ).length;

  const overdueCount = candidates.filter(
    (c) => getCandidateAlertStatus(c).status === 'Overdue'
  ).length;

  const approachingCount = candidates.filter(
    (c) => getCandidateAlertStatus(c).status === 'Approaching'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
            Recruitment Analytics
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Pipeline Funnel & Conversion Reports</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          Visual analytics tracking applicant throughput, document completion ratios, and follow-up timeliness.
        </p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Document Completion</span>
            <FileCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Math.round((docsCompleteCount / total) * 100)}%
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {docsCompleteCount} of {candidates.length} have both Resume & Form
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Screening Conversion</span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Math.round(
              (candidates.filter((c) => c.stage === 'Call Completed').length / total) * 100
            )}
            %
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {candidates.filter((c) => c.stage === 'Call Completed').length} Candidates with calls finished
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">SLA Follow-Up Health</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {overdueCount === 0 ? '100% On-Time' : `${overdueCount} Overdue Calls`}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {approachingCount} calls currently approaching 24h deadline
          </p>
        </div>
      </div>

      {/* 7-Stage Funnel Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Recruitment Stage Conversion Funnel</h3>
        <p className="text-xs text-slate-500">
          Distribution of candidates across the seven standard workflow stages.
        </p>

        <div className="space-y-3 pt-2">
          {stageCounts.map((item, idx) => (
            <div key={item.stage} className="space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-800">
                  {idx + 1}. {item.stage}
                </span>
                <span className="text-slate-600">
                  {item.count} Candidates ({item.percentage}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(item.percentage, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teammates Call Completion Performance */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Teammate Call Completion Performance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {teammates.map((tm) => {
            const assigned = candidates.filter((c) => c.assignedTeammateId === tm.id);
            const completed = assigned.filter((c) => c.stage === 'Call Completed').length;
            const completionRate = assigned.length ? Math.round((completed / assigned.length) * 100) : 0;

            return (
              <div key={tm.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{tm.name}</span>
                  <span className="text-teal-700">{completionRate}%</span>
                </div>
                <p className="text-slate-500 text-[11px]">{tm.title}</p>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                  <span>Completed: {completed}</span>
                  <span>Assigned: {assigned.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
