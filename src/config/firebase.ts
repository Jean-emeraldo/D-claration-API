import { cert, initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { env } from './env.js';

let authInstance: Auth | null = null;

function getCredential() {
  const serviceAccountJson = env.firebase.serviceAccountJson;
  if (!serviceAccountJson) {
    return applicationDefault();
  }

  const parsed: unknown = JSON.parse(serviceAccountJson);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain a Firebase service account JSON object.');
  }

  const serviceAccount = parsed as Record<string, unknown>;
  const projectId =
    typeof serviceAccount.project_id === 'string' ? serviceAccount.project_id : env.firebase.projectId;
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  if (!projectId || typeof clientEmail !== 'string' || typeof privateKey !== 'string') {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON must include project_id, client_email, and private_key.',
    );
  }

  return cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  });
}

export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: getCredential(),
      });
    }

    authInstance = getAuth();
    return authInstance;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Firebase Admin is not configured: ${message}`);
  }
}
