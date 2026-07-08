/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { Employee, HolidayLeave } from '../types';

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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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

// Load Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCWb1pFYCuXfYwUoYO18Q1SzX-tnLVhs7s",
  authDomain: "steady-order-0fs6l.firebaseapp.com",
  projectId: "steady-order-0fs6l",
  storageBucket: "steady-order-0fs6l.firebasestorage.app",
  messagingSenderId: "160754130696",
  appId: "1:160754130696:web:40adbad4a07684f5b696bd"
};

const databaseId = "ai-studio-companyholidayma-8dfe94fc-83bb-4ca3-b28f-6542e6f3324e";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);

// Helper to remove undefined properties before saving to Firestore
const cleanData = (obj: any) => {
  const copy = { ...obj };
  Object.keys(copy).forEach((key) => {
    if (copy[key] === undefined) {
      delete copy[key];
    }
  });
  return copy;
};

// --- Realtime Subscriptions ---

export const subscribeEmployees = (callback: (employees: Employee[]) => void) => {
  const employeesCol = collection(db, 'employees');
  return onSnapshot(employeesCol, (snapshot) => {
    const list: Employee[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Employee);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'employees');
  });
};

export const subscribeHolidays = (callback: (holidays: HolidayLeave[]) => void) => {
  const holidaysCol = collection(db, 'holidays');
  return onSnapshot(holidaysCol, (snapshot) => {
    const list: HolidayLeave[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as HolidayLeave);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'holidays');
  });
};

export const subscribeSettings = (callback: (settings: { 
  companyName: string; 
  weekendType: string;
  vacationQuota?: number;
  sickQuota?: number;
  personalQuota?: number;
  specialQuota?: number;
  otherQuota?: number;
}) => void) => {
  const settingsDoc = doc(db, 'settings', 'global');
  return onSnapshot(settingsDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        companyName: data.companyName || 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด',
        weekendType: data.weekendType || 'sat-sun',
        vacationQuota: data.vacationQuota !== undefined ? Number(data.vacationQuota) : 6,
        sickQuota: data.sickQuota !== undefined ? Number(data.sickQuota) : 30,
        personalQuota: data.personalQuota !== undefined ? Number(data.personalQuota) : 3,
        specialQuota: data.specialQuota !== undefined ? Number(data.specialQuota) : 5,
        otherQuota: data.otherQuota !== undefined ? Number(data.otherQuota) : 5,
      });
    } else {
      callback({
        companyName: 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด',
        weekendType: 'sat-sun',
        vacationQuota: 6,
        sickQuota: 30,
        personalQuota: 3,
        specialQuota: 5,
        otherQuota: 5,
      });
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'settings/global');
  });
};

// --- Mutation Operations ---

export const saveEmployeeToCloud = async (employee: Employee) => {
  const path = `employees/${employee.id}`;
  try {
    const cleaned = cleanData(employee);
    const docRef = doc(db, 'employees', employee.id);
    await setDoc(docRef, cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteEmployeeFromCloud = async (employeeId: string) => {
  const path = `employees/${employeeId}`;
  try {
    // Delete the employee document
    const docRef = doc(db, 'employees', employeeId);
    await deleteDoc(docRef);

    // Also delete all their holiday records in a batch
    const holidaysCol = collection(db, 'holidays');
    const q = query(holidaysCol, where('employeeId', '==', employeeId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveHolidayToCloud = async (holiday: HolidayLeave) => {
  const path = `holidays/${holiday.id}`;
  try {
    const cleaned = cleanData(holiday);
    const docRef = doc(db, 'holidays', holiday.id);
    await setDoc(docRef, cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteHolidayFromCloud = async (holidayId: string) => {
  const path = `holidays/${holidayId}`;
  try {
    const docRef = doc(db, 'holidays', holidayId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveSettingsToCloud = async (
  companyName: string, 
  weekendType: string,
  vacationQuota?: number,
  sickQuota?: number,
  personalQuota?: number,
  specialQuota?: number,
  otherQuota?: number
) => {
  const path = 'settings/global';
  try {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, { 
      companyName, 
      weekendType,
      vacationQuota: vacationQuota ?? 6,
      sickQuota: sickQuota ?? 30,
      personalQuota: personalQuota ?? 3,
      specialQuota: specialQuota ?? 5,
      otherQuota: otherQuota ?? 5
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
