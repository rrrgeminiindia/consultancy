\set ON_ERROR_STOP on

\if :{?owner_email}
\else
  \echo 'Required variable missing: owner_email'
  \quit
\endif

\if :{?owner_name}
\else
  \echo 'Required variable missing: owner_name'
  \quit
\endif

\if :{?iam_issuer}
\else
  \echo 'Required variable missing: iam_issuer'
  \quit
\endif

\if :{?iam_subject}
\else
  \echo 'Required variable missing: iam_subject'
  \quit
\endif

BEGIN;

WITH inserted_user AS (
  INSERT INTO platform_users (
    email,
    display_name,
    platform_role,
    status,
    last_login_at
  )
  VALUES (
    :'owner_email',
    :'owner_name',
    'OWNER_ADMIN',
    'ACTIVE',
    now()
  )
  ON CONFLICT (email) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      platform_role = 'OWNER_ADMIN',
      status = 'ACTIVE',
      deactivated_at = NULL
  RETURNING id, email
), linked_identity AS (
  INSERT INTO platform_user_identities (
    platform_user_id,
    provider,
    issuer,
    external_subject,
    provider_email
  )
  SELECT
    id,
    'CENTRAL_IAM',
    :'iam_issuer',
    :'iam_subject',
    email
  FROM inserted_user
  ON CONFLICT (issuer, external_subject) DO UPDATE
  SET disabled_at = NULL,
      provider_email = EXCLUDED.provider_email
  RETURNING platform_user_id
)
INSERT INTO instance_access (
  platform_user_id,
  company_instance_id,
  access_status,
  granted_by
)
SELECT
  linked_identity.platform_user_id,
  company_instances.id,
  'ACTIVE',
  linked_identity.platform_user_id
FROM linked_identity
CROSS JOIN company_instances
WHERE company_instances.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM instance_access existing
    WHERE existing.platform_user_id = linked_identity.platform_user_id
      AND existing.company_instance_id = company_instances.id
      AND existing.access_status = 'ACTIVE'
  );

COMMIT;

