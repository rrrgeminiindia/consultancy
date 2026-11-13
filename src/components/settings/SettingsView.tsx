import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { FirebaseService } from '../../services/firebase';
import { UserRole } from '../../types';
import {
  Settings,
  Database,
  ShieldCheck,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code2,
  Lock,
  Layers
} from 'lucide-react';

interface SettingsViewProps {
  userRole: UserRole;
  onResetComplete: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userRole, onResetComplete }) => {
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'firebase' | 'data' | 'security'>('firebase');

  const fbStatus = FirebaseService.getStatus();

  const handleReset = () => {
    StorageService.resetToSampleData();
    setErrorFeedback(null);
    setResetFeedback('Reset complete! All 8 scenario candidate records restored.');
    setResetConfirm(false);
    onResetComplete();
    setTimeout(() => setResetFeedback(null), 3500);
  };

  const handleExportBackup = () => {
    const data = {
      candidates: StorageService.getCandidates(),
      teammates: StorageService.getTeammates(),
      jobOpenings: StorageService.getJobOpenings(),
      formTemplates: StorageService.getFormTemplates(),
      emailTemplates: StorageService.getEmailTemplates(),
      exportedAt: new Date().toISOString()
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `CandidateFlow_Backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorFeedback(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.candidates && Array.isArray(parsed.candidates)) {
          StorageService.saveCandidates(parsed.candidates);
        }
        if (parsed.teammates && Array.isArray(parsed.teammates)) {
          StorageService.saveTeammates(parsed.teammates);
        }
        if (parsed.jobOpenings && Array.isArray(parsed.jobOpenings)) {
          StorageService.saveJobOpenings(parsed.jobOpenings);
        }
        if (parsed.formTemplates && Array.isArray(parsed.formTemplates)) {
          StorageService.saveFormTemplates(parsed.formTemplates);
        }
        if (parsed.emailTemplates && Array.isArray(parsed.emailTemplates)) {
          StorageService.saveEmailTemplates(parsed.emailTemplates);
        }
        setResetFeedback('Backup data imported successfully!');
        onResetComplete();
        setTimeout(() => setResetFeedback(null), 3500);
      } catch {
        setErrorFeedback('Invalid JSON backup file. Please export a fresh CandidateFlow backup and try again.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
            System Architecture & Configuration
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Settings & Backend Integration</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          Review active browser storage behavior, required Firebase Authentication & Firestore setup steps, and sample dataset tools.
        </p>

        {resetFeedback && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetFeedback}</span>
          </div>
        )}

        {errorFeedback && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorFeedback}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('firebase')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'firebase'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Storage & Firebase Status
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Security Rules (Draft)
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'data'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sample Data & Backup
        </button>
      </div>

      {/* TAB 1: FIREBASE GUIDE */}
      {activeTab === 'firebase' && (
        <div className="space-y-5">
          {/* Connection Status Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Active Storage Mode</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    {fbStatus.isConfigured ? 'Firebase Config Detected' : 'Local Browser Storage Only'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  All candidates, teammates, jobs, forms, and email templates currently save to{' '}
                  <strong>localStorage</strong> in this browser. The header role switcher is a UI preview only — real teammate logins, shared multi-user data, and backend access rules are <strong>not active</strong> until Firebase is provisioned and wired.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="p-2 bg-amber-50 text-amber-900 rounded-lg font-semibold flex items-center gap-1.5 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Single-Browser Mode (Firebase Not Connected)</span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Guide for Non-Programmer User */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Step-by-Step Firebase Authentication & Firestore Setup Guide</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              As requested in your brief, real security cannot rely solely on the frontend browser interface.
              Here is how CandidateFlow connects to Firebase Firestore so permissions are strictly enforced on Google's cloud servers:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-bold text-slate-900">Create Firebase Project</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-teal-700 underline font-semibold">console.firebase.google.com</a>, click "Add Project", and name it <code>candidateflow</code>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-bold text-slate-900">Enable Firestore & Google Auth</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  In the Firebase left sidebar, click <strong>Build &gt; Firestore Database</strong> (click Create database in Production Mode). Then go to <strong>Authentication &gt; Sign-in method</strong> and enable <strong>Google</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-bold text-slate-900">Deploy Security Rules</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Copy the hardened rules from the <strong>Security Rules</strong> tab and paste into the Firebase Rules tab. This ensures Teammates can never read candidates assigned to others!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY RULES (RBAC) */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Lock className="w-4 h-4 text-teal-600" />
              <span>Production Firestore Security Rules (Attribute-Based Access Control)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Hardened ABAC
            </span>
          </div>

          <p className="text-slate-600 leading-relaxed">
            These rules are stored in <code>firestore.rules</code> and enforce mathematical isolation at the database level:
          </p>

          <pre className="p-4 bg-slate-900 text-teal-300 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Default deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isAdmin() { 
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid)); 
    }

    // Candidates: Teammate can ONLY read candidates assigned to them
    match /candidates/{candidateId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.assignedTeammateId == request.auth.uid);
      allow create: if isAdmin();
      allow delete: if isAdmin();
      allow update: if isAdmin() || (
        isSignedIn() && 
        resource.data.assignedTeammateId == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stage', 'callLogs', 'lastContactDate', 'notes', 'updatedAt'])
      );
    }
  }
}`}
          </pre>
        </div>
      )}

      {/* TAB 3: DATA RESET & BACKUP */}
      {activeTab === 'data' && (
        <div className="space-y-5">
          {/* Reset Demo Data */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-xl">
                <h4 className="text-sm font-bold text-slate-900">Reset Demo & Sample Data</h4>
                <p className="text-slate-500 mt-0.5">
                  Restores the full suite of fictional test candidates demonstrating all 8 hiring scenarios:
                  New Candidate, Missing Resume, Missing Form, Documents Complete, Ready for Call, 24h Warning, 48h Overdue Alert, and Call Completed.
                </p>
              </div>

              {resetConfirm ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-rose-600 font-semibold">Are you sure?</span>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
                  >
                    Yes, Reset Data
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restore Sample Data</span>
                </button>
              )}
            </div>
          </div>

          {/* Export / Import JSON Backup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
            <h4 className="text-sm font-bold text-slate-900">Export & Import CRM Backup</h4>
            <p className="text-slate-500">
              Download your complete local CRM dataset as a portable JSON file, or restore candidate records from an existing backup.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold inline-flex items-center gap-2 transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4 text-teal-400" />
                <span>Export Full CRM JSON Backup</span>
              </button>

              <label className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
