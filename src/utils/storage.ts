/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, HolidayLeave } from '../types';
export { calculateDaysBetween } from './dateUtils';

// Default initial employees list for enterprise context
const DEFAULT_EMPLOYEES: Employee[] = [];

// Default initial holidays
const DEFAULT_HOLIDAYS: HolidayLeave[] = [];

// One-time migration to clear out old pre-loaded sample employees and holidays for a clean start
if (typeof window !== 'undefined' && !localStorage.getItem('clean_start_migration_done')) {
  localStorage.setItem('company_employees', JSON.stringify([]));
  localStorage.setItem('company_holidays', JSON.stringify([]));
  localStorage.setItem('clean_start_migration_done', 'true');
}

export const getEmployeesFromStorage = (): Employee[] => {
  const data = localStorage.getItem('company_employees');
  if (!data) {
    localStorage.setItem('company_employees', JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  }
  return JSON.parse(data);
};

export const saveEmployeesToStorage = (employees: Employee[]): void => {
  localStorage.setItem('company_employees', JSON.stringify(employees));
};

export const getHolidaysFromStorage = (): HolidayLeave[] => {
  const data = localStorage.getItem('company_holidays');
  if (!data) {
    localStorage.setItem('company_holidays', JSON.stringify(DEFAULT_HOLIDAYS));
    return DEFAULT_HOLIDAYS;
  }
  return JSON.parse(data);
};

export const saveHolidaysToStorage = (holidays: HolidayLeave[]): void => {
  localStorage.setItem('company_holidays', JSON.stringify(holidays));
};
