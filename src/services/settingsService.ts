/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseClient';
import { Employee, HolidayLeave, LeaveQuotas } from '../types';
import { DEFAULT_LEAVE_QUOTAS } from '../constants/leaveTypes';

export interface CompanySettings {
  companyName: string;
  weekendType: string;
  vacationQuota: number;
  sickQuota: number;
  personalQuota: number;
  specialQuota: number;
  otherQuota: number;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด',
  weekendType: 'sat-sun',
  vacationQuota: DEFAULT_LEAVE_QUOTAS.vacation,
  sickQuota: DEFAULT_LEAVE_QUOTAS.sick,
  personalQuota: DEFAULT_LEAVE_QUOTAS.personal,
  specialQuota: DEFAULT_LEAVE_QUOTAS.special_leave,
  otherQuota: DEFAULT_LEAVE_QUOTAS.other,
};

export const subscribeSettings = (callback: (settings: CompanySettings) => void) => {
  const settingsDoc = doc(db, 'settings', 'global');
  return onSnapshot(
    settingsDoc,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          companyName: data.companyName || DEFAULT_COMPANY_SETTINGS.companyName,
          weekendType: data.weekendType || DEFAULT_COMPANY_SETTINGS.weekendType,
          vacationQuota: data.vacationQuota !== undefined ? Number(data.vacationQuota) : DEFAULT_COMPANY_SETTINGS.vacationQuota,
          sickQuota: data.sickQuota !== undefined ? Number(data.sickQuota) : DEFAULT_COMPANY_SETTINGS.sickQuota,
          personalQuota: data.personalQuota !== undefined ? Number(data.personalQuota) : DEFAULT_COMPANY_SETTINGS.personalQuota,
          specialQuota: data.specialQuota !== undefined ? Number(data.specialQuota) : DEFAULT_COMPANY_SETTINGS.specialQuota,
          otherQuota: data.otherQuota !== undefined ? Number(data.otherQuota) : DEFAULT_COMPANY_SETTINGS.otherQuota,
        });
      } else {
        callback(DEFAULT_COMPANY_SETTINGS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    }
  );
};

export const saveSettingsToCloud = async (
  companyName: string,
  weekendType: string,
  vacationQuota?: number,
  sickQuota?: number,
  personalQuota?: number,
  specialQuota?: number,
  otherQuota?: number
): Promise<void> => {
  const path = 'settings/global';
  try {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, {
      companyName,
      weekendType,
      vacationQuota: vacationQuota ?? DEFAULT_COMPANY_SETTINGS.vacationQuota,
      sickQuota: sickQuota ?? DEFAULT_COMPANY_SETTINGS.sickQuota,
      personalQuota: personalQuota ?? DEFAULT_COMPANY_SETTINGS.personalQuota,
      specialQuota: specialQuota ?? DEFAULT_COMPANY_SETTINGS.specialQuota,
      otherQuota: otherQuota ?? DEFAULT_COMPANY_SETTINGS.otherQuota,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export interface SystemBackupData {
  version: string;
  exportedAt: string;
  companyName: string;
  weekendType: string;
  leaveQuotas: LeaveQuotas;
  employees: Employee[];
  holidays: HolidayLeave[];
}

export const createSystemBackup = (
  companyName: string,
  weekendType: string,
  leaveQuotas: LeaveQuotas,
  employees: Employee[],
  holidays: HolidayLeave[]
): SystemBackupData => {
  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    companyName,
    weekendType,
    leaveQuotas,
    employees,
    holidays
  };
};

export interface ValidateBackupResult {
  valid: boolean;
  error?: string;
  data?: SystemBackupData;
}

export const validateBackupData = (rawJson: string): ValidateBackupResult => {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'รูปแบบไฟล์ JSON ไม่ถูกต้อง' };
    }

    if (!Array.isArray(parsed.employees)) {
      return { valid: false, error: 'ไม่พบรายการข้อมูลพนักงาน (employees) ที่ถูกต้อง' };
    }

    if (!Array.isArray(parsed.holidays)) {
      return { valid: false, error: 'ไม่พบรายการข้อมูลวันหยุดหรือการลา (holidays) ที่ถูกต้อง' };
    }

    const companyName = typeof parsed.companyName === 'string' && parsed.companyName.trim()
      ? parsed.companyName.trim()
      : DEFAULT_COMPANY_SETTINGS.companyName;

    const weekendType = typeof parsed.weekendType === 'string'
      ? parsed.weekendType
      : DEFAULT_COMPANY_SETTINGS.weekendType;

    const leaveQuotas: LeaveQuotas = {
      vacation: typeof parsed.leaveQuotas?.vacation === 'number' ? parsed.leaveQuotas.vacation : DEFAULT_COMPANY_SETTINGS.vacationQuota,
      sick: typeof parsed.leaveQuotas?.sick === 'number' ? parsed.leaveQuotas.sick : DEFAULT_COMPANY_SETTINGS.sickQuota,
      personal: typeof parsed.leaveQuotas?.personal === 'number' ? parsed.leaveQuotas.personal : DEFAULT_COMPANY_SETTINGS.personalQuota,
      special_leave: typeof parsed.leaveQuotas?.special_leave === 'number' ? parsed.leaveQuotas.special_leave : DEFAULT_COMPANY_SETTINGS.specialQuota,
      other: typeof parsed.leaveQuotas?.other === 'number' ? parsed.leaveQuotas.other : DEFAULT_COMPANY_SETTINGS.otherQuota,
    };

    return {
      valid: true,
      data: {
        version: parsed.version || '2.0.0',
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        companyName,
        weekendType,
        leaveQuotas,
        employees: parsed.employees,
        holidays: parsed.holidays,
      }
    };
  } catch (err: any) {
    return { valid: false, error: `ไม่สามารถประมวลผลไฟล์ได้: ${err?.message || 'JSON Parse Error'}` };
  }
};

