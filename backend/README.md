# Africa Ancestry Backend

TypeScript + Express API. Uses Supabase for auth, database, and storage.

## Quick start

```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YOCO_SECRET_KEY, etc.
npm install
npm run dev
# Runs on http://localhost:3000
```

## Supabase setup (one-time)

In the Supabase SQL Editor, run these files **in order**:

1. `sql/ancestry_data_schema.sql` — creates all ancestry data tables
2. `sql/ancestry_profile_functions.sql` — creates lookup + scoring SQL functions
3. `sql/ancestry_profile_queries.sql` — creates `infer_surname_association` + view
4. `sql/auth_billing_schema.sql` — creates `report_entitlements` + `yoco_checkout_sessions`
5. `sql/ancestry_data_seed.sql` — seeds Southern African families, kingdoms, clans, regions, sources

Also create a Supabase Storage bucket named `ancestry-photos` (set to public).

## Endpoints

### Auth
- `POST /api/auth/register` — `{ email, password, fullName? }` → `{ token, user }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` — Bearer → `{ user }`

### Uploads (Supabase Storage)
- `POST /api/uploads/photo/init` — Bearer → signed upload URL

### Payments (Yoco)
- `POST /api/payments/yoco/checkout` — Bearer → `{ redirectUrl, checkoutId }`
- `POST /api/payments/yoco/webhook` — Yoco signature verified

### Reports
- `POST /api/ancestry/profile/preview` — Bearer (no payment) → partial report
- `POST /api/ancestry/profile` — Bearer + paid entitlement → full report

## Report request body

```json
{
  "language": "isiZulu",
  "clanOrLineageName": "Buthelezi",
  "givenNames": "Sipho",
  "surname": "Dlamini",
  "gender": "male",
  "dateOfBirth": "1990-06-15",
  "photo": {
    "uploadedPhotoUrl": "https://your-project.supabase.co/storage/v1/object/public/ancestry-photos/..."
  }
}
```

## Payment flow

1. Register / login → JWT token
2. `POST /api/payments/yoco/checkout` → `redirectUrl`
3. User pays on Yoco → webhook fires → entitlement granted
4. `POST /api/ancestry/profile` → full report

## Env vars

See `.env.example` for all required variables.
