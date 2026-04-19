"use client";
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "casita-family-prod",
  appId: "1:111047255377:web:07bd92559c40dfb1429f70",
  storageBucket: "casita-family-prod.firebasestorage.app",
  apiKey: "AIzaSyDLc0xnngPEt4tf5zHHdj1P9h1IGJv71d8",
  authDomain: "casita-family-prod.firebaseapp.com",
  messagingSenderId: "111047255377",
};

// Initialize Firebase SDK. Ensure it's only initialized once for SSR compatibility.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('firestore-error', { detail: errInfo }));
  }
}

export { signInWithPopup, signInAnonymously, onAuthStateChanged };
