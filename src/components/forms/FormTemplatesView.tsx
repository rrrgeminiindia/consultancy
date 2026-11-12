import React, { useState } from 'react';
import { Candidate, CandidateFormTemplate, FormField, JobOpening, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Edit2,
  Settings,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  AlertTriangle
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

  // Field adding form state
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const activeTemplate =
    formTemplates.find((t) => t.id === selectedTemplateId) || formTemplates[0];

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

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate || !newFieldLabel.trim()) return;

    const fieldKey = newFieldLabel
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 20);

    const newField: FormField = {
      id: `f-${Date.now()}`,
      name: fieldKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options:
        newFieldType === 'select'
          ? newFieldOptions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined
    };

    const updated = StorageService.updateFormTemplate(activeTemplate.id, {
      fields: [...activeTemplate.fields, newField]
    });

    if (updated) {
      onTemplatesUpdated(StorageService.getFormTemplates());
      setShowAddField(false);
      setNewFieldLabel('');
      setNewFieldOptions('');
    }
  };

  if (!activeTemplate) return null;

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

        {/* Template Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Active Template:</label>
          <select
            value={activeTemplate.id}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-teal-500 shadow-2xs"
          >
            {formTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Field List & Controls */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">{activeTemplate.title}</h3>
              <p className="text-xs text-slate-500">{activeTemplate.description}</p>
            </div>
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setShowAddField(!showAddField)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddField ? 'Cancel' : 'Add Question Field'}</span>
              </button>
            )}
          </div>

          {/* Add Field Form */}
          {showAddField && (
            <form
              onSubmit={handleAddField}
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
                    onClick={() => setShowAddField(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                  >
                    Append Field
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
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete Field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Live Questionnaire Preview */}
        <div className="lg:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Eye className="w-4 h-4 text-teal-600" />
            <span>Applicant Form Preview</span>
          </div>
          <p className="text-xs text-slate-500">
            This is the questionnaire view candidates fill out via the web link.
          </p>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 max-h-[60vh] overflow-y-auto">
            {activeTemplate.fields.slice(0, 7).map((f) => (
              <div key={f.id} className="text-xs space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  {f.label} {f.required && <span className="text-rose-500">*</span>}
                </label>
                <div className="h-8 bg-slate-50 border border-slate-200 rounded-md px-2.5 flex items-center text-slate-400 text-[11px]">
                  {f.type === 'select' ? 'Select an option...' : f.placeholder || `Enter ${f.label.toLowerCase()}`}
                </div>
              </div>
            ))}
            {activeTemplate.fields.length > 7 && (
              <p className="text-center text-[11px] text-slate-400 italic pt-2">
                + {activeTemplate.fields.length - 7} more configured fields
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
