import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import baseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const isPlaceholder = (val: string) => !val || val.includes("YOUR_") || val.includes("MY_");

// Retrieve dynamic configs from local json or public environment fallback
export const firebaseConfig = {
  apiKey: isPlaceholder(baseConfig.apiKey) ? (import.meta as any).env.VITE_FIREBASE_API_KEY || "" : baseConfig.apiKey,
  authDomain: isPlaceholder(baseConfig.authDomain) ? (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "" : baseConfig.authDomain,
  projectId: isPlaceholder(baseConfig.projectId) ? (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "" : baseConfig.projectId,
  storageBucket: isPlaceholder(baseConfig.storageBucket) ? (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "" : baseConfig.storageBucket,
  messagingSenderId: isPlaceholder(baseConfig.messagingSenderId) ? (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "" : baseConfig.messagingSenderId,
  appId: isPlaceholder(baseConfig.appId) ? (import.meta as any).env.VITE_FIREBASE_APP_ID || "" : baseConfig.appId,
  firestoreDatabaseId: baseConfig.firestoreDatabaseId || (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || "(default)",
};

const hasConfiguredFirebase = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: any = null;
export let db: any = null;
export let auth: any = null;
export const googleProvider = new GoogleAuthProvider();

if (hasConfiguredFirebase) {
  try {
    app = initializeApp(firebaseConfig);
    const dbId = firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId;
    db = getFirestore(app, dbId);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase config has placeholders or missing values. App will fall back to local storage. Please configure firebase-applet-config.json or set VITE_FIREBASE_* environment variables.");
}

export function isFirebaseEnabled(): boolean {
  return !!(auth && db);
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (!isFirebaseEnabled()) {
    throw error;
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  if (!isFirebaseEnabled()) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection verified successfully!");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline");
    }
  }
}

if (isFirebaseEnabled()) {
  testConnection();
}
