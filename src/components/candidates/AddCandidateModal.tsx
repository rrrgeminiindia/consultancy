import React, { useState } from 'react';
import {
  Candidate,
  JobOpening,
  Teammate
} from '../../types';
import { StorageService } from '../../services/storage';
import {
  X,
  UserPlus,
  AlertTriangle,
  Check,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOpenings: JobOpening[];
  teammates: Teammate[];
  onCandidateAdded: (newCandidate: Candidate) => void;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  jobOpenings,
  teammates,
  onCandidateAdded
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [jobTitle, setJobTitle] = useState(jobOpenings[0]?.title || 'Senior Full Stack Engineer (React/Node)');
  const [jobLocation, setJobLocation] = useState(jobOpenings[0]?.location || 'Austin, TX (Hybrid)');
  const [totalItExperience, setTotalItExperience] = useState('5 years');
  const [relevantExperience, setRelevantExperience] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [workAuthorization, setWorkAuthorization] = useState('US Citizen');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('2 weeks');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [linkedInJobOpening, setLinkedInJobOpening] = useState('LinkedIn Post - Active Opening');
  const [assignedTeammateId, setAssignedTeammateId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Duplicate warning states
  const [duplicateWarning, setDuplicateWarning] = useState<Candidate | null>(null);
  const [allowDuplicateOverride, setAllowDuplicateOverride] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJobSelect = (title: string) => {
    setJobTitle(title);
    const matched = jobOpenings.find((j) => j.title === title);
    if (matched) {
      setJobLocation(matched.location);
      setLinkedInJobOpening(`LinkedIn Job - ${matched.title}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('A valid email address is required.');
      return;
    }
    if (!contactNumber.trim()) {
      setErrorMessage('Contact phone number is required.');
      return;
    }

    // Duplicate detection check
    const existingDuplicate = StorageService.checkDuplicate(email, linkedInJobOpening);
    if (existingDuplicate && !allowDuplicateOverride) {
      setDuplicateWarning(existingDuplicate);
      return;
    }

    const assignedTm = teammates.find((t) => t.id === assignedTeammateId);
    const nowIso = new Date().toISOString();

    const candidateData: Omit<
      Candidate,
      'id' | 'createdAt' | 'updatedAt' | 'stageHistory' | 'callLogs' | 'emailLogs'
    > = {
      fullName: fullName.trim(),
      email: email.trim(),
      contactNumber: contactNumber.trim(),
      jobTitle,
      jobLocation,
      totalItExperience,
      relevantExperience,
      currentLocation: currentLocation || jobLocation,
      workAuthorization,
      currentEmployer: currentEmployer || 'Independent / Not Provided',
      noticePeriod,
      applicationDate: new Date(applicationDate).toISOString(),
      linkedInJobOpening,
      assignedTeammateId: assignedTeammateId || null,
      assignedTeammateName: assignedTm ? assignedTm.name : null,
      assignmentDate: assignedTeammateId ? nowIso : null,
      stage: 'New Candidate', // All new candidates start in New Candidate stage
      resumeStatus: 'Pending',
      candidateFormStatus: 'Pending',
      identityVerificationStatus: 'Pending',
      lastContactDate: null,
      nextFollowUpDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      callPendingStartedAt: null,
      stageEnteredAt: nowIso,
      formResponses: {},
      notes: notes.trim()
    };

    const created = StorageService.addCandidate(candidateData);
    onCandidateAdded(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Add New Candidate</h3>
              <p className="text-xs text-slate-300">
                New candidate intake from LinkedIn opening. Starts in "New Candidate" stage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning Dialog if triggered */}
        {duplicateWarning && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="font-bold text-sm text-amber-950">
                  Duplicate Candidate Profile Detected!
                </p>
                <p>
                  A candidate record already exists with email <strong>{email}</strong> for opening{' '}
                  <strong>{linkedInJobOpening}</strong>:
                </p>
                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-[11px]">
                  <p className="font-semibold text-slate-800">
                    {duplicateWarning.fullName} — Currently in stage: {duplicateWarning.stage}
                  </p>
                  <p className="text-slate-500">
                    Applied on: {new Date(duplicateWarning.applicationDate).toLocaleDateString()}
                  </p>
                </div>
                <label className="flex items-center gap-2 mt-2 font-semibold text-amber-950 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={allowDuplicateOverride}
                    onChange={(e) => setAllowDuplicateOverride(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-amber-300 focus:ring-teal-500"
                  />
                  <span>
                    Admin Override: Allow intentional re-application / duplicate entry
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Contact Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span>Contact Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.lin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Number (Phone) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 (555) 987-6543"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dallas, TX"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Job & Application */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-teal-600" />
              <span>Job Opening & LinkedIn Intake</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Job Opening *
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                >
                  {jobOpenings.map((job) => (
                    <option key={job.id} value={job.title}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Job Location
                </label>
                <input
                  type="text"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  LinkedIn Job Reference / Source
                </label>
                <input
                  type="text"
                  value={linkedInJobOpening}
                  onChange={(e) => setLinkedInJobOpening(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Application Date
                </label>
                <input
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Professional Experience & Authorization */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-600" />
              <span>Experience & Employment</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total IT Experience *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6.5 years"
                  value={totalItExperience}
                  onChange={(e) => setTotalItExperience(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Work Authorization / Visa *
                </label>
                <select
                  value={workAuthorization}
                  onChange={(e) => setWorkAuthorization(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="US Citizen">US Citizen</option>
                  <option value="Permanent Resident (Green Card)">Permanent Resident (Green Card)</option>
                  <option value="H1B Visa (Transfer needed)">H1B Visa (Transfer needed)</option>
                  <option value="H1B (Direct)">H1B (Direct)</option>
                  <option value="OPT / CPT">OPT / CPT</option>
                  <option value="TN Visa">TN Visa</option>
                  <option value="Other Work Authorization">Other Work Authorization</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Employer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cognizant / TCS / Freelance"
                  value={currentEmployer}
                  onChange={(e) => setCurrentEmployer(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notice Period
                </label>
                <select
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="30 days">30 days</option>
                  <option value="60 days">60 days</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Relevant Experience Highlights
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 yrs React, TypeScript, Node, AWS, PostgreSQL"
                  value={relevantExperience}
                  onChange={(e) => setRelevantExperience(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Assignment & Initial Notes */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Teammate Assignment & Notes</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assign to Teammate (Optional)
                </label>
                <select
                  value={assignedTeammateId}
                  onChange={(e) => setAssignedTeammateId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">Unassigned (Assign later)</option>
                  {teammates.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} ({tm.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Starting Stage
                </label>
                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>New Candidate (Default)</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Intake Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Initial recruiter observations from LinkedIn profile or message..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shadow-teal-700/20 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Candidate Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
