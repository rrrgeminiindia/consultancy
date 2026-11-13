import React, { useState, useEffect } from 'react';
import { Candidate, EmailTemplate, UserRole } from '../../types';
import { interpolateEmail } from '../../utils/helpers';
import { StorageService } from '../../services/storage';
import {
  Mail,
  Copy,
  Check,
  Edit2,
  Save,
  Send,
  User,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface EmailTemplatesViewProps {
  emailTemplates: EmailTemplate[];
  candidates: Candidate[];
  userRole: UserRole;
  currentUserName: string;
  onTemplatesUpdated: (templates: EmailTemplate[]) => void;
  onLogEmailSent?: (candidateId: string, template: EmailTemplate, subject: string, body: string) => void;
  preselectedCandidateId?: string;
}

export const EmailTemplatesView: React.FC<EmailTemplatesViewProps> = ({
  emailTemplates,
  candidates,
  userRole,
  currentUserName,
  onTemplatesUpdated,
  onLogEmailSent,
  preselectedCandidateId
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    emailTemplates[0]?.id || ''
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    preselectedCandidateId || candidates[0]?.id || ''
  );

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loggedCandidateFeedback, setLoggedCandidateFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedCandidateId && candidates.some((c) => c.id === preselectedCandidateId)) {
      setSelectedCandidateId(preselectedCandidateId);
    } else if (!candidates.some((c) => c.id === selectedCandidateId)) {
      setSelectedCandidateId(candidates[0]?.id || '');
    }
  }, [preselectedCandidateId, candidates, selectedCandidateId]);

  const activeTemplate =
    emailTemplates.find((t) => t.id === selectedTemplateId) || emailTemplates[0];
  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId);

  const startEditing = () => {
    if (!activeTemplate) return;
    setEditSubject(activeTemplate.subject);
    setEditBody(activeTemplate.body);
    setIsEditing(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) return;

    const updated = StorageService.updateEmailTemplate(activeTemplate.id, {
      subject: editSubject,
      body: editBody
    });

    if (updated) {
      onTemplatesUpdated(StorageService.getEmailTemplates());
      setIsEditing(false);
    }
  };

  const handleCopyClipboard = async (textToCopy: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const handleLogSent = () => {
    if (!activeCandidate || !activeTemplate) return;
    const interpolatedSubject = interpolateEmail(activeTemplate.subject, activeCandidate, currentUserName);
    const interpolatedBody = interpolateEmail(activeTemplate.body, activeCandidate, currentUserName);

    StorageService.addEmailLog(activeCandidate.id, {
      templateId: activeTemplate.id,
      templateTitle: activeTemplate.title,
      recipientEmail: activeCandidate.email,
      subject: interpolatedSubject,
      content: interpolatedBody
    });

    setLoggedCandidateFeedback(`Logged outreach to ${activeCandidate.fullName} in CRM history!`);
    setTimeout(() => setLoggedCandidateFeedback(null), 3500);
  };

  if (!activeTemplate) return null;

  const previewSubject = interpolateEmail(activeTemplate.subject, activeCandidate, currentUserName);
  const previewBody = interpolateEmail(activeTemplate.body, activeCandidate, currentUserName);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
              Recruitment Follow-Up Assistant
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Email Templates & Message Generator</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Standardized recruiter communication for all 7 hiring stages. Dynamic placeholder replacement for{' '}
            <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono text-[11px]">[Candidate Name]</code>,{' '}
            <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono text-[11px]">[Job Title]</code>,{' '}
            <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono text-[11px]">[Location]</code>, and{' '}
            <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono text-[11px]">[Teammate Name]</code>.
            Copy directly to clipboard to send via your preferred email client.
          </p>
        </div>

        {loggedCandidateFeedback && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{loggedCandidateFeedback}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Template Selector List (A to G) */}
        <div className="lg:col-span-5 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Standard Follow-Up Templates (7)
          </h3>

          <div className="space-y-2">
            {emailTemplates.map((tpl) => {
              const isSelected = tpl.id === activeTemplate.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplateId(tpl.id);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-teal-500/30'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-teal-400 text-slate-950 font-black'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tpl.key}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate">{tpl.title}</p>
                      <p
                        className={`text-[11px] mt-0.5 line-clamp-1 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {tpl.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-teal-400' : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        isSelected
                          ? 'bg-slate-800 text-teal-300 border border-slate-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Target: {tpl.recommendedStage}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Live Preview, Candidate Tester, Editor & Copy Action */}
        <div className="lg:col-span-7 space-y-4">
          {/* Candidate Context Picker for live interpolation */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-slate-700">Preview with Candidate:</span>
            </div>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              disabled={candidates.length === 0}
              className="bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500 max-w-xs w-full sm:w-auto"
            >
              {candidates.length === 0 ? (
                <option value="">No assigned candidates available</option>
              ) : (
                candidates.map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    {cand.fullName} ({cand.jobTitle})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Template Card Preview or Edit */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{activeTemplate.title}</h4>
                <p className="text-xs text-slate-500">{activeTemplate.description}</p>
              </div>

              {userRole === 'ADMIN' && (
                <button
                  onClick={() => (isEditing ? setIsEditing(false) : startEditing())}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-white text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Template'}</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveTemplate} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subject Line (Placeholders supported)
                  </label>
                  <input
                    type="text"
                    required
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Message Body (Placeholders: [Candidate Name], [Job Title], [Location], [Teammate Name], [Recruiter Name])
                  </label>
                  <textarea
                    rows={12}
                    required
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono leading-relaxed focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Template</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-4">
                {/* Subject Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Subject Line Preview
                    </span>
                    <button
                      onClick={() => handleCopyClipboard(previewSubject, 'subject')}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                    >
                      {copiedKey === 'subject' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Subject Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Subject</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900">
                    {previewSubject}
                  </div>
                </div>

                {/* Body Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Message Body Preview
                    </span>
                    <button
                      onClick={() => handleCopyClipboard(previewBody, 'body')}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                    >
                      {copiedKey === 'body' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Body Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Body</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans min-h-[220px]">
                    {previewBody}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopyClipboard(
                          `Subject: ${previewSubject}\n\n${previewBody}`,
                          'all'
                        )
                      }
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      {copiedKey === 'all' ? (
                        <>
                          <Check className="w-4 h-4 text-teal-400" />
                          <span>Copied All to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Full Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  {activeCandidate && (
                    <button
                      onClick={handleLogSent}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs shadow-teal-700/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Log as Sent in {activeCandidate.fullName.split(' ')[0]}'s History</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
