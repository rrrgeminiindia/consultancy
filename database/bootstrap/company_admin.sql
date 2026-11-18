\set ON_ERROR_STOP on

\if :{?admin_email}
\else
  \echo 'Required variable missing: admin_email'
  \quit
\endif

\if :{?first_name}
\else
  \echo 'Required variable missing: first_name'
  \quit
\endif

\if :{?last_name}
\else
  \echo 'Required variable missing: last_name'
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
  INSERT INTO app_users (
    email,
    first_name,
    last_name,
    display_name,
    global_role,
    status,
    invited_at,
    activated_at,
    last_login_at
  )
  VALUES (
    :'admin_email',
    :'first_name',
    :'last_name',
    :'first_name' || ' ' || :'last_name',
    'ADMIN',
    'ACTIVE',
    now(),
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE
  SET first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      display_name = EXCLUDED.display_name,
      global_role = 'ADMIN',
      status = 'ACTIVE',
      activated_at = coalesce(app_users.activated_at, now()),
      deactivated_at = NULL,
      deactivated_by_user_id = NULL
  RETURNING id, email
)
INSERT INTO user_identities (
  user_id,
  provider,
  issuer,
  external_subject,
  provider_email,
  last_authenticated_at
)
SELECT
  id,
  'CENTRAL_IAM',
  :'iam_issuer',
  :'iam_subject',
  email,
  now()
FROM inserted_user
ON CONFLICT (issuer, external_subject) DO UPDATE
SET disabled_at = NULL,
    provider_email = EXCLUDED.provider_email,
    last_authenticated_at = now();

COMMIT;

