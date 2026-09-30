/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, HolidayLeave, LeaveQuotas } from '../types';
import { DEFAULT_LEAVE_QUOTAS } from '../constants/leaveTypes';
import { 
  DEFAULT_COMPANY_SETTINGS, 
  CompanySettings, 
  subscribeSettings, 
  saveSettingsToCloud,
  validateBackupData 
} from '../services/settingsService';
import { subscribeEmployees, saveEmployeeToCloud, deleteEmployeeFromCloud } from '../services/employeeService';
import { subscribeHolidays, saveHolidayToCloud, deleteHolidayFromCloud } from '../services/holidayService';
import { getEmployeesFromStorage, getHolidaysFromStorage } from '../utils/storage';
import { ToastMessage, ToastType } from '../components/common/Toast';

interface CompanyContextType {
  employees: Employee[];
  holidays: HolidayLeave[];
  companyName: string;
  weekendType: string;
  leaveQuotas: LeaveQuotas;
  isLoading: boolean;
  selectedAnnualEmpId: string | null;
  setSelectedAnnualEmpId: (id: string | null) => void;
  // CRUD Actions
  saveEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  saveHoliday: (holiday: HolidayLeave) => Promise<void>;
  deleteHoliday: (holidayId: string) => Promise<void>;
  updateSettings: (settings: { companyName: string; weekendType: string; quotas: LeaveQuotas }) => Promise<void>;
  // Bulk updates (for settings/migrations)
  setEmployeesBulk: (updatedList: Employee[]) => Promise<void>;
  setHolidaysBulk: (updatedList: HolidayLeave[]) => Promise<void>;
  // Administrative Operations
  seedDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  restoreBackup: (rawJson: string) => Promise<{ success: boolean; message: string }>;
  // Toast notifications
  toast: ToastMessage | null;
  showToast: (type: ToastType, title: string, message?: string) => void;
  closeToast: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<HolidayLeave[]>([]);
  const [companyName, setCompanyName] = useState<string>(DEFAULT_COMPANY_SETTINGS.companyName);
  const [weekendType, setWeekendType] = useState<string>(DEFAULT_COMPANY_SETTINGS.weekendType);
  const [leaveQuotas, setLeaveQuotas] = useState<LeaveQuotas>(DEFAULT_LEAVE_QUOTAS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnualEmpId, setSelectedAnnualEmpId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: ToastType, title: string, message?: string) => {
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    // 1. One-time migration from LocalStorage to Cloud Firestore
    const runMigration = async () => {
      const localEmp = getEmployeesFromStorage();
      const localHol = getHolidaysFromStorage();
      const migrated = localStorage.getItem('firebase_migration_done') === 'true';

      if (!migrated && (localEmp.length > 0 || localHol.length > 0)) {
        console.log('Migrating local storage data to Firestore...');
        try {
          for (const emp of localEmp) {
            await saveEmployeeToCloud(emp);
          }
          for (const hol of localHol) {
            await saveHolidayToCloud(hol);
          }
          const storedCompany = localStorage.getItem('company_name_holiday');
          const storedWeekend = localStorage.getItem('weekend_type_holiday');
          if (storedCompany || storedWeekend) {
            await saveSettingsToCloud(
              storedCompany || DEFAULT_COMPANY_SETTINGS.companyName,
              storedWeekend || DEFAULT_COMPANY_SETTINGS.weekendType
            );
          }
        } catch (e) {
          console.error('Migration error: ', e);
        }
      }
      localStorage.setItem('firebase_migration_done', 'true');
    };

    runMigration().then(() => {
      // 2. Realtime Subscriptions to Firestore Collections
      const unsubEmployees = subscribeEmployees((list) => {
        setEmployees(list);
        setIsLoading(false);
      });

      const unsubHolidays = subscribeHolidays((list) => {
        setHolidays(list);
      });

      const unsubSettings = subscribeSettings((settings: CompanySettings) => {
        setCompanyName(settings.companyName);
        setWeekendType(settings.weekendType);
        setLeaveQuotas({
          vacation: settings.vacationQuota,
          sick: settings.sickQuota,
          personal: settings.personalQuota,
          special_leave: settings.specialQuota,
          other: settings.otherQuota,
        });
      });

      return () => {
        unsubEmployees();
        unsubHolidays();
        unsubSettings();
      };
    });
  }, []);

  const saveEmployee = async (employee: Employee) => {
    try {
      await saveEmployeeToCloud(employee);
      showToast('success', 'บันทึกข้อมูลพนักงานเรียบร้อย', `${employee.firstName} ${employee.lastName}`);
    } catch (err: any) {
      showToast('error', 'บันทึกข้อมูลพนักงานไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      await deleteEmployeeFromCloud(employeeId);
      showToast('info', 'ลบข้อมูลพนักงานและวันลาเรียบร้อย');
    } catch (err: any) {
      showToast('error', 'ลบข้อมูลไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const saveHoliday = async (holiday: HolidayLeave) => {
    try {
      await saveHolidayToCloud(holiday);
      showToast('success', 'บันทึกการลาสำเร็จ', holiday.title);
    } catch (err: any) {
      showToast('error', 'บันทึกวันลาไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    try {
      await deleteHolidayFromCloud(holidayId);
      showToast('info', 'ลบรายการวันลาเรียบร้อย');
    } catch (err: any) {
      showToast('error', 'ลบวันลาไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const updateSettings = async (settings: { companyName: string; weekendType: string; quotas: LeaveQuotas }) => {
    try {
      await saveSettingsToCloud(
        settings.companyName,
        settings.weekendType,
        settings.quotas.vacation,
        settings.quotas.sick,
        settings.quotas.personal,
        settings.quotas.special_leave,
        settings.quotas.other
      );
      showToast('success', 'บันทึกการตั้งค่าระบบเรียบร้อย');
    } catch (err: any) {
      showToast('error', 'บันทึกการตั้งค่าไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const setEmployeesBulk = async (updatedList: Employee[]) => {
    try {
      const currentIds = new Set(updatedList.map((e) => e.id));
      const deletedEmployees = employees.filter((e) => !currentIds.has(e.id));
      for (const emp of deletedEmployees) {
        await deleteEmployeeFromCloud(emp.id);
      }
      for (const emp of updatedList) {
        await saveEmployeeToCloud(emp);
      }
      showToast('success', 'ปรับปรุงรายชื่อพนักงานเรียบร้อย');
    } catch (err: any) {
      showToast('error', 'อัปเดตรายชื่อพนักงานไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const setHolidaysBulk = async (updatedList: HolidayLeave[]) => {
    try {
      const currentIds = new Set(updatedList.map((h) => h.id));
      const deletedHolidays = holidays.filter((h) => !currentIds.has(h.id));
      for (const hol of deletedHolidays) {
        await deleteHolidayFromCloud(hol.id);
      }
      for (const hol of updatedList) {
        await saveHolidayToCloud(hol);
      }
      showToast('success', 'ปรับปรุงข้อมูลวันหยุดเรียบร้อย');
    } catch (err: any) {
      showToast('error', 'อัปเดตข้อมูลวันหยุดไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const seedDemoData = async () => {
    try {
      const mockEmployees: Employee[] = [
        { id: 'emp-1', employeeCode: 'EMP001', firstName: 'สมชาย', lastName: 'ใจดี', nickname: 'ชาย', position: 'ผู้จัดการอาวุโส', department: 'บริหารงานบุคคล', isActive: true, joinDate: '2023-01-10' },
        { id: 'emp-2', employeeCode: 'EMP002', firstName: 'ณิชา', lastName: 'สุขใจ', nickname: 'ณิ', position: 'หัวหน้าทีมพัฒนา', department: 'ไอที', isActive: true, joinDate: '2024-03-15' },
        { id: 'emp-3', employeeCode: 'EMP003', firstName: 'ปกรณ์', lastName: 'สุวรรณ', nickname: 'ปาล์ม', position: 'นักออกแบบ UI/UX', department: 'ออกแบบผลิตภัณฑ์', isActive: true, joinDate: '2025-05-18' },
        { id: 'emp-4', employeeCode: 'EMP004', firstName: 'เกวลิน', lastName: 'รักสวย', nickname: 'กล้วย', position: 'เจ้าหน้าที่การตลาด', department: 'การตลาดดิจิทัล', isActive: true, joinDate: '2025-11-20' },
      ];

      const currentYear = new Date().getFullYear();
      const mockHolidays: HolidayLeave[] = [
        { id: 'hol-1', employeeId: 'emp-2', startDate: `${currentYear}-01-12`, endDate: `${currentYear}-01-14`, type: 'vacation', title: 'ลาพักร้อนท่องเที่ยวประจำปี', durationDays: 3 },
        { id: 'hol-2', employeeId: 'emp-4', startDate: `${currentYear}-02-09`, endDate: `${currentYear}-02-09`, type: 'sick', title: 'ลาป่วยจากไข้หวัดใหญ่และปวดศีรษะ', durationDays: 1 },
        { id: 'hol-3', employeeId: 'emp-1', startDate: `${currentYear}-03-16`, endDate: `${currentYear}-03-17`, type: 'personal', title: 'ลากิจดำเนินเอกสารราชการ', durationDays: 2 },
        { id: 'hol-4', employeeId: 'all', startDate: `${currentYear}-04-13`, endDate: `${currentYear}-04-15`, type: 'public_holiday', title: 'วันสงกรานต์ (วันขึ้นปีใหม่ไทย)', durationDays: 3 },
        { id: 'hol-5', employeeId: 'emp-3', startDate: `${currentYear}-05-06`, endDate: `${currentYear}-05-08`, type: 'vacation', title: 'ลาพักร้อนกลับต่างจังหวัด', durationDays: 3 },
        { id: 'hol-6', employeeId: 'emp-2', startDate: `${currentYear}-06-22`, endDate: `${currentYear}-06-22`, type: 'personal', title: 'ลากิจติดต่อธนาคาร', durationDays: 1 },
      ];

      for (const emp of mockEmployees) {
        await saveEmployeeToCloud(emp);
      }
      for (const hol of mockHolidays) {
        await saveHolidayToCloud(hol);
      }
      showToast('success', 'โหลดข้อมูลสาธิตเรียบร้อยแล้ว', `พนักงาน ${mockEmployees.length} ท่าน และประวัติวันหยุด ${mockHolidays.length} รายการ`);
    } catch (err: any) {
      showToast('error', 'โหลดข้อมูลสาธิตไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const clearAllData = async () => {
    try {
      for (const emp of employees) {
        await deleteEmployeeFromCloud(emp.id);
      }
      for (const hol of holidays) {
        await deleteHolidayFromCloud(hol.id);
      }
      showToast('info', 'ล้างข้อมูลระบบทั้งหมดเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('error', 'ล้างข้อมูลไม่สำเร็จ', err?.message);
      throw err;
    }
  };

  const restoreBackup = async (rawJson: string): Promise<{ success: boolean; message: string }> => {
    const validated = validateBackupData(rawJson);
    if (!validated.valid || !validated.data) {
      const msg = validated.error || 'ไฟล์สำรองไม่ถูกต้อง';
      showToast('error', 'นำเข้าข้อมูลไม่สำเร็จ', msg);
      return { success: false, message: msg };
    }

    try {
      const { data } = validated;

      // 1. Update settings
      await saveSettingsToCloud(
        data.companyName,
        data.weekendType,
        data.leaveQuotas.vacation,
        data.leaveQuotas.sick,
        data.leaveQuotas.personal,
        data.leaveQuotas.special_leave,
        data.leaveQuotas.other
      );

      // 2. Clear old data and write imported data
      for (const emp of employees) {
        await deleteEmployeeFromCloud(emp.id);
      }
      for (const hol of holidays) {
        await deleteHolidayFromCloud(hol.id);
      }

      for (const emp of data.employees) {
        await saveEmployeeToCloud(emp);
      }
      for (const hol of data.holidays) {
        await saveHolidayToCloud(hol);
      }

      const summaryMsg = `กู้คืนข้อมูลสำเร็จ! พนักงาน ${data.employees.length} คน, ประวัติวันลา ${data.holidays.length} รายการ`;
      showToast('success', 'กู้คืนข้อมูลจากไฟล์สำรองสำเร็จ', summaryMsg);
      return { success: true, message: summaryMsg };
    } catch (err: any) {
      const msg = err?.message || 'เกิดข้อผิดพลาดระหว่างเขียนข้อมูลลง Cloud';
      showToast('error', 'กู้คืนข้อมูลไม่สำเร็จ', msg);
      return { success: false, message: msg };
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        employees,
        holidays,
        companyName,
        weekendType,
        leaveQuotas,
        isLoading,
        selectedAnnualEmpId,
        setSelectedAnnualEmpId,
        saveEmployee,
        deleteEmployee,
        saveHoliday,
        deleteHoliday,
        updateSettings,
        setEmployeesBulk,
        setHolidaysBulk,
        seedDemoData,
        clearAllData,
        restoreBackup,
        toast,
        showToast,
        closeToast,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
