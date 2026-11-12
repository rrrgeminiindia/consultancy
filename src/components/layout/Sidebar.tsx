import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  UserCheck,
  Mail,
  BarChart3,
  Settings,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  User
} from 'lucide-react';
import { UserRole } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'candidates'
  | 'jobs'
  | 'forms'
  | 'team'
  | 'emails'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  userName: string;
  overdueCount: number;
  approachingCount: number;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  userName,
  overdueCount,
  approachingCount,
  isOpen,
  onCloseMobile
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    adminOnly?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'candidates',
      label: userRole === 'ADMIN' ? 'All Candidates' : 'My Candidates',
      icon: Users
    },
    {
      id: 'jobs',
      label: 'Job Openings',
      icon: Briefcase,
      adminOnly: true
    },
    {
      id: 'forms',
      label: 'Candidate Forms',
      icon: FileText,
      adminOnly: true
    },
    {
      id: 'team',
      label: 'Team Management',
      icon: UserCheck,
      adminOnly: true
    },
    {
      id: 'emails',
      label: 'Email Templates',
      icon: Mail
    },
    {
      id: 'reports',
      label: 'Reports & Funnel',
      icon: BarChart3,
      adminOnly: true
    },
    {
      id: 'settings',
      label: 'Settings & Firebase',
      icon: Settings
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and branding */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Candidate<span className="text-teal-400">Flow</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Recruitment CRM
              </p>
            </div>
          </div>
        </div>

        {/* User Role Badge Banner */}
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {userRole === 'ADMIN' ? (
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            ) : (
              <User className="w-4 h-4 text-teal-400" />
            )}
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Current Role
              </span>
              <span className="font-semibold text-white">
                {userRole === 'ADMIN' ? 'Admin / Lead' : 'Teammate'}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              userRole === 'ADMIN'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'bg-teal-400/20 text-teal-300 border border-teal-400/30'
            }`}
          >
            {userRole}
          </span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Hide admin-only items if current user is teammate
            if (item.adminOnly && userRole !== 'ADMIN') return null;

            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Overdue Alert Widget in Sidebar */}
        {(overdueCount > 0 || approachingCount > 0) && (
          <div className="mx-3 mb-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Follow-Up Alerts</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center justify-between text-rose-400 py-0.5">
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Overdue (&gt;48h):
                </span>
                <span className="font-bold bg-rose-950/80 border border-rose-800/50 px-1.5 py-0.2 rounded text-rose-300">
                  {overdueCount}
                </span>
              </div>
            )}
            {approachingCount > 0 && (
              <div className="flex items-center justify-between text-amber-400 py-0.5">
                <span>Needs Call (&gt;24h):</span>
                <span className="font-bold bg-amber-950/80 border border-amber-800/50 px-1.5 py-0.2 rounded text-amber-300">
                  {approachingCount}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer Tagline */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">CandidateFlow</p>
          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
            Manage Candidates. Track Progress. Never Miss a Follow-Up.
          </p>
        </div>
      </aside>
    </>
  );
};
