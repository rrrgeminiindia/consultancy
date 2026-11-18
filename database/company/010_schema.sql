BEGIN;

CREATE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;

CREATE SEQUENCE candidate_number_seq START WITH 1;

CREATE FUNCTION next_candidate_number()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT 'C-' || lpad(nextval('candidate_number_seq')::text, 6, '0');
$$;

CREATE TABLE company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_code text NOT NULL UNIQUE CHECK (instance_code ~ '^[a-z][a-z0-9_-]{2,62}$'),
  legal_name text NOT NULL CHECK (btrim(legal_name) <> ''),
  display_name text NOT NULL CHECK (btrim(display_name) <> ''),
  default_timezone text NOT NULL DEFAULT 'UTC',
  default_currency char(3) NOT NULL DEFAULT 'USD',
  logo_storage_key text,
  status company_status NOT NULL DEFAULT 'ACTIVE',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_company_profile_singleton ON company_profile ((true));

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  first_name text NOT NULL CHECK (btrim(first_name) <> ''),
  last_name text NOT NULL CHECK (btrim(last_name) <> ''),
  display_name text NOT NULL CHECK (btrim(display_name) <> ''),
  global_role user_global_role NOT NULL DEFAULT 'STANDARD',
  status user_status NOT NULL DEFAULT 'INVITED',
  timezone text NOT NULL DEFAULT 'UTC',
  last_login_at timestamptz,
  invited_at timestamptz,
  activated_at timestamptz,
  deactivated_at timestamptz,
  deactivated_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT app_user_deactivation_consistency CHECK (
    (status = 'DEACTIVATED' AND deactivated_at IS NOT NULL)
    OR status <> 'DEACTIVATED'
  ),
  CONSTRAINT app_user_activation_consistency CHECK (
    (status = 'ACTIVE' AND activated_at IS NOT NULL)
    OR status <> 'ACTIVE'
  )
);

ALTER TABLE app_users
  ADD CONSTRAINT fk_app_users_deactivated_by
  FOREIGN KEY (deactivated_by_user_id) REFERENCES app_users(id) ON DELETE RESTRICT;

CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_by_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (btrim(provider) <> ''),
  issuer text NOT NULL CHECK (btrim(issuer) <> ''),
  external_subject text NOT NULL CHECK (btrim(external_subject) <> ''),
  provider_email citext NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  last_authenticated_at timestamptz,
  disabled_at timestamptz,
  UNIQUE (issuer, external_subject)
);

CREATE INDEX ix_user_identities_user ON user_identities (user_id);

CREATE TABLE user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  requested_global_role user_global_role NOT NULL DEFAULT 'STANDARD',
  token_hash text,
  provider_invitation_id text,
  status invitation_status NOT NULL DEFAULT 'PENDING',
  expires_at timestamptz NOT NULL,
  invited_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  accepted_by_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT invitation_token_source CHECK (
    token_hash IS NOT NULL OR provider_invitation_id IS NOT NULL
  ),
  CONSTRAINT invitation_acceptance_consistency CHECK (
    (status = 'ACCEPTED' AND accepted_by_user_id IS NOT NULL AND accepted_at IS NOT NULL)
    OR status <> 'ACCEPTED'
  ),
  CONSTRAINT invitation_revocation_consistency CHECK (
    (status = 'REVOKED' AND revoked_at IS NOT NULL)
    OR status <> 'REVOKED'
  )
);

CREATE UNIQUE INDEX uq_pending_invitation_email
  ON user_invitations (email)
  WHERE status = 'PENDING';

CREATE TABLE user_global_role_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  from_role user_global_role,
  to_role user_global_role NOT NULL,
  changed_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (btrim(reason) <> ''),
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recruitment_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z][A-Z0-9_-]{1,31}$'),
  name citext NOT NULL UNIQUE,
  description text,
  status group_status NOT NULL DEFAULT 'ACTIVE',
  created_by_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES recruitment_groups(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  membership_role group_membership_role NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  assigned_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  ended_by_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  reason text,
  CONSTRAINT membership_period CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT membership_end_reason CHECK (
    ended_at IS NULL OR (ended_by_user_id IS NOT NULL AND btrim(coalesce(reason, '')) <> '')
  )
);

CREATE UNIQUE INDEX uq_group_membership_active
  ON group_memberships (group_id, user_id)
  WHERE ended_at IS NULL;

CREATE INDEX ix_group_membership_user_active
  ON group_memberships (user_id, group_id)
  WHERE ended_at IS NULL;

CREATE TABLE invitation_group_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES user_invitations(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES recruitment_groups(id) ON DELETE RESTRICT,
  membership_role group_membership_role NOT NULL,
  UNIQUE (invitation_id, group_id)
);

CREATE TABLE streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z][A-Z0-9_-]{1,31}$'),
  name citext NOT NULL UNIQUE,
  description text,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  created_by_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE candidate_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z][A-Z0-9_-]{1,31}$'),
  name citext NOT NULL UNIQUE,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE,
  category text,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_number text NOT NULL UNIQUE DEFAULT next_candidate_number(),
  first_name text NOT NULL CHECK (btrim(first_name) <> ''),
  middle_name text,
  last_name text NOT NULL CHECK (btrim(last_name) <> ''),
  preferred_name text,
  email citext,
  normalized_email text,
  phone text,
  normalized_phone text,
  alternate_phone text,
  primary_stream_id uuid REFERENCES streams(id) ON DELETE RESTRICT,
  professional_title text,
  summary text,
  marketing_summary text,
  total_experience_months integer CHECK (total_experience_months IS NULL OR total_experience_months >= 0),
  relevant_experience_months integer CHECK (relevant_experience_months IS NULL OR relevant_experience_months >= 0),
  city text,
  state_region text,
  country text,
  postal_code text,
  current_location text,
  relocation_preference text,
  remote_preference text,
  work_authorization text,
  authorization_expiry date,
  employment_preference text,
  current_pay_rate numeric(12,2) CHECK (current_pay_rate IS NULL OR current_pay_rate >= 0),
  target_pay_rate numeric(12,2) CHECK (target_pay_rate IS NULL OR target_pay_rate >= 0),
  target_bill_rate numeric(12,2) CHECK (target_bill_rate IS NULL OR target_bill_rate >= 0),
  currency char(3) NOT NULL DEFAULT 'USD',
  availability_date date,
  notice_period_days integer CHECK (notice_period_days IS NULL OR notice_period_days >= 0),
  lifecycle_state candidate_lifecycle_state NOT NULL DEFAULT 'INTAKE',
  current_group_id uuid REFERENCES recruitment_groups(id) ON DELETE RESTRICT,
  current_owner_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  lifecycle_entered_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  source_id uuid REFERENCES candidate_sources(id) ON DELETE RESTRICT,
  source_detail text,
  referred_by text,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_completeness smallint NOT NULL DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  archived_by_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  CONSTRAINT candidate_owner_requires_group CHECK (
    current_owner_user_id IS NULL OR current_group_id IS NOT NULL
  ),
  CONSTRAINT candidate_archive_consistency CHECK (
    (lifecycle_state = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL)
    OR lifecycle_state <> 'ARCHIVED'
  )
);

CREATE TABLE candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  years_experience numeric(4,1) CHECK (years_experience IS NULL OR years_experience >= 0),
  proficiency skill_proficiency,
  is_primary boolean NOT NULL DEFAULT false,
  last_used_year smallint CHECK (last_used_year IS NULL OR last_used_year BETWEEN 1950 AND 2200),
  UNIQUE (candidate_id, skill_id)
);

CREATE TABLE candidate_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  employer_name text NOT NULL,
  role_title text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_experience_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE candidate_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_year smallint CHECK (start_year IS NULL OR start_year BETWEEN 1900 AND 2200),
  completion_year smallint CHECK (completion_year IS NULL OR completion_year BETWEEN 1900 AND 2200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_education_years CHECK (
    completion_year IS NULL OR start_year IS NULL OR completion_year >= start_year
  )
);

CREATE TABLE candidate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  category document_category NOT NULL,
  storage_key text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 text NOT NULL,
  version_number integer NOT NULL DEFAULT 1 CHECK (version_number > 0),
  is_current boolean NOT NULL DEFAULT true,
  visibility content_visibility NOT NULL DEFAULT 'NORMAL',
  scan_status scan_status NOT NULL DEFAULT 'PENDING',
  uploaded_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (candidate_id, category, version_number)
);

CREATE UNIQUE INDEX uq_candidate_current_document_category
  ON candidate_documents (candidate_id, category)
  WHERE is_current AND archived_at IS NULL;

CREATE TABLE candidate_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  name text NOT NULL,
  issuer text,
  issued_date date,
  expiry_date date,
  credential_id text,
  document_id uuid REFERENCES candidate_documents(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT certification_dates CHECK (expiry_date IS NULL OR issued_date IS NULL OR expiry_date >= issued_date)
);

CREATE TABLE candidate_group_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES recruitment_groups(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  assigned_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  ended_by_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (btrim(reason) <> ''),
  transfer_note text,
  owner_user_id_at_start uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  CONSTRAINT candidate_group_assignment_period CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT candidate_group_assignment_end_actor CHECK (ended_at IS NULL OR ended_by_user_id IS NOT NULL)
);

CREATE UNIQUE INDEX uq_candidate_one_active_group
  ON candidate_group_assignments (candidate_id)
  WHERE ended_at IS NULL;

CREATE INDEX ix_candidate_group_active_group
  ON candidate_group_assignments (group_id, candidate_id)
  WHERE ended_at IS NULL;

CREATE TABLE candidate_owner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES recruitment_groups(id) ON DELETE RESTRICT,
  owner_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  changed_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  reason text,
  CONSTRAINT candidate_owner_assignment_period CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE UNIQUE INDEX uq_candidate_one_active_owner
  ON candidate_owner_assignments (candidate_id)
  WHERE ended_at IS NULL;

CREATE TABLE candidate_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  from_state candidate_lifecycle_state,
  to_state candidate_lifecycle_state NOT NULL,
  reason_code text,
  reason_text text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  changed_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE candidate_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (btrim(body) <> ''),
  visibility content_visibility NOT NULL DEFAULT 'NORMAL',
  author_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  supersedes_note_id uuid REFERENCES candidate_notes(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE,
  website text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  notes text,
  created_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE vendor_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  first_name text NOT NULL,
  last_name text NOT NULL,
  title text,
  email citext,
  phone text,
  is_preferred boolean NOT NULL DEFAULT false,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE,
  website text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  notes text,
  created_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  first_name text NOT NULL,
  last_name text NOT NULL,
  title text,
  email citext,
  phone text,
  is_preferred boolean NOT NULL DEFAULT false,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE job_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_reference text,
  title text NOT NULL,
  description text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE RESTRICT,
  vendor_id uuid REFERENCES vendors(id) ON DELETE RESTRICT,
  location text,
  work_arrangement text,
  employment_type text,
  minimum_experience_months integer CHECK (minimum_experience_months IS NULL OR minimum_experience_months >= 0),
  rate_min numeric(12,2) CHECK (rate_min IS NULL OR rate_min >= 0),
  rate_max numeric(12,2) CHECK (rate_max IS NULL OR rate_max >= 0),
  currency char(3) NOT NULL DEFAULT 'USD',
  openings integer NOT NULL DEFAULT 1 CHECK (openings > 0),
  status job_status NOT NULL DEFAULT 'DRAFT',
  opened_at timestamptz,
  closed_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT job_rate_range CHECK (rate_max IS NULL OR rate_min IS NULL OR rate_max >= rate_min)
);

CREATE TABLE job_required_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_requirement_id uuid NOT NULL REFERENCES job_requirements(id) ON DELETE RESTRICT,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  is_mandatory boolean NOT NULL DEFAULT true,
  minimum_years numeric(4,1) CHECK (minimum_years IS NULL OR minimum_years >= 0),
  UNIQUE (job_requirement_id, skill_id)
);

CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  vendor_contact_id uuid REFERENCES vendor_contacts(id) ON DELETE RESTRICT,
  client_id uuid REFERENCES clients(id) ON DELETE RESTRICT,
  job_requirement_id uuid REFERENCES job_requirements(id) ON DELETE RESTRICT,
  group_id_at_creation uuid NOT NULL REFERENCES recruitment_groups(id) ON DELETE RESTRICT,
  owner_user_id_at_creation uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  submitted_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  status submission_status NOT NULL DEFAULT 'DRAFT',
  submitted_at timestamptz,
  rate numeric(12,2) CHECK (rate IS NULL OR rate >= 0),
  currency char(3) NOT NULL DEFAULT 'USD',
  employment_type text,
  external_reference text,
  notes text,
  last_follow_up_at timestamptz,
  next_follow_up_at timestamptz,
  rejection_reason_code text,
  rejection_reason_text text,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT submission_submitted_at_required CHECK (
    status = 'DRAFT' OR submitted_at IS NOT NULL
  ),
  CONSTRAINT submission_rejection_reason CHECK (
    status <> 'REJECTED' OR btrim(coalesce(rejection_reason_text, '')) <> ''
  )
);

CREATE UNIQUE INDEX uq_submission_active_opportunity
  ON submissions (candidate_id, vendor_id, job_requirement_id) NULLS NOT DISTINCT
  WHERE archived_at IS NULL
    AND status NOT IN ('ACCEPTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED');

CREATE TABLE submission_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  from_status submission_status,
  to_status submission_status NOT NULL,
  reason_code text,
  reason_text text,
  changed_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE marketing_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  submission_id uuid REFERENCES submissions(id) ON DELETE RESTRICT,
  vendor_id uuid REFERENCES vendors(id) ON DELETE RESTRICT,
  activity_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  outcome text,
  notes text,
  next_follow_up_at timestamptz,
  performed_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT
);

CREATE TABLE interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  round_number integer NOT NULL CHECK (round_number > 0),
  round_label text NOT NULL,
  interview_type text NOT NULL,
  scheduled_start_at timestamptz NOT NULL,
  scheduled_end_at timestamptz NOT NULL,
  original_timezone text NOT NULL,
  method text NOT NULL,
  location_or_link text,
  interviewer_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions text,
  status interview_status NOT NULL DEFAULT 'SCHEDULED',
  result interview_result,
  feedback text,
  next_step text,
  follow_up_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  archived_at timestamptz,
  UNIQUE (submission_id, round_number),
  CONSTRAINT interview_schedule CHECK (scheduled_end_at > scheduled_start_at),
  CONSTRAINT interview_result_requires_completion CHECK (
    result IS NULL OR status IN ('COMPLETED', 'PENDING_FEEDBACK', 'CANCELLED')
  )
);

CREATE TABLE interview_schedule_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE RESTRICT,
  old_start_at timestamptz NOT NULL,
  old_end_at timestamptz NOT NULL,
  old_timezone text NOT NULL,
  new_start_at timestamptz NOT NULL,
  new_end_at timestamptz NOT NULL,
  new_timezone text NOT NULL,
  reason text NOT NULL,
  changed_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE RESTRICT,
  submission_id uuid REFERENCES submissions(id) ON DELETE RESTRICT,
  interview_id uuid REFERENCES interviews(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  task_type text NOT NULL,
  priority task_priority NOT NULL DEFAULT 'NORMAL',
  status task_status NOT NULL DEFAULT 'OPEN',
  assignee_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  due_at timestamptz,
  completed_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_parent_required CHECK (num_nonnulls(candidate_id, submission_id, interview_id) >= 1),
  CONSTRAINT task_completion_consistency CHECK (
    (status = 'COMPLETED' AND completed_at IS NOT NULL)
    OR status <> 'COMPLETED'
  )
);

CREATE TABLE offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  status offer_status NOT NULL DEFAULT 'DRAFT',
  role_title text NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  vendor_id uuid REFERENCES vendors(id) ON DELETE RESTRICT,
  location text,
  employment_type text NOT NULL,
  pay_rate numeric(12,2) CHECK (pay_rate IS NULL OR pay_rate >= 0),
  bill_rate numeric(12,2) CHECK (bill_rate IS NULL OR bill_rate >= 0),
  currency char(3) NOT NULL DEFAULT 'USD',
  start_date date,
  end_date date,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  offer_document_id uuid REFERENCES candidate_documents(id) ON DELETE RESTRICT,
  sent_at timestamptz,
  responded_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  archived_at timestamptz,
  CONSTRAINT offer_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE offer_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
  from_status offer_status,
  to_status offer_status NOT NULL,
  reason text,
  changed_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
  offer_id uuid REFERENCES offers(id) ON DELETE RESTRICT,
  submission_id uuid REFERENCES submissions(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  vendor_id uuid REFERENCES vendors(id) ON DELETE RESTRICT,
  job_requirement_id uuid REFERENCES job_requirements(id) ON DELETE RESTRICT,
  group_id_at_placement uuid NOT NULL REFERENCES recruitment_groups(id) ON DELETE RESTRICT,
  status placement_status NOT NULL DEFAULT 'PLANNED',
  role_title text NOT NULL,
  employment_type text NOT NULL,
  location text,
  pay_rate numeric(12,2) CHECK (pay_rate IS NULL OR pay_rate >= 0),
  bill_rate numeric(12,2) CHECK (bill_rate IS NULL OR bill_rate >= 0),
  currency char(3) NOT NULL DEFAULT 'USD',
  start_date date NOT NULL,
  end_date date,
  actual_end_date date,
  completion_reason text,
  created_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  archived_at timestamptz,
  CONSTRAINT placement_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT placement_actual_end CHECK (actual_end_date IS NULL OR actual_end_date >= start_date),
  CONSTRAINT placement_completion_reason CHECK (
    status NOT IN ('COMPLETED', 'CANCELLED') OR btrim(coalesce(completion_reason, '')) <> ''
  )
);

CREATE TABLE placement_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES placements(id) ON DELETE RESTRICT,
  from_status placement_status,
  to_status placement_status NOT NULL,
  reason text,
  changed_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  field_key text NOT NULL CHECK (field_key ~ '^[a-z][a-z0-9_]{1,62}$'),
  label text NOT NULL,
  data_type text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  is_filterable boolean NOT NULL DEFAULT false,
  is_sensitive boolean NOT NULL DEFAULT false,
  visible_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, field_key)
);

CREATE TABLE activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  group_id_at_event uuid REFERENCES recruitment_groups(id) ON DELETE RESTRICT,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  actor_identity_subject text,
  actor_ip inet,
  user_agent text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  candidate_id uuid REFERENCES candidates(id) ON DELETE RESTRICT,
  before_data jsonb,
  after_data jsonb,
  reason text,
  request_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  status outbox_status NOT NULL DEFAULT 'PENDING',
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, name)
);

CREATE TABLE import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key text NOT NULL,
  uploaded_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  status job_run_status NOT NULL DEFAULT 'PENDING',
  total_rows integer NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  successful_rows integer NOT NULL DEFAULT 0 CHECK (successful_rows >= 0),
  failed_rows integer NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE import_job_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL CHECK (row_number > 0),
  normalized_input jsonb NOT NULL,
  status text NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE RESTRICT,
  duplicate_candidate_id uuid REFERENCES candidates(id) ON DELETE RESTRICT,
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  processed_at timestamptz,
  UNIQUE (import_job_id, row_number)
);

CREATE TABLE export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  authorization_snapshot jsonb NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  status job_run_status NOT NULL DEFAULT 'PENDING',
  storage_key text,
  checksum_sha256 text,
  row_count integer CHECK (row_count IS NULL OR row_count >= 0),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  operation text NOT NULL,
  request_hash text NOT NULL,
  response_status integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE (user_id, operation, idempotency_key)
);

COMMIT;

