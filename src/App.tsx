import React, { useState, useEffect } from 'react';
import {
  Candidate,
  CandidateFormStatus,
  CandidateFormTemplate,
  EmailTemplate,
  JobOpening,
  RecruitmentStage,
  ResumeStatus,
  Teammate,
  UserProfile
} from './types';
import { StorageService, subscribeToStore } from './services/storage';
import { getCandidateAlertStatus } from './utils/helpers';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CandidateTable } from './components/candidates/CandidateTable';
import { CandidateProfileModal } from './components/candidates/CandidateProfileModal';
import { AddCandidateModal } from './components/candidates/AddCandidateModal';
import { CsvUploadModal } from './components/candidates/CsvUploadModal';
import { JobOpeningsView } from './components/jobs/JobOpeningsView';
import { FormTemplatesView } from './components/forms/FormTemplatesView';
import { TeamManagementView } from './components/team/TeamManagementView';
import { EmailTemplatesView } from './components/emails/EmailTemplatesView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  // Global Store States
  const [candidates, setCandidates] = useState<Candidate[]>(StorageService.getCandidates());
  const [teammates, setTeammates] = useState<Teammate[]>(StorageService.getTeammates());
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>(StorageService.getJobOpenings());
  const [formTemplates, setFormTemplates] = useState<CandidateFormTemplate[]>(StorageService.getFormTemplates());
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(StorageService.getEmailTemplates());
  const [activeUser, setActiveUser] = useState<UserProfile>(StorageService.getActiveUser());

  // Navigation & UI States
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const [preselectedEmailCandidateId, setPreselectedEmailCandidateId] = useState<string | undefined>(undefined);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setCandidates([...StorageService.getCandidates()]);
      setTeammates([...StorageService.getTeammates()]);
      setJobOpenings([...StorageService.getJobOpenings()]);
      setFormTemplates([...StorageService.getFormTemplates()]);
      setEmailTemplates([...StorageService.getEmailTemplates()]);
      setActiveUser(StorageService.getActiveUser());
    });
    return unsubscribe;
  }, []);

  // Update selected candidate if candidate modified in store
  useEffect(() => {
    if (selectedCandidate) {
      const fresh = candidates.find((c) => c.id === selectedCandidate.id);
      if (fresh) setSelectedCandidate(fresh);
    }
  }, [candidates]);

  // Role-scoped candidates for alert calculations
  const scopedCandidates =
    activeUser.role === 'TEAMMATE'
      ? candidates.filter((c) => c.assignedTeammateId === activeUser.id)
      : candidates;

  const overdueCount = scopedCandidates.filter(
    (c) => getCandidateAlertStatus(c).status === 'Overdue'
  ).length;

  const approachingCount = scopedCandidates.filter(
    (c) => getCandidateAlertStatus(c).status === 'Approaching'
  ).length;

  // Actions
  const handleSwitchUser = (user: UserProfile) => {
    StorageService.setActiveUser(user);
    setActiveUser(user);
    // If teammate and on admin-only tab, revert to dashboard
    if (user.role === 'TEAMMATE' && ['jobs', 'forms', 'team', 'reports'].includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  };

  const handleUpdateStage = (candidateId: string, stage: RecruitmentStage) => {
    StorageService.updateCandidate(candidateId, { stage });
  };

  const handleQuickToggleResume = (candidateId: string, status: ResumeStatus) => {
    StorageService.updateCandidate(candidateId, { resumeStatus: status });
  };

  const handleQuickToggleForm = (candidateId: string, status: CandidateFormStatus) => {
    StorageService.updateCandidate(candidateId, { candidateFormStatus: status });
  };

  const handleOpenEmailForCandidate = (cand: Candidate) => {
    setPreselectedEmailCandidateId(cand.id);
    setSelectedCandidate(null);
    setCurrentTab('emails');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userRole={activeUser.role}
        userName={activeUser.name}
        overdueCount={overdueCount}
        approachingCount={approachingCount}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          activeUser={activeUser}
          onSwitchUser={handleSwitchUser}
          teammates={teammates}
          candidates={candidates}
          onOpenAddModal={() => setIsAddCandidateOpen(true)}
          onOpenCsvModal={() => setIsCsvUploadOpen(true)}
          onSelectCandidate={(cand) => setSelectedCandidate(cand)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSettings={() => setCurrentTab('settings')}
        />

        {/* View Routing */}
        <main className="p-4 lg:p-8 flex-1 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              candidates={candidates}
              teammates={teammates}
              userRole={activeUser.role}
              currentUserId={activeUser.id}
              onSelectCandidate={(c) => setSelectedCandidate(c)}
              onUpdateStage={handleUpdateStage}
              onQuickToggleResume={handleQuickToggleResume}
              onQuickToggleForm={handleQuickToggleForm}
              onNavigateToEmails={() => setCurrentTab('emails')}
              onNavigateToCandidates={() => setCurrentTab('candidates')}
              searchQuery={searchQuery}
            />
          )}

          {currentTab === 'candidates' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeUser.role === 'ADMIN' ? 'All Candidates Database' : 'My Assigned Candidates'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeUser.role === 'ADMIN'
                      ? 'Comprehensive CRM table with real-time stage adjustments, document verification, and follow-up deadlines.'
                      : 'Focused recruitment pipeline showing candidates assigned specifically to you.'}
                  </p>
                </div>
                {activeUser.role === 'ADMIN' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCsvUploadOpen(true)}
                      className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Bulk CSV Upload
                    </button>
                    <button
                      onClick={() => setIsAddCandidateOpen(true)}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                    >
                      + Add Candidate
                    </button>
                  </div>
                )}
              </div>

              <CandidateTable
                candidates={candidates}
                teammates={teammates}
                userRole={activeUser.role}
                currentUserId={activeUser.id}
                onSelectCandidate={(c) => setSelectedCandidate(c)}
                onUpdateStage={handleUpdateStage}
                onQuickToggleResume={handleQuickToggleResume}
                onQuickToggleForm={handleQuickToggleForm}
                externalSearch={searchQuery}
              />
            </div>
          )}

          {currentTab === 'jobs' && (
            <JobOpeningsView
              jobOpenings={jobOpenings}
              candidates={candidates}
              userRole={activeUser.role}
              onJobOpeningsUpdated={setJobOpenings}
            />
          )}

          {currentTab === 'forms' && (
            <FormTemplatesView
              formTemplates={formTemplates}
              jobOpenings={jobOpenings}
              candidates={candidates}
              userRole={activeUser.role}
              onTemplatesUpdated={setFormTemplates}
            />
          )}

          {currentTab === 'team' && (
            <TeamManagementView
              teammates={teammates}
              candidates={candidates}
              userRole={activeUser.role}
              onTeammatesUpdated={setTeammates}
              onSelectCandidate={(c) => setSelectedCandidate(c)}
              onSwitchToTeammateView={(tm) => {
                handleSwitchUser({
                  id: tm.id,
                  name: tm.name,
                  email: tm.email,
                  role: 'TEAMMATE',
                  avatar: tm.avatar,
                  title: tm.title
                });
                setCurrentTab('candidates');
              }}
            />
          )}

          {currentTab === 'emails' && (
            <EmailTemplatesView
              emailTemplates={emailTemplates}
              candidates={scopedCandidates}
              userRole={activeUser.role}
              currentUserName={activeUser.name}
              onTemplatesUpdated={setEmailTemplates}
              preselectedCandidateId={preselectedEmailCandidateId}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView candidates={candidates} teammates={teammates} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              userRole={activeUser.role}
              onResetComplete={() => {
                setCandidates([...StorageService.getCandidates()]);
                setTeammates([...StorageService.getTeammates()]);
                setJobOpenings([...StorageService.getJobOpenings()]);
              }}
            />
          )}
        </main>
      </div>

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <CandidateProfileModal
          candidate={selectedCandidate}
          isOpen={true}
          onClose={() => setSelectedCandidate(null)}
          formTemplates={formTemplates}
          emailTemplates={emailTemplates}
          teammates={teammates}
          userRole={activeUser.role}
          currentUserId={activeUser.id}
          onCandidateUpdated={(updated) => setSelectedCandidate(updated)}
          onCandidateDeleted={() => setSelectedCandidate(null)}
          onOpenEmailModal={handleOpenEmailForCandidate}
        />
      )}

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        jobOpenings={jobOpenings}
        teammates={teammates}
        onCandidateAdded={(newCand) => {
          setSelectedCandidate(newCand);
        }}
      />

      {/* Bulk CSV Upload Modal */}
      <CsvUploadModal
        isOpen={isCsvUploadOpen}
        onClose={() => setIsCsvUploadOpen(false)}
        jobOpenings={jobOpenings}
        teammates={teammates}
        onImportComplete={() => {
          // Store updates automatically via subscription
        }}
      />
    </div>
  );
}
