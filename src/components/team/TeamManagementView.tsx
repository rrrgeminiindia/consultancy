import React, { useState } from 'react';
import { Candidate, Teammate, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { getCandidateAlertStatus } from '../../utils/helpers';
import {
  UserCheck,
  Plus,
  PhoneCall,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  X,
  Users,
  ShieldCheck,
  BarChart2
} from 'lucide-react';

interface TeamManagementViewProps {
  teammates: Teammate[];
  candidates: Candidate[];
  userRole: UserRole;
  onTeammatesUpdated: (teammates: Teammate[]) => void;
  onSelectCandidate: (candidate: Candidate) => void;
  onSwitchToTeammateView?: (teammate: Teammate) => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  teammates,
  candidates,
  userRole,
  onTeammatesUpdated,
  onSelectCandidate,
  onSwitchToTeammateView
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('Technical Recruiter');
  const [maxCapacity, setMaxCapacity] = useState(15);

  const [reassignCandidateId, setReassignCandidateId] = useState<string | null>(null);
  const [targetTeammateId, setTargetTeammateId] = useState<string>('');

  const handleCreateTeammate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    StorageService.addTeammate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      title: title.trim(),
      active: true,
      maxCapacity
    });

    onTeammatesUpdated(StorageService.getTeammates());
    setShowAddModal(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignCandidateId) return;

    const tm = teammates.find((t) => t.id === targetTeammateId);
    StorageService.updateCandidate(
      reassignCandidateId,
      {
        assignedTeammateId: targetTeammateId || null,
        assignedTeammateName: tm ? tm.name : null,
        assignmentDate: targetTeammateId ? new Date().toISOString() : null
      },
      `Reassigned candidate to ${tm ? tm.name : 'Unassigned'}`
    );

    setReassignCandidateId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
              Recruitment Team Performance
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Teammate Allocation & Screening Metrics</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Monitor teammate workload capacities, active call queues, and overdue follow-up bottlenecks.
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teammate</span>
          </button>
        )}
      </div>

      {/* Teammate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {teammates.map((tm) => {
          const assignedCandidates = candidates.filter((c) => c.assignedTeammateId === tm.id);
          const activeFunnel = assignedCandidates.filter(
            (c) => !['Call Completed', 'Withdrawn', 'Closed'].includes(c.stage)
          );
          const callsCompletedCount = assignedCandidates.filter(
            (c) => c.stage === 'Call Completed'
          ).length;
          const pendingCalls = assignedCandidates.filter((c) => c.stage === 'Call Pending');

          // Overdue follow-ups for this specific teammate
          const overdueCalls = pendingCalls.filter((c) => {
            const alert = getCandidateAlertStatus(c);
            return alert.status === 'Overdue';
          });

          const capacityPct = Math.min(100, Math.round((activeFunnel.length / tm.maxCapacity) * 100));

          return (
            <div
              key={tm.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Teammate Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-900 text-teal-400 font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-teal-500/20">
                      {tm.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{tm.name}</h3>
                      <p className="text-[11px] text-slate-500">{tm.title}</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                </div>

                {/* Contact info */}
                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{tm.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tm.phone}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Active</span>
                    <span className="text-base font-bold text-slate-900">{activeFunnel.length}</span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 block uppercase font-semibold">Calls Done</span>
                    <span className="text-base font-bold text-emerald-800">{callsCompletedCount}</span>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg border ${
                      overdueCalls.length > 0
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-slate-50 border-slate-100 text-slate-800'
                    }`}
                  >
                    <span className="text-[10px] block uppercase font-semibold">Overdue</span>
                    <span className="text-base font-bold">
                      {overdueCalls.length}
                    </span>
                  </div>
                </div>

                {/* Workload Capacity Bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                    <span>Candidate Capacity</span>
                    <span>
                      {activeFunnel.length} / {tm.maxCapacity} ({capacityPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityPct > 85 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {onSwitchToTeammateView && (
                  <button
                    onClick={() => onSwitchToTeammateView(tm)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Switch to {tm.name.split(' ')[0]}'s View
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Teammate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Teammate Recruiter</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeammate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan.hayes@candidateflow.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 789-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Title / Role</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Active Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 10)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  Add Teammate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
