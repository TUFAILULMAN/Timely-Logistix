/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

// Authenticate anonymously so the user gets a secure session to read/write Firestore
let isAuthInit = false;
let authInitPromise: Promise<void> | null = null;

export function waitForAuthInit(): Promise<void> {
  if (isAuthInit) return Promise.resolve();
  if (authInitPromise) return authInitPromise;

  authInitPromise = new Promise<void>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      isAuthInit = true;
      unsubscribe();
      resolve();
    });
  });
  return authInitPromise;
}

export async function ensureAuth() {
  // First, wait for Firebase Auth to finish restoring its persisted session (if any)
  await waitForAuthInit();

  // If we already have a user signed in (either anonymous or email/password), we are good!
  if (auth.currentUser) {
    return;
  }

  try {
    await signInAnonymously(auth);
  } catch (error: any) {
    if (error && error.code === 'auth/admin-restricted-operation') {
      console.warn(
        "Firebase Anonymous Sign-In is not yet enabled for this project.\n" +
        "To enable synchronization:\n" +
        "1. Go to your Firebase Console.\n" +
        "2. Navigate to Build -> Authentication -> Sign-in method.\n" +
        "3. Enable the 'Anonymous' provider and save.\n" +
        "The app will continue to run robustly in offline/sandbox mode with localStorage fallback."
      );
    } else {
      console.warn("Firebase Anonymous Auth skipped or failed:", error?.message || error);
    }
  }
}

// Background auth initialization
ensureAuth().catch(() => {});

