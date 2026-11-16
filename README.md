# Registration API

Independent registration API for Flutter and the back office.

## Features

- User registration request capture
- Secure 6-digit OTP email verification
- OTP resend and expiration handling
- Admin approval / rejection flow
- Final Firebase account creation only after approval
- Password reset flow after approval

## Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Firebase Admin SDK
- SMTP mailer

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

## Available routes

- `GET /health`
- `POST /api/registrations/request`
- `POST /api/registrations/verify`
- `POST /api/registrations/resend`
- `POST /api/admin/registrations/review`
- `GET /api/admin/registrations/:id`
- `POST /api/translation/translate`
- `POST /api/translation/key`

## Production deployment

- Create the Vercel project `registration-api` with the project root set to this directory.
- In the Vercel project settings, add the production environment variables before deploying:
  - `DATABASE_URL`: a reachable PostgreSQL connection URL (TLS parameters may be required by the provider).
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`: credentials and sender address for OTP emails.
  - `APP_BASE_URL`: the public HTTPS URL of this API.
  - `FIREBASE_SERVICE_ACCOUNT_JSON` (and optionally `FIREBASE_PROJECT_ID`): the complete service-account JSON is required for admin approval; never commit it.
  - `OTP_TTL_MINUTES` and `APPROVAL_TTL_MINUTES` are optional and have safe defaults.
- Select the Production environment for these variables, then redeploy; Vercel only applies changed environment variables to new deployments.
- Deploy from this directory:

  ```bash
  npx vercel@latest link --yes --project registration-api
  npx vercel@latest deploy --prod --yes
  ```

- Check `https://registration-api.vercel.app/health` after deployment. It returns `503` with a safe diagnostic if PostgreSQL is not configured or reachable, or if `SMTP_HOST` is missing.

The back office project must have `VITE_REGISTRATION_API_URL=https://registration-api.vercel.app` set for its Production environment before it is built and deployed.
