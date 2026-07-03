/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Settings, 
  Users, 
  CheckCircle2, 
  BarChart3, 
  Menu, 
  X, 
  ShieldAlert,
  Compass,
  Heart,
  CloudLightning,
  Loader2
} from 'lucide-react';
import { Employee, HolidayLeave } from './types';
import {
  getEmployeesFromStorage,
  getHolidaysFromStorage
} from './utils/storage';
import {
  subscribeEmployees,
  subscribeHolidays,
  subscribeSettings,
  saveEmployeeToCloud,
  deleteEmployeeFromCloud,
  saveHolidayToCloud,
  deleteHolidayFromCloud,
  saveSettingsToCloud
} from './utils/firebase';
import EmployeeSettings from './components/EmployeeSettings';
import HolidayCalendar from './components/HolidayCalendar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SystemSettings from './components/SystemSettings';

export default function App() {
  // Navigation menu state
  const [activeMenu, setActiveMenu] = useState<'holidays' | 'employees' | 'analytics' | 'settings'>('holidays');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load persistence state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<HolidayLeave[]>([]);
  const [companyName, setCompanyName] = useState<string>('บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. One-time migration from LocalStorage to Firestore
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
              storedCompany || 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด',
              storedWeekend || 'sat-sun'
            );
          }
        } catch (e) {
          console.error('Migration error: ', e);
        }
      }
      localStorage.setItem('firebase_migration_done', 'true');
    };

    runMigration().then(() => {
      // 2. Subscribe to realtime cloud updates
      const unsubEmployees = subscribeEmployees((list) => {
        setEmployees(list);
        setIsLoading(false);
      });

      const unsubHolidays = subscribeHolidays((list) => {
        setHolidays(list);
      });

      const unsubSettings = subscribeSettings((settings) => {
        setCompanyName(settings.companyName);
      });

      return () => {
        unsubEmployees();
        unsubHolidays();
        unsubSettings();
      };
    });
  }, []);

  const handleEmployeesChange = async (updatedList: Employee[]) => {
    try {
      // Determine deleted
      const currentIds = new Set(updatedList.map(e => e.id));
      const deletedEmployees = employees.filter(e => !currentIds.has(e.id));
      for (const emp of deletedEmployees) {
        await deleteEmployeeFromCloud(emp.id);
      }
      // Save/update
      for (const emp of updatedList) {
        await saveEmployeeToCloud(emp);
      }
    } catch (err: any) {
      console.error("Error saving employees change to cloud: ", err);
      alert("ไม่สามารถบันทึกข้อมูลพนักงานไปยัง Cloud ได้: " + err.message);
    }
  };

  const handleHolidaysChange = async (updatedList: HolidayLeave[]) => {
    try {
      // Determine deleted
      const currentIds = new Set(updatedList.map(h => h.id));
      const deletedHolidays = holidays.filter(h => !currentIds.has(h.id));
      for (const hol of deletedHolidays) {
        await deleteHolidayFromCloud(hol.id);
      }
      // Save/update
      for (const hol of updatedList) {
        await saveHolidayToCloud(hol);
      }
    } catch (err: any) {
      console.error("Error saving holidays change to cloud: ", err);
      alert("ไม่สามารถบันทึกข้อมูลวันหยุดไปยัง Cloud ได้: " + err.message);
    }
  };

  const menuItems = [
    { id: 'holidays', label: 'ปฏิทินวันหยุด', icon: CalendarDays, desc: 'ปฏิทิน & บันทึกใบลาหยุด' },
    { id: 'employees', label: 'จัดการรายชื่อพนักงาน', icon: Users, desc: 'ประวัติพนักงาน & ส่งออก' },
    { id: 'analytics', label: 'แดชบอร์ด & สถิติ', icon: BarChart3, desc: 'วิเคราะห์ยอดลาองค์กร' },
    { id: 'settings', label: 'การตั้งค่าระบบ', icon: Settings, desc: 'นโยบาย & ข้อมูลสาธิต' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans flex flex-col lg:flex-row">
      
      {/* 📱 Mobile Top Header */}
      <header className="lg:hidden bg-slate-900 text-white px-5 h-16 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600/10 flex items-center justify-center">
            <CalendarDays className="w-5.5 h-5.5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xs font-bold leading-tight font-sans text-white">{companyName}</h1>
          </div>
        </div>

        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white transition focus:outline-none cursor-pointer"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* 💻 Responsive Sidebar Container (Desktop Sidebar / Mobile Drawer Overlay) */}
      <aside className={`
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:static top-16 lg:top-0 left-0 bottom-0 w-64 lg:w-72 bg-[#0F172A] text-slate-100 flex flex-col z-30 transition-transform duration-300 border-r border-slate-800/60 shadow-xl lg:shadow-none shrink-0
      `}>
        {/* Desktop Brand Header */}
        <div className="hidden lg:flex p-6 border-b border-slate-800/80 items-center space-x-3 bg-slate-950/40">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <CalendarDays className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm text-slate-100 tracking-tight block truncate" title={companyName}>
              {companyName}
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  setIsMobileOpen(false); // Close mobile drawer
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/40' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3.5 shrink-0 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <div className="min-w-0">
                  <span className="text-xs tracking-wide block">{item.label}</span>
                  <span className={`text-[9px] font-medium block leading-none mt-0.5 ${isActive ? 'text-rose-200' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-950/20 text-[10px] text-slate-500 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5 font-semibold text-slate-400">
            <CloudLightning className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>เชื่อมต่อคลาวด์: Cloud Sync Active</span>
          </div>
          <p className="leading-relaxed">ข้อมูลทั้งหมดเชื่อมโยงแบบเรียลไทม์ผ่าน Firestore ผู้ใช้ทุกคนเห็นข้อมูลตรงกันทันที</p>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/50 text-[9px]">
            <span>Company Portal</span>
            <span>v1.1.0</span>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile active menu drawer */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden mt-16"
        />
      )}

      {/* 🖥️ Main Viewport Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          
          {/* Active View Router */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
              <h3 className="text-sm font-bold text-slate-800">กำลังเชื่อมต่อฐานข้อมูลคลาวด์...</h3>
              <p className="text-xs text-slate-500 mt-1">ประสานข้อมูลแบบเรียลไทม์กับ Google Cloud Firestore</p>
            </div>
          ) : (
            <>
              {activeMenu === 'holidays' && (
                <HolidayCalendar 
                  employees={employees}
                  holidays={holidays}
                  onHolidaysChange={handleHolidaysChange}
                />
              )}

              {activeMenu === 'employees' && (
                <EmployeeSettings 
                  employees={employees} 
                  onEmployeesChange={handleEmployeesChange} 
                />
              )}

              {activeMenu === 'analytics' && (
                <AnalyticsDashboard 
                  employees={employees}
                  holidays={holidays}
                />
              )}

              {activeMenu === 'settings' && (
                <SystemSettings 
                  employees={employees}
                  holidays={holidays}
                  onEmployeesChange={handleEmployeesChange}
                  onHolidaysChange={handleHolidaysChange}
                />
              )}
            </>
          )}

        </div>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200/60 py-4.5 text-center mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-[11px] text-slate-400 font-medium flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>© 2026 {companyName}. สงวนลิขสิทธิ์ทั้งหมดตามกฎหมายองค์กร</p>
            <div className="flex items-center gap-1.5">
              <span>จัดทำด้วยความใส่ใจพนักงานในองค์กร</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            </div>
          </div>
        </footer>
      </main>

    </div>
  );
}
