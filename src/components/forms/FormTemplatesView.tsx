import React, { useState, useEffect } from 'react';
import { Candidate, CandidateFormTemplate, FormField, JobOpening, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { getMissingFormFields } from '../../utils/helpers';
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';

interface FormTemplatesViewProps {
  formTemplates: CandidateFormTemplate[];
  jobOpenings: JobOpening[];
  candidates: Candidate[];
  userRole: UserRole;
  onTemplatesUpdated: (templates: CandidateFormTemplate[]) => void;
}

export const FormTemplatesView: React.FC<FormTemplatesViewProps> = ({
  formTemplates,
  jobOpenings,
  candidates,
  userRole,
  onTemplatesUpdated
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    formTemplates[0]?.id || ''
  );
  const [auditCandidateId, setAuditCandidateId] = useState<string>(candidates[0]?.id || '');

  // Field add/edit form state
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // New Template modal state
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplDescription, setNewTplDescription] = useState('');
  const [newTplJobId, setNewTplJobId] = useState(jobOpenings[0]?.id || '');

  useEffect(() => {
    if (!formTemplates.some((t) => t.id === selectedTemplateId) && formTemplates[0]) {
      setSelectedTemplateId(formTemplates[0].id);
    }
  }, [formTemplates, selectedTemplateId]);

  useEffect(() => {
    if (!candidates.some((c) => c.id === auditCandidateId) && candidates[0]) {
      setAuditCandidateId(candidates[0].id);
    }
  }, [candidates, auditCandidateId]);

  const activeTemplate =
    formTemplates.find((t) => t.id === selectedTemplateId) || formTemplates[0];
  const auditCandidate = candidates.find((c) => c.id === auditCandidateId);

  const handleToggleRequired = (fieldId: string) => {
    if (!activeTemplate) return;
    const updatedFields = activeTemplate.fields.map((f) =>
      f.id === fieldId ? { ...f, required: !f.required } : f
    );
    const updated = StorageService.updateFormTemplate(activeTemplate.id, {
      fields: updatedFields
    });
    if (updated) onTemplatesUpdated(StorageService.getFormTemplates());
  };

  const handleDeleteField = (fieldId: string) => {
    if (!activeTemplate) return;
    const updatedFields = activeTemplate.fields.filter((f) => f.id !== fieldId);
    const updated = StorageService.updateFormTemplate(activeTemplate.id, {
      fields: updatedFields
    });
    if (updated) onTemplatesUpdated(StorageService.getFormTemplates());
  };

  const startAddField = () => {
    setEditingFieldId(null);
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(true);
    setNewFieldOptions('');
    setShowFieldForm(true);
  };

  const startEditField = (field: FormField) => {
    setEditingFieldId(field.id);
    setNewFieldLabel(field.label);
    setNewFieldType(field.type);
    setNewFieldRequired(field.required);
    setNewFieldOptions(field.options ? field.options.join(', ') : '');
    setShowFieldForm(true);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate || !newFieldLabel.trim()) return;

    const parsedOptions =
      newFieldType === 'select'
        ? newFieldOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    if (editingFieldId) {
      const updatedFields = activeTemplate.fields.map((f) =>
        f.id === editingFieldId
          ? {
              ...f,
              label: newFieldLabel.trim(),
              type: newFieldType,
              required: newFieldRequired,
              options: parsedOptions
            }
          : f
      );
      const updated = StorageService.updateFormTemplate(activeTemplate.id, {
        fields: updatedFields
      });
      if (updated) {
        onTemplatesUpdated(StorageService.getFormTemplates());
        setShowFieldForm(false);
        setEditingFieldId(null);
      }
      return;
    }

    const fieldKey =
      newFieldLabel
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 20) || `field${Date.now()}`;

    const newField: FormField = {
      id: `f-${Date.now()}`,
      name: fieldKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options: parsedOptions
    };

    const updated = StorageService.updateFormTemplate(activeTemplate.id, {
      fields: [...activeTemplate.fields, newField]
    });

    if (updated) {
      onTemplatesUpdated(StorageService.getFormTemplates());
      setShowFieldForm(false);
      setNewFieldLabel('');
      setNewFieldOptions('');
    }
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplTitle.trim()) return;

    const created = StorageService.addFormTemplate({
      title: newTplTitle.trim(),
      jobOpeningId: newTplJobId || 'default',
      description: newTplDescription.trim() || 'Custom candidate intake questionnaire',
      fields: [
        { id: `f-fn-${Date.now()}`, name: 'firstName', label: 'First Name', type: 'text', required: true },
        { id: `f-ln-${Date.now()}`, name: 'lastName', label: 'Last Name', type: 'text', required: true },
        { id: `f-em-${Date.now()}`, name: 'email', label: 'Email Address', type: 'email', required: true },
        { id: `f-ph-${Date.now()}`, name: 'phone', label: 'Phone Number', type: 'tel', required: true },
        { id: `f-vs-${Date.now()}`, name: 'visaStatus', label: 'Visa Status', type: 'text', required: true },
        { id: `f-np-${Date.now()}`, name: 'noticePeriod', label: 'Notice Period', type: 'text', required: true }
      ]
    });

    if (newTplJobId) {
      StorageService.updateJobOpening(newTplJobId, { formTemplateId: created.id });
    }

    onTemplatesUpdated(StorageService.getFormTemplates());
    setSelectedTemplateId(created.id);
    setShowNewTemplateModal(false);
    setNewTplTitle('');
    setNewTplDescription('');
  };

  if (!activeTemplate) return null;

  const auditResult = auditCandidate ? getMissingFormFields(auditCandidate, activeTemplate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
              Configurable Intake Forms
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Candidate Information Form Builder
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Configure different questionnaire forms per job opening. Add required or optional fields
            to detect missing applicant data automatically.
          </p>
        </div>

        {/* Template Selector Dropdown & Create Template */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Active Template:</label>
          <select
            value={activeTemplate.id}
            onChange={(e) => {
              setSelectedTemplateId(e.target.value);
              setShowFieldForm(false);
            }}
            className="p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-teal-500 shadow-2xs"
          >
            {formTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.title}
              </option>
            ))}
          </select>
          {userRole === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setShowNewTemplateModal(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Field List & Controls */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">{activeTemplate.title}</h3>
              <p className="text-xs text-slate-500">{activeTemplate.description}</p>
            </div>
            {userRole === 'ADMIN' && (
              <button
                type="button"
                onClick={() => (showFieldForm ? setShowFieldForm(false) : startAddField())}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showFieldForm ? 'Cancel' : 'Add Question Field'}</span>
              </button>
            )}
          </div>

          {/* Add / Edit Field Form */}
          {showFieldForm && (
            <form
              onSubmit={handleSaveField}
              className="bg-slate-50 p-4 rounded-xl border border-teal-200 space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Question Label / Field Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Current Base Salary, Willing to Relocate, etc."
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Field Type</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="text">Text Input</option>
                    <option value="select">Dropdown Select</option>
                    <option value="number">Numeric (Years/Salary)</option>
                    <option value="textarea">Paragraph / Multi-line</option>
                    <option value="email">Email Address</option>
                    <option value="tel">Phone Number</option>
                  </select>
                </div>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dropdown Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Option A, Option B, Option C"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>Mark as Mandatory / Required Field</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFieldForm(false);
                      setEditingFieldId(null);
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                  >
                    {editingFieldId ? 'Save Field' : 'Append Field'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Fields list */}
          <div className="divide-y divide-slate-100">
            {activeTemplate.fields.map((field, idx) => (
              <div
                key={field.id}
                className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-400 text-[11px] w-5">#{idx + 1}</span>
                  <div>
                    <span className="font-semibold text-slate-900">{field.label}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="uppercase font-mono">{field.type}</span>
                      {field.options && (
                        <span>({field.options.length} options)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRequired(field.id)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
                      field.required
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {field.required ? 'Required' : 'Optional'}
                  </button>

                  {userRole === 'ADMIN' && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditField(field)}
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                        title="Edit Field"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Live Questionnaire Preview & Candidate Missing Field Audit */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Eye className="w-4 h-4 text-teal-600" />
              <span>Applicant Form Preview</span>
            </div>
            <p className="text-xs text-slate-500">
              Preview of the {activeTemplate.fields.length} fields configured on this form template.
            </p>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 max-h-[38vh] overflow-y-auto">
              {activeTemplate.fields.map((f) => (
                <div key={f.id} className="text-xs space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    {f.label} {f.required && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="h-8 bg-slate-50 border border-slate-200 rounded-md px-2.5 flex items-center text-slate-400 text-[11px]">
                    {f.type === 'select'
                      ? f.options?.slice(0, 3).join(' / ') || 'Select an option...'
                      : f.placeholder || `Enter ${f.label.toLowerCase()}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Missing Fields Audit */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-sm text-slate-900">Missing Fields Checker</h4>
            <select
              value={auditCandidateId}
              onChange={(e) => setAuditCandidateId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-semibold"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.jobTitle})
                </option>
              ))}
            </select>

            {auditResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Completion Score</span>
                  <span>
                    {auditResult.completedCount} / {auditResult.totalCount} fields
                  </span>
                </div>
                {auditResult.missingRequired.length > 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Missing Required ({auditResult.missingRequired.length})</span>
                    </p>
                    <p className="text-[11px] text-amber-800">
                      {auditResult.missingRequired.join(', ')}
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>All required fields provided</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create New Form Template Modal */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Create Candidate Form Template</h3>
              <button
                type="button"
                onClick={() => setShowNewTemplateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cybersecurity Engineer Intake Form"
                  value={newTplTitle}
                  onChange={(e) => setNewTplTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link to Job Opening</label>
                <select
                  value={newTplJobId}
                  onChange={(e) => setNewTplJobId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">General / Unlinked</option>
                  {jobOpenings.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Purpose of this intake form..."
                  value={newTplDescription}
                  onChange={(e) => setNewTplDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewTemplateModal(false)}
                  className="px-3.5 py-1.5 border rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
