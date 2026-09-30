/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Configured Cloud Project Credentials
const firebaseConfig = {
  apiKey: "AIzaSyCWb1pFYCuXfYwUoYO18Q1SzX-tnLVhs7s",
  authDomain: "steady-order-0fs6l.firebaseapp.com",
  projectId: "steady-order-0fs6l",
  storageBucket: "steady-order-0fs6l.firebasestorage.app",
  messagingSenderId: "160754130696",
  appId: "1:160754130696:web:40adbad4a07684f5b696bd"
};

const DATABASE_ID = "ai-studio-companyholidayma-8dfe94fc-83bb-4ca3-b28f-6542e6f3324e";

// Initialize App singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, DATABASE_ID);

/**
 * Removes undefined fields before writing to Firestore to prevent SDK errors
 */
export const cleanDocumentData = <T extends Record<string, any>>(obj: T): T => {
  const copy: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      copy[key] = obj[key];
    }
  });
  return copy as T;
};
