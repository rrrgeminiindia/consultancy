import React, { useState, useRef } from 'react';
import { Candidate, JobOpening, Teammate } from '../../types';
import { StorageService } from '../../services/storage';
import { normalizeEmail } from '../../utils/helpers';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  FileText
} from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOpenings: JobOpening[];
  teammates: Teammate[];
  onImportComplete: (count: number) => void;
}

interface ParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
  mapped: {
    fullName: string;
    email: string;
    contactNumber: string;
    jobTitle: string;
    jobLocation: string;
    totalItExperience: string;
    relevantExperience: string;
    currentLocation: string;
    workAuthorization: string;
    currentEmployer: string;
    noticePeriod: string;
    linkedInJobOpening: string;
    assignedTeammateId: string | null;
    notes: string;
  };
  isValid: boolean;
  isDuplicate: boolean;
  duplicateCandidateName?: string;
  errors: string[];
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  jobOpenings,
  teammates,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    fullName: '',
    email: '',
    contactNumber: '',
    jobTitle: '',
    jobLocation: '',
    totalItExperience: '',
    currentLocation: '',
    workAuthorization: '',
    currentEmployer: '',
    noticePeriod: '',
    notes: ''
  });

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'summary'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    validRows: number;
    duplicateRows: number;
    invalidRows: number;
    importedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Simple CSV parser
  const parseCsvText = (text: string) => {
    const lines = text
      .split(/\r\n|\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      alert('CSV must contain a header row and at least one data row.');
      return;
    }

    // Helper to split CSV line considering quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const dataRows = lines.slice(1).map(parseLine);

    setCsvHeaders(headers);
    setRawRows(dataRows);

    // Auto-detect mapping
    const autoMapping: Record<string, string> = { ...columnMapping };
    headers.forEach((h) => {
      const lower = h.toLowerCase();
      if (lower.includes('name')) autoMapping.fullName = h;
      else if (lower.includes('email')) autoMapping.email = h;
      else if (lower.includes('phone') || lower.includes('contact') || lower.includes('mobile'))
        autoMapping.contactNumber = h;
      else if (lower.includes('job') || lower.includes('title') || lower.includes('role'))
        autoMapping.jobTitle = h;
      else if (lower.includes('location') || lower.includes('city'))
        autoMapping.jobLocation = h;
      else if (lower.includes('exp') || lower.includes('experience'))
        autoMapping.totalItExperience = h;
      else if (lower.includes('auth') || lower.includes('visa'))
        autoMapping.workAuthorization = h;
      else if (lower.includes('employer') || lower.includes('company'))
        autoMapping.currentEmployer = h;
      else if (lower.includes('notice'))
        autoMapping.noticePeriod = h;
      else if (lower.includes('note') || lower.includes('comment'))
        autoMapping.notes = h;
    });

    setColumnMapping(autoMapping);
    setStep('mapping');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCsvText(content);
    };
    reader.readAsText(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        parseCsvText(content);
      };
      reader.readAsText(droppedFile);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      `Full Name,Email Address,Phone Number,Job Title,Location,IT Experience,Current Employer,Work Authorization,Notice Period,Notes\n` +
      `Julian Vance,julian.vance@example.com,+1 (415) 309-1122,Senior Full Stack Engineer (React/Node),Austin TX,7 years,Acme Cloud,US Citizen,2 weeks,Excellent React 19 portfolio\n` +
      `Mei-Ling Zhou,meiling.zhou@example.com,+1 (206) 774-8833,Cloud DevOps & Platform Architect,Seattle WA,8.5 years,Apex Networks,Green Card,30 days,Terraform and Kubernetes certified\n` +
      `Tariq Al-Mansoor,tariq.mansoor@example.com,+1 (917) 441-2910,Lead Data Architect (Snowflake & PySpark),New York NY,9 years,Global FinTech,H1B Visa,Immediate,Snowflake architect\n` +
      `Carlos Mendoza,,+1 (312) 555-1234,Mobile React Native Developer,Remote,4 years,TechCore,US Citizen,2 weeks,Missing email to test validation\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'CandidateFlow_Sample_Import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateAndBuildPreview = () => {
    const existingCandidates = StorageService.getCandidates();
    const rows: ParsedRow[] = [];

    rawRows.forEach((row, idx) => {
      const rawData: Record<string, string> = {};
      csvHeaders.forEach((h, colIdx) => {
        rawData[h] = row[colIdx] || '';
      });

      const fullName = (columnMapping.fullName ? rawData[columnMapping.fullName] : '') || '';
      const email = (columnMapping.email ? rawData[columnMapping.email] : '') || '';
      const contactNumber = (columnMapping.contactNumber ? rawData[columnMapping.contactNumber] : '') || '';
      const jobTitle =
        (columnMapping.jobTitle ? rawData[columnMapping.jobTitle] : '') ||
        jobOpenings[0]?.title ||
        'IT Specialist';
      const jobLocation = (columnMapping.jobLocation ? rawData[columnMapping.jobLocation] : '') || 'Remote';
      const totalItExperience = (columnMapping.totalItExperience ? rawData[columnMapping.totalItExperience] : '') || '3+ years';
      const currentLocation = (columnMapping.currentLocation ? rawData[columnMapping.currentLocation] : '') || jobLocation;
      const workAuthorization = (columnMapping.workAuthorization ? rawData[columnMapping.workAuthorization] : '') || 'US Citizen';
      const currentEmployer = (columnMapping.currentEmployer ? rawData[columnMapping.currentEmployer] : '') || 'Not Provided';
      const noticePeriod = (columnMapping.noticePeriod ? rawData[columnMapping.noticePeriod] : '') || '2 weeks';
      const notes = (columnMapping.notes ? rawData[columnMapping.notes] : '') || 'Imported via CSV';

      const errors: string[] = [];

      // Required field validation
      if (!fullName.trim()) errors.push('Missing Candidate Name');
      if (!email.trim()) errors.push('Missing Email Address');
      else if (!email.includes('@')) errors.push('Invalid Email Format');
      if (!contactNumber.trim()) errors.push('Missing Phone Number');

      // Duplicate detection against existing database
      let isDuplicate = false;
      let duplicateCandidateName = '';
      if (email.trim()) {
        const norm = normalizeEmail(email);
        const dup = existingCandidates.find(
          (c) => normalizeEmail(c.email) === norm && c.jobTitle.toLowerCase() === jobTitle.toLowerCase()
        );
        if (dup) {
          isDuplicate = true;
          duplicateCandidateName = dup.fullName;
          errors.push(`Duplicate: already exists as ${dup.fullName}`);
        }
      }

      rows.push({
        rowNumber: idx + 2, // 1-indexed plus header
        raw: rawData,
        mapped: {
          fullName,
          email,
          contactNumber,
          jobTitle,
          jobLocation,
          totalItExperience,
          relevantExperience: totalItExperience ? `${totalItExperience} in relevant technologies` : '',
          currentLocation,
          workAuthorization,
          currentEmployer,
          noticePeriod,
          linkedInJobOpening: `LinkedIn Opening - ${jobTitle}`,
          assignedTeammateId: null,
          notes
        },
        isValid: errors.length === 0,
        isDuplicate,
        duplicateCandidateName,
        errors
      });
    });

    setParsedRows(rows);
    setStep('preview');
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid && !r.isDuplicate);
    if (validRows.length === 0) {
      alert('No valid non-duplicate rows to import.');
      return;
    }

    const candidatesToImport = validRows.map((r) => ({
      ...r.mapped,
      applicationDate: new Date().toISOString(),
      stage: 'New Candidate' as const,
      resumeStatus: 'Pending' as const,
      candidateFormStatus: 'Pending' as const,
      identityVerificationStatus: 'Pending' as const,
      assignedTeammateName: null,
      assignmentDate: null,
      lastContactDate: null,
      nextFollowUpDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      callPendingStartedAt: null,
      stageEnteredAt: new Date().toISOString(),
      formResponses: {}
    }));

    const result = StorageService.bulkImportCandidates(candidatesToImport);

    setImportSummary({
      totalRows: parsedRows.length,
      validRows: validRows.length,
      duplicateRows: parsedRows.filter((r) => r.isDuplicate).length,
      invalidRows: parsedRows.filter((r) => !r.isValid && !r.isDuplicate).length,
      importedCount: result.importedCount
    });

    setStep('summary');
    onImportComplete(result.importedCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Bulk CSV Candidate Upload</h3>
              <p className="text-xs text-slate-300">
                Import multiple candidate applicants from LinkedIn spreadsheets with duplicate & validation checks.
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

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="p-6 space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-10 text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="p-4 bg-teal-100 text-teal-700 rounded-full">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Click to select CSV file, or drag and drop here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports comma-separated .csv files exported from LinkedIn Recruiter or spreadsheets
                </p>
              </div>
            </div>

            {/* Template Download Utility */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Need a sample format template?</p>
                  <p className="text-[11px] text-slate-500">
                    Download our ready-made CSV template with headers and realistic dummy IT candidate rows.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download Sample CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Map CSV Columns to Candidate Fields</h4>
                <p className="text-xs text-slate-500">
                  We automatically matched most fields. Verify or adjust the column pairings below.
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                {rawRows.length} Candidate Rows Detected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto p-1">
              {[
                { key: 'fullName', label: 'Full Name * (Required)', required: true },
                { key: 'email', label: 'Email Address * (Required)', required: true },
                { key: 'contactNumber', label: 'Phone Number * (Required)', required: true },
                { key: 'jobTitle', label: 'Job Title / Role' },
                { key: 'jobLocation', label: 'Location' },
                { key: 'totalItExperience', label: 'Total IT Experience' },
                { key: 'currentLocation', label: 'Current Residence City' },
                { key: 'workAuthorization', label: 'Work Authorization / Visa' },
                { key: 'currentEmployer', label: 'Current Employer' },
                { key: 'noticePeriod', label: 'Notice Period' },
                { key: 'notes', label: 'Notes / Comments' }
              ].map((field) => (
                <div key={field.key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {field.label}
                  </label>
                  <select
                    value={columnMapping[field.key] || ''}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">-- Do not import / Auto-fill --</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        CSV Column: "{header}"
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Upload
              </button>
              <button
                type="button"
                onClick={validateAndBuildPreview}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>Validate & Preview Records</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Validation Table */}
        {step === 'preview' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Pre-Import Validation Preview</h4>
                <p className="text-xs text-slate-500">
                  Review verified rows, duplicate flags, and invalid rows before executing import.
                </p>
              </div>

              {/* Status pills */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {parsedRows.filter((r) => r.isValid && !r.isDuplicate).length} Valid
                </span>
                {parsedRows.filter((r) => r.isDuplicate).length > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {parsedRows.filter((r) => r.isDuplicate).length} Duplicate
                  </span>
                )}
                {parsedRows.filter((r) => !r.isValid && !r.isDuplicate).length > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {parsedRows.filter((r) => !r.isValid && !r.isDuplicate).length} Invalid
                  </span>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[50vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Row #</th>
                    <th className="py-2.5 px-3">Validation Status</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Job Title</th>
                    <th className="py-2.5 px-3">Experience</th>
                    <th className="py-2.5 px-3">Reasons / Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={
                        r.isDuplicate
                          ? 'bg-amber-50/50'
                          : !r.isValid
                          ? 'bg-rose-50/50'
                          : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500">#{r.rowNumber}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {r.isValid && !r.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ready
                          </span>
                        ) : r.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            Duplicate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Invalid
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.mapped.fullName || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.mapped.email || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{r.mapped.contactNumber || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{r.mapped.jobTitle}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.mapped.totalItExperience}</td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {r.errors.length > 0 ? (
                          <span className="text-rose-600 font-medium">
                            {r.errors.join('; ')}
                          </span>
                        ) : (
                          <span className="text-slate-400">None (Valid)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Field Mapping
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={parsedRows.filter((r) => r.isValid && !r.isDuplicate).length === 0}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Import {parsedRows.filter((r) => r.isValid && !r.isDuplicate).length} Valid Candidates
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Import Summary */}
        {step === 'summary' && importSummary && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-extrabold text-slate-900">
                Bulk Import Completed Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                The validated candidates have been added to your CRM in the "New Candidate" stage.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Rows</span>
                <span className="text-lg font-bold text-slate-800">{importSummary.totalRows}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Imported</span>
                <span className="text-lg font-bold text-emerald-700">{importSummary.importedCount}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-700 uppercase font-semibold block">Duplicates</span>
                <span className="text-lg font-bold text-amber-700">{importSummary.duplicateRows}</span>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                <span className="text-[10px] text-rose-700 uppercase font-semibold block">Invalid</span>
                <span className="text-lg font-bold text-rose-700">{importSummary.invalidRows}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
            >
              View In Pipeline Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
