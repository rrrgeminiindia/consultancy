BEGIN;

CREATE FUNCTION protect_final_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.global_role = 'ADMIN'
     AND OLD.status = 'ACTIVE'
     AND (
       TG_OP = 'DELETE'
       OR NEW.global_role <> 'ADMIN'
       OR NEW.status <> 'ACTIVE'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM app_users
       WHERE id <> OLD.id
         AND global_role = 'ADMIN'
         AND status = 'ACTIVE'
     )
  THEN
    RAISE EXCEPTION 'Cannot remove the final active company administrator';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION normalize_candidate_contacts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.normalized_email := CASE
    WHEN NEW.email IS NULL THEN NULL
    ELSE lower(btrim(NEW.email::text))
  END;

  NEW.normalized_phone := CASE
    WHEN NEW.phone IS NULL THEN NULL
    ELSE nullif(regexp_replace(NEW.phone, '[^0-9+]', '', 'g'), '')
  END;

  RETURN NEW;
END;
$$;

CREATE FUNCTION protect_group_with_active_candidates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'ACTIVE'
     AND NEW.status <> 'ACTIVE'
     AND EXISTS (
       SELECT 1
       FROM candidate_group_assignments
       WHERE group_id = OLD.id
         AND ended_at IS NULL
     )
  THEN
    RAISE EXCEPTION 'Cannot deactivate or archive a group with active candidate assignments';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION assert_candidate_group_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  candidate_uuid uuid;
  projected_group uuid;
  active_group uuid;
  active_group_status group_status;
BEGIN
  IF TG_TABLE_NAME = 'candidates' THEN
    candidate_uuid := COALESCE(NEW.id, OLD.id);
  ELSE
    candidate_uuid := COALESCE(NEW.candidate_id, OLD.candidate_id);
  END IF;

  SELECT current_group_id
  INTO projected_group
  FROM candidates
  WHERE id = candidate_uuid;

  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  SELECT assignment.group_id, recruitment_groups.status
  INTO active_group, active_group_status
  FROM candidate_group_assignments assignment
  JOIN recruitment_groups ON recruitment_groups.id = assignment.group_id
  WHERE assignment.candidate_id = candidate_uuid
    AND assignment.ended_at IS NULL;

  IF projected_group IS DISTINCT FROM active_group THEN
    RAISE EXCEPTION 'Candidate % current_group_id does not match its active group assignment', candidate_uuid;
  END IF;

  IF active_group IS NOT NULL AND active_group_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Candidate % cannot be assigned to an inactive group', candidate_uuid;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION assert_candidate_owner_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  candidate_uuid uuid;
  projected_owner uuid;
  projected_group uuid;
  active_owner uuid;
  owner_group uuid;
BEGIN
  IF TG_TABLE_NAME = 'candidates' THEN
    candidate_uuid := COALESCE(NEW.id, OLD.id);
  ELSE
    candidate_uuid := COALESCE(NEW.candidate_id, OLD.candidate_id);
  END IF;

  SELECT current_owner_user_id, current_group_id
  INTO projected_owner, projected_group
  FROM candidates
  WHERE id = candidate_uuid;

  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  SELECT owner_user_id, group_id
  INTO active_owner, owner_group
  FROM candidate_owner_assignments
  WHERE candidate_id = candidate_uuid
    AND ended_at IS NULL;

  IF projected_owner IS DISTINCT FROM active_owner THEN
    RAISE EXCEPTION 'Candidate % current owner does not match its active owner assignment', candidate_uuid;
  END IF;

  IF active_owner IS NOT NULL AND owner_group IS DISTINCT FROM projected_group THEN
    RAISE EXCEPTION 'Candidate % owner assignment is not in the active recruitment group', candidate_uuid;
  END IF;

  IF active_owner IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM group_memberships membership
    JOIN app_users ON app_users.id = membership.user_id
    WHERE membership.group_id = owner_group
      AND membership.user_id = active_owner
      AND membership.ended_at IS NULL
      AND app_users.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Candidate % owner is not an active member of the active group', candidate_uuid;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION assert_membership_owner_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  affected_group uuid;
  affected_user uuid;
BEGIN
  affected_group := COALESCE(NEW.group_id, OLD.group_id);
  affected_user := COALESCE(NEW.user_id, OLD.user_id);

  IF EXISTS (
    SELECT 1
    FROM candidates
    WHERE current_group_id = affected_group
      AND current_owner_user_id = affected_user
  ) AND NOT EXISTS (
    SELECT 1
    FROM group_memberships membership
    JOIN app_users ON app_users.id = membership.user_id
    WHERE membership.group_id = affected_group
      AND membership.user_id = affected_user
      AND membership.ended_at IS NULL
      AND app_users.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Active candidate ownership must be cleared or reassigned before ending group membership';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION assert_user_owner_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status <> 'ACTIVE'
     AND OLD.status = 'ACTIVE'
     AND EXISTS (
       SELECT 1
       FROM candidates
       WHERE current_owner_user_id = OLD.id
     )
  THEN
    RAISE EXCEPTION 'Candidate ownership must be cleared or reassigned before deactivating user %', OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION validate_interview_candidate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  submission_candidate uuid;
BEGIN
  SELECT candidate_id INTO submission_candidate
  FROM submissions
  WHERE id = NEW.submission_id;

  IF submission_candidate IS DISTINCT FROM NEW.candidate_id THEN
    RAISE EXCEPTION 'Interview candidate must match submission candidate';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION validate_offer_candidate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  submission_candidate uuid;
BEGIN
  SELECT candidate_id INTO submission_candidate
  FROM submissions
  WHERE id = NEW.submission_id;

  IF submission_candidate IS DISTINCT FROM NEW.candidate_id THEN
    RAISE EXCEPTION 'Offer candidate must match submission candidate';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION validate_placement_candidate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  related_candidate uuid;
BEGIN
  IF NEW.offer_id IS NOT NULL THEN
    SELECT candidate_id INTO related_candidate FROM offers WHERE id = NEW.offer_id;
    IF related_candidate IS DISTINCT FROM NEW.candidate_id THEN
      RAISE EXCEPTION 'Placement candidate must match offer candidate';
    END IF;
  END IF;

  IF NEW.submission_id IS NOT NULL THEN
    SELECT candidate_id INTO related_candidate FROM submissions WHERE id = NEW.submission_id;
    IF related_candidate IS DISTINCT FROM NEW.candidate_id THEN
      RAISE EXCEPTION 'Placement candidate must match submission candidate';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'company_profile',
    'app_users',
    'recruitment_groups',
    'streams',
    'candidate_sources',
    'skills',
    'candidates',
    'candidate_experiences',
    'candidate_education',
    'candidate_certifications',
    'candidate_notes',
    'vendors',
    'vendor_contacts',
    'clients',
    'client_contacts',
    'job_requirements',
    'submissions',
    'interviews',
    'tasks',
    'offers',
    'placements',
    'custom_field_definitions',
    'saved_views'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      table_name,
      table_name
    );
  END LOOP;
END;
$$;

CREATE TRIGGER trg_protect_final_admin
BEFORE UPDATE OR DELETE ON app_users
FOR EACH ROW EXECUTE FUNCTION protect_final_admin();

CREATE TRIGGER trg_normalize_candidate_contacts
BEFORE INSERT OR UPDATE OF email, phone ON candidates
FOR EACH ROW EXECUTE FUNCTION normalize_candidate_contacts();

CREATE TRIGGER trg_protect_group_with_active_candidates
BEFORE UPDATE OF status ON recruitment_groups
FOR EACH ROW EXECUTE FUNCTION protect_group_with_active_candidates();

CREATE CONSTRAINT TRIGGER trg_candidate_group_assignment_consistency
AFTER INSERT OR UPDATE OR DELETE ON candidate_group_assignments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_candidate_group_consistency();

CREATE CONSTRAINT TRIGGER trg_candidate_group_projection_consistency
AFTER INSERT OR UPDATE ON candidates
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_candidate_group_consistency();

CREATE CONSTRAINT TRIGGER trg_candidate_owner_assignment_consistency
AFTER INSERT OR UPDATE OR DELETE ON candidate_owner_assignments
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_candidate_owner_consistency();

CREATE CONSTRAINT TRIGGER trg_candidate_owner_projection_consistency
AFTER INSERT OR UPDATE ON candidates
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_candidate_owner_consistency();

CREATE CONSTRAINT TRIGGER trg_group_membership_owner_consistency
AFTER INSERT OR UPDATE OR DELETE ON group_memberships
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_membership_owner_consistency();

CREATE CONSTRAINT TRIGGER trg_user_owner_consistency
AFTER UPDATE OF status ON app_users
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION assert_user_owner_consistency();

CREATE TRIGGER trg_validate_interview_candidate
BEFORE INSERT OR UPDATE OF candidate_id, submission_id ON interviews
FOR EACH ROW EXECUTE FUNCTION validate_interview_candidate();

CREATE TRIGGER trg_validate_offer_candidate
BEFORE INSERT OR UPDATE OF candidate_id, submission_id ON offers
FOR EACH ROW EXECUTE FUNCTION validate_offer_candidate();

CREATE TRIGGER trg_validate_placement_candidate
BEFORE INSERT OR UPDATE OF candidate_id, offer_id, submission_id ON placements
FOR EACH ROW EXECUTE FUNCTION validate_placement_candidate();

CREATE TRIGGER trg_user_role_history_immutable
BEFORE UPDATE OR DELETE ON user_global_role_history
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER trg_candidate_status_history_immutable
BEFORE UPDATE OR DELETE ON candidate_status_history
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER trg_submission_status_history_immutable
BEFORE UPDATE OR DELETE ON submission_status_history
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER trg_interview_schedule_history_immutable
BEFORE UPDATE OR DELETE ON interview_schedule_history
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER trg_offer_status_history_immutable
BEFORE UPDATE OR DELETE ON offer_status_history
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER trg_placement_status_history_immutable
BEFORE UPDATE OR DELETE ON placement_status_history
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER trg_activity_events_immutable
BEFORE UPDATE OR DELETE ON activity_events
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE INDEX ix_candidates_lifecycle_active
  ON candidates (lifecycle_state, last_activity_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX ix_candidates_current_group
  ON candidates (current_group_id, lifecycle_state)
  WHERE archived_at IS NULL;

CREATE INDEX ix_candidates_current_owner
  ON candidates (current_owner_user_id, lifecycle_state)
  WHERE archived_at IS NULL;

CREATE INDEX ix_candidates_stream
  ON candidates (primary_stream_id, lifecycle_state)
  WHERE archived_at IS NULL;

CREATE INDEX ix_candidates_availability
  ON candidates (availability_date)
  WHERE archived_at IS NULL;

CREATE INDEX ix_candidates_normalized_email
  ON candidates (normalized_email)
  WHERE normalized_email IS NOT NULL;

CREATE INDEX ix_candidates_normalized_phone
  ON candidates (normalized_phone)
  WHERE normalized_phone IS NOT NULL;

CREATE INDEX ix_candidates_name_trigram
  ON candidates USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX ix_candidate_status_history_time
  ON candidate_status_history (candidate_id, changed_at DESC);

CREATE INDEX ix_candidate_notes_time
  ON candidate_notes (candidate_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX ix_submissions_candidate_status
  ON submissions (candidate_id, status, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX ix_submissions_vendor_status
  ON submissions (vendor_id, status, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX ix_submissions_job_status
  ON submissions (job_requirement_id, status)
  WHERE archived_at IS NULL AND job_requirement_id IS NOT NULL;

CREATE INDEX ix_submissions_follow_up
  ON submissions (next_follow_up_at)
  WHERE archived_at IS NULL AND next_follow_up_at IS NOT NULL;

CREATE INDEX ix_interviews_schedule
  ON interviews (scheduled_start_at, status)
  WHERE archived_at IS NULL;

CREATE INDEX ix_tasks_assignee_due
  ON tasks (assignee_user_id, status, due_at);

CREATE INDEX ix_placements_dates
  ON placements (status, start_date, end_date)
  WHERE archived_at IS NULL;

CREATE INDEX ix_activity_candidate_time
  ON activity_events (candidate_id, occurred_at DESC);

CREATE INDEX ix_audit_candidate_time
  ON audit_log (candidate_id, occurred_at DESC)
  WHERE candidate_id IS NOT NULL;

CREATE INDEX ix_audit_actor_time
  ON audit_log (actor_user_id, occurred_at DESC)
  WHERE actor_user_id IS NOT NULL;

CREATE INDEX ix_audit_request
  ON audit_log (request_id);

CREATE INDEX ix_notifications_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX ix_outbox_available
  ON outbox_events (status, available_at)
  WHERE status IN ('PENDING', 'FAILED');

COMMIT;

