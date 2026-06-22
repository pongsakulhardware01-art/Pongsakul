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
  CalendarDays
} from 'lucide-react';
import { Employee, HolidayLeave } from '../types';

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

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('company_name_holiday', companyName);
    localStorage.setItem('weekend_type_holiday', weekendType);
    alert('บันทึกการตั้งค่าบริษัทเรียบร้อยแล้ว! (หมายเหตุ: ระบบจะเปลี่ยนหัวตารางในเบราว์เซอร์ของคุณ)');
    window.location.reload(); // Refresh to apply throughout the app state gracefully
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
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
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
            <Building className="w-4.5 h-4.5 text-indigo-500" />
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
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">นโยบายวันหยุดประจำสัปดาห์ (Weekly Off-Days)</label>
              <select
                value={weekendType}
                onChange={(e) => setWeekendType(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="sat-sun">วันเสาร์ และ วันอาทิตย์ (สากล)</option>
                <option value="sun-only">วันอาทิตย์ (เฉพาะบางธุรกิจสำนักงาน)</option>
                <option value="none">ไม่มีวันหยุดประจำสัปดาห์คงที่</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
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
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 hover:bg-indigo-150 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg transition cursor-pointer"
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

      {/* FAQs Panel */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2.5">
          <HelpCircle className="w-4.5 h-4.5 text-indigo-500" />
          วิธีการทำงานและความปลอดภัยด้านข้อมูล
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          แอปพลิเคชันนี้ทำงานในระดับ Client-Side 100% ข้อมูลทั้งหมดของผู้ใช้และพนักงานจะถูกบันทึกอย่างปลอดภัยแบบออฟไลน์อยู่ใน Browser ของเครื่องคอมพิวเตอร์นี้ผ่านออบเจกต์ <code>LocalStorage</code> โดยตรง ไม่มีการส่งข้อมูลใด ๆ กลับขึ้นสู่อินเทอร์เน็ตภายนอกหรือคลาวด์อื่น ๆ ของระบบ ดังนั้นควรหมั่นส่งออกสำรองข้อมูล (.json) เก็บรักษาไว้เป็นระยะหากต้องการใช้งานระยะยาวเพื่อความปลอดภัยสูงสุดครับ
        </p>
      </div>
    </div>
  );
}
