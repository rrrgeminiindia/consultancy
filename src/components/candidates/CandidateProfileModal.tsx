import React, { useState, useEffect } from 'react';
import {
  Candidate,
  CandidateFormTemplate,
  EmailTemplate,
  JobOpening,
  RecruitmentStage,
  ResumeStatus,
  CandidateFormStatus,
  IdentityVerificationStatus,
  Teammate,
  UserRole,
  CallOutcome
} from '../../types';
import {
  getCandidateAlertStatus,
  formatDate,
  formatDateTime,
  formatTimeInStage,
  getMissingFormFields,
  areDocumentsComplete,
  interpolateEmail
} from '../../utils/helpers';
import { StorageService } from '../../services/storage';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  Building,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  FileCheck,
  UserCheck,
  MessageSquare,
  History,
  Trash2,
  Edit,
  Save,
  Plus,
  Send,
  AlertCircle
} from 'lucide-react';

interface CandidateProfileModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  formTemplates: CandidateFormTemplate[];
  emailTemplates: EmailTemplate[];
  jobOpenings?: JobOpening[];
  teammates: Teammate[];
  userRole: UserRole;
  currentUserId: string;
  currentUserName?: string;
  onCandidateUpdated: (updated: Candidate) => void;
  onCandidateDeleted: (id: string) => void;
  onOpenEmailModal?: (candidate: Candidate) => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  candidate,
  isOpen,
  onClose,
  formTemplates,
  emailTemplates,
  jobOpenings = [],
  teammates,
  userRole,
  currentUserId,
  currentUserName = 'Alex Mercer',
  onCandidateUpdated,
  onCandidateDeleted,
  onOpenEmailModal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'calls' | 'emails' | 'history'>('overview');

  // Edit details mode
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...candidate });

  // Form response editor state
  const [isEditingFormResponses, setIsEditingFormResponses] = useState(false);
  const [formResponsesDraft, setFormResponsesDraft] = useState<Record<string, string>>({
    ...(candidate.formResponses || {})
  });

  // Call logging form state
  const [showCallForm, setShowCallForm] = useState(false);
  const [callDate, setCallDate] = useState(new Date().toISOString().split('T')[0]);
  const [callTime, setCallTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [callDuration, setCallDuration] = useState(15);
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Completed');
  const [callNotes, setCallNotes] = useState('');
  const [markCompletedOnLog, setMarkCompletedOnLog] = useState(true);

  // Manual Email Record logging
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [selectedEmailTplId, setSelectedEmailTplId] = useState(emailTemplates[0]?.id || '');
  const [manualEmailSubject, setManualEmailSubject] = useState('');
  const [manualEmailDate, setManualEmailDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualEmailNotes, setManualEmailNotes] = useState('');

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync draft states whenever candidate changes or modal reopens
  useEffect(() => {
    setEditFormData({ ...candidate });
    setFormResponsesDraft({ ...(candidate.formResponses || {}) });
    setIsEditing(false);
    setIsEditingFormResponses(false);
    setConfirmDelete(false);
    setShowCallForm(false);
    setShowEmailForm(false);
    const firstTpl = emailTemplates[0];
    if (firstTpl) {
      setSelectedEmailTplId(firstTpl.id);
      setManualEmailSubject(interpolateEmail(firstTpl.subject, candidate, currentUserName));
    }
    setManualEmailDate(new Date().toISOString().split('T')[0]);
    setManualEmailNotes('');
  }, [candidate.id, isOpen]);

  useEffect(() => {
    if (!isEditing) {
      setEditFormData({ ...candidate });
    }
    if (!isEditingFormResponses) {
      setFormResponsesDraft({ ...(candidate.formResponses || {}) });
    }
  }, [candidate, isEditing, isEditingFormResponses]);

  if (!isOpen) return null;

  const alert = getCandidateAlertStatus(candidate);
  const matchedJob = jobOpenings.find((j) => j.title === candidate.jobTitle);
  const matchedTemplate =
    formTemplates.find(
      (t) =>
        (matchedJob && (t.id === matchedJob.formTemplateId || t.jobOpeningId === matchedJob.id)) ||
        t.jobOpeningId === candidate.linkedInJobOpening
    ) || formTemplates[0];

  const missingFieldsData = getMissingFormFields(candidate, matchedTemplate);
  const docsComplete = areDocumentsComplete(candidate);

  const stages: RecruitmentStage[] =
    userRole === 'ADMIN'
      ? [
          'New Candidate',
          'Initial Email Sent',
          'Documents Pending',
          'Documents Received',
          'Ready for Teammate Call',
          'Call Pending',
          'Call Completed',
          'Withdrawn',
          'Closed'
        ]
      : ['Ready for Teammate Call', 'Call Pending', 'Call Completed'];

  const handleStageChange = (newStage: RecruitmentStage) => {
    const updated = StorageService.updateCandidate(candidate.id, { stage: newStage });
    if (updated) onCandidateUpdated(updated);
  };

  const handleTeammateAssign = (teammateId: string) => {
    const tm = teammates.find((t) => t.id === teammateId);
    const updated = StorageService.updateCandidate(
      candidate.id,
      {
        assignedTeammateId: teammateId || null,
        assignedTeammateName: tm ? tm.name : null,
        assignmentDate: teammateId ? new Date().toISOString() : null
      },
      `Assigned to ${tm ? tm.name : 'Unassigned'}`
    );
    if (updated) onCandidateUpdated(updated);
  };

  const handleDocumentStatusToggle = (
    docType: 'resume' | 'form' | 'identity',
    newStatus: any
  ) => {
    const updates: Partial<Candidate> = {};
    if (docType === 'resume') updates.resumeStatus = newStatus;
    if (docType === 'form') updates.candidateFormStatus = newStatus;
    if (docType === 'identity') updates.identityVerificationStatus = newStatus;

    // Auto-progress to Documents Received if both resume & form become Received!
    const updatedResume = docType === 'resume' ? newStatus : candidate.resumeStatus;
    const updatedForm = docType === 'form' ? newStatus : candidate.candidateFormStatus;
    if (updatedResume === 'Received' && updatedForm === 'Received' && candidate.stage === 'Documents Pending') {
      updates.stage = 'Documents Received';
    }

    const updated = StorageService.updateCandidate(
      candidate.id,
      updates,
      `Document status updated: ${docType} set to ${newStatus}`
    );
    if (updated) onCandidateUpdated(updated);
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.updateCandidate(candidate.id, editFormData, 'Updated candidate profile details');
    if (updated) {
      onCandidateUpdated(updated);
      setIsEditing(false);
    }
  };

  const handleRecordCall = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.addCallLog(candidate.id, {
      callDate,
      callTime,
      durationMinutes: callDuration,
      outcome: callOutcome,
      notes: callNotes,
      markCompleted: markCompletedOnLog
    });
    if (updated) {
      onCandidateUpdated(updated);
      setShowCallForm(false);
      setCallNotes('');
    }
  };

  const handleRecordEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const tpl = emailTemplates.find((t) => t.id === selectedEmailTplId);
    const interpolatedBody = tpl ? interpolateEmail(tpl.body, candidate, currentUserName) : 'Email logged manually';
    const updated = StorageService.addEmailLog(candidate.id, {
      templateId: selectedEmailTplId,
      templateTitle: tpl ? tpl.title : 'Manual Recruiter Email',
      recipientEmail: candidate.email,
      subject: manualEmailSubject,
      content: manualEmailNotes.trim() || interpolatedBody,
      sentAt: manualEmailDate ? new Date(`${manualEmailDate}T12:00:00`).toISOString() : undefined
    });
    if (updated) {
      onCandidateUpdated(updated);
      setShowEmailForm(false);
      setManualEmailNotes('');
    }
  };

  const handleSaveFormResponses = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.updateCandidate(
      candidate.id,
      { formResponses: formResponsesDraft },
      'Updated candidate form field responses'
    );
    if (updated) {
      onCandidateUpdated(updated);
      setIsEditingFormResponses(false);
    }
  };

  const handleDelete = () => {
    if (StorageService.deleteCandidate(candidate.id)) {
      onCandidateDeleted(candidate.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-lg">
              {candidate.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{candidate.fullName}</h3>
                {alert.status === 'Overdue' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {alert.badgeText}
                  </span>
                )}
                {alert.status === 'Approaching' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {alert.badgeText}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {candidate.jobTitle} • {candidate.jobLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Info'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Stage Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 uppercase text-[10px]">Current Stage:</span>
            <select
              value={candidate.stage}
              onChange={(e) => handleStageChange(e.target.value as RecruitmentStage)}
              disabled={
                userRole === 'TEAMMATE' &&
                !['Ready for Teammate Call', 'Call Pending', 'Call Completed'].includes(candidate.stage)
              }
              className="bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs px-2.5 py-1 focus:outline-none focus:border-teal-500 shadow-2xs disabled:opacity-60"
            >
              {!stages.includes(candidate.stage) && (
                <option value={candidate.stage}>{candidate.stage}</option>
              )}
              {stages.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
            <span className="text-slate-400 text-[11px]">
              (in stage for {formatTimeInStage(candidate.stageEnteredAt)})
            </span>
          </div>

          {/* Teammate Assignment */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 uppercase text-[10px]">Assigned Teammate:</span>
            {userRole === 'ADMIN' ? (
              <select
                value={candidate.assignedTeammateId || ''}
                onChange={(e) => handleTeammateAssign(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-xs px-2.5 py-1 focus:outline-none focus:border-teal-500 shadow-2xs"
              >
                <option value="">Unassigned</option>
                {teammates.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-slate-800">
                {candidate.assignedTeammateName || 'Unassigned'}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-slate-200 bg-white overflow-x-auto whitespace-nowrap shrink-0">
          {[
            { id: 'overview', label: 'Candidate Details', icon: User },
            { id: 'documents', label: 'Document Checklist', icon: FileCheck },
            { id: 'calls', label: `Call Notes (${candidate.callLogs?.length || 0})`, icon: Phone },
            { id: 'emails', label: `Email History (${candidate.emailLogs?.length || 0})`, icon: Mail },
            { id: 'history', label: 'Timeline & History', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
                  isActive
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW & DETAILS */}
          {activeTab === 'overview' && (
            <>
              {isEditing ? (
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={editFormData.contactNumber}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, contactNumber: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Current Location</label>
                      <input
                        type="text"
                        value={editFormData.currentLocation}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, currentLocation: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Total IT Experience</label>
                      <input
                        type="text"
                        value={editFormData.totalItExperience}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, totalItExperience: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Work Authorization</label>
                      <input
                        type="text"
                        value={editFormData.workAuthorization}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, workAuthorization: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Current Employer</label>
                      <input
                        type="text"
                        value={editFormData.currentEmployer}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, currentEmployer: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Notice Period</label>
                      <input
                        type="text"
                        value={editFormData.noticePeriod}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, noticePeriod: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                      {jobOpenings.length > 0 ? (
                        <select
                          value={editFormData.jobTitle}
                          onChange={(e) => {
                            const matched = jobOpenings.find((j) => j.title === e.target.value);
                            setEditFormData({
                              ...editFormData,
                              jobTitle: e.target.value,
                              jobLocation: matched ? matched.location : editFormData.jobLocation
                            });
                          }}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                        >
                          {!jobOpenings.some((j) => j.title === editFormData.jobTitle) && (
                            <option value={editFormData.jobTitle}>{editFormData.jobTitle}</option>
                          )}
                          {jobOpenings.map((j) => (
                            <option key={j.id} value={j.title}>
                              {j.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={editFormData.jobTitle}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, jobTitle: e.target.value })
                          }
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Job Location</label>
                      <input
                        type="text"
                        value={editFormData.jobLocation}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, jobLocation: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">LinkedIn Job Opening</label>
                      <input
                        type="text"
                        value={editFormData.linkedInJobOpening}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, linkedInJobOpening: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Application Date</label>
                      <input
                        type="date"
                        value={editFormData.applicationDate ? editFormData.applicationDate.split('T')[0] : ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            applicationDate: e.target.value ? new Date(e.target.value).toISOString() : editFormData.applicationDate
                          })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Next Follow-Up Date</label>
                      <input
                        type="date"
                        value={editFormData.nextFollowUpDate ? editFormData.nextFollowUpDate.split('T')[0] : ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            nextFollowUpDate: e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : null
                          })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Relevant Experience</label>
                      <input
                        type="text"
                        value={editFormData.relevantExperience}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, relevantExperience: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Recruiter Notes</label>
                      <textarea
                        rows={3}
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 border rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Contact & Employment */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      <span>Contact & Identification</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-medium text-slate-800">{candidate.email}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-mono font-medium text-slate-800">{candidate.contactNumber}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Current City:</span>
                        <span className="font-medium text-slate-800">{candidate.currentLocation}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Work Authorization:</span>
                        <span className="font-semibold text-slate-800">{candidate.workAuthorization}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Application Date:</span>
                        <span className="font-medium text-slate-800">{formatDate(candidate.applicationDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: IT Experience & Role */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-teal-600" />
                      <span>Professional Background</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Total IT Experience:</span>
                        <span className="font-bold text-teal-800">{candidate.totalItExperience}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Current Employer:</span>
                        <span className="font-medium text-slate-800">{candidate.currentEmployer}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Notice Period:</span>
                        <span className="font-medium text-slate-800">{candidate.noticePeriod}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">LinkedIn Source:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[180px]">
                          {candidate.linkedInJobOpening}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Last Contact:</span>
                        <span className="font-medium text-slate-800">{formatDateTime(candidate.lastContactDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Relevant highlights */}
                  <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase">
                      Relevant Technical Experience Highlights:
                    </span>
                    <p className="text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {candidate.relevantExperience || 'No specific highlights entered yet.'}
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase">
                      Recruitment Process Notes:
                    </span>
                    <p className="text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {candidate.notes || 'No internal notes recorded.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: DOCUMENT CHECKLIST & MISSING FIELDS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Resume Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">1. Resume (PDF/Word)</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          candidate.resumeStatus === 'Received'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {candidate.resumeStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Required for technical evaluation and teammate screening.
                    </p>
                  </div>
                  {userRole === 'ADMIN' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() =>
                          handleDocumentStatusToggle(
                            'resume',
                            candidate.resumeStatus === 'Received' ? 'Pending' : 'Received'
                          )
                        }
                        className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 transition-colors"
                      >
                        Set as {candidate.resumeStatus === 'Received' ? 'Pending' : 'Received'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Candidate Information Form Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">2. Candidate Info Form</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          candidate.candidateFormStatus === 'Received'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {candidate.candidateFormStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Questionnaire: notice period, work authorization, interview availability.
                    </p>
                  </div>
                  {userRole === 'ADMIN' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() =>
                          handleDocumentStatusToggle(
                            'form',
                            candidate.candidateFormStatus === 'Received' ? 'Pending' : 'Received'
                          )
                        }
                        className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 transition-colors"
                      >
                        Set as {candidate.candidateFormStatus === 'Received' ? 'Pending' : 'Received'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Identity Verification Status (Non-blocking) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">3. Identity Verification</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          candidate.identityVerificationStatus === 'Verified'
                            ? 'bg-teal-100 text-teal-800'
                            : candidate.identityVerificationStatus === 'Not Required'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {candidate.identityVerificationStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1">
                      Audit verification status (non-blocking). Never stores national ID or passport numbers.
                    </p>
                  </div>
                  {userRole === 'ADMIN' && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleDocumentStatusToggle('identity', 'Verified')}
                        className="flex-1 py-1 text-[11px] bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-teal-700"
                      >
                        Verified
                      </button>
                      <button
                        onClick={() => handleDocumentStatusToggle('identity', 'Pending')}
                        className="flex-1 py-1 text-[11px] bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-amber-700"
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleDocumentStatusToggle('identity', 'Not Required')}
                        className="flex-1 py-1 text-[11px] bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-slate-600"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document completeness banner */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  docsComplete
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <span className="font-semibold">
                  {docsComplete
                    ? 'Mandatory documents (Resume & Candidate Form) are complete — ready for teammate call!'
                    : 'Mandatory documents pending: Resume and Candidate Information Form are required before call.'}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/80">
                  Identity Non-Blocking
                </span>
              </div>

              {/* Missing Fields Breakdown & Editable Responses */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Candidate Information Form Field Completion
                    </h4>
                    <p className="text-xs text-slate-500">
                      Template: <strong>{matchedTemplate?.title || 'Standard IT Form'}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {missingFieldsData.completedCount} / {missingFieldsData.totalCount} Fields Complete
                    </span>
                    {userRole === 'ADMIN' && matchedTemplate && (
                      <button
                        type="button"
                        onClick={() => setIsEditingFormResponses(!isEditingFormResponses)}
                        className="px-3 py-1 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        {isEditingFormResponses ? 'Cancel' : 'Edit Form Fields'}
                      </button>
                    )}
                  </div>
                </div>

                {missingFieldsData.missingRequired.length > 0 ? (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900 block mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Missing Required Fields ({missingFieldsData.missingRequired.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {missingFieldsData.missingRequired.map((fName) => (
                        <span
                          key={fName}
                          className="px-2 py-0.5 bg-white border border-amber-300 text-amber-800 rounded font-medium text-[11px]"
                        >
                          {fName}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All mandatory fields for this job opening have been completed!</span>
                  </div>
                )}

                {missingFieldsData.missingOptional.length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold">Optional fields not filled:</span>{' '}
                    {missingFieldsData.missingOptional.join(', ')}
                  </div>
                )}

                {isEditingFormResponses && matchedTemplate && (
                  <form onSubmit={handleSaveFormResponses} className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {matchedTemplate.fields.map((field) => (
                        <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={formResponsesDraft[field.name] || ''}
                              onChange={(e) =>
                                setFormResponsesDraft({
                                  ...formResponsesDraft,
                                  [field.name]: e.target.value
                                })
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                            >
                              <option value="">-- Not Provided --</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              placeholder={field.placeholder || ''}
                              value={formResponsesDraft[field.name] || ''}
                              onChange={(e) =>
                                setFormResponsesDraft({
                                  ...formResponsesDraft,
                                  [field.name]: e.target.value
                                })
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                            />
                          ) : (
                            <input
                              type={field.type}
                              placeholder={field.placeholder || ''}
                              value={formResponsesDraft[field.name] || ''}
                              onChange={(e) =>
                                setFormResponsesDraft({
                                  ...formResponsesDraft,
                                  [field.name]: e.target.value
                                })
                              }
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingFormResponses(false)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                      >
                        Save Form Responses
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CALL NOTES & LOGGING */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Teammate Call Logs</h4>
                  <p className="text-xs text-slate-500">
                    Record call attempts, outreach duration, candidate ratings, and outcome notes.
                  </p>
                </div>
                <button
                  onClick={() => setShowCallForm(!showCallForm)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCallForm ? 'Hide Form' : 'Log New Call'}</span>
                </button>
              </div>

              {/* Call logging form */}
              {showCallForm && (
                <form
                  onSubmit={handleRecordCall}
                  className="bg-slate-50 p-4 rounded-xl border border-teal-200 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Call Date</label>
                      <input
                        type="date"
                        required
                        value={callDate}
                        onChange={(e) => setCallDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Call Time</label>
                      <input
                        type="time"
                        required
                        value={callTime}
                        onChange={(e) => setCallTime(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={callDuration}
                        onChange={(e) => setCallDuration(parseInt(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Call Outcome</label>
                    <select
                      value={callOutcome}
                      onChange={(e) => {
                        const nextOutcome = e.target.value as CallOutcome;
                        setCallOutcome(nextOutcome);
                        setMarkCompletedOnLog(nextOutcome === 'Completed');
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Completed">Completed (Successful Screening)</option>
                      <option value="Connected">Connected (Brief Chat / In Progress)</option>
                      <option value="Left Voicemail">Left Voicemail</option>
                      <option value="No Answer / Busy">No Answer / Busy</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Unreachable">Unreachable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Call Notes & Technical Evaluation
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Candidate communication skills, salary expectations, tech stack alignment, and next steps..."
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={markCompletedOnLog}
                        onChange={(e) => setMarkCompletedOnLog(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <span>Mark candidate stage as "Call Completed"</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCallForm(false)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs"
                      >
                        Save Call Log
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Call log history list */}
              <div className="space-y-2.5">
                {candidate.callLogs?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Phone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No calls logged yet</p>
                    <p className="text-slate-400">
                      Click "Log New Call" to record outreach attempts and conversation notes.
                    </p>
                  </div>
                ) : (
                  candidate.callLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.outcome === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {log.outcome}
                          </span>
                          <span className="font-semibold text-slate-900">
                            Logged by {log.teammateName}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {log.callDate} at {log.callTime} ({log.durationMinutes} mins)
                        </span>
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {log.notes}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EMAIL COMMUNICATION HISTORY */}
          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Email History & Records</h4>
                  <p className="text-xs text-slate-500">
                    Audit log of outreach emails, reminders, and notifications sent to this candidate.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenEmailModal && onOpenEmailModal(candidate)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Generate & Copy Email</span>
                  </button>
                  <button
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    {showEmailForm ? 'Cancel' : 'Record Sent Email'}
                  </button>
                </div>
              </div>

              {/* Manual Email Log Form */}
              {showEmailForm && (
                <form
                  onSubmit={handleRecordEmail}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Type / Template Used
                      </label>
                      <select
                        value={selectedEmailTplId}
                        onChange={(e) => {
                          setSelectedEmailTplId(e.target.value);
                          const t = emailTemplates.find((x) => x.id === e.target.value);
                          if (t) setManualEmailSubject(interpolateEmail(t.subject, candidate, currentUserName));
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        {emailTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sent Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={manualEmailDate}
                        onChange={(e) => setManualEmailDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={manualEmailSubject}
                        onChange={(e) => setManualEmailSubject(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Message Content / Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Summary of what was sent..."
                      value={manualEmailNotes}
                      onChange={(e) => setManualEmailNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="px-3 py-1.5 border rounded-lg text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                    >
                      Record in History
                    </button>
                  </div>
                </form>
              )}

              {/* Email List */}
              <div className="space-y-2.5">
                {candidate.emailLogs?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No emails recorded</p>
                    <p className="text-slate-400">
                      Use "Generate & Copy Email" to pick a template, copy with candidate placeholders, and log it.
                    </p>
                  </div>
                ) : (
                  candidate.emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.templateTitle}</span>
                        <span className="text-slate-400 text-[11px]">
                          {formatDateTime(log.sentAt)} by {log.sentBy}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">To: {log.recipientEmail}</p>
                      <p className="font-semibold text-slate-800">{log.subject}</p>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] whitespace-pre-line">
                        {log.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TIMELINE & STAGE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Recruitment Stage Activity Timeline</h4>
                <p className="text-xs text-slate-500">
                  Chronological log of stage transitions, status updates, and timestamps.
                </p>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {candidate.stageHistory?.map((item, idx) => (
                  <div key={idx} className="relative group text-xs">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{item.stage}</span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(item.enteredAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Updated by: {item.updatedBy}</p>
                      {item.notes && <p className="text-slate-700 pt-1 text-[11px]">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          {/* Admin delete candidate button with confirmation */}
          {userRole === 'ADMIN' ? (
            confirmDelete ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-rose-900">
                <span className="font-semibold">Confirm delete permanently?</span>
                <button
                  onClick={handleDelete}
                  className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 border border-slate-300 rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 p-1 hover:bg-rose-50 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Candidate</span>
              </button>
            )
          ) : (
            <span className="text-slate-400 italic">Teammate Mode</span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
