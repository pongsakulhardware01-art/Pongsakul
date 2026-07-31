/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef } from 'react';
import { toJpeg } from 'html-to-image';
import { Employee, HolidayLeave, HolidayType, LeaveQuotas } from '../types';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  BarChart3, 
  Award, 
  TrendingUp, 
  Briefcase, 
  Layers,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  Building2,
  UserCheck,
  FileCheck2,
  FileSpreadsheet,
  Sparkles,
  Loader2,
  Calendar,
  User,
  ChevronRight
} from 'lucide-react';

interface AnalyticsDashboardProps {
  employees: Employee[];
  holidays: HolidayLeave[];
  leaveQuotas: LeaveQuotas;
}

const TYPE_TRANSLATION: Record<HolidayType, { label: string; color: string; bg: string; border: string }> = {
  vacation: { label: 'ลาพักร้อน', color: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-100' },
  sick: { label: 'ลาป่วย', color: 'text-rose-600', bg: 'bg-rose-500', border: 'border-rose-100' },
  personal: { label: 'ลากิจ', color: 'text-teal-600', bg: 'bg-teal-500', border: 'border-teal-100' },
  public_holiday: { label: 'วันหยุดนักขัตฤกษ์', color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-100' },
  special_leave: { label: 'วันลาหยุดพิเศษ', color: 'text-fuchsia-600', bg: 'bg-fuchsia-500', border: 'border-fuchsia-100' },
  other: { label: 'อื่นๆ', color: 'text-purple-600', bg: 'bg-purple-500', border: 'border-purple-100' },
};

const LEAVE_TYPES_LIST: { type: HolidayType; label: string; bgColor: string; borderColor: string }[] = [
  { type: 'vacation', label: 'ลาพักร้อน', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { type: 'sick', label: 'ลาป่วย', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { type: 'personal', label: 'ลากิจ', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
  { type: 'special_leave', label: 'วันลาหยุดพิเศษ', bgColor: 'bg-fuchsia-50', borderColor: 'border-fuchsia-200' },
  { type: 'other', label: 'อื่นๆ', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' }
];

export default function AnalyticsDashboard({ employees, holidays, leaveQuotas }: AnalyticsDashboardProps) {
  const today = new Date();

  // Individual Report State
  const [reportEmpId, setReportEmpId] = useState<string>(employees[0]?.id || '');
  const [reportMonth, setReportMonth] = useState<number>(today.getMonth());
  const [reportYear, setReportYear] = useState<number>(today.getFullYear());
  const [isExportingJpg, setIsExportingJpg] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const reportSectionRef = useRef<HTMLDivElement>(null);

  const THAI_MONTHS_FULL = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const targetEmp = useMemo(() => {
    return employees.find(e => e.id === reportEmpId) || employees[0];
  }, [employees, reportEmpId]);

  // Report calculations for target employee
  const reportData = useMemo(() => {
    if (!targetEmp) return null;

    const empLeaves = holidays.filter(h => h.employeeId === targetEmp.id);

    const ytdLeaves = empLeaves.filter(h => {
      const year = parseInt(h.startDate.split('-')[0], 10);
      return year === reportYear;
    });

    const monthlyLeaves = ytdLeaves.filter(h => {
      const month = parseInt(h.startDate.split('-')[1], 10) - 1;
      return month === reportMonth;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));

    const monthlyTotalDays = monthlyLeaves.reduce((sum, h) => sum + h.durationDays, 0);

    const monthTypeCounts: Record<HolidayType, number> = {
      vacation: 0,
      sick: 0,
      personal: 0,
      public_holiday: 0,
      special_leave: 0,
      other: 0,
    };
    monthlyLeaves.forEach(h => {
      if (monthTypeCounts[h.type] !== undefined) {
        monthTypeCounts[h.type] += h.durationDays;
      }
    });

    const ytdTypeCounts: Record<HolidayType, number> = {
      vacation: 0,
      sick: 0,
      personal: 0,
      public_holiday: 0,
      special_leave: 0,
      other: 0,
    };
    ytdLeaves.forEach(h => {
      if (ytdTypeCounts[h.type] !== undefined) {
        ytdTypeCounts[h.type] += h.durationDays;
      }
    });

    const remainingQuota = {
      vacation: Math.max(0, leaveQuotas.vacation - ytdTypeCounts.vacation),
      sick: Math.max(0, leaveQuotas.sick - ytdTypeCounts.sick),
      personal: Math.max(0, leaveQuotas.personal - ytdTypeCounts.personal),
      special_leave: Math.max(0, leaveQuotas.special_leave - ytdTypeCounts.special_leave),
      other: Math.max(0, leaveQuotas.other - ytdTypeCounts.other),
    };

    return {
      empLeaves,
      ytdLeaves,
      monthlyLeaves,
      monthlyTotalDays,
      monthTypeCounts,
      ytdTypeCounts,
      remainingQuota,
    };
  }, [targetEmp, holidays, reportMonth, reportYear, leaveQuotas]);

  const handleExportReportJpg = async () => {
    if (!reportRef.current || !targetEmp) return;
    setIsExportingJpg(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      const dataUrl = await toJpeg(reportRef.current, {
        quality: 1.0,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          borderRadius: '16px',
        }
      });

      const monthName = THAI_MONTHS_FULL[reportMonth];
      const thaiYear = reportYear + 543;
      const empNameClean = `${targetEmp.firstName}_${targetEmp.lastName}`.replace(/\s+/g, '_');

      const link = document.createElement('a');
      link.download = `รายงานการลา_${empNameClean}_${monthName}_${thaiYear}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting JPG report:', error);
      alert('ไม่สามารถส่งออกภาพ JPG ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingJpg(false);
    }
  };

  const handleSelectEmployeeForReport = (empId: string) => {
    setReportEmpId(empId);
    if (reportSectionRef.current) {
      reportSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Basic Statistics Calculations
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.isActive).length;
    const totalLeaves = holidays.length;
    
    // Total days of approved leave
    const totalLeaveDays = holidays.reduce((sum, h) => sum + h.durationDays, 0);
    
    // Average leave days per active employee
    const averageDays = activeEmployees > 0 ? (totalLeaveDays / activeEmployees).toFixed(1) : '0';

    // Grouping by Leave Type
    const typeCounts: Record<HolidayType, number> = {
      vacation: 0,
      sick: 0,
      personal: 0,
      public_holiday: 0,
      special_leave: 0,
      other: 0,
    };
    
    holidays.forEach(h => {
      if (typeCounts[h.type] !== undefined) {
        typeCounts[h.type] += h.durationDays;
      }
    });

    const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a as HolidayType] > typeCounts[b as HolidayType] ? a : b
    ) as HolidayType;

    // Monthly aggregation
    const monthlyData = Array(12).fill(0);
    holidays.forEach(h => {
      // Assuming YYYY-MM-DD
      const monthIndex = parseInt(h.startDate.split('-')[1], 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex] += h.durationDays;
      }
    });

    // Top employees by leaves taken
    const empLeaveDays: Record<string, number> = {};
    holidays.forEach(h => {
      if (h.employeeId !== 'all') { // Skip public holidays for top employee leaves
        empLeaveDays[h.employeeId] = (empLeaveDays[h.employeeId] || 0) + h.durationDays;
      }
    });

    const topEmployees = Object.entries(empLeaveDays)
      .map(([empId, days]) => {
        const found = employees.find(e => e.id === empId);
        return {
          employee: found,
          days,
        };
      })
      .filter(item => item.employee !== undefined)
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    // Department Distribution
    const deptLeaves: Record<string, number> = {};
    holidays.forEach(h => {
      if (h.employeeId !== 'all') {
        const found = employees.find(e => e.id === h.employeeId);
        if (found) {
          deptLeaves[found.department] = (deptLeaves[found.department] || 0) + h.durationDays;
        }
      }
    });

    // Individual Employee Leave Quota Summary
    const employeeLeaveSummary = employees.map(emp => {
      const empHolidays = holidays.filter(h => h.employeeId === emp.id);
      
      const usedVacation = empHolidays.filter(h => h.type === 'vacation').reduce((sum, h) => sum + h.durationDays, 0);
      const usedSick = empHolidays.filter(h => h.type === 'sick').reduce((sum, h) => sum + h.durationDays, 0);
      const usedPersonal = empHolidays.filter(h => h.type === 'personal').reduce((sum, h) => sum + h.durationDays, 0);
      const usedSpecial = empHolidays.filter(h => h.type === 'special_leave').reduce((sum, h) => sum + h.durationDays, 0);
      const usedOther = empHolidays.filter(h => h.type === 'other').reduce((sum, h) => sum + h.durationDays, 0);

      const remainVacation = Math.max(0, leaveQuotas.vacation - usedVacation);
      const remainSick = Math.max(0, leaveQuotas.sick - usedSick);
      const remainPersonal = Math.max(0, leaveQuotas.personal - usedPersonal);
      const remainSpecial = Math.max(0, leaveQuotas.special_leave - usedSpecial);
      const remainOther = Math.max(0, leaveQuotas.other - usedOther);

      const isVacationExceeded = usedVacation > leaveQuotas.vacation;
      const isSickExceeded = usedSick > leaveQuotas.sick;
      const isPersonalExceeded = usedPersonal > leaveQuotas.personal;
      const isSpecialExceeded = usedSpecial > leaveQuotas.special_leave;
      const isOtherExceeded = usedOther > leaveQuotas.other;

      const hasAnyExceeded = isVacationExceeded || isSickExceeded || isPersonalExceeded || isSpecialExceeded || isOtherExceeded;

      return {
        employee: emp,
        used: {
          vacation: usedVacation,
          sick: usedSick,
          personal: usedPersonal,
          special_leave: usedSpecial,
          other: usedOther
        },
        remain: {
          vacation: remainVacation,
          sick: remainSick,
          personal: remainPersonal,
          special_leave: remainSpecial,
          other: remainOther
        },
        exceeded: {
          vacation: isVacationExceeded,
          sick: isSickExceeded,
          personal: isPersonalExceeded,
          special_leave: isSpecialExceeded,
          other: isOtherExceeded
        },
        hasAnyExceeded
      };
    });

    return {
      totalEmployees,
      activeEmployees,
      totalLeaves,
      totalLeaveDays,
      averageDays,
      typeCounts,
      mostCommonType,
      monthlyData,
      topEmployees,
      deptLeaves,
      employeeLeaveSummary,
    };
  }, [employees, holidays, leaveQuotas]);

  const thaiMonthsAbbr = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const maxMonthValue = Math.max(...stats.monthlyData, 1);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-rose-950 p-6 rounded-2xl text-white shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 font-sans text-white">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            รายงานและแดชบอร์ดสถิติการลาหยุด
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            สรุปข้อมูลสถิติลายอดสะสมพนักงาน วิเคราะห์ประเภทของวันลา ค้นหาข้อมูลเชิงลึกในองค์กร
          </p>
        </div>
        <div className="text-xs bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-lg text-rose-200 font-mono self-start md:self-auto">
          อัปเดตข้อมูลแบบ Real-time
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">พนักงานรวมการใช้งาน</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.totalEmployees} <span className="text-xs font-medium text-slate-500">คน</span></span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">พร้อมปฏิบัติงาน {stats.activeEmployees} คน</span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">รวมจำนวนวันที่หยุดงาน</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.totalLeaveDays} <span className="text-xs font-medium text-slate-500">วัน</span></span>
            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full inline-block">จากใบลาทั้งหมด {stats.totalLeaves} ฉบับ</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">วันลาเฉลี่ยต่อพนักงาน</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.averageDays} <span className="text-xs font-medium text-slate-500">วัน/คน</span></span>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full inline-block">คำนวณเฉพาะพนักงาน Active</span>
          </div>
          <div className="w-12 h-12 bg-rose-100/50 text-rose-700 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">ประเภทการลาที่มีสถิติสูงสุด</span>
            <span className="text-lg font-black text-slate-800 block truncate max-w-[150px]">
              {TYPE_TRANSLATION[stats.mostCommonType]?.label || 'ไม่พบข้อมูล'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-slate-100 ${TYPE_TRANSLATION[stats.mostCommonType]?.color || 'text-slate-600'}`}>
              หยุดรวม: {stats.typeCounts[stats.mostCommonType] || 0} วัน
            </span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts & Top List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Monthly Trend & Top Employees */}
        <div className="lg:col-span-8 space-y-6">
          {/* Monthly Bar chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarDays className="w-4.5 h-4.5 text-rose-600" />
              แนวโน้มรวมการหยุดงานในแต่ละเดือน (จำนวนวันในหมวดลาทั้งหมด)
            </h3>
            
            <div className="h-64 flex items-end gap-2.5 sm:gap-4 pt-6 border-b border-slate-100 pb-2">
              {stats.monthlyData.map((val, idx) => {
                const percentHeight = (val / maxMonthValue) * 85; // Max 85% computed height to look nice
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      เดือน{thaiMonthsAbbr[idx]}: {val} วัน
                    </div>
                    {/* Bar */}
                    <div 
                      style={{ height: `${Math.max(percentHeight, 4)}%` }}
                      className={`w-full rounded-t-md transition ${
                        val > 0 ? 'bg-rose-600 group-hover:bg-rose-500' : 'bg-slate-100'
                      }`}
                    />
                    {/* Label */}
                    <span className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full text-center">
                      {thaiMonthsAbbr[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Breakdown list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4.5 h-4.5 text-rose-700" />
              การหยุดงานสะสมแบ่งตามแผนก (Department Leave Metrics)
            </h3>
            {Object.keys(stats.deptLeaves).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีสถิติวันลาสะสมสำหรับแต่ละแผนก</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(stats.deptLeaves).map(([dept, days]) => (
                  <div key={dept} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100/80">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-black text-rose-600">
                        {dept.slice(0, 2)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">แผนก {dept}</span>
                        <span className="text-[10px] text-slate-400 font-medium leading-none block">Company Department Unit</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">{days} วัน</span>
                      <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded block">สถิติวันหยุดรวม</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Distribution & Leaders */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top 5 list */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              พนักงานที่มีวันลาเก็บสะสมสูงสุด (Top 5 Leaves)
            </h3>

            {stats.topEmployees.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                ยังไม่มีประวัติการส่งใบลาหยุดของพนักงานเก็บไว้ในระบบ
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topEmployees.map((item, idx) => {
                  const emp = item.employee!;
                  return (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100/50 transition">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center uppercase">
                          {emp.firstName.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            รหัส {emp.employeeCode} • {emp.position}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-rose-700 block bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-center">
                          {item.days} วัน
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">อันดับ {idx + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leave Type distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Percent className="w-4.5 h-4.5 text-rose-600" />
              สัดส่วนประเภทการลาหยุดงาน (Leave Type Breakdown)
            </h3>

            <div className="space-y-4.5 pt-1">
              {Object.entries(stats.typeCounts).map(([typeKey, val]) => {
                const displayInfo = TYPE_TRANSLATION[typeKey as HolidayType];
                const totalDays = stats.totalLeaveDays || 1;
                const percentage = Math.round(((val as number) / totalDays) * 100);

                return (
                  <div key={typeKey} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{displayInfo?.label}</span>
                      <span className="font-mono text-slate-500 font-bold">{val} วัน ({percentage}%)</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className={`h-full ${displayInfo?.bg || 'bg-slate-400'} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Employee Leave Quotas Balance Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-rose-600" />
              สรุปสิทธิ์วันลาคงเหลือรายบุคคล (Employee Leave Quota Balance)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              แสดงสิทธิ์การลาตามเกณฑ์ขั้นต่ำตามกฎหมายหรือนโยบายองค์กร (ลาพักร้อน {leaveQuotas.vacation} วัน | ลาป่วย {leaveQuotas.sick} วัน | ลากิจ {leaveQuotas.personal} วัน)
            </p>
          </div>
          <div className="text-xs font-semibold bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-100 self-start sm:self-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            คำนวณสิทธิ์คงเหลืออัตโนมัติ
          </div>
        </div>

        {stats.employeeLeaveSummary.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            ยังไม่มีรายชื่อพนักงานในระบบ
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-1">พนักงาน</th>
                  <th className="py-3 px-2 text-center">ลาพักร้อน ({leaveQuotas.vacation} วัน)</th>
                  <th className="py-3 px-2 text-center">ลาป่วย ({leaveQuotas.sick} วัน)</th>
                  <th className="py-3 px-2 text-center">ลากิจ ({leaveQuotas.personal} วัน)</th>
                  <th className="py-3 px-2 text-center">ลาหยุดพิเศษ ({leaveQuotas.special_leave} วัน)</th>
                  <th className="py-3 px-2 text-center">อื่นๆ ({leaveQuotas.other} วัน)</th>
                  <th className="py-3 px-1 text-center">สถานะสิทธิ์</th>
                  <th className="py-3 px-2 text-center">รายงาน JPG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.employeeLeaveSummary.map((summary) => {
                  const emp = summary.employee;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                            {emp.firstName.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {emp.firstName} {emp.lastName} {emp.nickname ? `(${emp.nickname})` : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate font-mono">
                              {emp.employeeCode} • {emp.position}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Vacation */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-block">
                          <span className="text-xs font-black block text-slate-800">
                            {summary.used.vacation} / {leaveQuotas.vacation} <span className="text-[10px] text-slate-400 font-medium">วัน</span>
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                            summary.exceeded.vacation 
                              ? 'bg-rose-50 text-rose-600' 
                              : summary.remain.vacation === 0 
                                ? 'bg-slate-50 text-slate-400' 
                                : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {summary.exceeded.vacation ? 'เกินสิทธิ์ ❌' : `เหลือ ${summary.remain.vacation} วัน`}
                          </span>
                        </div>
                      </td>

                      {/* Sick */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-block">
                          <span className="text-xs font-black block text-slate-800">
                            {summary.used.sick} / {leaveQuotas.sick} <span className="text-[10px] text-slate-400 font-medium">วัน</span>
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                            summary.exceeded.sick 
                              ? 'bg-rose-50 text-rose-600' 
                              : summary.remain.sick === 0 
                                ? 'bg-slate-50 text-slate-400' 
                                : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {summary.exceeded.sick ? 'เกินสิทธิ์ ❌' : `เหลือ ${summary.remain.sick} วัน`}
                          </span>
                        </div>
                      </td>

                      {/* Personal */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-block">
                          <span className="text-xs font-black block text-slate-800">
                            {summary.used.personal} / {leaveQuotas.personal} <span className="text-[10px] text-slate-400 font-medium">วัน</span>
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                            summary.exceeded.personal 
                              ? 'bg-rose-50 text-rose-600' 
                              : summary.remain.personal === 0 
                                ? 'bg-slate-50 text-slate-400' 
                                : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {summary.exceeded.personal ? 'เกินสิทธิ์ ❌' : `เหลือ ${summary.remain.personal} วัน`}
                          </span>
                        </div>
                      </td>

                      {/* Special Leave */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-block">
                          <span className="text-xs font-black block text-slate-800">
                            {summary.used.special_leave} / {leaveQuotas.special_leave} <span className="text-[10px] text-slate-400 font-medium">วัน</span>
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                            summary.exceeded.special_leave 
                              ? 'bg-rose-50 text-rose-600' 
                              : summary.remain.special_leave === 0 
                                ? 'bg-slate-50 text-slate-400' 
                                : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {summary.exceeded.special_leave ? 'เกินสิทธิ์ ❌' : `เหลือ ${summary.remain.special_leave} วัน`}
                          </span>
                        </div>
                      </td>

                      {/* Other */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-block">
                          <span className="text-xs font-black block text-slate-800">
                            {summary.used.other} / {leaveQuotas.other} <span className="text-[10px] text-slate-400 font-medium">วัน</span>
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                            summary.exceeded.other 
                              ? 'bg-rose-50 text-rose-600' 
                              : summary.remain.other === 0 
                                ? 'bg-slate-50 text-slate-400' 
                                : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {summary.exceeded.other ? 'เกินสิทธิ์ ❌' : `เหลือ ${summary.remain.other} วัน`}
                          </span>
                        </div>
                      </td>

                      {/* Overall Status */}
                      <td className="py-3 px-1 text-center">
                        {summary.hasAnyExceeded ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            เกินโควตา ⚠️
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            มีสิทธิ์คงเหลือ
                          </span>
                        )}
                      </td>

                      {/* Report Action Button */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleSelectEmployeeForReport(emp.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                          title="ดู/สร้างรายงาน JPG รายบุคคล"
                        >
                          <FileText className="w-3 h-3 text-rose-600" />
                          <span>รายงาน JPG</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Monthly Report Generator Section */}
      <div ref={reportSectionRef} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-600" />
              รายงานสรุปการลาหยุดงานรายบุคคลประจำเดือน (Individual Monthly Report)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              เลือกพนักงานและประจำเดือน เพื่อสร้างรายงานสรุปพร้อมบันทึกเป็นรูปภาพ JPG สำหรับพิมพ์หรือส่งต่อ
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportReportJpg}
            disabled={isExportingJpg || !targetEmp}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer shrink-0 self-start md:self-auto"
          >
            {isExportingJpg ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>กำลังส่งออก JPG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>ดาวน์โหลดรายงานเป็น JPG</span>
              </>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">เลือกพนักงาน (Employee)</label>
            <select
              value={reportEmpId}
              onChange={(e) => setReportEmpId(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} {emp.nickname ? `(${emp.nickname})` : ''} - [{emp.employeeCode}] ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">เลือกประจำเดือน (Month)</label>
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
            >
              {THAI_MONTHS_FULL.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">เลือกปี (Year)</label>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
            >
              {[today.getFullYear() - 2, today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
                <option key={y} value={y}>พ.ศ. {y + 543} ({y})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Printable Report Document Preview */}
        {!targetEmp ? (
          <div className="text-center py-10 text-xs text-slate-400">
            โปรดเลือกพนักงานเพื่อแสดงตัวอย่างรายงาน
          </div>
        ) : (
          <div className="overflow-x-auto pt-2 pb-4">
            <div
              ref={reportRef}
              className="w-full min-w-[720px] max-w-4xl mx-auto bg-white border-2 border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm text-slate-800 space-y-6 font-sans"
            >
              {/* Report Letterhead Header */}
              <div className="flex items-center justify-between border-b-2 border-rose-600 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black flex items-center justify-center text-xl shadow-md shrink-0">
                    PH
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด</h2>
                    <p className="text-xs font-bold text-rose-600">PONGSAKUL HARDWARE CO., LTD.</p>
                    <p className="text-[11px] text-slate-500 font-medium">เอกสารสรุปสถิติการหยุดงานพนักงานประจำเดือน (Monthly Employee Leave Summary)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">วันที่ออกรายงาน</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {today.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Employee & Period Banner */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ข้อมูลพนักงาน (Employee Details)</div>
                  <div className="text-base font-black text-slate-900">
                    {targetEmp.firstName} {targetEmp.lastName} {targetEmp.nickname ? `(${targetEmp.nickname})` : ''}
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5 pt-0.5 font-medium">
                    <p>รหัสพนักงาน: <strong className="font-mono text-slate-800">{targetEmp.employeeCode}</strong></p>
                    <p>แผนก: <strong className="text-slate-800">{targetEmp.department}</strong> • ตำแหน่ง: <strong className="text-slate-800">{targetEmp.position}</strong></p>
                  </div>
                </div>

                <div className="space-y-1 text-right border-l border-slate-200 pl-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ประจำรอบเดือน (Report Period)</div>
                  <div className="text-lg font-black text-rose-700">
                    เดือน{THAI_MONTHS_FULL[reportMonth]} พ.ศ. {reportYear + 543}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    รวมวันลาในเดือนนี้: <strong className="text-slate-900 font-black text-sm">{reportData?.monthlyTotalDays || 0} วัน</strong>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown 5 Boxes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-rose-600" />
                  สรุปการหยุดงานแยกตามประเภท ประจำเดือน {THAI_MONTHS_FULL[reportMonth]}
                </h4>
                <div className="grid grid-cols-5 gap-2.5 text-center">
                  {LEAVE_TYPES_LIST.map(item => {
                    const days = reportData?.monthTypeCounts[item.type] || 0;
                    return (
                      <div key={item.type} className={`p-3 rounded-xl border ${item.borderColor} ${item.bgColor}`}>
                        <span className="text-[10px] font-bold block text-slate-600 truncate">{item.label}</span>
                        <span className="text-lg font-black block mt-0.5 text-slate-900">
                          {days} <span className="text-[10px] text-slate-500 font-normal">วัน</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cumulative YTD Quotas Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  สรุปสิทธิ์วันลาคงเหลือสะสมประจำปี พ.ศ. {reportYear + 543}
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                        <th className="py-2.5 px-3">ประเภทการลา</th>
                        <th className="py-2.5 px-3 text-center">สิทธิ์ตามโควตา</th>
                        <th className="py-2.5 px-3 text-center">ใช้ในเดือนนี้</th>
                        <th className="py-2.5 px-3 text-center">ใช้สะสมทั้งปี ({reportYear + 543})</th>
                        <th className="py-2.5 px-3 text-center">สิทธิ์คงเหลือ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {LEAVE_TYPES_LIST.map(item => {
                        const totalQuota = leaveQuotas[item.type as keyof LeaveQuotas] || 0;
                        const usedMonth = reportData?.monthTypeCounts[item.type] || 0;
                        const usedYtd = reportData?.ytdTypeCounts[item.type] || 0;
                        const remain = reportData?.remainingQuota[item.type as keyof typeof reportData.remainingQuota] || 0;
                        const isExceeded = usedYtd > totalQuota;

                        return (
                          <tr key={item.type}>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{item.label}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">{totalQuota} วัน</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600">{usedMonth} วัน</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{usedYtd} วัน</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full inline-block ${
                                isExceeded 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : remain === 0 
                                    ? 'bg-slate-100 text-slate-500' 
                                    : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isExceeded ? 'เกินสิทธิ์ ❌' : `เหลือ ${remain} วัน`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Monthly Leaves Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-rose-600" />
                  ประวัติใบลาในเดือน{THAI_MONTHS_FULL[reportMonth]} ({reportData?.monthlyLeaves.length || 0} รายการ)
                </h4>
                {(!reportData?.monthlyLeaves || reportData.monthlyLeaves.length === 0) ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                    ไม่มีประวัติการหยุดงานในเดือน {THAI_MONTHS_FULL[reportMonth]} พ.ศ. {reportYear + 543}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                          <th className="py-2.5 px-2 text-center w-8">#</th>
                          <th className="py-2.5 px-3">ช่วงวันที่หยุด</th>
                          <th className="py-2.5 px-2 text-center">ประเภท</th>
                          <th className="py-2.5 px-2 text-center">จำนวน</th>
                          <th className="py-2.5 px-3">เหตุผลการลา</th>
                          <th className="py-2.5 px-3">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {reportData.monthlyLeaves.map((h, idx) => (
                          <tr key={h.id}>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 font-mono text-[11px]">
                              {h.startDate === h.endDate ? h.startDate : `${h.startDate} ถึง ${h.endDate}`}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-800">
                                {TYPE_TRANSLATION[h.type]?.label || h.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-black text-rose-700">{h.durationDays} วัน</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{h.title}</td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">{h.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Signature Block */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-6 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ลงชื่อพนักงานผู้ยื่นใบลา</span>
                  <div className="pt-6 border-b border-slate-400 w-3/4 mx-auto"></div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">({targetEmp.firstName} {targetEmp.lastName})</p>
                    <p className="text-[10px] text-slate-500">ตำแหน่ง: {targetEmp.position}</p>
                    <p className="text-[10px] text-slate-400 pt-1">วันที่: ...... / ...... / ..........</p>
                  </div>
                </div>

                <div className="space-y-6 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ลงชื่อผู้บังคับบัญชา / ฝ่ายบุคคล (HR)</span>
                  <div className="pt-6 border-b border-slate-400 w-3/4 mx-auto"></div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">( ........................................................... )</p>
                    <p className="text-[10px] text-slate-500">ผู้อนุมัติ / ฝ่ายทรัพยากรบุคคล</p>
                    <p className="text-[10px] text-slate-400 pt-1">วันที่: ...... / ...... / ..........</p>
                  </div>
                </div>
              </div>

              {/* Document Footer */}
              <div className="flex justify-between items-center text-[9px] text-slate-400 pt-3 border-t border-slate-100 font-mono">
                <span>เอกสารออกโดยระบบ บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด</span>
                <span>INTERNAL REPORT • CONFIDENTIAL</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
