import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Upload,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  Database
} from 'lucide-react';
import { Candidate, Teammate, UserProfile } from '../../types';
import { INITIAL_ADMIN_USER } from '../../data/initialData';
import { getCandidateAlertStatus } from '../../utils/helpers';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  activeUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  teammates: Teammate[];
  candidates: Candidate[];
  onOpenAddModal: () => void;
  onOpenCsvModal: () => void;
  onSelectCandidate: (candidate: Candidate) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  activeUser,
  onSwitchUser,
  teammates,
  candidates,
  onOpenAddModal,
  onOpenCsvModal,
  onSelectCandidate,
  searchQuery,
  onSearchChange,
  onOpenSettings
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter candidates relevant to active user for notifications
  const userCandidates =
    activeUser.role === 'ADMIN'
      ? candidates
      : candidates.filter((c) => c.assignedTeammateId === activeUser.id);

  // Identify overdue and approaching alerts
  const alertCandidates = userCandidates
    .map((c) => ({
      candidate: c,
      alert: getCandidateAlertStatus(c)
    }))
    .filter((item) => item.alert.status !== 'Normal');

  const overdueCount = alertCandidates.filter((i) => i.alert.status === 'Overdue').length;
  const approachingCount = alertCandidates.filter((i) => i.alert.status === 'Approaching').length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Mobile hamburger & search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates by name, email, role, or phone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions, notifications, user switcher */}
      <div className="flex items-center gap-2.5">
        {/* Action Buttons for Admin */}
        {activeUser.role === 'ADMIN' && (
          <button
            onClick={onOpenCsvModal}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
            title="Import candidates from CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>
        )}

        {/* Add Candidate (Admin only) */}
        {activeUser.role === 'ADMIN' && (
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs shadow-teal-700/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Candidate</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}

        {/* Follow-up Notifications Bell */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            title="Follow-up notifications"
          >
            <Bell className="w-5 h-5" />
            {alertCandidates.length > 0 && (
              <span
                className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                  overdueCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-0 overflow-hidden z-50">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-sm">Follow-Up Action Center</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  {overdueCount > 0 && (
                    <span className="bg-rose-500 px-2 py-0.5 rounded-full font-bold">
                      {overdueCount} Overdue
                    </span>
                  )}
                  {approachingCount > 0 && (
                    <span className="bg-amber-500 px-2 py-0.5 rounded-full font-bold">
                      {approachingCount} Due
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {alertCandidates.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-teal-500" />
                    <p className="font-medium text-slate-700">All follow-ups are up to date!</p>
                    <p className="text-[11px] text-slate-400">
                      No candidate calls or deadlines are currently pending past 24 hours.
                    </p>
                  </div>
                ) : (
                  alertCandidates.map(({ candidate, alert }) => (
                    <div
                      key={candidate.id}
                      onClick={() => {
                        onSelectCandidate(candidate);
                        setNotificationsOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3"
                    >
                      <div
                        className={`p-2 rounded-lg mt-0.5 ${
                          alert.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {candidate.fullName}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              alert.status === 'Overdue'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {alert.badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{candidate.jobTitle}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>Stage: {candidate.stage}</span>
                          <span>•</span>
                          <span>Assigned: {candidate.assignedTeammateName || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-teal-500/30">
              {activeUser.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>{activeUser.name.split(' ')[0]}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    activeUser.role === 'ADMIN'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {activeUser.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[110px]">
                {activeUser.role === 'ADMIN' ? 'Lead Recruiter' : 'Teammate'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* User Switcher Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900">Preview Role / User (Local Mode)</p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  Switches UI view locally in this browser. Real teammate logins require Firebase Auth setup.
                </p>
              </div>

              {/* Admin Option */}
              <button
                onClick={() => {
                  onSwitchUser(INITIAL_ADMIN_USER);
                  setUserDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                  activeUser.role === 'ADMIN'
                    ? 'bg-slate-900 text-white'
                    : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      activeUser.role === 'ADMIN'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{INITIAL_ADMIN_USER.name}</p>
                    <p
                      className={`text-[10px] ${
                        activeUser.role === 'ADMIN' ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      Admin (Full Access & All Candidates)
                    </p>
                  </div>
                </div>
              </button>

              <div className="my-2 border-t border-slate-100 pt-1 px-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Teammates (Restricted Views)
                </p>
              </div>

              {/* Teammates Options */}
              {teammates.map((tm) => {
                const isSelected = activeUser.id === tm.id;
                return (
                  <button
                    key={tm.id}
                    onClick={() => {
                      onSwitchUser({
                        id: tm.id,
                        name: tm.name,
                        email: tm.email,
                        role: 'TEAMMATE',
                        avatar: tm.avatar,
                        title: tm.title
                      });
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-teal-700 text-white'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-teal-300 text-teal-950'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{tm.name}</p>
                        <p
                          className={`text-[10px] ${
                            isSelected ? 'text-teal-100' : 'text-slate-500'
                          }`}
                        >
                          {tm.title} (Assigned only)
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
