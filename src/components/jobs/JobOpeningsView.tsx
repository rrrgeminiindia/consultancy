import React, { useState } from 'react';
import { Candidate, JobOpening, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Briefcase,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  X,
  Building,
  Edit2
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface JobOpeningsViewProps {
  jobOpenings: JobOpening[];
  candidates: Candidate[];
  userRole: UserRole;
  onSelectJobFilter?: (jobTitle: string) => void;
  onJobOpeningsUpdated: (jobs: JobOpening[]) => void;
}

export const JobOpeningsView: React.FC<JobOpeningsViewProps> = ({
  jobOpenings,
  candidates,
  userRole,
  onSelectJobFilter,
  onJobOpeningsUpdated
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('Austin, TX (Hybrid)');
  const [type, setType] = useState<'Full-time' | 'Contract' | 'Remote' | 'Hybrid'>('Full-time');
  const [description, setDescription] = useState('');
  const [requiredExperienceYears, setRequiredExperienceYears] = useState(5);
  const [openingsCount, setOpeningsCount] = useState(2);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    StorageService.addJobOpening({
      title: title.trim(),
      department,
      location,
      type,
      active: true,
      formTemplateId: 'template-swe',
      description,
      requiredExperienceYears,
      openingsCount
    });

    onJobOpeningsUpdated(StorageService.getJobOpenings());
    setShowAddModal(false);
    setTitle('');
    setDescription('');
  };

  const handleToggleActive = (id: string, current: boolean) => {
    StorageService.updateJobOpening(id, { active: !current });
    onJobOpeningsUpdated(StorageService.getJobOpenings());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
              Talent Demand
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Job Openings & LinkedIn Posts</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Track published job descriptions, target experience thresholds, and candidate application flow.
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job Opening</span>
          </button>
        )}
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobOpenings.map((job) => {
          const appliedCandidates = candidates.filter((c) => c.jobTitle === job.title);
          const activePipeline = appliedCandidates.filter(
            (c) => !['Call Completed', 'Withdrawn', 'Closed'].includes(c.stage)
          );

          return (
            <div
              key={job.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                job.active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                    {job.department}
                  </span>
                  <button
                    onClick={() => handleToggleActive(job.id, job.active)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase transition-colors ${
                      job.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {job.active ? 'Active' : 'Closed'}
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">{job.title}</h3>

                <div className="flex items-center gap-2 text-slate-500 text-xs mt-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.location}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {job.type} • Min {job.requiredExperienceYears}+ yrs IT exp
                  </span>
                </div>

                {job.description && (
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {job.description}
                  </p>
                )}
              </div>

              {/* Applicant stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>{appliedCandidates.length} Total Applicants</span>
                </div>
                <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md font-bold">
                  {activePipeline.length} in Active Funnel
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Job Opening</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Security Architect"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Security">Security</option>
                    <option value="Product">Product</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Arrangement</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min IT Experience (Yrs)</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={requiredExperienceYears}
                    onChange={(e) => setRequiredExperienceYears(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key responsibilities and required stack..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  Publish Opening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
