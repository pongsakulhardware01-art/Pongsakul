/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, cleanDocumentData, handleFirestoreError, OperationType } from './firebaseClient';
import { HolidayLeave } from '../types';
import { calculateDaysBetween } from '../utils/dateUtils';

const COLLECTION_NAME = 'holidays';

export const subscribeHolidays = (callback: (holidays: HolidayLeave[]) => void) => {
  const holidaysCol = collection(db, COLLECTION_NAME);
  return onSnapshot(
    holidaysCol,
    (snapshot) => {
      const list: HolidayLeave[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as HolidayLeave);
      });
      // Sort by startDate
      list.sort((a, b) => a.startDate.localeCompare(b.startDate));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    }
  );
};

export const saveHolidayToCloud = async (holiday: HolidayLeave): Promise<void> => {
  const path = `${COLLECTION_NAME}/${holiday.id}`;
  try {
    // Ensure durationDays is always accurately populated
    const calculatedDuration = calculateDaysBetween(holiday.startDate, holiday.endDate);
    const payload: HolidayLeave = {
      ...holiday,
      durationDays: holiday.durationDays > 0 ? holiday.durationDays : calculatedDuration
    };

    const cleaned = cleanDocumentData(payload);
    const docRef = doc(db, COLLECTION_NAME, holiday.id);
    await setDoc(docRef, cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteHolidayFromCloud = async (holidayId: string): Promise<void> => {
  const path = `${COLLECTION_NAME}/${holidayId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, holidayId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

/**
 * Checks if a proposed leave date overlaps with existing leaves for the same employee
 */
export const checkLeaveDateOverlap = (
  employeeId: string,
  startDate: string,
  endDate: string,
  existingHolidays: HolidayLeave[],
  excludeHolidayId?: string
): HolidayLeave | undefined => {
  if (employeeId === 'all') return undefined; // Public holidays can coexist

  return existingHolidays.find(h => {
    if (h.id === excludeHolidayId) return false;
    if (h.employeeId !== employeeId) return false;
    // Overlap condition: start <= otherEnd AND end >= otherStart
    return startDate <= h.endDate && endDate >= h.startDate;
  });
};
