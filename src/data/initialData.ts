import { Candidate, CandidateFormTemplate, EmailTemplate, JobOpening, Teammate, UserProfile } from '../types';

export const INITIAL_ADMIN_USER: UserProfile = {
  id: 'admin-1',
  name: 'Alex Mercer (Lead Recruiter)',
  email: 'alex.recruiter@candidateflow.io',
  role: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  title: 'Lead IT Recruitment Consultant'
};

export const INITIAL_TEAMMATES: Teammate[] = [
  {
    id: 'tm-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@candidateflow.io',
    phone: '+1 (555) 234-5678',
    title: 'Senior Technical Recruiter',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    active: true,
    maxCapacity: 15
  },
  {
    id: 'tm-2',
    name: 'Marcus Chen',
    email: 'marcus.chen@candidateflow.io',
    phone: '+1 (555) 345-6789',
    title: 'Talent Acquisition Partner',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    active: true,
    maxCapacity: 12
  },
  {
    id: 'tm-3',
    name: 'Priya Sharma',
    email: 'priya.sharma@candidateflow.io',
    phone: '+1 (555) 456-7890',
    title: 'IT Sourcing Specialist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    active: true,
    maxCapacity: 10
  }
];

export const INITIAL_JOB_OPENINGS: JobOpening[] = [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer (React/Node)',
    department: 'Engineering',
    location: 'Austin, TX (Hybrid)',
    type: 'Full-time',
    active: true,
    formTemplateId: 'template-swe',
    description: 'Looking for a seasoned Full Stack Engineer with strong TypeScript, React 19, Node.js, and AWS architecture experience.',
    requiredExperienceYears: 6,
    openingsCount: 3,
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'job-2',
    title: 'Cloud DevOps & Platform Architect',
    department: 'Infrastructure',
    location: 'Seattle, WA (Remote)',
    type: 'Full-time',
    active: true,
    formTemplateId: 'template-devops',
    description: 'Kubernetes, Terraform, CI/CD pipelines, and multi-region AWS cloud infrastructure automation.',
    requiredExperienceYears: 7,
    openingsCount: 2,
    createdAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 'job-3',
    title: 'Lead Data Architect (Snowflake & PySpark)',
    department: 'Data & Analytics',
    location: 'New York, NY (Hybrid)',
    type: 'Full-time',
    active: true,
    formTemplateId: 'template-data',
    description: 'Design enterprise data lakes, pipeline orchestration, and analytical models with dbt and Snowflake.',
    requiredExperienceYears: 8,
    openingsCount: 1,
    createdAt: '2026-11-01T11:00:00Z'
  },
  {
    id: 'job-4',
    title: 'Mobile React Native Developer',
    department: 'Mobile Engineering',
    location: 'Remote (US/Canada)',
    type: 'Contract',
    active: true,
    formTemplateId: 'template-swe',
    description: 'Cross-platform iOS and Android apps with React Native, offline synchronization, and state management.',
    requiredExperienceYears: 4,
    openingsCount: 2,
    createdAt: '2026-11-05T08:30:00Z'
  }
];

export const INITIAL_FORM_TEMPLATES: CandidateFormTemplate[] = [
  {
    id: 'template-swe',
    title: 'Standard Software Engineering Candidate Form',
    jobOpeningId: 'job-1',
    description: 'Detailed candidate information sheet required for engineering evaluation before teammate interview.',
    fields: [
      { id: 'f-first-name', name: 'firstName', label: 'First Name', type: 'text', required: true },
      { id: 'f-last-name', name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { id: 'f-email', name: 'email', label: 'Email Address', type: 'email', required: true },
      { id: 'f-phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { id: 'f-education', name: 'education', label: 'Highest Degree Education', type: 'select', required: true, options: ["Bachelor's in CS / IT", "Master's in CS / IT", 'PhD', 'Bootcamp Graduate', 'Self-Taught / Other'] },
      { id: 'f-university', name: 'university', label: 'University / Institute', type: 'text', required: false },
      { id: 'f-grad-year', name: 'graduationYear', label: 'Graduation Year', type: 'number', required: false },
      { id: 'f-curr-loc', name: 'currentLocation', label: 'Current City & State', type: 'text', required: true },
      { id: 'f-visa', name: 'visaStatus', label: 'Work Authorization / Visa Status', type: 'select', required: true, options: ['US Citizen', 'Permanent Resident (Green Card)', 'H1B Visa (Transfer needed)', 'H1B (Direct)', 'OPT / CPT', 'TN Visa', 'Other Work Authorization'] },
      { id: 'f-employer', name: 'currentEmployer', label: 'Current Employer', type: 'text', required: true },
      { id: 'f-it-exp', name: 'totalItExperience', label: 'Total IT Experience (Years)', type: 'number', required: true },
      { id: 'f-pref-pos', name: 'preferredPosition', label: 'Preferred Role / Specialty', type: 'text', required: false },
      { id: 'f-notice', name: 'noticePeriod', label: 'Notice Period', type: 'select', required: true, options: ['Immediate', '1 Week', '2 Weeks', '30 Days', '60 Days'] },
      { id: 'f-vacation', name: 'vacationPlans', label: 'Upcoming Planned Vacations in Next 90 Days', type: 'text', required: false },
      { id: 'f-reloc', name: 'relocation', label: 'Open to Relocation', type: 'select', required: true, options: ['Yes - Anywhere', 'Yes - Specific States', 'No - Remote Only', 'Already Local'] },
      { id: 'f-interview-avail', name: 'interviewAvailability', label: 'Interview Availability Windows', type: 'textarea', required: true, placeholder: 'e.g. Weekdays after 2 PM EST' }
    ],
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'template-devops',
    title: 'Cloud & Infrastructure Candidate Form',
    jobOpeningId: 'job-2',
    description: 'DevOps & Cloud architecture questionnaire covering certifications and on-call availability.',
    fields: [
      { id: 'f-first-name', name: 'firstName', label: 'First Name', type: 'text', required: true },
      { id: 'f-last-name', name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { id: 'f-email', name: 'email', label: 'Email Address', type: 'email', required: true },
      { id: 'f-phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { id: 'f-curr-loc', name: 'currentLocation', label: 'Current Location', type: 'text', required: true },
      { id: 'f-visa', name: 'visaStatus', label: 'Visa Status', type: 'select', required: true, options: ['US Citizen', 'Permanent Resident', 'H1B', 'Other'] },
      { id: 'f-it-exp', name: 'totalItExperience', label: 'Total IT Experience', type: 'number', required: true },
      { id: 'f-notice', name: 'noticePeriod', label: 'Notice Period', type: 'select', required: true, options: ['Immediate', '2 Weeks', '30 Days'] },
      { id: 'f-reloc', name: 'relocation', label: 'Relocation Openness', type: 'select', required: true, options: ['Remote Only', 'Open to Relocation'] },
      { id: 'f-interview-avail', name: 'interviewAvailability', label: 'Interview Availability', type: 'textarea', required: true }
    ],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z'
  }
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'email-tpl-a',
    key: 'A',
    title: 'A. Initial Email: Request Resume & Candidate Form',
    description: 'Sent right after candidate applies on LinkedIn to request their updated resume and candidate info form.',
    recommendedStage: 'New Candidate',
    subject: 'Action Required: Next Steps for [Job Title] Application with [Recruiter Name]',
    body: `Hi [Candidate Name],

Thank you for your interest and application for the [Job Title] role based in [Location] via LinkedIn!

We have reviewed your profile and would love to move forward with your evaluation. To proceed smoothly to our technical assessment round, could you please reply with the following two items at your earliest convenience:

1. Your most updated Resume (PDF or Word format).
2. Completed Candidate Information Form (link: https://candidateflow.io/form/[Job Title]) to confirm your work authorization, notice period, and preferred interview windows.

If you have any quick questions regarding the team, tech stack, or compensation, feel free to reply directly to this message.

Best regards,
[Recruiter Name]
Lead IT Recruitment Consultant
CandidateFlow Recruitment Services`
  },
  {
    id: 'email-tpl-b',
    key: 'B',
    title: 'B. Resume Missing Reminder',
    description: 'Sent when candidate has submitted the form or initial reply, but their updated resume is still missing.',
    recommendedStage: 'Documents Pending',
    subject: 'Gentle Reminder: Updated Resume Needed for [Job Title] - [Candidate Name]',
    body: `Hi [Candidate Name],

Hope you are having a productive week!

We are currently preparing candidate shortlists for the hiring manager on the [Job Title] position. We noticed we have not yet received your updated Resume.

Could you please attach your latest resume in reply to this email? As soon as we receive it, we will expedite scheduling your screening call with our technical recruiter, [Teammate Name].

Looking forward to hearing from you.

Warm regards,
[Recruiter Name]
CandidateFlow Recruitment Services`
  },
  {
    id: 'email-tpl-c',
    key: 'C',
    title: 'C. Candidate Information Form Missing Reminder',
    description: 'Sent when resume was received, but the essential candidate information form is still missing.',
    recommendedStage: 'Documents Pending',
    subject: 'Quick Follow-Up: Candidate Information Form for [Job Title]',
    body: `Hi [Candidate Name],

Thank you for sending over your resume for the [Job Title] opening!

Our team had a preliminary review and was very impressed with your background. To ensure we have your current notice period, salary expectations, and work authorization accurately logged for the hiring team, please take 3 minutes to complete our short Candidate Information Form:

👉 Form link: https://candidateflow.io/form/[Job Title]

Once this form is completed, your profile will immediately transition to our technical screening schedule.

Thank you for your prompt response,
[Recruiter Name]
CandidateFlow Recruitment Services`
  },
  {
    id: 'email-tpl-d',
    key: 'D',
    title: 'D. Document Receipt Confirmation',
    description: 'Sent once both resume and candidate form have been received and verified.',
    recommendedStage: 'Documents Received',
    subject: 'Documents Received: [Job Title] Application Complete - [Candidate Name]',
    body: `Hi [Candidate Name],

Great news! We have successfully received and verified both your updated resume and candidate information form for the [Job Title] role.

All prerequisite information is now complete. Our team is conducting the final internal alignment, and your application is being assigned to our technical recruitment partner, [Teammate Name], who will connect with you shortly for the initial technical discussion.

Thank you for your prompt cooperation!

Best regards,
[Recruiter Name]
CandidateFlow Recruitment Services`
  },
  {
    id: 'email-tpl-e',
    key: 'E',
    title: 'E. Profile Shared with Teammate (Call Scheduled)',
    description: 'Notifies candidate that their profile is in the hands of their assigned teammate for an introductory phone call.',
    recommendedStage: 'Ready for Teammate Call',
    subject: 'Introduction: Your Upcoming Screening Call for [Job Title] with [Teammate Name]',
    body: `Hi [Candidate Name],

I wanted to let you know that your candidate profile for the [Job Title] position has been officially transferred to my colleague, [Teammate Name].

[Teammate Name] will be reaching out to you via phone/email within the next 24-48 business hours to conduct your 20-minute introductory recruiter screening call. They will discuss the project scope, team dynamics, compensation expectations, and answer any technical questions you may have.

Please make sure you have your phone reachable and check your inbox/voicemail.

Best of luck with the conversation!

Sincerely,
[Recruiter Name]
Lead Recruitment Consultant`
  },
  {
    id: 'email-tpl-f',
    key: 'F',
    title: 'F. 24-Hour Follow-Up Reminder',
    description: 'Sent or referenced when a call has been pending for 24 hours to keep the momentum going.',
    recommendedStage: 'Call Pending',
    subject: 'Checking In: Screening Call for [Job Title] - [Candidate Name]',
    body: `Hi [Candidate Name],

I am checking in to confirm if you and [Teammate Name] were able to connect regarding the [Job Title] opportunity.

We know schedules can get hectic! If you have not yet synced up or if you need to reschedule to a specific time that suits you better, please reply with your top 2 availability slots for tomorrow.

We want to make sure your candidacy stays on track before interview slots fill up.

Kind regards,
[Recruiter Name]
CandidateFlow Recruitment Services`
  },
  {
    id: 'email-tpl-g',
    key: 'G',
    title: 'G. 48-Hour Overdue Follow-Up Alert',
    description: 'Sent when call is 48 hours overdue, asking candidate to directly reach out or coordinate with recruiter.',
    recommendedStage: 'Call Pending',
    subject: 'Urgent Follow-Up: Connecting on your [Job Title] Application',
    body: `Dear [Candidate Name],

Our records indicate that you were scheduled for a preliminary phone outreach with [Teammate Name] regarding the [Job Title] position in [Location], but we have not been able to complete the call within the 48-hour window.

Your background remains of high interest to us. If you have not received a call, had missed connections, or experienced any scheduling conflicts, please contact me directly at your earliest convenience:

Recruiter Contact: [Recruiter Name]
Direct Phone / WhatsApp: +1 (555) 019-2834
Email: alex.recruiter@candidateflow.io

Please let us know if you are still actively interested in this position so we can prioritize your interview slot with the hiring manager.

Warm regards,
[Recruiter Name]
Lead IT Recruitment Consultant
CandidateFlow`
  }
];

// Helper to get ISO strings in the past
const now = new Date('2026-11-12T12:58:00Z');
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3600 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 3600 * 1000).toISOString();

export const INITIAL_CANDIDATES: Candidate[] = [
  // 1. New Candidate (Just applied, no email sent yet)
  {
    id: 'cand-101',
    fullName: 'Ethan Ramirez',
    email: 'ethan.ramirez.dev@example.com',
    contactNumber: '+1 (512) 890-1122',
    jobTitle: 'Senior Full Stack Engineer (React/Node)',
    jobLocation: 'Austin, TX (Hybrid)',
    totalItExperience: '7.5 years',
    relevantExperience: '5 years React 18/19, TypeScript, Express, GraphQL, AWS Lambda',
    currentLocation: 'Austin, TX',
    workAuthorization: 'US Citizen',
    currentEmployer: 'Apex Cloud Solutions',
    noticePeriod: '2 weeks',
    applicationDate: hoursAgo(4),
    linkedInJobOpening: 'LinkedIn Job #884920 - Sr Full Stack',
    assignedTeammateId: null,
    assignedTeammateName: null,
    assignmentDate: null,
    stage: 'New Candidate',
    resumeStatus: 'Pending',
    candidateFormStatus: 'Pending',
    identityVerificationStatus: 'Pending',
    lastContactDate: null,
    nextFollowUpDate: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
    callPendingStartedAt: null,
    stageEnteredAt: hoursAgo(4),
    formResponses: {},
    notes: 'Applied through LinkedIn EasyApply. Strong GitHub profile with modern Next.js open-source contributions.',
    stageHistory: [
      {
        stage: 'New Candidate',
        enteredAt: hoursAgo(4),
        updatedBy: 'System Import (LinkedIn)',
        notes: 'Application received from LinkedIn post #884920'
      }
    ],
    callLogs: [],
    emailLogs: [],
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4)
  },

  // 2. Missing Resume (Candidate form received, resume pending)
  {
    id: 'cand-102',
    fullName: 'Ananya Deshmukh',
    email: 'ananya.deshmukh.cloud@example.com',
    contactNumber: '+1 (206) 441-9988',
    jobTitle: 'Cloud DevOps & Platform Architect',
    jobLocation: 'Seattle, WA (Remote)',
    totalItExperience: '8 years',
    relevantExperience: '6 years Kubernetes, Terraform, AWS EKS, Prometheus, GitOps',
    currentLocation: 'Bellevue, WA',
    workAuthorization: 'Permanent Resident (Green Card)',
    currentEmployer: 'Nordic Tech Systems',
    noticePeriod: '30 days',
    applicationDate: daysAgo(2),
    linkedInJobOpening: 'LinkedIn Job #885102 - Cloud DevOps',
    assignedTeammateId: 'tm-1',
    assignedTeammateName: 'Sarah Jenkins',
    assignmentDate: daysAgo(1),
    stage: 'Documents Pending',
    resumeStatus: 'Pending',
    candidateFormStatus: 'Received',
    identityVerificationStatus: 'Verified',
    lastContactDate: daysAgo(1),
    nextFollowUpDate: hoursAgo(12),
    callPendingStartedAt: null,
    stageEnteredAt: daysAgo(1),
    formResponses: {
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      education: "Master's in CS / IT",
      university: 'University of Washington',
      graduationYear: '2018',
      currentLocation: 'Bellevue, WA',
      visaStatus: 'Permanent Resident',
      currentEmployer: 'Nordic Tech Systems',
      totalItExperience: '8',
      noticePeriod: '30 Days',
      relocation: 'No - Remote Only',
      interviewAvailability: 'Tuesdays and Thursdays after 3 PM PST'
    },
    notes: 'Submitted candidate info form promptly. Awaiting updated PDF resume reflecting recent AWS migrations.',
    stageHistory: [
      {
        stage: 'New Candidate',
        enteredAt: daysAgo(2),
        updatedBy: 'Alex Mercer',
        notes: 'Initial profile intake'
      },
      {
        stage: 'Initial Email Sent',
        enteredAt: daysAgo(1.8),
        updatedBy: 'Alex Mercer',
        notes: 'Sent Template A (Initial outreach)'
      },
      {
        stage: 'Documents Pending',
        enteredAt: daysAgo(1),
        updatedBy: 'Alex Mercer',
        notes: 'Form received; resume still pending'
      }
    ],
    callLogs: [],
    emailLogs: [
      {
        id: 'elog-1',
        candidateId: 'cand-102',
        templateId: 'email-tpl-a',
        templateTitle: 'A. Initial Email',
        sentBy: 'Alex Mercer',
        sentAt: daysAgo(1.8),
        recipientEmail: 'ananya.deshmukh.cloud@example.com',
        subject: 'Action Required: Next Steps for Cloud DevOps & Platform Architect Application',
        content: 'Hi Ananya, thank you for your application...'
      }
    ],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1)
  },

  // 3. Missing Candidate Form (Resume received, candidate form pending)
  {
    id: 'cand-103',
    fullName: 'Liam O\'Connor',
    email: 'liam.oconnor.data@example.com',
    contactNumber: '+1 (917) 602-3344',
    jobTitle: 'Lead Data Architect (Snowflake & PySpark)',
    jobLocation: 'New York, NY (Hybrid)',
    totalItExperience: '9 years',
    relevantExperience: 'Snowflake enterprise warehousing, dbt, Apache Airflow, Databricks',
    currentLocation: 'Jersey City, NJ',
    workAuthorization: 'US Citizen',
    currentEmployer: 'FinAnalytics Global',
    noticePeriod: 'Immediate',
    applicationDate: daysAgo(3),
    linkedInJobOpening: 'LinkedIn Job #885991 - Lead Data Architect',
    assignedTeammateId: 'tm-2',
    assignedTeammateName: 'Marcus Chen',
    assignmentDate: daysAgo(2),
    stage: 'Documents Pending',
    resumeStatus: 'Received',
    candidateFormStatus: 'Pending',
    identityVerificationStatus: 'Pending',
    lastContactDate: daysAgo(2),
    nextFollowUpDate: hoursAgo(6),
    callPendingStartedAt: null,
    stageEnteredAt: daysAgo(2),
    formResponses: {},
    notes: 'Resume sent via LinkedIn message. Missing candidate information form with notice period and interview windows.',
    stageHistory: [
      {
        stage: 'New Candidate',
        enteredAt: daysAgo(3),
        updatedBy: 'Alex Mercer',
        notes: 'Profile saved from LinkedIn direct inmail'
      },
      {
        stage: 'Initial Email Sent',
        enteredAt: daysAgo(2.5),
        updatedBy: 'Alex Mercer',
        notes: 'Sent initial email'
      },
      {
        stage: 'Documents Pending',
        enteredAt: daysAgo(2),
        updatedBy: 'Alex Mercer',
        notes: 'Resume attached; form pending'
      }
    ],
    callLogs: [],
    emailLogs: [],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2)
  },

  // 4. Documents Completed (Both resume and candidate form received)
  {
    id: 'cand-104',
    fullName: 'Elena Rostova',
    email: 'elena.rostova.tech@example.com',
    contactNumber: '+1 (415) 772-8819',
    jobTitle: 'Senior Full Stack Engineer (React/Node)',
    jobLocation: 'Austin, TX (Hybrid)',
    totalItExperience: '6 years',
    relevantExperience: 'Full stack TypeScript, React 19, Tailwind, PostgreSQL, Redis',
    currentLocation: 'Round Rock, TX',
    workAuthorization: 'H1B (Transfer needed)',
    currentEmployer: 'Vanguard Systems Inc.',
    noticePeriod: '2 weeks',
    applicationDate: daysAgo(4),
    linkedInJobOpening: 'LinkedIn Job #884920 - Sr Full Stack',
    assignedTeammateId: 'tm-1',
    assignedTeammateName: 'Sarah Jenkins',
    assignmentDate: daysAgo(1),
    stage: 'Documents Received',
    resumeStatus: 'Received',
    candidateFormStatus: 'Received',
    identityVerificationStatus: 'Verified',
    lastContactDate: daysAgo(1),
    nextFollowUpDate: new Date(now.getTime() + 12 * 3600 * 1000).toISOString(),
    callPendingStartedAt: null,
    stageEnteredAt: daysAgo(1),
    formResponses: {
      firstName: 'Elena',
      lastName: 'Rostova',
      education: "Master's in CS / IT",
      university: 'UT Austin',
      graduationYear: '2020',
      currentLocation: 'Round Rock, TX',
      visaStatus: 'H1B Visa (Transfer needed)',
      currentEmployer: 'Vanguard Systems Inc.',
      totalItExperience: '6',
      noticePeriod: '2 Weeks',
      relocation: 'Already Local',
      interviewAvailability: 'Any afternoon after 1 PM CST'
    },
    notes: 'All mandatory documents verified. Profile looks top-tier. Ready to queue for teammate phone call.',
    stageHistory: [
      {
        stage: 'New Candidate',
        enteredAt: daysAgo(4),
        updatedBy: 'Alex Mercer'
      },
      {
        stage: 'Documents Pending',
        enteredAt: daysAgo(3),
        updatedBy: 'Alex Mercer'
      },
      {
        stage: 'Documents Received',
        enteredAt: daysAgo(1),
        updatedBy: 'Alex Mercer',
        notes: 'Both resume and candidate form confirmed complete.'
      }
    ],
    callLogs: [],
    emailLogs: [
      {
        id: 'elog-2',
        candidateId: 'cand-104',
        templateId: 'email-tpl-d',
        templateTitle: 'D. Document Receipt Confirmation',
        sentBy: 'Alex Mercer',
        sentAt: daysAgo(1),
        recipientEmail: 'elena.rostova.tech@example.com',
        subject: 'Documents Received: Senior Full Stack Engineer Application Complete',
        content: 'Hi Elena, Great news! We have successfully received and verified both your updated resume...'
      }
    ],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1)
  },

  // 5. Ready for Teammate Call
  {
    id: 'cand-105',
    fullName: 'David Kalu',
    email: 'david.kalu.eng@example.com',
    contactNumber: '+1 (312) 555-4091',
    jobTitle: 'Mobile React Native Developer',
    jobLocation: 'Remote (US/Canada)',
    totalItExperience: '5 years',
    relevantExperience: 'React Native, Redux Toolkit, Expo EAS, iOS App Store submissions, Android Play Console',
    currentLocation: 'Chicago, IL',
    workAuthorization: 'US Citizen',
    currentEmployer: 'FinApp Studios',
    noticePeriod: 'Immediate',
    applicationDate: daysAgo(5),
    linkedInJobOpening: 'LinkedIn Job #886200 - Mobile React Native',
    assignedTeammateId: 'tm-2',
    assignedTeammateName: 'Marcus Chen',
    assignmentDate: hoursAgo(10),
    stage: 'Ready for Teammate Call',
    resumeStatus: 'Received',
    candidateFormStatus: 'Received',
    identityVerificationStatus: 'Not Required',
    lastContactDate: hoursAgo(10),
    nextFollowUpDate: new Date(now.getTime() + 14 * 3600 * 1000).toISOString(),
    callPendingStartedAt: null,
    stageEnteredAt: hoursAgo(10),
    formResponses: {
      firstName: 'David',
      lastName: 'Kalu',
      education: "Bachelor's in CS / IT",
      university: 'University of Illinois',
      graduationYear: '2021',
      currentLocation: 'Chicago, IL',
      visaStatus: 'US Citizen',
      currentEmployer: 'FinApp Studios',
      totalItExperience: '5',
      noticePeriod: 'Immediate',
      relocation: 'No - Remote Only',
      interviewAvailability: 'Flexible any time between 9am - 5pm CST'
    },
    notes: 'Documents verified. Assigned to Marcus Chen for initial recruiter phone screen.',
    stageHistory: [
      {
        stage: 'Documents Received',
        enteredAt: daysAgo(2),
        updatedBy: 'Alex Mercer'
      },
      {
        stage: 'Ready for Teammate Call',
        enteredAt: hoursAgo(10),
        updatedBy: 'Alex Mercer',
        notes: 'Assigned to Marcus Chen. Introduction email sent.'
      }
    ],
    callLogs: [],
    emailLogs: [
      {
        id: 'elog-3',
        candidateId: 'cand-105',
        templateId: 'email-tpl-e',
        templateTitle: 'E. Profile Shared with Teammate',
        sentBy: 'Alex Mercer',
        sentAt: hoursAgo(10),
        recipientEmail: 'david.kalu.eng@example.com',
        subject: 'Introduction: Your Upcoming Screening Call for Mobile React Native Developer with Marcus Chen',
        content: 'Hi David, I wanted to let you know that your candidate profile has been officially transferred to Marcus Chen...'
      }
    ],
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(10)
  },

  // 6. Call Pending for 26 Hours (APPROACHING 24H YELLOW WARNING)
  {
    id: 'cand-106',
    fullName: 'Sophia Martinez',
    email: 'sophia.martinez.ui@example.com',
    contactNumber: '+1 (408) 555-7766',
    jobTitle: 'Senior Full Stack Engineer (React/Node)',
    jobLocation: 'Austin, TX (Hybrid)',
    totalItExperience: '6.5 years',
    relevantExperience: 'React, Node, GraphQL, Jest, Cypress, microservices architecture',
    currentLocation: 'San Jose, CA (Relocating)',
    workAuthorization: 'US Citizen',
    currentEmployer: 'CloudGrid Systems',
    noticePeriod: '2 weeks',
    applicationDate: daysAgo(6),
    linkedInJobOpening: 'LinkedIn Job #884920 - Sr Full Stack',
    assignedTeammateId: 'tm-1',
    assignedTeammateName: 'Sarah Jenkins',
    assignmentDate: hoursAgo(26),
    stage: 'Call Pending',
    resumeStatus: 'Received',
    candidateFormStatus: 'Received',
    identityVerificationStatus: 'Verified',
    lastContactDate: hoursAgo(26),
    nextFollowUpDate: hoursAgo(2),
    callPendingStartedAt: hoursAgo(26), // 26 hours ago! >= 24h triggers YELLOW warning
    stageEnteredAt: hoursAgo(26),
    formResponses: {
      firstName: 'Sophia',
      lastName: 'Martinez',
      education: "Bachelor's in CS / IT",
      currentLocation: 'San Jose, CA',
      visaStatus: 'US Citizen',
      currentEmployer: 'CloudGrid Systems',
      totalItExperience: '6.5',
      noticePeriod: '2 Weeks',
      relocation: 'Yes - Specific States',
      interviewAvailability: 'Mornings 8am-11am PST'
    },
    notes: 'Call pending for 26 hours. Assigned to Sarah Jenkins. Teammate needs to complete the first phone screen.',
    stageHistory: [
      {
        stage: 'Ready for Teammate Call',
        enteredAt: daysAgo(2),
        updatedBy: 'Alex Mercer'
      },
      {
        stage: 'Call Pending',
        enteredAt: hoursAgo(26),
        updatedBy: 'Sarah Jenkins',
        notes: 'Call queued for candidate outreach'
      }
    ],
    callLogs: [
      {
        id: 'clog-1',
        candidateId: 'cand-106',
        teammateId: 'tm-1',
        teammateName: 'Sarah Jenkins',
        callDate: '2026-11-11',
        callTime: '14:30',
        durationMinutes: 2,
        outcome: 'Left Voicemail',
        notes: 'Candidate did not pick up, left a brief voicemail asking for return call.',
        createdAt: hoursAgo(22)
      }
    ],
    emailLogs: [],
    createdAt: daysAgo(6),
    updatedAt: hoursAgo(22)
  },

  // 7. Call Pending for 54 Hours (OVERDUE 48H RED ALERT)
  {
    id: 'cand-107',
    fullName: 'Vikramaditya Sengupta',
    email: 'vikram.sengupta.devops@example.com',
    contactNumber: '+1 (617) 555-8912',
    jobTitle: 'Cloud DevOps & Platform Architect',
    jobLocation: 'Seattle, WA (Remote)',
    totalItExperience: '10 years',
    relevantExperience: 'Kubernetes, AWS Architect Pro, CI/CD with GitLab, Helm, Terraform',
    currentLocation: 'Boston, MA',
    workAuthorization: 'H1B Visa (Transfer needed)',
    currentEmployer: 'Boston Cloud Innovations',
    noticePeriod: '30 days',
    applicationDate: daysAgo(7),
    linkedInJobOpening: 'LinkedIn Job #885102 - Cloud DevOps',
    assignedTeammateId: 'tm-3',
    assignedTeammateName: 'Priya Sharma',
    assignmentDate: hoursAgo(54),
    stage: 'Call Pending',
    resumeStatus: 'Received',
    candidateFormStatus: 'Received',
    identityVerificationStatus: 'Verified',
    lastContactDate: hoursAgo(54),
    nextFollowUpDate: hoursAgo(30),
    callPendingStartedAt: hoursAgo(54), // 54 hours ago! >= 48h triggers RED OVERDUE alert!
    stageEnteredAt: hoursAgo(54),
    formResponses: {
      firstName: 'Vikramaditya',
      lastName: 'Sengupta',
      education: "Master's in CS / IT",
      university: 'Northeastern University',
      graduationYear: '2016',
      currentLocation: 'Boston, MA',
      visaStatus: 'H1B Visa (Transfer needed)',
      currentEmployer: 'Boston Cloud Innovations',
      totalItExperience: '10',
      noticePeriod: '30 Days',
      relocation: 'No - Remote Only',
      interviewAvailability: 'Evenings after 6 PM EST'
    },
    notes: 'CRITICAL: Call pending timer exceeded 48 hours. Assigned to Priya Sharma. Urgent recruiter follow-up required.',
    stageHistory: [
      {
        stage: 'Documents Received',
        enteredAt: daysAgo(3),
        updatedBy: 'Alex Mercer'
      },
      {
        stage: 'Call Pending',
        enteredAt: hoursAgo(54),
        updatedBy: 'Alex Mercer',
        notes: 'Handed off to Priya Sharma'
      }
    ],
    callLogs: [
      {
        id: 'clog-2',
        candidateId: 'cand-107',
        teammateId: 'tm-3',
        teammateName: 'Priya Sharma',
        callDate: '2026-11-10',
        callTime: '11:00',
        durationMinutes: 1,
        outcome: 'No Answer / Busy',
        notes: 'Line was busy during morning attempt.',
        createdAt: hoursAgo(48)
      }
    ],
    emailLogs: [],
    createdAt: daysAgo(7),
    updatedAt: hoursAgo(48)
  },

  // 8. Call Completed (Successful call logged with feedback)
  {
    id: 'cand-108',
    fullName: 'Rachel Goldberg',
    email: 'rachel.goldberg.data@example.com',
    contactNumber: '+1 (646) 555-1200',
    jobTitle: 'Lead Data Architect (Snowflake & PySpark)',
    jobLocation: 'New York, NY (Hybrid)',
    totalItExperience: '8.5 years',
    relevantExperience: 'Snowflake, PySpark, AWS Redshift to Snowflake migration, dbt core',
    currentLocation: 'New York, NY',
    workAuthorization: 'US Citizen',
    currentEmployer: 'Alpha Financial Data',
    noticePeriod: '2 weeks',
    applicationDate: daysAgo(8),
    linkedInJobOpening: 'LinkedIn Job #885991 - Lead Data Architect',
    assignedTeammateId: 'tm-2',
    assignedTeammateName: 'Marcus Chen',
    assignmentDate: daysAgo(3),
    stage: 'Call Completed',
    resumeStatus: 'Received',
    candidateFormStatus: 'Received',
    identityVerificationStatus: 'Verified',
    lastContactDate: hoursAgo(8),
    nextFollowUpDate: new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
    callPendingStartedAt: daysAgo(2),
    stageEnteredAt: hoursAgo(8),
    formResponses: {
      firstName: 'Rachel',
      lastName: 'Goldberg',
      education: "Master's in CS / IT",
      university: 'Columbia University',
      graduationYear: '2017',
      currentLocation: 'New York, NY',
      visaStatus: 'US Citizen',
      currentEmployer: 'Alpha Financial Data',
      totalItExperience: '8.5',
      noticePeriod: '2 Weeks',
      relocation: 'Already Local',
      interviewAvailability: 'Any day between 12-2 PM EST'
    },
    notes: 'Outstanding technical recruiter phone screen completed by Marcus Chen. Recommend scheduling hiring manager panel.',
    stageHistory: [
      {
        stage: 'Call Pending',
        enteredAt: daysAgo(2),
        updatedBy: 'Marcus Chen'
      },
      {
        stage: 'Call Completed',
        enteredAt: hoursAgo(8),
        updatedBy: 'Marcus Chen',
        notes: 'Call finished successfully with detailed candidate rating: 5/5'
      }
    ],
    callLogs: [
      {
        id: 'clog-3',
        candidateId: 'cand-108',
        teammateId: 'tm-2',
        teammateName: 'Marcus Chen',
        callDate: '2026-11-12',
        callTime: '10:15',
        durationMinutes: 28,
        outcome: 'Completed',
        notes: 'Great conversation. Solid hands-on Snowflake architecture, led migration of 14TB data warehouse. Target comp: $195k + bonus.',
        createdAt: hoursAgo(8)
      }
    ],
    emailLogs: [],
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(8)
  }
];
