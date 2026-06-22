/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, HolidayLeave } from '../types';

// Default initial employees list for enterprise context
const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'EMP001',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    nickname: 'ชาย',
    position: 'ผู้จัดการทั่วไป',
    department: 'บริหาร',
    phone: '081-234-5678',
    email: 'somchai@company.com',
    isActive: true,
    joinDate: '2022-01-15'
  },
  {
    id: 'emp-2',
    employeeCode: 'EMP002',
    firstName: 'วิภา',
    lastName: 'รักดี',
    nickname: 'วิ',
    position: 'นักพัฒนาซอฟต์แวร์อาวุโส',
    department: 'ไอที',
    phone: '082-345-6789',
    email: 'wipa@company.com',
    isActive: true,
    joinDate: '2023-03-01'
  },
  {
    id: 'emp-3',
    employeeCode: 'EMP003',
    firstName: 'ธนพล',
    lastName: 'รุ่งเรือง',
    nickname: 'พล',
    position: 'เจ้าหน้าที่ฝ่ายทรัพยากรบุคคล',
    department: 'ฝ่ายบุคคล (HR)',
    phone: '083-456-7890',
    email: 'thanapol@company.com',
    isActive: true,
    joinDate: '2024-05-10'
  },
  {
    id: 'emp-4',
    employeeCode: 'EMP004',
    firstName: 'กนกวรรณ',
    lastName: 'แก้วงาม',
    nickname: 'ก้อย',
    position: 'ดีไซเนอร์สินค้า',
    department: 'ออกแบบ',
    phone: '084-567-8901',
    email: 'kanokwan@company.com',
    isActive: true,
    joinDate: '2025-02-20'
  },
  {
    id: 'emp-5',
    employeeCode: 'EMP005',
    firstName: 'มานะ',
    lastName: 'เพียรพยายาม',
    nickname: 'นะ',
    position: 'เจ้าหน้าที่ฝ่ายการตลาดดิจิทัล',
    department: 'การตลาด',
    phone: '085-678-9012',
    email: 'mana@company.com',
    isActive: true,
    joinDate: '2025-08-11'
  }
];

// Default initial holidays (around June/July 2026 to fit the current simulated environment date)
const DEFAULT_HOLIDAYS: HolidayLeave[] = [
  {
    id: 'hol-1',
    employeeId: 'emp-2',
    startDate: '2026-06-15',
    endDate: '2026-06-17',
    type: 'vacation',
    title: 'ลาพักร้อนท่องเที่ยวต่างจังหวัด',
    notes: 'เดินทางไปเชียงใหม่ พักผ่อนประจำปี',
    durationDays: 3
  },
  {
    id: 'hol-2',
    employeeId: 'emp-4',
    startDate: '2026-06-22',
    endDate: '2026-06-22',
    type: 'sick',
    title: 'ลาป่วยพบแพทย์',
    notes: 'นัดตรวจทันตกรรมและตรวจสุขภาพประจำปี',
    durationDays: 1
  },
  {
    id: 'hol-3',
    employeeId: 'emp-1',
    startDate: '2026-06-03',
    endDate: '2026-06-03',
    type: 'public_holiday',
    title: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
    notes: 'วันหยุดราชการประจำปี',
    durationDays: 1
  },
  {
    id: 'hol-4',
    employeeId: 'emp-3',
    startDate: '2026-07-06',
    endDate: '2026-07-08',
    type: 'personal',
    title: 'ลากิจติดต่อราชการ',
    notes: 'ทำธุรกรรมจัดตั้งทะเบียนบ้าน',
    durationDays: 3
  },
  {
    id: 'hol-5',
    employeeId: 'all', // represents public holiday for everyone
    startDate: '2026-06-12',
    endDate: '2026-06-12',
    type: 'public_holiday',
    title: 'วันหยุดบริษัทพิเศษ',
    notes: 'วันหยุดประจำบริษัท',
    durationDays: 1
  }
];

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

// Simple utility to calculate duration between dates inclusive
export const calculateDaysBetween = (startStr: string, endStr: string): number => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || !endStr) return 1;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};
