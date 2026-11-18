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

CREATE TABLE platform_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  display_name text NOT NULL CHECK (btrim(display_name) <> ''),
  platform_role platform_role NOT NULL DEFAULT 'STANDARD',
  status account_status NOT NULL DEFAULT 'INVITED',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,
  CONSTRAINT platform_user_deactivation_consistency CHECK (
    (status = 'DEACTIVATED' AND deactivated_at IS NOT NULL)
    OR (status <> 'DEACTIVATED')
  )
);

CREATE TABLE platform_user_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id uuid NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (btrim(provider) <> ''),
  issuer text NOT NULL CHECK (btrim(issuer) <> ''),
  external_subject text NOT NULL CHECK (btrim(external_subject) <> ''),
  provider_email citext NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  UNIQUE (issuer, external_subject)
);

CREATE TABLE company_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_code text NOT NULL UNIQUE CHECK (instance_code ~ '^[a-z][a-z0-9_-]{2,62}$'),
  legal_name text NOT NULL CHECK (btrim(legal_name) <> ''),
  display_name text NOT NULL CHECK (btrim(display_name) <> ''),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]{2,62}$'),
  base_url text NOT NULL UNIQUE CHECK (base_url ~ '^https?://'),
  status instance_status NOT NULL DEFAULT 'PROVISIONING',
  deployment_version text NOT NULL,
  database_secret_ref text NOT NULL,
  storage_ref text NOT NULL,
  auth_issuer text NOT NULL CHECK (auth_issuer ~ '^https?://'),
  auth_client_id text NOT NULL,
  infrastructure_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  detached_at timestamptz,
  CONSTRAINT company_instance_detachment_consistency CHECK (
    (status IN ('DETACHED', 'DECOMMISSIONED') AND detached_at IS NOT NULL)
    OR (status NOT IN ('DETACHED', 'DECOMMISSIONED'))
  )
);

CREATE TABLE instance_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id uuid NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
  company_instance_id uuid NOT NULL REFERENCES company_instances(id) ON DELETE RESTRICT,
  access_status instance_access_status NOT NULL DEFAULT 'ACTIVE',
  granted_by uuid NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT instance_access_revocation_consistency CHECK (
    (access_status = 'REVOKED' AND revoked_at IS NOT NULL)
    OR (access_status <> 'REVOKED')
  )
);

CREATE UNIQUE INDEX uq_instance_access_active
  ON instance_access (platform_user_id, company_instance_id)
  WHERE access_status = 'ACTIVE';

CREATE INDEX ix_instance_access_user_status
  ON instance_access (platform_user_id, access_status);

CREATE INDEX ix_instance_access_instance_status
  ON instance_access (company_instance_id, access_status);

CREATE TABLE instance_metrics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_instance_id uuid NOT NULL REFERENCES company_instances(id) ON DELETE RESTRICT,
  candidate_count integer NOT NULL DEFAULT 0 CHECK (candidate_count >= 0),
  active_user_count integer NOT NULL DEFAULT 0 CHECK (active_user_count >= 0),
  active_marketing_count integer NOT NULL DEFAULT 0 CHECK (active_marketing_count >= 0),
  active_placement_count integer NOT NULL DEFAULT 0 CHECK (active_placement_count >= 0),
  health_status instance_health_status NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_instance_metrics_latest
  ON instance_metrics_snapshots (company_instance_id, captured_at DESC);

CREATE TABLE instance_detachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_instance_id uuid NOT NULL REFERENCES company_instances(id) ON DELETE RESTRICT,
  status detachment_status NOT NULL DEFAULT 'REQUESTED',
  requested_by uuid NOT NULL REFERENCES platform_users(id) ON DELETE RESTRICT,
  approved_by uuid REFERENCES platform_users(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (btrim(reason) <> ''),
  export_manifest_checksum text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT detachment_two_person_approval CHECK (
    approved_by IS NULL OR approved_by <> requested_by
  ),
  CONSTRAINT detachment_completion_consistency CHECK (
    (status = 'COMPLETED' AND completed_at IS NOT NULL)
    OR (status <> 'COMPLETED')
  )
);

CREATE UNIQUE INDEX uq_instance_active_detachment
  ON instance_detachments (company_instance_id)
  WHERE status NOT IN ('COMPLETED', 'CANCELLED');

CREATE TABLE platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_platform_user_id uuid REFERENCES platform_users(id) ON DELETE RESTRICT,
  company_instance_id uuid REFERENCES company_instances(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (btrim(action) <> ''),
  entity_type text NOT NULL CHECK (btrim(entity_type) <> ''),
  entity_id uuid,
  reason text,
  request_id uuid NOT NULL,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_platform_audit_instance_time
  ON platform_audit_log (company_instance_id, occurred_at DESC);

CREATE INDEX ix_platform_audit_actor_time
  ON platform_audit_log (actor_platform_user_id, occurred_at DESC);

CREATE INDEX ix_platform_audit_request
  ON platform_audit_log (request_id);

CREATE FUNCTION protect_final_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.platform_role = 'OWNER_ADMIN'
     AND OLD.status = 'ACTIVE'
     AND (
       TG_OP = 'DELETE'
       OR NEW.platform_role <> 'OWNER_ADMIN'
       OR NEW.status <> 'ACTIVE'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM platform_users
       WHERE id <> OLD.id
         AND platform_role = 'OWNER_ADMIN'
         AND status = 'ACTIVE'
     )
  THEN
    RAISE EXCEPTION 'Cannot remove the final active platform owner administrator';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_platform_users_updated_at
BEFORE UPDATE ON platform_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_company_instances_updated_at
BEFORE UPDATE ON company_instances
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_protect_final_owner_admin
BEFORE UPDATE OR DELETE ON platform_users
FOR EACH ROW EXECUTE FUNCTION protect_final_owner_admin();

CREATE TRIGGER trg_platform_audit_no_update
BEFORE UPDATE OR DELETE ON platform_audit_log
FOR EACH ROW EXECUTE FUNCTION reject_mutation();

COMMIT;

