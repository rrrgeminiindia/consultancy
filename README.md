# Bench Management

Database-first foundation for independently deployable consultancy recruitment and bench-management instances.

## Application stack

```text
apps/portal-web       Next.js common login and company selector
apps/company-web      Next.js recruitment dashboard deployed once per company
services/portal-api   FastAPI portal and instance-routing API
services/company-api  FastAPI company API deployed once per company
packages/ui           Shared React UI components
database              Portal and standalone company PostgreSQL schemas
```

The same company frontend and backend code is deployed separately for FlyHigh and Dattai. Company behavior and data come from environment configuration and the selected company database, not from code forks.

## Local databases

| Service | Database | Default port | Purpose |
|---|---|---:|---|
| `portal-db` | `portal_control` | 5542 | Common login directory and company-tile routing |
| `flyhigh-db` | `flyhigh_recruitment` | 5543 | Complete FlyHigh company data |
| `dattai-db` | `dattai_recruitment` | 5544 | Complete Dattai company data |

The two company databases use the same schema scripts but separate seed files. They do not share recruitment data or application users.

IAM remains external and owns passwords, MFA, OAuth identities, sessions, and reset tokens. The databases store IAM identity mappings and application authorization only.

## Start locally

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

Install application dependencies:

```bash
pnpm install
uv sync --all-packages --group dev
```

Build and validate:

```bash
pnpm lint
pnpm typecheck
pnpm build
uv run ruff check services
uv run pytest
```

## Run the application

Start the portal API:

```bash
uv run uvicorn portal_api.main:app --host 127.0.0.1 --port 8000
```

Start independent FlyHigh and Dattai APIs in separate terminals:

```bash
COMPANY_DATABASE_URL="postgresql+psycopg://flyhigh_app:change-me-flyhigh@127.0.0.1:5543/flyhigh_recruitment" \
  uv run uvicorn company_api.main:app --host 127.0.0.1 --port 8100

COMPANY_DATABASE_URL="postgresql+psycopg://dattai_app:change-me-dattai@127.0.0.1:5544/dattai_recruitment" \
  uv run uvicorn company_api.main:app --host 127.0.0.1 --port 8200
```

Start the portal UI:

```bash
PORTAL_API_URL=http://127.0.0.1:8000 pnpm --filter @bench/portal-web dev
```

For one company during normal UI development:

```bash
COMPANY_API_URL=http://127.0.0.1:8100 pnpm --filter @bench/company-web dev
```

To run both company instances simultaneously, build once and launch two production processes:

```bash
pnpm --filter @bench/company-web build

COMPANY_API_URL=http://127.0.0.1:8100 \
  pnpm --filter @bench/company-web exec next start -p 3001

COMPANY_API_URL=http://127.0.0.1:8200 \
  pnpm --filter @bench/company-web exec next start -p 3002
```

Local URLs:

| Application | URL |
|---|---|
| Common login | `http://localhost:3000` |
| Company selector | `http://localhost:3000/companies` |
| FlyHigh | `http://localhost:3001` |
| Dattai | `http://localhost:3002` |
| Portal API docs | `http://localhost:8000/docs` |
| FlyHigh API docs | `http://localhost:8100/docs` |
| Dattai API docs | `http://localhost:8200/docs` |

Open the project in VS Code:

```bash
code bench-management.code-workspace
```

OIDC/Keycloak remains the production identity provider. The company API already enforces application authorization and accepts a local `X-User-Email` identity only while `COMPANY_AUTH_MODE=development`. In production mode it resolves the trusted `X-User-Issuer` and `X-User-Subject` values against `user_identities`; passwords and sessions never enter a company database.

## Candidate history and group access

The company console includes candidate, group, lead, membership, and complete candidate-history screens. The API applies these rules before returning data:

- `ADMIN`, `OPERATIONS`, and `AUDITOR` can read all company groups and candidates.
- `STANDARD` users can read only candidates in groups where they have an active membership.
- Group `LEAD` and `RECRUITER` memberships can update candidates in that group.
- `MARKETING` can update only the marketing portion of the lifecycle.
- `VIEWER` and `AUDITOR` are read-only.
- Only `ADMIN` and `OPERATIONS` can view candidate rates or transfer candidates between groups.
- Group leads can assign candidate owners, but the owner must be an active member of that group.

Direct candidate and group URLs use the same server-side checks as list APIs. Unauthorized records return `404` to avoid revealing that another group owns the record.

Load idempotent local demonstration users, candidates, and full-history records into both company databases:

```bash
docker compose exec -T flyhigh-db psql -U flyhigh_app -d flyhigh_recruitment < database/dev/100_demo_data.sql
docker compose exec -T dattai-db psql -U dattai_app -d dattai_recruitment < database/dev/100_demo_data.sql
```

The default local session is `admin@company.local`. To test a scoped session, set `COMPANY_DEV_USER_EMAIL` on both the company API and company web process. Available examples include `java.lead@company.local`, `java.recruiter@company.local`, `data.lead@company.local`, `data.viewer@company.local`, `qa.marketing@company.local`, `operations@company.local`, and `auditor@company.local`.

The initialization scripts run only when a database volume is first created.

To inspect a database:

```bash
docker compose exec portal-db psql -U portal_app -d portal_control
docker compose exec flyhigh-db psql -U flyhigh_app -d flyhigh_recruitment
docker compose exec dattai-db psql -U dattai_app -d dattai_recruitment
```

## Bootstrap the first IAM-backed owner

Create the person in the configured IAM provider first, then use the verified OIDC issuer and subject. These scripts create only application records and identity mappings; they never create or store a password.

Portal owner with access to both company tiles:

```bash
docker compose exec -T portal-db psql \
  -U portal_app \
  -d portal_control \
  -v owner_email='owner@example.com' \
  -v owner_name='Platform Owner' \
  -v iam_issuer='https://identity.example.com' \
  -v iam_subject='replace-with-iam-subject' \
  < database/bootstrap/portal_owner.sql
```

Company administrator, run once for each company database:

```bash
docker compose exec -T flyhigh-db psql \
  -U flyhigh_app \
  -d flyhigh_recruitment \
  -v admin_email='owner@example.com' \
  -v first_name='Platform' \
  -v last_name='Owner' \
  -v iam_issuer='https://identity.example.com' \
  -v iam_subject='replace-with-iam-subject' \
  < database/bootstrap/company_admin.sql

docker compose exec -T dattai-db psql \
  -U dattai_app \
  -d dattai_recruitment \
  -v admin_email='owner@example.com' \
  -v first_name='Platform' \
  -v last_name='Owner' \
  -v iam_issuer='https://identity.example.com' \
  -v iam_subject='replace-with-iam-subject' \
  < database/bootstrap/company_admin.sql
```

To intentionally rebuild all local databases from scratch:

```bash
docker compose down -v
docker compose up -d
```

`docker compose down -v` permanently removes the local development database volumes.

## Layout

```text
database/
  portal/       Shared portal-control schema and FlyHigh/Dattai instance registry
  company/      Reusable standalone company schema
  seeds/        Company-specific profile and reference-data seeds
```

Production deployments should place each company database and storage bucket in its own cloud account/project or equivalent isolation boundary. The local Compose setup uses separate containers to preserve the same ownership boundary.

