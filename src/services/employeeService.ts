/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
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
import { db, cleanDocumentData, handleFirestoreError, OperationType } from './firebaseClient';
import { Employee } from '../types';

const COLLECTION_NAME = 'employees';

export const subscribeEmployees = (callback: (employees: Employee[]) => void) => {
  const employeesCol = collection(db, COLLECTION_NAME);
  return onSnapshot(
    employeesCol,
    (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Employee);
      });
      // Sort alphabetically by first name
      list.sort((a, b) => a.firstName.localeCompare(b.firstName, 'th'));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    }
  );
};

export const saveEmployeeToCloud = async (employee: Employee): Promise<void> => {
  const path = `${COLLECTION_NAME}/${employee.id}`;
  try {
    const cleaned = cleanDocumentData(employee);
    const docRef = doc(db, COLLECTION_NAME, employee.id);
    await setDoc(docRef, cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteEmployeeFromCloud = async (employeeId: string): Promise<void> => {
  const path = `${COLLECTION_NAME}/${employeeId}`;
  try {
    // 1. Delete employee document
    const docRef = doc(db, COLLECTION_NAME, employeeId);
    await deleteDoc(docRef);

    // 2. Cascade delete all their leave records
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

export const validateEmployee = (emp: Partial<Employee>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!emp.firstName?.trim()) errors.push('กรุณาระบุชื่อจริงของพนักงาน');
  if (!emp.lastName?.trim()) errors.push('กรุณาระบุนามสกุลของพนักงาน');
  if (!emp.employeeCode?.trim()) errors.push('กรุณาระบุรหัสพนักงาน');
  if (!emp.position?.trim()) errors.push('กรุณาระบุตำแหน่ง');
  if (!emp.department?.trim()) errors.push('กรุณาระบุแผนก');
  return { valid: errors.length === 0, errors };
};
