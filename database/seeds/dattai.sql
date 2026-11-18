BEGIN;

INSERT INTO company_profile (
  id,
  instance_code,
  legal_name,
  display_name,
  default_timezone,
  default_currency,
  status,
  settings
)
VALUES (
  '22222222-bbbb-4222-8222-222222222222',
  'dattai',
  'Dattai',
  'Dattai',
  'America/Chicago',
  'USD',
  'ACTIVE',
  jsonb_build_object(
    'operations_can_manage_memberships', true,
    'stale_candidate_days', 14,
    'overdue_follow_up_days', 2,
    'require_admin_mfa', true
  )
);

INSERT INTO system_settings (key, value)
VALUES
  ('authentication', '{"public_signup": false, "google_login": true, "password_login": true, "invitation_expiry_hours": 72}'::jsonb),
  ('exports', '{"allowed_roles": ["ADMIN", "OPERATIONS", "AUDITOR"], "expiry_hours": 24}'::jsonb),
  ('document_uploads', '{"max_size_mb": 20, "require_clean_scan": true}'::jsonb);

INSERT INTO streams (code, name, description)
VALUES
  ('JAVA', 'Java', 'Java and JVM engineering'),
  ('DOTNET', '.NET', '.NET and C# engineering'),
  ('DATA', 'Data Engineering', 'Data platforms, analytics, and data engineering'),
  ('QA', 'Quality Assurance', 'Manual and automated quality engineering'),
  ('DEVOPS', 'DevOps', 'Cloud infrastructure, platform, and DevOps engineering'),
  ('SALESFORCE', 'Salesforce', 'Salesforce administration and engineering');

INSERT INTO candidate_sources (code, name)
VALUES
  ('REFERRAL', 'Referral'),
  ('RECRUITER', 'Recruiter Sourcing'),
  ('JOB_BOARD', 'Job Board'),
  ('INTERNAL', 'Internal Transfer'),
  ('VENDOR', 'Vendor');

INSERT INTO skills (name, category)
VALUES
  ('Java', 'Programming Language'),
  ('C#', 'Programming Language'),
  ('Python', 'Programming Language'),
  ('React', 'Frontend'),
  ('PostgreSQL', 'Database'),
  ('AWS', 'Cloud'),
  ('Azure', 'Cloud'),
  ('Selenium', 'Quality Assurance');

INSERT INTO recruitment_groups (code, name, description)
VALUES
  ('JAVA_TEAM', 'Java Team', 'Java recruitment and marketing group'),
  ('DATA_TEAM', 'Data Team', 'Data recruitment and marketing group'),
  ('QA_TEAM', 'QA Team', 'Quality assurance recruitment and marketing group');

COMMIT;

