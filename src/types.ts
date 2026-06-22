/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  position: string;
  department: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  joinDate?: string;
}

export type HolidayType = 'vacation' | 'sick' | 'personal' | 'public_holiday' | 'other';

export interface HolidayLeave {
  id: string;
  employeeId: string; // references Employee.id or 'all' for public holiday
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: HolidayType;
  title: string; // Title or reason, e.g., "ลาพักร้อนกลับบ้านเกิด"
  notes?: string;
  durationDays: number;
}
