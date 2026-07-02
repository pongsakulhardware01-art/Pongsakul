/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Building, 
  Trash2, 
  RefreshCcw, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  CalendarDays,
  Download,
  Upload,
  Database,
  AlertTriangle,
  FileJson
} from 'lucide-react';
import { Employee, HolidayLeave } from '../types';
import { saveSettingsToCloud } from '../utils/firebase';

interface SystemSettingsProps {
  employees: Employee[];
  holidays: HolidayLeave[];
  onEmployeesChange: (updatedList: Employee[]) => void;
  onHolidaysChange: (updatedList: HolidayLeave[]) => void;
}

export default function SystemSettings({ 
  employees, 
  holidays, 
  onEmployeesChange, 
  onHolidaysChange 
}: SystemSettingsProps) {
  const [companyName, setCompanyName] = useState(() => {
    const stored = localStorage.getItem('company_name_holiday');
    return (!stored || stored === 'บริษัท บิวตี้ฟูล จำกัด') ? 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด' : stored;
  });
  const [weekendType, setWeekendType] = useState(() => localStorage.getItem('weekend_type_holiday') || 'sat-sun');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSeededAlert, setIsSeededAlert] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleExportData = () => {
    try {
      const backupData = {
        version: '1.2.0',
        companyName: localStorage.getItem('company_name_holiday') || 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด',
        weekendType: localStorage.getItem('weekend_type_holiday') || 'sat-sun',
        employees,
        holidays,
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateFormatted = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup_pongsakul_holiday_${dateFormatted}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล: ' + err?.message);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Simple validation to check structure
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('โครงสร้างไฟล์ไม่ถูกต้อง');
        }

        const importedEmployees = parsed.employees;
        const importedHolidays = parsed.holidays;

        if (!Array.isArray(importedEmployees)) {
          throw new Error('ไม่พบข้อมูลรายชื่อพนักงานที่ถูกต้องในไฟล์สะสม');
        }

        if (!Array.isArray(importedHolidays)) {
          throw new Error('ไม่พบข้อมูลวันหยุดหรือใบลาหยุดที่ถูกต้องในไฟล์สะสม');
        }

        // Optional settings restoration
        if (parsed.companyName && typeof parsed.companyName === 'string') {
          localStorage.setItem('company_name_holiday', parsed.companyName);
          setCompanyName(parsed.companyName);
        }
        if (parsed.weekendType && typeof parsed.weekendType === 'string') {
          localStorage.setItem('weekend_type_holiday', parsed.weekendType);
          setWeekendType(parsed.weekendType);
        }

        // Safe conversion of array fields
        onEmployeesChange(importedEmployees);
        onHolidaysChange(importedHolidays);

        setImportSuccess(`นำเข้าข้อมูลสำเร็จ! โหลดรายชื่อพนักงาน ${importedEmployees.length} คน และ ประวัติวันหยุด ${importedHolidays.length} รายการ เรียบร้อยแล้ว`);
        
        // Let's reload to let everything reflect nicely after a short timeout
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err: any) {
        setImportError(err?.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('company_name_holiday', companyName);
      localStorage.setItem('weekend_type_holiday', weekendType);
      await saveSettingsToCloud(companyName, weekendType);
      alert('บันทึกการตั้งค่าบริษัทเรียบร้อยแล้ว! ข้อมูลได้รับการประสานงานผ่าน Cloud เรียบร้อย');
      window.location.reload(); // Refresh to apply throughout the app state gracefully
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลไปยัง Cloud: ' + err?.message);
    }
  };

  const handleSeedMockData = () => {
    // Generate lovely sample data
    const mockEmployees: Employee[] = [
      { id: 'emp-1', employeeCode: 'EMP001', firstName: 'สมชาย', lastName: 'ใจดี', nickname: 'ชาย', position: 'ผู้จัดการอาวุโส', department: 'บริหารงานบุคคล', isActive: true, joinDate: '2023-01-10' },
      { id: 'emp-2', employeeCode: 'EMP002', firstName: 'ณิชา', lastName: 'สุขใจ', nickname: 'ณิ', position: 'หัวหน้าทีมพัฒนา', department: 'ไอที', isActive: true, joinDate: '2024-03-15' },
      { id: 'emp-3', employeeCode: 'EMP003', firstName: 'ปกรณ์', lastName: 'สุวรรณ', nickname: 'ปาล์ม', position: 'นักออกแบบ UI/UX', department: 'ออกแบบผลิตภัณฑ์', isActive: true, joinDate: '2025-05-18' },
      { id: 'emp-4', employeeCode: 'EMP004', firstName: 'เกวลิน', lastName: 'รักสวย', nickname: 'กล้วย', position: 'เจ้าหน้าที่การตลาด', department: 'การตลาดดิจิทัล', isActive: true, joinDate: '2025-11-20' },
    ];

    const mockHolidays: HolidayLeave[] = [
      { id: 'hol-1', employeeId: 'emp-2', startDate: '2026-06-01', endDate: '2026-06-03', type: 'vacation', title: 'ลาพักร้อนพาครอบครัวท่องเที่ยวประจำปี', durationDays: 3 },
      { id: 'hol-2', employeeId: 'emp-4', startDate: '2026-06-08', endDate: '2026-06-08', type: 'sick', title: 'ลาป่วยจากไข้หวัดใหญ่และปวดศีรษะ', durationDays: 1 },
      { id: 'hol-3', employeeId: 'emp-1', startDate: '2026-06-15', endDate: '2026-06-16', type: 'personal', title: 'ลากิจดำเนินเอกสารและโอนบ้าน', durationDays: 2 },
      { id: 'hol-4', employeeId: 'all', startDate: '2026-06-03', endDate: '2026-06-03', type: 'public_holiday', title: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี', durationDays: 1 },
    ];

    onEmployeesChange(mockEmployees);
    onHolidaysChange(mockHolidays);
    setIsSeededAlert(true);
    setTimeout(() => setIsSeededAlert(false), 3000);
  };

  const handleClearAllData = () => {
    localStorage.removeItem('holiday_leaves_records');
    localStorage.removeItem('company_employees_records');
    onEmployeesChange([]);
    onHolidaysChange([]);
    setIsAlertOpen(false);
    alert('ล้างข้อมูลพนักงานและวันหยุดทั้งหมดออกจากเบราว์เซอร์เสร็จสิ้น!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
          <Settings className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">การตั้งค่าระบบและองค์กร (System Configuration)</h2>
          <p className="text-sm text-slate-500 mt-0.5">ส่วนควบคุมสิทธิ์ ตัวแปรเริ่มต้น และงานความปลอดภัยของระบบหน่วยข้อมูลในเครื่อง</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Company Settings Board */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Building className="w-4.5 h-4.5 text-rose-500" />
            ข้อมูลทั่วไปของบริษัท & นโยบายประจำสัปดาห์
          </h3>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">ชื่อบริษัท / องค์กรที่จัดแสดงในปฏิทิน</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ระบุชื่อบริษัทของคุณ"
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">นโยบายวันหยุดประจำสัปดาห์ (Weekly Off-Days)</label>
              <select
                value={weekendType}
                onChange={(e) => setWeekendType(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
              >
                <option value="sat-sun">วันเสาร์ และ วันอาทิตย์ (สากล)</option>
                <option value="sun-only">วันอาทิตย์ (เฉพาะบางธุรกิจสำนักงาน)</option>
                <option value="none">ไม่มีวันหยุดประจำสัปดาห์คงที่</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
            >
              บันทึกการตั้งค่าพารามิเตอร์องค์กร
            </button>
          </form>
        </div>

        {/* Database Helpers Board */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
            การบำรุงรักษาฐานข้อมูลและการทดสอบ (Database Maintenance)
          </h3>

          <div className="space-y-4">
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-600 block">ทดสอบระบบด้วยชุดข้อมูลสาธิต (Data Seeding)</span>
              <p className="text-[11.5px] text-slate-500 leading-relaxed">
                ระบบจะสร้างรายชื่อพนักงานทดลองและใบรับรองวันลาหยุดตัวอย่างในเดือนมิถุนายนให้คุณ เพื่อให้ได้มองเห็นยอดตัวอย่างการทำงานทั้งหมดได้ง่ายๆ
              </p>
              <button
                type="button"
                onClick={handleSeedMockData}
                className="inline-flex items-center justify-center px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                ติดตั้งข้อมูลตัวอย่างเบื้องต้น
              </button>
              {isSeededAlert && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ติดตั้งสำเร็จ! ตรวจสอบที่หน้าปฏิทินวันหยุดได้เลย
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block text-rose-600">พื้นที่ล้างค่าความปลอดภัย (Danger Zone)</span>
              <p className="text-[11.5px] text-slate-500 leading-relaxed">
                การกดปุ่มด้านล่างนี้จะทำการลบข้อมูลรายชื่อพนักงานประวัติและฟังก์ชันวันหยุดทั้งหมดอย่างถาวรจาก Browser Memory บังคับไม่สามารถย้อนคืนได้
              </p>
              
              {!isAlertOpen ? (
                <button
                  type="button"
                  onClick={() => setIsAlertOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  ลบข้อมูลในเครื่องทั้งหมด...
                </button>
              ) : (
                <div className="bg-rose-50 p-4.5 rounded-xl border border-rose-200 space-y-3">
                  <span className="text-xs font-bold text-rose-800 block">⚠️ ยืนยันการลบข้อมูลทั้งหมด?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleClearAllData}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      ใช่, ลบทั้งหมดอย่างถาวร
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAlertOpen(false)}
                      className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 💾 Full System Import & Export Backup */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <Database className="w-4.5 h-4.5 text-rose-600" />
          ระบบสำรองและกู้คืนข้อมูลทั้งหมดของระบบ (Full System Backup & Restore)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Export section */}
          <div className="space-y-3 bg-slate-50 p-4.5 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              ส่งออกไฟล์สำรองข้อมูลระบบทั้งหมด (Export Backup JSON)
            </h4>
            <p className="text-[11.5px] text-slate-500 leading-relaxed">
              ทำการบันทึกข้อมูลรายชื่อพนักงานทั้งหมด ({employees.length} คน), ประวัติการลาวันหยุด ({holidays.length} รายการ), ชื่อองค์กร และค่าโครงสร้างระบบ ลงในไฟล์สำรอง <code>.json</code> เพื่อดาวน์โหลดเก็บรักษาไว้ภายนอกได้อย่างปลอดภัย
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center justify-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                ดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมด (.json)
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="space-y-3 bg-slate-50 p-4.5 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-rose-600" />
              นำเข้าไฟล์สำรองเพื่อกู้คืนข้อมูล (Import / Restore JSON)
            </h4>
            <p className="text-[11.5px] text-slate-500 leading-relaxed">
              เลือกไฟล์สำรอง <code>.json</code> ที่เคยส่งออกไว้จากระบบนี้เพื่อกู้คืนรายชื่อพนักงาน ประวัติการลา และชื่อบริษัทกลับคืนสู่เครื่องของคุณ <span className="text-rose-600 font-bold">⚠️ คำเตือน: จะลบและเขียนทับข้อมูลเดิมทั้งหมดที่กำลังใช้งานอยู่</span>
            </p>
            
            <div className="pt-1">
              <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl px-4 py-5 hover:bg-white hover:border-rose-500 transition cursor-pointer text-center group">
                <FileJson className="w-8 h-8 text-slate-400 group-hover:text-rose-500 transition mb-1.5" />
                <span className="text-xs font-bold text-slate-700 block">คลิกที่นี่เพื่อเลือกไฟล์สำรองเพื่อนำเข้า</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">รับเฉพาะไฟล์ประเภท .json เท่านั้น</span>
                
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden" 
                />
              </label>
            </div>

            {importSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-start gap-1.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">กู้คืนสำเร็จ!</p>
                  <p className="text-[10.5px] text-emerald-700 mt-0.5">{importSuccess}</p>
                </div>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-start gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">เกิดข้อผิดพลาดในการนำเข้า</p>
                  <p className="text-[10.5px] text-rose-700 mt-0.5">{importError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQs Panel */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2.5">
          <HelpCircle className="w-4.5 h-4.5 text-rose-500" />
          วิธีการทำงานและความปลอดภัยด้านข้อมูล
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          แอปพลิเคชันนี้ทำงานในระดับ Client-Side 100% ข้อมูลทั้งหมดของผู้ใช้และพนักงานจะถูกบันทึกอย่างปลอดภัยแบบออฟไลน์อยู่ใน Browser ของเครื่องคอมพิวเตอร์นี้ผ่านออบเจกต์ <code>LocalStorage</code> โดยตรง ไม่มีการส่งข้อมูลใด ๆ กลับขึ้นสู่อินเทอร์เน็ตภายนอกหรือคลาวด์อื่น ๆ ของระบบ ดังนั้นควรหมั่นส่งออกสำรองข้อมูล (.json) เก็บรักษาไว้เป็นระยะหากต้องการใช้งานระยะยาวเพื่อความปลอดภัยสูงสุดครับ
        </p>
      </div>
    </div>
  );
}
