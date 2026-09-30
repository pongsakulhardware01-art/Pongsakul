/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef } from 'react';
import { toJpeg } from 'html-to-image';
import { Employee, HolidayLeave, HolidayType, LeaveQuotas } from '../types';
import { 
  Award, 
  BarChart3, 
  Calendar, 
  CalendarDays, 
  Check, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Download, 
  FileCheck2, 
  FileSpreadsheet, 
  FileText, 
  Layers, 
  Loader2, 
  Percent, 
  Printer, 
  Sparkles, 
  TrendingUp, 
  User, 
  UserCheck, 
  Users, 
  AlertTriangle,
  Building2,
  Briefcase,
  Maximize2
} from 'lucide-react';

interface IndividualAnnualReportProps {
  employee: Employee;
  allEmployees: Employee[];
  onSelectEmployee: (empId: string) => void;
  holidays: HolidayLeave[];
  leaveQuotas: LeaveQuotas;
  year: number;
  onYearChange: (year: number) => void;
  companyName?: string;
}

const TYPE_CONFIG: Record<HolidayType, { 
  label: string; 
  shortLabel: string; 
  emoji: string; 
  color: string; 
  bgColor: string; 
  borderColor: string; 
  badgeBg: string;
  barColor: string;
}> = {
  vacation: { 
    label: 'ลาพักร้อน', 
    shortLabel: 'พักร้อน', 
    emoji: '🏖️', 
    color: 'text-amber-800', 
    bgColor: 'bg-amber-50', 
    borderColor: 'border-amber-200', 
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    barColor: 'bg-amber-500' 
  },
  sick: { 
    label: 'ลาป่วย', 
    shortLabel: 'ลาป่วย', 
    emoji: '🤒', 
    color: 'text-rose-800', 
    bgColor: 'bg-rose-50', 
    borderColor: 'border-rose-200', 
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
    barColor: 'bg-rose-500' 
  },
  personal: { 
    label: 'ลากิจ', 
    shortLabel: 'ลากิจ', 
    emoji: '💼', 
    color: 'text-sky-800', 
    bgColor: 'bg-sky-50', 
    borderColor: 'border-sky-200', 
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    barColor: 'bg-sky-500' 
  },
  public_holiday: { 
    label: 'วันหยุดนักขัตฤกษ์/บริษัท', 
    shortLabel: 'วันหยุดบริษัท', 
    emoji: '📢', 
    color: 'text-emerald-800', 
    bgColor: 'bg-emerald-50', 
    borderColor: 'border-emerald-200', 
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    barColor: 'bg-emerald-500' 
  },
  special_leave: { 
    label: 'วันลาหยุดพิเศษ', 
    shortLabel: 'หยุดพิเศษ', 
    emoji: '✨', 
    color: 'text-fuchsia-800', 
    bgColor: 'bg-fuchsia-50', 
    borderColor: 'border-fuchsia-200', 
    badgeBg: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
    barColor: 'bg-fuchsia-500' 
  },
  other: { 
    label: 'ลาอื่นๆ', 
    shortLabel: 'อื่นๆ', 
    emoji: '📌', 
    color: 'text-purple-800', 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200', 
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
    barColor: 'bg-purple-500' 
  },
};

const LEAVE_CATEGORIES: { type: HolidayType; quotaKey: keyof LeaveQuotas }[] = [
  { type: 'vacation', quotaKey: 'vacation' },
  { type: 'sick', quotaKey: 'sick' },
  { type: 'personal', quotaKey: 'personal' },
  { type: 'special_leave', quotaKey: 'special_leave' },
  { type: 'other', quotaKey: 'other' }
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_WEEKDAYS_SHORT = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export default function IndividualAnnualReport({
  employee,
  allEmployees,
  onSelectEmployee,
  holidays,
  leaveQuotas,
  year,
  onYearChange,
  companyName = 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด'
}: IndividualAnnualReportProps) {
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [mobileFitMode, setMobileFitMode] = useState(true);
  const [previewScale, setPreviewScale] = useState(1);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const thaiYear = year + 543;

  // Handle preview scale on mobile/tablet
  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        if (containerWidth < 1220) {
          const scale = Math.max(0.28, Math.min(1, (containerWidth - 16) / 1180));
          setPreviewScale(scale);
        } else {
          setPreviewScale(1);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [employee.id, year, mobileFitMode]);

  // Current employee index for Prev/Next navigation
  const currentIndex = allEmployees.findIndex(e => e.id === employee.id);
  const handlePrevEmployee = () => {
    if (currentIndex > 0) {
      onSelectEmployee(allEmployees[currentIndex - 1].id);
    } else {
      onSelectEmployee(allEmployees[allEmployees.length - 1].id);
    }
  };
  const handleNextEmployee = () => {
    if (currentIndex < allEmployees.length - 1) {
      onSelectEmployee(allEmployees[currentIndex + 1].id);
    } else {
      onSelectEmployee(allEmployees[0].id);
    }
  };

  // 1. Annual leaves for this employee
  const annualLeaves = useMemo(() => {
    return holidays.filter(h => {
      if (h.employeeId !== employee.id) return false;
      const startY = parseInt(h.startDate.split('-')[0], 10);
      const endY = parseInt(h.endDate.split('-')[0], 10);
      return startY === year || endY === year;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [holidays, employee.id, year]);

  // 2. Annual type totals
  const annualTypeCounts = useMemo(() => {
    const counts: Record<HolidayType, number> = {
      vacation: 0,
      sick: 0,
      personal: 0,
      public_holiday: 0,
      special_leave: 0,
      other: 0,
    };
    annualLeaves.forEach(h => {
      if (counts[h.type] !== undefined) {
        counts[h.type] += h.durationDays;
      }
    });
    return counts;
  }, [annualLeaves]);

  const totalLeaveDays = useMemo(() => {
    return annualLeaves.reduce((sum, h) => sum + h.durationDays, 0);
  }, [annualLeaves]);

  // Quotas calculations
  const quotaSummary = useMemo(() => {
    return LEAVE_CATEGORIES.map(cat => {
      const quota = leaveQuotas[cat.quotaKey] || 0;
      const used = annualTypeCounts[cat.type] || 0;
      const remain = Math.max(0, quota - used);
      const exceeded = used > quota;
      const overDays = Math.max(0, used - quota);
      const usagePercent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
      return {
        type: cat.type,
        quotaKey: cat.quotaKey,
        quota,
        used,
        remain,
        exceeded,
        overDays,
        usagePercent,
        config: TYPE_CONFIG[cat.type]
      };
    });
  }, [leaveQuotas, annualTypeCounts]);

  const totalQuota = useMemo(() => {
    return quotaSummary.reduce((sum, q) => sum + q.quota, 0);
  }, [quotaSummary]);

  const totalRemain = useMemo(() => {
    return quotaSummary.reduce((sum, q) => sum + q.remain, 0);
  }, [quotaSummary]);

  const hasAnyExceeded = useMemo(() => {
    return quotaSummary.some(q => q.exceeded);
  }, [quotaSummary]);

  // 3. Month by Month distribution matrix (12 months)
  const monthDistribution = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const monthLeaves = annualLeaves.filter(h => {
        const startM = parseInt(h.startDate.split('-')[1], 10) - 1;
        const endM = parseInt(h.endDate.split('-')[1], 10) - 1;
        return startM === monthIdx || endM === monthIdx;
      });

      const counts: Record<HolidayType, number> = {
        vacation: 0,
        sick: 0,
        personal: 0,
        public_holiday: 0,
        special_leave: 0,
        other: 0,
      };

      monthLeaves.forEach(h => {
        if (counts[h.type] !== undefined) {
          counts[h.type] += h.durationDays;
        }
      });

      const totalDaysInMonth = monthLeaves.reduce((sum, h) => sum + h.durationDays, 0);
      const percentageOfYear = totalLeaveDays > 0 ? Math.round((totalDaysInMonth / totalLeaveDays) * 100) : 0;

      return {
        monthIdx,
        monthName: THAI_MONTHS_FULL[monthIdx],
        counts,
        totalDays: totalDaysInMonth,
        percentageOfYear,
        leavesCount: monthLeaves.length,
      };
    });
  }, [annualLeaves, totalLeaveDays]);

  // Max month value for visual bar
  const maxMonthDays = useMemo(() => {
    return Math.max(...monthDistribution.map(m => m.totalDays), 1);
  }, [monthDistribution]);

  // Peak month
  const peakMonth = useMemo(() => {
    const sorted = [...monthDistribution].sort((a, b) => b.totalDays - a.totalDays);
    return sorted[0]?.totalDays > 0 ? sorted[0] : null;
  }, [monthDistribution]);

  // Net attendance rate (assuming standard working year ~260 days)
  const standardWorkingDays = 260;
  const netAttendedDays = Math.max(0, standardWorkingDays - totalLeaveDays);
  const attendanceRate = ((netAttendedDays / standardWorkingDays) * 100).toFixed(1);

  // Longest leave streak
  const longestStreak = useMemo(() => {
    if (annualLeaves.length === 0) return 0;
    return Math.max(...annualLeaves.map(h => h.durationDays));
  }, [annualLeaves]);

  // Most frequent weekday
  const mostFrequentDay = useMemo(() => {
    if (annualLeaves.length === 0) return null;
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    annualLeaves.forEach(h => {
      const d = new Date(h.startDate).getDay();
      dayCounts[d]++;
    });
    let maxDay = 0;
    let maxVal = 0;
    dayCounts.forEach((cnt, idx) => {
      if (cnt > maxVal) {
        maxVal = cnt;
        maxDay = idx;
      }
    });
    return maxVal > 0 ? { dayName: THAI_WEEKDAYS_SHORT[maxDay], count: maxVal } : null;
  }, [annualLeaves]);

  // Helper date formatter in Thai
  const formatThaiDateRange = (startDate: string, endDate: string) => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const startStr = s.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    if (startDate === endDate) return startStr;
    const endStr = e.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    return `${startStr} - ${endStr}`;
  };

  const getDayOfWeekThai = (dateStr: string) => {
    const d = new Date(dateStr);
    return THAI_WEEKDAYS_SHORT[d.getDay()];
  };

  // Export to high-res JPG
  const handleExportAnnualJpg = async () => {
    if (!reportRef.current) return;
    setIsExportingJpg(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      const node = reportRef.current;
      const targetWidth = 1180;
      const targetHeight = node.scrollHeight;

      const dataUrl = await toJpeg(node, {
        quality: 0.98,
        pixelRatio: 2.5,
        width: targetWidth,
        height: targetHeight,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          transform: 'none',
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          maxWidth: 'none',
          minWidth: `${targetWidth}px`,
          borderRadius: '16px',
        }
      });

      const empNameClean = `${employee.firstName}_${employee.lastName}`.replace(/\s+/g, '_');
      const filename = `ผลสรุปรายปี_${empNameClean}_พศ${thaiYear}.jpg`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting annual JPG report:', error);
      alert('ไม่สามารถส่งออกภาพ JPG ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Employee Selection & Quick Nav */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevEmployee}
              className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-slate-600 hover:text-slate-900 cursor-pointer shadow-3xs"
              title="พนักงานคนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <select
                value={employee.id}
                onChange={(e) => onSelectEmployee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer appearance-none shadow-3xs"
              >
                {allEmployees.map((emp, idx) => (
                  <option key={emp.id} value={emp.id}>
                    {idx + 1}. {emp.firstName} {emp.lastName} {emp.nickname ? `(${emp.nickname})` : ''} - [{emp.employeeCode}]
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleNextEmployee}
              className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-slate-600 hover:text-slate-900 cursor-pointer shadow-3xs"
              title="พนักงานคนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">ประจำปี:</span>
            <select
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer shadow-3xs"
            >
              {[year - 2, year - 1, year, year + 1].map(y => (
                <option key={y} value={y}>พ.ศ. {y + 543} ({y})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportAnnualJpg}
            disabled={isExportingJpg}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            {isExportingJpg ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>กำลังสร้างรูปภาพ JPG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>ดาวน์โหลดผลสรุปรายปี (.JPG)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer shadow-3xs"
            title="พิมพ์หน้ารายงานนี้"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* 📱 Mobile Scale Toggle Bar */}
      <div className="flex md:hidden items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
        <span className="text-[11px] font-bold text-slate-600">มุมมองตัวอย่างรายงาน:</span>
        <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setMobileFitMode(true)}
            className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition cursor-pointer ${
              mobileFitMode 
                ? 'bg-rose-600 text-white shadow-3xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📱 พอดีหน้าจอ
          </button>
          <button
            type="button"
            onClick={() => setMobileFitMode(false)}
            className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition cursor-pointer ${
              !mobileFitMode 
                ? 'bg-rose-600 text-white shadow-3xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔍 ขนาดจริง 100%
          </button>
        </div>
      </div>

      {/* Report Document Preview & JPG Export Node */}
      <div ref={containerRef} className="w-full pt-1 pb-4">
        <div
          className={`w-full flex justify-center ${!mobileFitMode ? 'overflow-x-auto pb-4' : 'overflow-hidden'}`}
          style={{
            height: (mobileFitMode && previewScale < 1 && reportRef.current) 
              ? `${reportRef.current.offsetHeight * previewScale + 12}px` 
              : 'auto'
          }}
        >
          <div
            ref={reportRef}
            style={{
              transform: (mobileFitMode && previewScale < 1) ? `scale(${previewScale})` : 'none',
              transformOrigin: 'top center',
            }}
            className="w-[1180px] shrink-0 bg-white border-2 border-slate-200/90 rounded-2xl p-8 sm:p-12 shadow-sm text-slate-800 space-y-6 font-sans mx-auto"
          >
            {/* 1. Executive Letterhead Header */}
            <div className="flex items-center justify-between border-b-2 border-rose-600 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white font-black flex items-center justify-center text-2xl shadow-md shrink-0">
                  PH
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{companyName}</h2>
                  <p className="text-xs font-bold text-rose-600 tracking-wide uppercase">PONGSAKUL HARDWARE CO., LTD.</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    เอกสารผลสรุปสถิติการหยุดงานและผลการปฏิบัติงานรายบุคคลประจำปี (Annual Employee Leave & Performance Record)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">วันที่ออกรายงาน</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {today.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="inline-block mt-1 text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  PH-ANNUAL-{thaiYear}-{employee.employeeCode}
                </span>
              </div>
            </div>

            {/* 2. Employee Dossier & Annual Executive Metrics */}
            <div className="grid grid-cols-12 gap-4">
              {/* Employee Bio Card (7 cols) */}
              <div className="col-span-7 bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-rose-600" />
                    ข้อมูลพนักงานผู้รับการประเมิน (Employee Profile)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                    รหัส: {employee.employeeCode}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-800 font-black text-xl flex items-center justify-center shrink-0 shadow-3xs">
                    {employee.firstName.slice(0, 1)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-lg font-black text-slate-900 truncate">
                      {employee.firstName} {employee.lastName} {employee.nickname ? `(${employee.nickname})` : ''}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600 pt-0.5 font-medium">
                      <p>แผนก: <strong className="text-slate-800">{employee.department}</strong></p>
                      <p>ตำแหน่ง: <strong className="text-slate-800">{employee.position}</strong></p>
                      <p>สถานะ: <span className="text-emerald-700 font-bold">ปฏิบัติงานปกติ (Active)</span></p>
                      <p>เบอร์ติดต่อ: <span className="font-mono text-slate-700">{employee.phone || '-'}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Annual Scope Card (5 cols) */}
              <div className="col-span-5 bg-gradient-to-br from-slate-900 to-rose-950 text-white rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    รอบปีสรุปผล (Evaluation Year)
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    พ.ศ. {thaiYear} ({year})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] text-slate-300 font-medium block">รวมวันลาทั้งปี</span>
                    <span className="text-2xl font-black text-white block mt-0.5">{totalLeaveDays} <span className="text-xs font-normal text-rose-200">วัน</span></span>
                    <span className="text-[9px] text-slate-300 block">{annualLeaves.length} ใบลาตลอดปี</span>
                  </div>

                  <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] text-slate-300 font-medium block">อัตราการมาทำงานสุทธิ</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-0.5">{attendanceRate}%</span>
                    <span className="text-[9px] text-slate-300 block">มาทำงาน {netAttendedDays}/{standardWorkingDays} วัน</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1 border-t border-white/10">
                  <span>สถานะสิทธิ์ภาพรวม:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${
                    hasAnyExceeded ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {hasAnyExceeded ? 'มีรายการเกินสิทธิ์ ⚠️' : 'อยู่ในเกณฑ์ปกติ สมบูรณ์ ✅'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Annual Quota Utilization Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  ตารางสรุปสิทธิ์วันลาและยอดคงเหลือตลอดทั้งปี พ.ศ. {thaiYear} (Annual Quota Balance)
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  คำนวณตามเกณฑ์โควตาสิทธิประจำปีของบริษัท
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10.5px]">
                      <th className="py-2.5 px-3">ประเภทการลา</th>
                      <th className="py-2.5 px-3 text-center">สิทธิ์ตามโควตา</th>
                      <th className="py-2.5 px-3 text-center">ใช้ไปตลอดปี</th>
                      <th className="py-2.5 px-3 text-center">สิทธิ์คงเหลือ</th>
                      <th className="py-2.5 px-3 text-center">อัตราการใช้ (%)</th>
                      <th className="py-2.5 px-4 text-center w-36">แถบสัดส่วนการใช้</th>
                      <th className="py-2.5 px-3 text-center">สถานะสิทธิ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {quotaSummary.map((cat) => (
                      <tr key={cat.type} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{cat.config.emoji}</span>
                            <span className="font-bold text-slate-800">{cat.config.label}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                          {cat.quota} วัน
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-rose-700 text-sm">
                          {cat.used} วัน
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          <span className={cat.remain === 0 ? 'text-slate-400' : 'text-emerald-700'}>
                            {cat.remain} วัน
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                          {cat.usagePercent}%
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              style={{ width: `${Math.min(100, cat.usagePercent)}%` }}
                              className={`h-full ${cat.exceeded ? 'bg-rose-600' : cat.config.barColor} rounded-full transition-all`}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full inline-block border ${
                            cat.exceeded
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : cat.remain === 0
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {cat.exceeded ? `เกิน ${cat.overDays} วัน ❌` : cat.remain === 0 ? 'ใช้ครบสิทธิ์' : `เหลือ ${cat.remain} วัน ✅`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Footer Row */}
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                      <td className="py-3 px-3">รวมทุกประเภทสิทธิ์</td>
                      <td className="py-3 px-3 text-center font-mono font-black">{totalQuota} วัน</td>
                      <td className="py-3 px-3 text-center font-mono font-black text-rose-700 text-sm">{totalLeaveDays} วัน</td>
                      <td className="py-3 px-3 text-center font-mono font-black text-emerald-700">{totalRemain} วัน</td>
                      <td className="py-3 px-3 text-center font-mono font-black">
                        {totalQuota > 0 ? Math.round((totalLeaveDays / totalQuota) * 100) : 0}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, totalQuota > 0 ? Math.round((totalLeaveDays / totalQuota) * 100) : 0)}%` }}
                            className="h-full bg-slate-800 rounded-full"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasAnyExceeded ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {hasAnyExceeded ? 'เกินโควตาบางส่วน' : 'ปกติสมบูรณ์'}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 4. Month-by-Month Distribution Matrix (12 Months Table) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-rose-600" />
                  ตารางแจกแจงสถิติการหยุดงานแยก 12 เดือน (Month-by-Month Distribution)
                </h4>
                {peakMonth && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    เดือนที่ลาสูงสุด: {peakMonth.monthName} ({peakMonth.totalDays} วัน)
                  </span>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                      <th className="py-2.5 px-3">เดือน</th>
                      <th className="py-2.5 px-2 text-center">พักร้อน</th>
                      <th className="py-2.5 px-2 text-center">ลาป่วย</th>
                      <th className="py-2.5 px-2 text-center">ลากิจ</th>
                      <th className="py-2.5 px-2 text-center">หยุดพิเศษ</th>
                      <th className="py-2.5 px-2 text-center">อื่นๆ</th>
                      <th className="py-2.5 px-2 text-center">รวมวันลา</th>
                      <th className="py-2.5 px-4 text-center w-36">สัดส่วนของปี (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 bg-white">
                    {monthDistribution.map((m) => (
                      <tr key={m.monthIdx} className={m.totalDays > 0 ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/40'}>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {m.monthName}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-[11px]">
                          {m.counts.vacation > 0 ? <strong className="text-amber-700">{m.counts.vacation}</strong> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-[11px]">
                          {m.counts.sick > 0 ? <strong className="text-rose-700">{m.counts.sick}</strong> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-[11px]">
                          {m.counts.personal > 0 ? <strong className="text-sky-700">{m.counts.personal}</strong> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-[11px]">
                          {m.counts.special_leave > 0 ? <strong className="text-fuchsia-700">{m.counts.special_leave}</strong> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-[11px]">
                          {m.counts.other > 0 ? <strong className="text-purple-700">{m.counts.other}</strong> : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-black text-slate-900 text-xs">
                          {m.totalDays > 0 ? `${m.totalDays} วัน` : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-2 px-4 text-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${(m.totalDays / maxMonthDays) * 100}%` }}
                                className={`h-full rounded-full ${m.totalDays > 0 ? 'bg-rose-500' : 'bg-transparent'}`}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 w-8 text-right font-medium">
                              {m.percentageOfYear}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                      <td className="py-2.5 px-3">รวมทั้งปี ({thaiYear})</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-800">{annualTypeCounts.vacation}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-800">{annualTypeCounts.sick}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-800">{annualTypeCounts.personal}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-fuchsia-800">{annualTypeCounts.special_leave}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-800">{annualTypeCounts.other}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-rose-700 text-sm">{totalLeaveDays} วัน</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-600">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 5. Detailed Annual Leave History Log */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-rose-600" />
                  ตารางบันทึกประวัติการลาทุกรายการตลอดทั้งปีแบบละเอียด ({annualLeaves.length} รายการ)
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  เรียงตามลำดับวันที่เริ่มต้นลา
                </span>
              </div>

              {annualLeaves.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-black text-emerald-950">สถิติการมาปฏิบัติงานยอดเยี่ยม 100%</h5>
                  <p className="text-xs text-emerald-800">
                    ไม่พบประวัติการยื่นใบลาตลอดทั้งปี พ.ศ. {thaiYear} พนักงานมาปฏิบัติงานสม่ำเสมอครบถ้วนทุกวันทำงาน
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                        <th className="py-2.5 px-2 text-center w-8">#</th>
                        <th className="py-2.5 px-3">ช่วงวันที่หยุด</th>
                        <th className="py-2.5 px-2 text-center">วันในสัปดาห์</th>
                        <th className="py-2.5 px-2 text-center">ประเภทการลา</th>
                        <th className="py-2.5 px-2 text-center">จำนวนวัน</th>
                        <th className="py-2.5 px-3">รายละเอียดและเหตุผลการลา</th>
                        <th className="py-2.5 px-3">หมายเหตุเพิ่มเติม</th>
                        <th className="py-2.5 px-2 text-center">การตัดสิทธิ์</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {annualLeaves.map((h, idx) => {
                        const typeCfg = TYPE_CONFIG[h.type] || TYPE_CONFIG.other;
                        return (
                          <tr key={h.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[11px] font-bold">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 font-mono text-[11px] whitespace-nowrap">
                              {formatThaiDateRange(h.startDate, h.endDate)}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 text-[11px]">
                              {getDayOfWeekThai(h.startDate)}
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border inline-flex items-center gap-1 ${typeCfg.badgeBg}`}>
                                <span>{typeCfg.emoji}</span>
                                <span>{typeCfg.label}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-black text-rose-700 whitespace-nowrap">
                              {h.durationDays} วัน
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {h.title}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {h.notes || '-'}
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                ตัดสิทธิ์{typeCfg.shortLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 6. HR Annual Analytical Assessment */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-600" />
                บทวิเคราะห์และข้อสังเกตฝ่ายทรัพยากรบุคคล (HR Annual Insights)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block">ช่วงลาต่อเนื่องยาวสุด</span>
                  <span className="text-base font-black text-slate-800 block mt-0.5">{longestStreak} วัน</span>
                  <span className="text-[10.5px] text-slate-500">สถิติการลาต่อเนื่องสูงสุดในรอบปี</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block">วันในสัปดาห์ที่พบบ่อย</span>
                  <span className="text-base font-black text-slate-800 block mt-0.5">
                    {mostFrequentDay ? `วัน${mostFrequentDay.dayName}` : '-'}
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    {mostFrequentDay ? `ยื่นลาตรงกับวัน${mostFrequentDay.dayName} ${mostFrequentDay.count} ครั้ง` : 'ไม่มีข้อมูล'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block">การยกยอดสิทธิ์พักร้อน</span>
                  <span className="text-base font-black text-emerald-700 block mt-0.5">
                    เหลือ {quotaSummary.find(q => q.type === 'vacation')?.remain || 0} วัน
                  </span>
                  <span className="text-[10.5px] text-slate-500">ตามระเบียบบริษัทอนุญาตให้สะสมได้</span>
                </div>
              </div>
            </div>

            {/* 7. Official 3-Party Annual Signatures */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
              {/* Employee */}
              <div className="space-y-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">พนักงานผู้รับการประเมิน</span>
                <div className="pt-8 border-b border-slate-400 w-3/4 mx-auto"></div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">({employee.firstName} {employee.lastName})</p>
                  <p className="text-[10px] text-slate-500">ตำแหน่ง: {employee.position}</p>
                  <p className="text-[10px] text-slate-400 pt-1">วันที่: ...... / ...... / ..........</p>
                </div>
              </div>

              {/* Department Head */}
              <div className="space-y-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">หัวหน้าแผนก / ผู้บังคับบัญชา</span>
                <div className="pt-8 border-b border-slate-400 w-3/4 mx-auto"></div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">( ........................................................... )</p>
                  <p className="text-[10px] text-slate-500">ผู้ประเมินผลการปฏิบัติงาน</p>
                  <p className="text-[10px] text-slate-400 pt-1">วันที่: ...... / ...... / ..........</p>
                </div>
              </div>

              {/* HR / Management */}
              <div className="space-y-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ฝ่ายทรัพยากรบุคคล / ผู้บริหาร</span>
                <div className="pt-8 border-b border-slate-400 w-3/4 mx-auto"></div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">( ........................................................... )</p>
                  <p className="text-[10px] text-slate-500">ผู้อนุมัติผลการประเมินประจำปี</p>
                  <p className="text-[10px] text-slate-400 pt-1">วันที่: ...... / ...... / ..........</p>
                </div>
              </div>
            </div>

            {/* 8. Corporate Footer */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 font-mono">
              <span>เอกสารผลสรุปรายปีออกโดยระบบ {companyName}</span>
              <span>ANNUAL APPRAISAL & LEAVE RECORD • CONFIDENTIAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
