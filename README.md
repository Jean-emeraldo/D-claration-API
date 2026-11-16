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
- `POST /api/registrations/admin/review`
- `GET /api/registrations/:id`

## Production deployment

- Create the Vercel project `registration-api` with the project root set to this directory.
- Add the environment variables from `.env.example` in Vercel. Use the complete service-account JSON as the value of `FIREBASE_SERVICE_ACCOUNT_JSON`; never commit it.
- Deploy from this directory:

  ```bash
  npx vercel@latest link --yes --project registration-api
  npx vercel@latest deploy --prod --yes
  ```

- Check `https://registration-api.vercel.app/health` after deployment.

The back office project must have `VITE_REGISTRATION_API_URL=https://registration-api.vercel.app` set for its Production environment before it is built and deployed.
