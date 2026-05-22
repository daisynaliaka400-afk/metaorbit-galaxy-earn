MetaOrbit — Auth Migration & Verification

Summary
- This file describes how to apply the DB migration for the custom username/phone/password auth, create the default admin account, and verify registration/login/payment flows.

Migration file
- Migration path in the repo: [supabase/migrations/20260522000000_add_custom_auth.sql](supabase/migrations/20260522000000_add_custom_auth.sql)

Pre-requisites
- Supabase project with SQL editor access or CI capable of running SQL against your DB.
- Ensure `pgcrypto` is available (for server-side SHA-256 hashing) or run `CREATE EXTENSION IF NOT EXISTS pgcrypto;` before running the migration.

Apply migration (manual via Supabase SQL editor)
1. Open your Supabase project → SQL → New query.
2. Run:

```sql
-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Then paste the contents of the migration file:
-- See repo file: supabase/migrations/20260522000000_add_custom_auth.sql
``` 

3. Execute the query. The migration will:
- Add `password_hash`, `email`, and `account_status` fields (if missing).
- Add unique indexes on lower(username) and phone.
- Create a default admin account (username `admin`, phone `0700000000`, password `Admin12345`).

Notes about the admin password
- The migration hashes the password with `digest('Admin12345','sha256')` using `pgcrypto`. If you want to change the admin password, update the migration before running or run an UPDATE SQL command after the migration.

Verification steps (staging or deployed instance)
1. Register
- Open the app `/signup` and register using: Full name, Username (unique), Phone (unique numeric), Password (≥8), select Package. You should be redirected to `/payment?plan=...`.

2. Login
- Open `/login` and login with either `username` or `phone` and the password you set. Successful login stores a client session and an httpOnly `auth_token` cookie so server pages detect the user.

3. Payment
- Complete the Paynecta payment. The webhook/success handlers in `src/app/api/payment/*` will set `account_status = 'active'`, `payment_status = 'paid'`, create a `transactions` record, and redirect the browser to `/dashboard`.

4. Admin
- Login with: username `admin`, phone `0700000000`, password `Admin12345`. Admin users are assigned the `admin` role during migration.

If registration fails with "Username already exists" or "Phone number already registered",
- use a different username or phone or check the `profiles` table for duplicates.

If server pages still redirect to login after a successful client login
- Confirm the `auth_token` cookie exists (httpOnly cookie is set by `/api/session` endpoint). Verify the server process reads this cookie via `createClientWithFallback()` in `src/lib/supabase/server.ts`.

Local build / type-check (optional)
- From project root, run either (depending on your environment):

```bash
# npm
npm install
npm run dev
# or build/type-check
npm run build

# or if you use bun
bun install
bun dev
```

Commit & Push
- The repository already contains the migration file and code changes. After applying the migration in Supabase, verify the app on staging. If you want me to perform additional changes, tell me and I'll continue.

Support
- If you prefer, provide a Supabase service-role key and an environment where I can run migrations (or grant CI access) and I can run the migration and verify automatically.

