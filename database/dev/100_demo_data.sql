BEGIN;

INSERT INTO app_users (
  id, email, first_name, last_name, display_name, global_role, status,
  invited_at, activated_at
)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'admin@company.local', 'Avery', 'Admin', 'Avery Admin', 'ADMIN', 'ACTIVE', now(), now()),
  ('00000000-0000-4000-8000-000000000002', 'operations@company.local', 'Olivia', 'Operations', 'Olivia Operations', 'OPERATIONS', 'ACTIVE', now(), now()),
  ('00000000-0000-4000-8000-000000000003', 'auditor@company.local', 'Ari', 'Auditor', 'Ari Auditor', 'AUDITOR', 'ACTIVE', now(), now()),
  ('00000000-0000-4000-8000-000000000011', 'java.lead@company.local', 'Jordan', 'Lee', 'Jordan Lee', 'STANDARD', 'ACTIVE', now(), now()),
  ('00000000-0000-4000-8000-000000000012', 'java.recruiter@company.local', 'Riley', 'Chen', 'Riley Chen', 'STANDARD', 'ACTIVE', now(), now()),
  ('00000000-0000-4000-8000-000000000021', 'data.lead@company.local', 'Morgan', 'Patel', 'Morgan Patel', 'STANDARD', 'ACTIVE', now(), now()),
  ('00000000-0000-4000-8000-000000000022', 'data.viewer@company.local', 'Taylor', 'Kim', 'Taylor Kim', 'STANDARD', 'ACTIVE', now(), now()),
  ('00000000-0000-4000-8000-000000000031', 'qa.marketing@company.local', 'Casey', 'Davis', 'Casey Davis', 'STANDARD', 'ACTIVE', now(), now())
ON CONFLICT (email) DO UPDATE
SET display_name = EXCLUDED.display_name,
    global_role = EXCLUDED.global_role,
    status = 'ACTIVE',
    activated_at = coalesce(app_users.activated_at, now()),
    deactivated_at = null,
    deactivated_by_user_id = null;

INSERT INTO group_memberships (
  id, group_id, user_id, membership_role, assigned_by_user_id, reason
)
SELECT membership_id, groups.id, user_id, membership_role::group_membership_role,
       '00000000-0000-4000-8000-000000000001'::uuid, 'Local demonstration access'
FROM (
  VALUES
    ('01000000-0000-4000-8000-000000000011'::uuid, 'JAVA_TEAM', '00000000-0000-4000-8000-000000000011'::uuid, 'LEAD'),
    ('01000000-0000-4000-8000-000000000012'::uuid, 'JAVA_TEAM', '00000000-0000-4000-8000-000000000012'::uuid, 'RECRUITER'),
    ('01000000-0000-4000-8000-000000000021'::uuid, 'DATA_TEAM', '00000000-0000-4000-8000-000000000021'::uuid, 'LEAD'),
    ('01000000-0000-4000-8000-000000000022'::uuid, 'DATA_TEAM', '00000000-0000-4000-8000-000000000022'::uuid, 'VIEWER'),
    ('01000000-0000-4000-8000-000000000031'::uuid, 'QA_TEAM', '00000000-0000-4000-8000-000000000031'::uuid, 'MARKETING')
) access(membership_id, group_code, user_id, membership_role)
JOIN recruitment_groups groups ON groups.code = access.group_code
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidates (
  id, candidate_number, first_name, last_name, email, phone, primary_stream_id,
  professional_title, summary, total_experience_months, current_location,
  work_authorization, employment_preference, lifecycle_state, current_group_id,
  current_owner_user_id, lifecycle_entered_at, last_activity_at, availability_date,
  profile_completeness, created_by_user_id, created_at
)
SELECT
  seed.candidate_id, seed.candidate_number, seed.first_name, seed.last_name,
  seed.email::citext, seed.phone, streams.id, seed.title, seed.summary,
  seed.experience_months, seed.location, seed.auth_status,
  seed.employment_preference, seed.lifecycle_state::candidate_lifecycle_state, groups.id,
  seed.owner_user_id, seed.lifecycle_entered_at, seed.last_activity_at,
  seed.availability_date, seed.completeness,
  '00000000-0000-4000-8000-000000000001'::uuid, seed.created_at
FROM (
  VALUES
    ('10000000-0000-4000-8000-000000000001'::uuid, 'C-DEMO01', 'Priya', 'Sharma', 'priya.sharma@example.com', '+1 312 555 0101', 'JAVA', 'Senior Java Engineer', 'Backend engineer specializing in Java, Spring Boot, and AWS.', 96, 'Chicago, IL', 'H-1B', 'Contract', 'INTERVIEWING', 'JAVA_TEAM', '00000000-0000-4000-8000-000000000012'::uuid, now() - interval '2 days', now() - interval '3 hours', current_date + 7, 92, now() - interval '45 days'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'C-DEMO02', 'Noah', 'Williams', 'noah.williams@example.com', '+1 469 555 0102', 'DATA', 'Data Engineer', 'Data engineer working across Python, PostgreSQL, and cloud pipelines.', 60, 'Dallas, TX', 'US Citizen', 'Contract', 'BENCH', 'DATA_TEAM', '00000000-0000-4000-8000-000000000021'::uuid, now() - interval '8 days', now() - interval '1 day', current_date, 86, now() - interval '30 days'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'C-DEMO03', 'Emma', 'Garcia', 'emma.garcia@example.com', '+1 512 555 0103', 'QA', 'QA Automation Engineer', 'Automation specialist with Selenium and API testing experience.', 72, 'Austin, TX', 'Green Card', 'Contract', 'MARKETING_ACTIVE', 'QA_TEAM', '00000000-0000-4000-8000-000000000031'::uuid, now() - interval '5 days', now() - interval '6 hours', current_date + 3, 88, now() - interval '21 days'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'C-DEMO04', 'Liam', 'Johnson', 'liam.johnson@example.com', '+1 773 555 0104', 'JAVA', 'Java Technical Lead', 'Technical lead with distributed systems and financial services experience.', 132, 'Chicago, IL', 'US Citizen', 'Contract', 'PLACED', 'JAVA_TEAM', '00000000-0000-4000-8000-000000000011'::uuid, now() - interval '12 days', now() - interval '2 days', current_date - 14, 96, now() - interval '120 days')
) seed(candidate_id, candidate_number, first_name, last_name, email, phone, stream_code,
       title, summary, experience_months, location, auth_status, employment_preference,
       lifecycle_state, group_code, owner_user_id, lifecycle_entered_at, last_activity_at,
       availability_date, completeness, created_at)
JOIN streams ON streams.code = seed.stream_code
JOIN recruitment_groups groups ON groups.code = seed.group_code
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidate_group_assignments (
  id, candidate_id, group_id, assigned_by_user_id, reason, owner_user_id_at_start, started_at
)
SELECT assignment_id, candidate_id, groups.id,
       '00000000-0000-4000-8000-000000000001'::uuid,
       'Initial group assignment', owner_user_id, started_at
FROM (
  VALUES
    ('11000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'JAVA_TEAM', '00000000-0000-4000-8000-000000000012'::uuid, now() - interval '45 days'),
    ('11000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, 'DATA_TEAM', '00000000-0000-4000-8000-000000000021'::uuid, now() - interval '30 days'),
    ('11000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, 'QA_TEAM', '00000000-0000-4000-8000-000000000031'::uuid, now() - interval '21 days'),
    ('11000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, 'JAVA_TEAM', '00000000-0000-4000-8000-000000000011'::uuid, now() - interval '120 days')
) seed(assignment_id, candidate_id, group_code, owner_user_id, started_at)
JOIN recruitment_groups groups ON groups.code = seed.group_code
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidate_owner_assignments (
  id, candidate_id, group_id, owner_user_id, changed_by_user_id, reason, started_at
)
SELECT assignment_id, candidate_id, groups.id, owner_user_id,
       '00000000-0000-4000-8000-000000000001'::uuid, 'Initial candidate owner', started_at
FROM (
  VALUES
    ('12000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'JAVA_TEAM', '00000000-0000-4000-8000-000000000012'::uuid, now() - interval '45 days'),
    ('12000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, 'DATA_TEAM', '00000000-0000-4000-8000-000000000021'::uuid, now() - interval '30 days'),
    ('12000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, 'QA_TEAM', '00000000-0000-4000-8000-000000000031'::uuid, now() - interval '21 days'),
    ('12000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, 'JAVA_TEAM', '00000000-0000-4000-8000-000000000011'::uuid, now() - interval '120 days')
) seed(assignment_id, candidate_id, group_code, owner_user_id, started_at)
JOIN recruitment_groups groups ON groups.code = seed.group_code
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidate_status_history (
  id, candidate_id, from_state, to_state, reason_text, changed_by_user_id, changed_at
)
VALUES
  ('13000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 'INTAKE', 'Candidate added', '00000000-0000-4000-8000-000000000012', now() - interval '45 days'),
  ('13000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'INTAKE', 'SCREENING', 'Initial screening started', '00000000-0000-4000-8000-000000000012', now() - interval '40 days'),
  ('13000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'SCREENING', 'BENCH', 'Screening completed', '00000000-0000-4000-8000-000000000012', now() - interval '32 days'),
  ('13000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'BENCH', 'MARKETING_READY', 'Profile approved for marketing', '00000000-0000-4000-8000-000000000011', now() - interval '20 days'),
  ('13000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'MARKETING_READY', 'MARKETING_ACTIVE', 'Marketing launched', '00000000-0000-4000-8000-000000000012', now() - interval '14 days'),
  ('13000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'MARKETING_ACTIVE', 'INTERVIEWING', 'Client interview requested', '00000000-0000-4000-8000-000000000012', now() - interval '2 days'),
  ('13000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', null, 'INTAKE', 'Candidate added', '00000000-0000-4000-8000-000000000021', now() - interval '30 days'),
  ('13000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000002', 'INTAKE', 'SCREENING', 'Screening started', '00000000-0000-4000-8000-000000000021', now() - interval '25 days'),
  ('13000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000002', 'SCREENING', 'BENCH', 'Available for deployment', '00000000-0000-4000-8000-000000000021', now() - interval '8 days'),
  ('13000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000003', null, 'MARKETING_READY', 'Imported marketing-ready candidate', '00000000-0000-4000-8000-000000000031', now() - interval '21 days'),
  ('13000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000003', 'MARKETING_READY', 'MARKETING_ACTIVE', 'Profile submitted to market', '00000000-0000-4000-8000-000000000031', now() - interval '5 days'),
  ('13000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000004', null, 'INTAKE', 'Candidate added', '00000000-0000-4000-8000-000000000011', now() - interval '120 days'),
  ('13000000-0000-4000-8000-000000000032', '10000000-0000-4000-8000-000000000004', 'INTAKE', 'BENCH', 'Existing consultant onboarded', '00000000-0000-4000-8000-000000000011', now() - interval '110 days'),
  ('13000000-0000-4000-8000-000000000033', '10000000-0000-4000-8000-000000000004', 'BENCH', 'MARKETING_ACTIVE', 'Marketing started', '00000000-0000-4000-8000-000000000011', now() - interval '90 days'),
  ('13000000-0000-4000-8000-000000000034', '10000000-0000-4000-8000-000000000004', 'MARKETING_ACTIVE', 'INTERVIEWING', 'Client interview', '00000000-0000-4000-8000-000000000011', now() - interval '70 days'),
  ('13000000-0000-4000-8000-000000000035', '10000000-0000-4000-8000-000000000004', 'INTERVIEWING', 'OFFERED', 'Offer received', '00000000-0000-4000-8000-000000000011', now() - interval '45 days'),
  ('13000000-0000-4000-8000-000000000036', '10000000-0000-4000-8000-000000000004', 'OFFERED', 'PLACED', 'Offer accepted and placement started', '00000000-0000-4000-8000-000000000011', now() - interval '12 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidate_notes (id, candidate_id, body, visibility, author_user_id, created_at)
VALUES
  ('14000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Candidate prefers hybrid roles in the Chicago area and can interview after 2 PM CT.', 'NORMAL', '00000000-0000-4000-8000-000000000012', now() - interval '10 days'),
  ('14000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Internal rate discussion is pending operations approval.', 'OPERATIONS_ONLY', '00000000-0000-4000-8000-000000000002', now() - interval '9 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendors (id, name, website, created_by_user_id)
VALUES ('20000000-0000-4000-8000-000000000001', 'Northstar Staffing', 'https://example.com', '00000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, name, website, created_by_user_id)
VALUES ('21000000-0000-4000-8000-000000000001', 'Acme Financial', 'https://example.com', '00000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO submissions (
  id, candidate_id, vendor_id, client_id, group_id_at_creation,
  owner_user_id_at_creation, submitted_by_user_id, status, submitted_at,
  external_reference, created_at
)
SELECT '22000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000004',
       '20000000-0000-4000-8000-000000000001',
       '21000000-0000-4000-8000-000000000001', groups.id,
       '00000000-0000-4000-8000-000000000011',
       '00000000-0000-4000-8000-000000000011', 'ACCEPTED',
       now() - interval '85 days', 'NS-ACME-1042', now() - interval '86 days'
FROM recruitment_groups groups WHERE groups.code = 'JAVA_TEAM'
ON CONFLICT (id) DO NOTHING;

INSERT INTO submission_status_history (
  id, submission_id, from_status, to_status, reason_text, changed_by_user_id, changed_at
)
VALUES
  ('23000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', 'DRAFT', 'SUBMITTED', 'Submitted to vendor', '00000000-0000-4000-8000-000000000011', now() - interval '85 days'),
  ('23000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000001', 'SUBMITTED', 'INTERVIEWING', 'Client requested interview', '00000000-0000-4000-8000-000000000011', now() - interval '70 days'),
  ('23000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000001', 'INTERVIEWING', 'OFFERED', 'Client issued offer', '00000000-0000-4000-8000-000000000011', now() - interval '45 days'),
  ('23000000-0000-4000-8000-000000000004', '22000000-0000-4000-8000-000000000001', 'OFFERED', 'ACCEPTED', 'Candidate accepted', '00000000-0000-4000-8000-000000000011', now() - interval '35 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO interviews (
  id, candidate_id, submission_id, round_number, round_label, interview_type,
  scheduled_start_at, scheduled_end_at, original_timezone, method, status, result,
  feedback, created_by_user_id, created_at
)
VALUES (
  '24000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004',
  '22000000-0000-4000-8000-000000000001', 1, 'Technical round', 'Technical',
  now() - interval '60 days', now() - interval '60 days' + interval '1 hour',
  'America/Chicago', 'Video', 'COMPLETED', 'PASSED',
  'Strong architecture and communication skills.', '00000000-0000-4000-8000-000000000011',
  now() - interval '68 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO offers (
  id, candidate_id, submission_id, status, role_title, client_id, vendor_id,
  location, employment_type, pay_rate, bill_rate, start_date, sent_at,
  responded_at, created_by_user_id, created_at
)
VALUES (
  '25000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004',
  '22000000-0000-4000-8000-000000000001', 'ACCEPTED', 'Java Technical Lead',
  '21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
  'Chicago, IL', 'Contract', 82, 125, current_date - 12,
  now() - interval '45 days', now() - interval '35 days',
  '00000000-0000-4000-8000-000000000011', now() - interval '46 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO offer_status_history (
  id, offer_id, from_status, to_status, reason, changed_by_user_id, changed_at
)
VALUES
  ('26000000-0000-4000-8000-000000000001', '25000000-0000-4000-8000-000000000001', 'DRAFT', 'SENT', 'Offer sent to candidate', '00000000-0000-4000-8000-000000000011', now() - interval '45 days'),
  ('26000000-0000-4000-8000-000000000002', '25000000-0000-4000-8000-000000000001', 'SENT', 'ACCEPTED', 'Candidate accepted offer', '00000000-0000-4000-8000-000000000011', now() - interval '35 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO placements (
  id, candidate_id, offer_id, submission_id, client_id, vendor_id,
  group_id_at_placement, status, role_title, employment_type, location,
  pay_rate, bill_rate, start_date, created_by_user_id, created_at
)
SELECT '27000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000004',
       '25000000-0000-4000-8000-000000000001',
       '22000000-0000-4000-8000-000000000001',
       '21000000-0000-4000-8000-000000000001',
       '20000000-0000-4000-8000-000000000001', groups.id,
       'ACTIVE', 'Java Technical Lead', 'Contract', 'Chicago, IL',
       82, 125, current_date - 12, '00000000-0000-4000-8000-000000000011',
       now() - interval '34 days'
FROM recruitment_groups groups WHERE groups.code = 'JAVA_TEAM'
ON CONFLICT (id) DO NOTHING;

INSERT INTO placement_status_history (
  id, placement_id, from_status, to_status, reason, changed_by_user_id, changed_at
)
VALUES
  ('28000000-0000-4000-8000-000000000001', '27000000-0000-4000-8000-000000000001', null, 'PLANNED', 'Placement scheduled', '00000000-0000-4000-8000-000000000011', now() - interval '34 days'),
  ('28000000-0000-4000-8000-000000000002', '27000000-0000-4000-8000-000000000001', 'PLANNED', 'ACTIVE', 'Consultant started', '00000000-0000-4000-8000-000000000011', now() - interval '12 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity_events (
  id, candidate_id, entity_type, entity_id, event_type, actor_user_id,
  group_id_at_event, summary, metadata, occurred_at
)
SELECT '29000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000001', 'candidate',
       '10000000-0000-4000-8000-000000000001', 'FOLLOW_UP_COMPLETED',
       '00000000-0000-4000-8000-000000000012', groups.id,
       'Completed candidate availability follow-up',
       '{"channel":"phone","outcome":"available"}'::jsonb,
       now() - interval '3 hours'
FROM recruitment_groups groups WHERE groups.code = 'JAVA_TEAM'
ON CONFLICT (id) DO NOTHING;

COMMIT;
