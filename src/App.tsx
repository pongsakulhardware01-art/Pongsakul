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
  Loader2,
  Calculator,
  ExternalLink,
  FileText,
  ReceiptText
} from 'lucide-react';
import { Employee, HolidayLeave, LeaveQuotas } from './types';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import Toast from './components/common/Toast';
import EmployeeSettings from './components/EmployeeSettings';
import HolidayCalendar from './components/HolidayCalendar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SystemSettings from './components/SystemSettings';
import { APP_CONFIG } from './constants/appConfig';

function AppContent() {
  // Navigation menu state
  const [activeMenu, setActiveMenu] = useState<'registry' | 'settings'>('registry');
  const [activeSubTab, setActiveSubTab] = useState<'holidays' | 'employees' | 'analytics'>('holidays');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Centralized State from Company Context
  const {
    employees,
    holidays,
    companyName,
    leaveQuotas,
    isLoading,
    selectedAnnualEmpId,
    setSelectedAnnualEmpId,
    setEmployeesBulk,
    setHolidaysBulk,
    toast,
    closeToast
  } = useCompany();

  const handleViewAnnualReport = (empId: string) => {
    setSelectedAnnualEmpId(empId);
    setActiveMenu('registry');
    setActiveSubTab('analytics');
    setIsMobileOpen(false);
  };

  const menuItems = [
    { id: 'registry', label: 'ทะเบียน พนักงาน&ปฎิทิน', icon: CalendarDays, desc: 'ปฏิทิน, รายชื่อพนักงาน & สถิติ' },
    { id: 'settings', label: 'การตั้งค่าระบบ', icon: Settings, desc: 'นโยบาย & ข้อมูลสาธิต' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans flex flex-col lg:flex-row">
      
      {/* 📱 Mobile Top Header */}
      <header className="lg:hidden bg-slate-900 text-white px-4 h-14 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold leading-tight font-sans text-white truncate max-w-[190px] sm:max-w-xs">{companyName}</h1>
            <div className="flex items-center gap-1 mt-0.5 text-[9px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Cloud Sync</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition focus:outline-none cursor-pointer flex items-center gap-1 text-xs"
            aria-label="เมนูเพิ่มเติม"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
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
              <React.Fragment key={item.id}>
                <button
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

                {item.id === 'registry' && (
                  <>
                    <a
                      href="https://pongsakul-aicalculate.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center px-4 py-3 rounded-xl text-left transition duration-150 text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 cursor-pointer group no-underline decoration-none"
                    >
                      <Calculator className="w-5 h-5 mr-3.5 shrink-0 text-slate-400 group-hover:text-slate-200 transition" />
                      <div className="min-w-0 flex-1 flex items-center justify-between">
                        <div>
                          <span className="text-xs tracking-wide block">โปรแกรมคำนวณ</span>
                          <span className="text-[9px] font-medium block leading-none mt-0.5 text-slate-500">
                            เปิดระบบคำนวณและประมวลผล
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0 ml-2" />
                      </div>
                    </a>

                    <a
                      href="https://pongsakulpdf.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center px-4 py-3 rounded-xl text-left transition duration-150 text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 cursor-pointer group no-underline decoration-none"
                    >
                      <FileText className="w-5 h-5 mr-3.5 shrink-0 text-slate-400 group-hover:text-slate-200 transition" />
                      <div className="min-w-0 flex-1 flex items-center justify-between">
                        <div>
                          <span className="text-xs tracking-wide block">แปลงไฟล์ PDF</span>
                          <span className="text-[9px] font-medium block leading-none mt-0.5 text-slate-500">
                            เปิดระบบเครื่องมือจัดการและแปลงไฟล์ PDF
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0 ml-2" />
                      </div>
                    </a>

                    <a
                      href="https://pongsakulquotation.onrender.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center px-4 py-3 rounded-xl text-left transition duration-150 text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 cursor-pointer group no-underline decoration-none"
                    >
                      <ReceiptText className="w-5 h-5 mr-3.5 shrink-0 text-slate-400 group-hover:text-slate-200 transition" />
                      <div className="min-w-0 flex-1 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs tracking-wide block">ใบเสนอราคา</span>
                            <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1 py-0.2 rounded font-medium">ชั่วคราว</span>
                          </div>
                          <span className="text-[9px] font-medium block leading-none mt-0.5 text-slate-500">
                            เปิดระบบออกใบเสนอราคาออนไลน์
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition shrink-0 ml-2" />
                      </div>
                    </a>
                  </>
                )}
              </React.Fragment>
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
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/50 text-[9px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-semibold">เวอร์ชั่นระบบ (Version)</span>
              <span className="bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold font-mono">{APP_CONFIG.version}</span>
            </div>
            <div className="text-[8px] text-slate-600 mt-1 space-y-0.5">
              {APP_CONFIG.versionHistory[0]?.highlights.slice(0, 3).map((h, i) => (
                <p key={i}>• {h}</p>
              ))}
            </div>
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
      <main className="flex-1 flex flex-col min-w-0 relative pb-20 lg:pb-0">
        <div className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">
          
          {/* Active View Router */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
              <h3 className="text-sm font-bold text-slate-800">กำลังเชื่อมต่อฐานข้อมูลคลาวด์...</h3>
              <p className="text-xs text-slate-500 mt-1">ประสานข้อมูลแบบเรียลไทม์กับ Google Cloud Firestore</p>
            </div>
          ) : (
            <>
              {activeMenu === 'registry' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Segmented Sub-navigation Tabs (Desktop & Tablet) */}
                  <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-100 shadow-3xs flex gap-1 overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setActiveSubTab('holidays')}
                      className={`flex-1 min-w-[105px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeSubTab === 'holidays'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      <span>ปฏิทินวันหยุด</span>
                    </button>
                    <button
                      onClick={() => setActiveSubTab('employees')}
                      className={`flex-1 min-w-[105px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeSubTab === 'employees'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <span>จัดการพนักงาน</span>
                    </button>
                    <button
                      onClick={() => setActiveSubTab('analytics')}
                      className={`flex-1 min-w-[105px] sm:min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeSubTab === 'analytics'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      <span>แดชบอร์ด & สถิติ</span>
                    </button>
                  </div>

                  {/* Render active sub-component */}
                  {activeSubTab === 'holidays' && (
                    <HolidayCalendar 
                      employees={employees}
                      holidays={holidays}
                      onHolidaysChange={setHolidaysBulk}
                      leaveQuotas={leaveQuotas}
                      companyName={companyName}
                      onViewEmployeeAnnualReport={handleViewAnnualReport}
                    />
                  )}

                  {activeSubTab === 'employees' && (
                    <EmployeeSettings 
                      employees={employees} 
                      onEmployeesChange={setEmployeesBulk} 
                    />
                  )}

                  {activeSubTab === 'analytics' && (
                    <AnalyticsDashboard 
                      employees={employees}
                      holidays={holidays}
                      leaveQuotas={leaveQuotas}
                      companyName={companyName}
                      initialSelectedEmpId={selectedAnnualEmpId || undefined}
                    />
                  )}
                </div>
              )}

              {activeMenu === 'settings' && (
                <SystemSettings />
              )}
            </>
          )}

        </div>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200/60 py-4 text-center mt-auto hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-[11px] text-slate-400 font-medium flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>© 2026 {companyName}. สงวนลิขสิทธิ์ทั้งหมดตามกฎหมายองค์กร</p>
            <div className="flex items-center gap-1.5">
              <span>จัดทำด้วยความใส่ใจพนักงานในองค์กร</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            </div>
          </div>
        </footer>
      </main>

      {/* 📱 Mobile Fixed Bottom Navigation Bar (Ergonomic Thumb Zone) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around">
        <button
          onClick={() => {
            setActiveMenu('registry');
            setActiveSubTab('holidays');
            setIsMobileOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer ${
            activeMenu === 'registry' && activeSubTab === 'holidays'
              ? 'text-rose-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays className={`w-5 h-5 mb-0.5 ${activeMenu === 'registry' && activeSubTab === 'holidays' ? 'text-rose-600' : 'text-slate-400'}`} />
          <span className="text-[10px] leading-tight">ปฏิทิน</span>
        </button>

        <button
          onClick={() => {
            setActiveMenu('registry');
            setActiveSubTab('employees');
            setIsMobileOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer ${
            activeMenu === 'registry' && activeSubTab === 'employees'
              ? 'text-rose-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className={`w-5 h-5 mb-0.5 ${activeMenu === 'registry' && activeSubTab === 'employees' ? 'text-rose-600' : 'text-slate-400'}`} />
          <span className="text-[10px] leading-tight">พนักงาน</span>
        </button>

        <button
          onClick={() => {
            setActiveMenu('registry');
            setActiveSubTab('analytics');
            setIsMobileOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer ${
            activeMenu === 'registry' && activeSubTab === 'analytics'
              ? 'text-rose-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className={`w-5 h-5 mb-0.5 ${activeMenu === 'registry' && activeSubTab === 'analytics' ? 'text-rose-600' : 'text-slate-400'}`} />
          <span className="text-[10px] leading-tight">สถิติ/รายงาน</span>
        </button>

        <button
          onClick={() => {
            setActiveMenu('settings');
            setIsMobileOpen(false);
          }}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition cursor-pointer ${
            activeMenu === 'settings'
              ? 'text-rose-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className={`w-5 h-5 mb-0.5 ${activeMenu === 'settings' ? 'text-rose-600' : 'text-slate-400'}`} />
          <span className="text-[10px] leading-tight">ตั้งค่าระบบ</span>
        </button>
      </nav>

      {/* Cloud Sync Toast Notification */}
      <Toast toast={toast} onClose={closeToast} />

    </div>
  );
}

export default function App() {
  return (
    <CompanyProvider>
      <AppContent />
    </CompanyProvider>
  );
}
