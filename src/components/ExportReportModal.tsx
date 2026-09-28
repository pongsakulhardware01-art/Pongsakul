/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { toJpeg, toBlob } from 'html-to-image';
import { Employee, HolidayLeave, HolidayType, LeaveQuotas } from '../types';
import { 
  Download, 
  Copy, 
  Check, 
  X, 
  CalendarDays, 
  FileText, 
  BarChart3, 
  Clock, 
  Building, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Users,
  Briefcase,
  Monitor,
  Printer,
  Award,
  Layers,
  CheckCircle2,
  TrendingUp,
  Percent,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  employees: Employee[];
  holidays: HolidayLeave[];
  companyName?: string;
  leaveQuotas?: LeaveQuotas;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_FULL_WEEKDAYS = [
  { short: 'อา.', full: 'วันอาทิตย์', isWeekend: true, textColor: 'text-rose-600', headerBg: 'bg-rose-50/70 text-rose-600' },
  { short: 'จ.', full: 'วันจันทร์', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { short: 'อ.', full: 'วันอังคาร', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { short: 'พ.', full: 'วันพุธ', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { short: 'พฤ.', full: 'วันพฤหัสบดี', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { short: 'ศ.', full: 'วันศุกร์', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { short: 'ส.', full: 'วันเสาร์', isWeekend: true, textColor: 'text-sky-700', headerBg: 'bg-sky-50/70 text-sky-700' }
];

const LEAVE_TYPE_STYLES: Record<HolidayType, { 
  label: string; 
  shortLabel: string;
  emoji: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  badgeBg: string;
  barColor: string;
}> = {
  vacation: { label: 'ลาพักร้อน', shortLabel: 'พักร้อน', emoji: '🏖️', color: 'text-amber-900', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', badgeBg: 'bg-amber-100 text-amber-900', barColor: 'bg-amber-500' },
  sick: { label: 'ลาป่วย', shortLabel: 'ลาป่วย', emoji: '🤒', color: 'text-rose-900', bgColor: 'bg-rose-50', borderColor: 'border-rose-300', badgeBg: 'bg-rose-100 text-rose-900', barColor: 'bg-rose-500' },
  personal: { label: 'ลากิจ', shortLabel: 'ลากิจ', emoji: '💼', color: 'text-sky-900', bgColor: 'bg-sky-50', borderColor: 'border-sky-300', badgeBg: 'bg-sky-100 text-sky-900', barColor: 'bg-sky-500' },
  public_holiday: { label: 'วันหยุดบริษัท/นักขัตฤกษ์', shortLabel: 'วันหยุดบริษัท', emoji: '📢', color: 'text-emerald-900', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300', badgeBg: 'bg-emerald-100 text-emerald-900', barColor: 'bg-emerald-500' },
  special_leave: { label: 'วันหยุดพิเศษ', shortLabel: 'หยุดพิเศษ', emoji: '✨', color: 'text-fuchsia-900', bgColor: 'bg-fuchsia-50', borderColor: 'border-fuchsia-300', badgeBg: 'bg-fuchsia-100 text-fuchsia-900', barColor: 'bg-fuchsia-500' },
  other: { label: 'ลาอื่นๆ', shortLabel: 'อื่นๆ', emoji: '📌', color: 'text-purple-900', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', badgeBg: 'bg-purple-100 text-purple-900', barColor: 'bg-purple-500' }
};

export default function ExportReportModal({
  isOpen,
  onClose,
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
  employees,
  holidays,
  companyName = 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด',
  leaveQuotas = { vacation: 6, sick: 30, personal: 3, special_leave: 5, other: 5 }
}: ExportReportModalProps) {
  // Layout mode: 'landscape' (16:9 Executive Presentation Slide) vs 'portrait' (A4 Document)
  const [layoutMode, setLayoutMode] = useState<'landscape' | 'portrait'>('landscape');
  
  // Section focus: 'summary' (ใครหยุดกี่วัน + ปฏิทิน), 'detailed' (บันทึกใบลาทุกใบ)
  const [contentMode, setContentMode] = useState<'summary' | 'detailed'>('summary');

  // Employee filter: 'all' (แสดงพนักงานทุกคน เติมเต็มพื้นที่ 100%) vs 'on_leave_only' (เฉพาะคนที่ลา)
  const [employeeFilter, setEmployeeFilter] = useState<'all' | 'on_leave_only'>('all');

  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(0.65);
  const [fitToScreen, setFitToScreen] = useState<boolean>(true);
  const [docHeight, setDocHeight] = useState<number>(0);

  const documentRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const targetDocWidth = layoutMode === 'landscape' ? 1440 : 1200;

  // Auto calculate zoom scale to fit preview nicely in viewport
  useEffect(() => {
    if (!isOpen) return;
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth - 48;
        const calculatedScale = Math.min(1, Math.max(0.24, containerWidth / targetDocWidth));
        if (fitToScreen) {
          setZoomScale(calculatedScale);
        }
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isOpen, fitToScreen, layoutMode, targetDocWidth]);

  // Dynamically measure actual document content height
  useEffect(() => {
    if (!isOpen || !documentRef.current) return;
    const measure = () => {
      if (documentRef.current) {
        setDocHeight(documentRef.current.offsetHeight);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(documentRef.current);
    return () => observer.disconnect();
  }, [isOpen, layoutMode, contentMode, employeeFilter, currentMonth, currentYear, employees, holidays]);

  // Employee lookup
  const getEmployee = (id: string): Employee | undefined => {
    return employees.find(e => e.id === id);
  };

  // Month date range calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  // Filter all holidays in this month (String-based comparison, immune to timezone shifts)
  const monthHolidays = useMemo(() => {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const startOfMonthStr = `${currentYear}-${mStr}-01`;
    const endOfMonthStr = `${currentYear}-${mStr}-${String(daysInMonth).padStart(2, '0')}`;

    return holidays.filter(h => {
      return (h.startDate <= endOfMonthStr && h.endDate >= startOfMonthStr);
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [holidays, currentYear, currentMonth, daysInMonth]);

  // Public / Company Holidays in this month
  const monthPublicHolidays = useMemo(() => {
    return monthHolidays.filter(h => h.employeeId === 'all' || h.type === 'public_holiday');
  }, [monthHolidays]);

  // Monthly Statistics
  const monthStats = useMemo(() => {
    let totalDays = 0;
    let companyHolidays = 0;
    let vacationDays = 0;
    let sickDays = 0;
    let personalAndOtherDays = 0;
    const empIdsOnLeave = new Set<string>();

    monthHolidays.forEach(h => {
      totalDays += h.durationDays;
      if (h.type === 'public_holiday' || h.employeeId === 'all') {
        companyHolidays += h.durationDays;
      } else if (h.type === 'vacation') {
        vacationDays += h.durationDays;
      } else if (h.type === 'sick') {
        sickDays += h.durationDays;
      } else {
        personalAndOtherDays += h.durationDays;
      }

      if (h.employeeId !== 'all') {
        empIdsOnLeave.add(h.employeeId);
      }
    });

    const activeEmps = employees.filter(e => e.isActive).length;
    const leaveRate = activeEmps > 0 
      ? Math.round((empIdsOnLeave.size / activeEmps) * 100) 
      : 0;

    const attendanceRate = Math.max(0, 100 - leaveRate);

    return {
      totalDays,
      companyHolidays,
      vacationDays,
      sickDays,
      personalAndOtherDays,
      employeeCount: empIdsOnLeave.size,
      recordsCount: monthHolidays.length,
      activeEmployees: activeEmps,
      leaveRate,
      attendanceRate
    };
  }, [monthHolidays, employees]);

  // Format Thai Date string (e.g. 5 ก.ย. or 5-7 ก.ย.)
  const formatThaiDateRange = (startDateStr: string, endDateStr: string) => {
    const sParts = startDateStr.split('-');
    const eParts = endDateStr.split('-');
    const sMonth = THAI_MONTHS[parseInt(sParts[1], 10) - 1];
    const sDay = parseInt(sParts[2], 10);

    if (startDateStr === endDateStr) {
      return `${sDay} ${sMonth}`;
    }

    const eMonth = THAI_MONTHS[parseInt(eParts[1], 10) - 1];
    const eDay = parseInt(eParts[2], 10);

    if (sMonth === eMonth) {
      return `${sDay}-${eDay} ${sMonth}`;
    }
    return `${sDay} ${sMonth} - ${eDay} ${eMonth}`;
  };

  // Helper to compute YTD quota used for an employee in current year
  const getEmployeeYtdQuota = (empId: string) => {
    const empYearHolidays = holidays.filter(h => {
      if (h.employeeId !== empId) return false;
      const startYear = new Date(h.startDate).getFullYear();
      return startYear === currentYear;
    });

    const usedVacation = empYearHolidays.filter(h => h.type === 'vacation').reduce((s, h) => s + h.durationDays, 0);
    const usedSick = empYearHolidays.filter(h => h.type === 'sick').reduce((s, h) => s + h.durationDays, 0);
    const usedPersonal = empYearHolidays.filter(h => h.type === 'personal').reduce((s, h) => s + h.durationDays, 0);

    const remainVacation = Math.max(0, (leaveQuotas?.vacation ?? 6) - usedVacation);
    const remainSick = Math.max(0, (leaveQuotas?.sick ?? 30) - usedSick);
    const remainPersonal = Math.max(0, (leaveQuotas?.personal ?? 3) - usedPersonal);

    return {
      usedVacation,
      usedSick,
      usedPersonal,
      remainVacation,
      remainSick,
      remainPersonal,
      vacationQuota: leaveQuotas?.vacation ?? 6,
      sickQuota: leaveQuotas?.sick ?? 30,
      personalQuota: leaveQuotas?.personal ?? 3
    };
  };

  // ⭐️ COMPREHENSIVE AGGREGATED SUMMARY BY EMPLOYEE (ใครหยุดไปกี่วันในเดือนนี้ + สิทธิ์คงเหลือ + รายละเอียดตามวัน)
  const employeeMonthSummary = useMemo(() => {
    interface EmployeeLeaveItem {
      id: string;
      startDate: string;
      endDate: string;
      dateRangeStr: string;
      type: HolidayType;
      title: string;
      durationDays: number;
    }

    interface EmployeeSummaryData {
      employee: Employee;
      totalDays: number;
      vacationDays: number;
      sickDays: number;
      personalDays: number;
      specialDays: number;
      otherDays: number;
      leaveItems: EmployeeLeaveItem[];
      datesList: string[];
      reasons: string[];
      quotaInfo: ReturnType<typeof getEmployeeYtdQuota>;
    }

    const summaryMap: Record<string, EmployeeSummaryData> = {};

    // 1. Initialize for all active employees if 'all' filter is active
    if (employeeFilter === 'all') {
      employees.filter(e => e.isActive).forEach(emp => {
        summaryMap[emp.id] = {
          employee: emp,
          totalDays: 0,
          vacationDays: 0,
          sickDays: 0,
          personalDays: 0,
          specialDays: 0,
          otherDays: 0,
          leaveItems: [],
          datesList: [],
          reasons: [],
          quotaInfo: getEmployeeYtdQuota(emp.id)
        };
      });
    }

    // 2. Accumulate this month's leave records
    monthHolidays.forEach(h => {
      if (h.employeeId === 'all') return;
      const emp = getEmployee(h.employeeId);
      if (!emp) return;

      if (!summaryMap[emp.id]) {
        summaryMap[emp.id] = {
          employee: emp,
          totalDays: 0,
          vacationDays: 0,
          sickDays: 0,
          personalDays: 0,
          specialDays: 0,
          otherDays: 0,
          leaveItems: [],
          datesList: [],
          reasons: [],
          quotaInfo: getEmployeeYtdQuota(emp.id)
        };
      }

      summaryMap[emp.id].totalDays += h.durationDays;
      if (h.type === 'vacation') summaryMap[emp.id].vacationDays += h.durationDays;
      else if (h.type === 'sick') summaryMap[emp.id].sickDays += h.durationDays;
      else if (h.type === 'personal') summaryMap[emp.id].personalDays += h.durationDays;
      else if (h.type === 'special_leave') summaryMap[emp.id].specialDays += h.durationDays;
      else summaryMap[emp.id].otherDays += h.durationDays;

      const dateStr = formatThaiDateRange(h.startDate, h.endDate);
      if (!summaryMap[emp.id].datesList.includes(dateStr)) {
        summaryMap[emp.id].datesList.push(dateStr);
      }

      if (h.title && !summaryMap[emp.id].reasons.includes(h.title)) {
        summaryMap[emp.id].reasons.push(h.title);
      }

      // ⭐️ Structured day-by-day leave detail item
      summaryMap[emp.id].leaveItems.push({
        id: h.id,
        startDate: h.startDate,
        endDate: h.endDate,
        dateRangeStr: dateStr,
        type: h.type,
        title: h.title,
        durationDays: h.durationDays
      });
    });

    let list = Object.values(summaryMap);

    // Sort leave items chronologically for each employee
    list.forEach(item => {
      item.leaveItems.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    });

    // 3. Filter if on_leave_only is selected
    if (employeeFilter === 'on_leave_only') {
      list = list.filter(item => item.totalDays > 0);
    }

    // Sort: who took the most days off first; for those with 0, sort by employeeCode or name
    return list.sort((a, b) => {
      if (b.totalDays !== a.totalDays) {
        return b.totalDays - a.totalDays;
      }
      return (a.employee.employeeCode || '').localeCompare(b.employee.employeeCode || '');
    });
  }, [monthHolidays, employees, currentYear, leaveQuotas, employeeFilter]);

  // 📅 COMPREHENSIVE DAILY LEAVE & ACTIVITY BREAKDOWN (รายละเอียดบันทึกตามวัน)
  const dailyActivityList = useMemo(() => {
    const list: {
      dayNum: number;
      dateString: string;
      thaiDate: string;
      dayOfWeekName: string;
      dayOfWeekShort: string;
      isWeekend: boolean;
      publicHolidays: HolidayLeave[];
      employeeLeaves: {
        id: string;
        emp: Employee | undefined;
        type: HolidayType;
        title: string;
        durationDays: number;
        startDate: string;
        endDate: string;
      }[];
    }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateString = `${currentYear}-${mStr}-${dStr}`;
      const dObj = new Date(currentYear, currentMonth, day);
      const dayOfWeek = dObj.getDay();

      // Reliable ISO date range comparison (immune to timezone offset differences)
      const leavesOnDate = monthHolidays.filter(h => {
        return dateString >= h.startDate && dateString <= h.endDate;
      });

      if (leavesOnDate.length > 0) {
        const pubHols = leavesOnDate.filter(h => h.employeeId === 'all' || h.type === 'public_holiday');
        const empLeaves = leavesOnDate.filter(h => h.employeeId !== 'all' && h.type !== 'public_holiday').map(h => ({
          id: h.id,
          emp: getEmployee(h.employeeId),
          type: h.type,
          title: h.title,
          durationDays: h.durationDays,
          startDate: h.startDate,
          endDate: h.endDate
        }));

        list.push({
          dayNum: day,
          dateString,
          thaiDate: `${day} ${THAI_MONTHS[currentMonth]}`,
          dayOfWeekName: THAI_FULL_WEEKDAYS[dayOfWeek]?.full || '',
          dayOfWeekShort: THAI_FULL_WEEKDAYS[dayOfWeek]?.short || '',
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          publicHolidays: pubHols,
          employeeLeaves: empLeaves
        });
      }
    }

    return list;
  }, [daysInMonth, currentYear, currentMonth, monthHolidays, employees]);

  // Department Breakdown
  const departmentBreakdown = useMemo(() => {
    const deptMap: Record<string, { days: number; count: number; emps: Set<string> }> = {};
    monthHolidays.forEach(h => {
      if (h.employeeId === 'all') return;
      const emp = getEmployee(h.employeeId);
      const dept = emp?.department || 'ฝ่ายทั่วไป';
      if (!deptMap[dept]) deptMap[dept] = { days: 0, count: 0, emps: new Set() };
      deptMap[dept].days += h.durationDays;
      deptMap[dept].count += 1;
      deptMap[dept].emps.add(h.employeeId);
    });

    const totalDays = monthStats.totalDays || 1;
    return Object.entries(deptMap)
      .map(([dept, data]) => ({ 
        dept, 
        days: data.days, 
        count: data.count, 
        empCount: data.emps.size,
        percentage: Math.round((data.days / totalDays) * 100)
      }))
      .sort((a, b) => b.days - a.days);
  }, [monthHolidays, employees, monthStats.totalDays]);

  // Calendar Grid Cells (Fixed 35 or 42 grid)
  const calendarCells = useMemo(() => {
    const cells: { dateString: string; dayNum: number; isCurrentMonth: boolean; dayOfWeek: number }[] = [];

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();

    // Previous month cells
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrev - i;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(dNum).padStart(2, '0');
      const dateString = `${prevYear}-${mStr}-${dStr}`;
      cells.push({
        dateString,
        dayNum: dNum,
        isCurrentMonth: false,
        dayOfWeek: new Date(dateString).getDay()
      });
    }

    // Current month cells
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const dateString = `${currentYear}-${mStr}-${dStr}`;
      cells.push({
        dateString,
        dayNum: i,
        isCurrentMonth: true,
        dayOfWeek: new Date(dateString).getDay()
      });
    }

    // Next month cells
    const targetLength = cells.length > 35 ? 42 : 35;
    const remaining = targetLength - cells.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let i = 1; i <= remaining; i++) {
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const dateString = `${nextYear}-${mStr}-${dStr}`;
      cells.push({
        dateString,
        dayNum: i,
        isCurrentMonth: false,
        dayOfWeek: new Date(dateString).getDay()
      });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek]);

  // Check leaves on a specific date string (ISO date string comparison)
  const getLeavesForDate = (dateStr: string) => {
    return monthHolidays.filter(h => {
      return dateStr >= h.startDate && dateStr <= h.endDate;
    });
  };

  // Action: Download JPG (Guaranteed 100% Full-bleed with ZERO empty space or scale distortion!)
  const handleDownloadJPG = async () => {
    const node = documentRef.current;
    if (!node) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const contentHeight = node.offsetHeight;

      const dataUrl = await toJpeg(node, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: targetDocWidth,
        height: contentHeight,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          margin: '0',
          width: `${targetDocWidth}px`,
          height: `${contentHeight}px`,
        }
      });

      const thaiYear = currentYear + 543;
      const monthName = THAI_MONTHS[currentMonth];
      const orientationName = layoutMode === 'landscape' ? 'สไลด์ผู้บริหาร_16x9' : 'รายงานผู้บริหาร_เต็มหน้าA4';
      const fileName = `สรุปวันหยุด_${orientationName}_${monthName}_${thaiYear}.jpg`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting JPG:', err);
      alert('ไม่สามารถส่งออกเป็นภาพ JPG ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  // Action: Copy to Clipboard
  const handleCopyToClipboard = async () => {
    const node = documentRef.current;
    if (!node) return;
    setIsCopying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 250));
      const contentHeight = node.offsetHeight;

      const blob = await toBlob(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: targetDocWidth,
        height: contentHeight,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          margin: '0',
          width: `${targetDocWidth}px`,
          height: `${contentHeight}px`,
        }
      });

      if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        handleDownloadJPG();
      }
    } catch (err) {
      console.warn('Clipboard write fallback:', err);
      handleDownloadJPG();
    } finally {
      setIsCopying(false);
    }
  };

  if (!isOpen) return null;

  const thaiCurrentYear = currentYear + 543;
  const todayFormatted = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl max-w-7xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-700/60 overflow-hidden my-auto animate-in fade-in duration-200">
        
        {/* Top Control Bar */}
        <div className="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-950">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>แดชบอร์ดสรุปวันหยุดนำเสนอผู้บริหาร (.JPG)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  สัดส่วนพอดี 100% ไม่มีช่องว่าง
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                สรุปยอดวันหยุดรายบุคคล ใครหยุดกี่วัน พร้อมสิทธิ์คงเหลือ และปฏิทินส่งออกคมชัดระดับ Masterpiece
              </p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={isCopying || isExporting}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
              title="คัดลอกภาพไปยังคลิปบอร์ด เพื่อวางใน LINE หรือแชท"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">คัดลอกแล้ว!</span>
                </>
              ) : isCopying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span>กำลังคัดลอก...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>คัดลอกภาพ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJPG}
              disabled={isExporting}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-950 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้างภาพ JPG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดรูปภาพ JPG</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer ml-1 border border-slate-700"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Format, Orientation, & Zoom Controls Bar */}
        <div className="bg-slate-900/95 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          
          {/* Format Options & Content Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold text-[11px]">สัดส่วนภาพ:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setLayoutMode('landscape')}
                className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'landscape' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>🖥️ สไลด์ผู้บริหาร (แนวนอน 16:9 แนะนำ)</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('portrait')}
                className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'portrait' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>📄 รายงานทางการ A4 (แนวตั้ง)</span>
              </button>
            </div>

            {/* Employee Coverage Filter (Eliminates empty space by listing all staff or only on-leave) */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 ml-1">
              <button
                type="button"
                onClick={() => setEmployeeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 text-[11px] ${
                  employeeFilter === 'all' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="แสดงพนักงานทุกคนในตาราง (รวมผู้ที่มาทำงานครบ 100%) เต็มหน้า ไม่มีช่องว่าง"
              >
                <Users className="w-3 h-3" />
                <span>👥 แสดงพนักงานทุกคน ({employees.filter(e => e.isActive).length} คน)</span>
              </button>

              <button
                type="button"
                onClick={() => setEmployeeFilter('on_leave_only')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 text-[11px] ${
                  employeeFilter === 'on_leave_only' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="แสดงเฉพาะผู้ที่มีบันทึกการลาในเดือนนี้"
              >
                <AlertCircle className="w-3 h-3" />
                <span>เฉพาะผู้ที่ลา ({monthStats.employeeCount} คน)</span>
              </button>
            </div>
          </div>

          {/* Month, Year, and Zoom Controls */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-bold text-[11px]">ประจำเดือน:</span>
              <select
                value={currentMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 font-bold text-white rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none cursor-pointer"
              >
                {THAI_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 font-bold text-white rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none cursor-pointer"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((yr) => (
                  <option key={yr} value={yr}>พ.ศ. {yr + 543}</option>
                ))}
              </select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFitToScreen(false);
                  setZoomScale(prev => Math.max(0.25, prev - 0.08));
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-850 rounded transition"
                title="ย่อขนาดพรีวิว"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-300 w-10 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  setFitToScreen(false);
                  setZoomScale(prev => Math.min(1.2, prev + 0.08));
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-850 rounded transition"
                title="ขยายขนาดพรีวิว"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFitToScreen(true)}
                className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  fitToScreen ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="ปรับขนาดพอดีหน้าต่างอัตโนมัติ"
              >
                พอดีจอ
              </button>
            </div>
          </div>

        </div>

        {/* Preview Canvas Background */}
        <div 
          ref={previewContainerRef}
          className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex items-start justify-center relative min-h-[500px]"
        >
          {/* Scaled Preview Viewport Wrapper (Handles visual scaling in the modal UI) */}
          <div 
            style={{
              width: `${targetDocWidth * zoomScale}px`,
              height: docHeight > 0 ? `${docHeight * zoomScale}px` : 'auto',
            }}
            className="shrink-0 relative shadow-2xl transition-all duration-100"
          >
            {/* Transform Container (ONLY applied for UI preview, NOT on the export root!) */}
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top left',
                width: `${targetDocWidth}px`,
              }}
            >
              {/* ⭐️ THE MASTER EXECUTIVE DOCUMENT TEMPLATE (NO CSS TRANSFORM! CAPTURED FULL-BLEED 100% CLEAN!) */}
              <div
                ref={documentRef}
                style={{
                  width: `${targetDocWidth}px`,
                }}
                className="bg-white text-slate-900 rounded-none border-0 shadow-none overflow-hidden select-none font-sans"
              >
                {/* ========================================================= */}
                {/* 🌟 LAYOUT A: 16:9 EXECUTIVE BOARDROOM SLIDE (RECOMMENDED) */}
                {/* ========================================================= */}
                {layoutMode === 'landscape' ? (
                  <div className="p-8 space-y-4 bg-white">
                    {/* Executive Header Banner */}
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-rose-950 shrink-0 border border-rose-400/30">
                          PH
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-white tracking-tight">
                              {companyName}
                            </h1>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              EXECUTIVE REPORT 16:9
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-rose-400 tracking-wider">
                            PONGSAKUL HARDWARE CO., LTD. • ฝ่ายทรัพยากรบุคคล (HR)
                          </p>
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                            รายงานสรุปสถิติวันหยุด ยอดวันลาพนักงานรายบุคคล และสถานะสิทธิ์คงเหลือ ประจำเดือน{THAI_MONTHS[currentMonth]} พ.ศ. {thaiCurrentYear}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 text-right">
                        <div className="border-r border-slate-700/80 pr-5 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">รอบการประเมิน</span>
                          <span className="text-sm font-black text-white font-mono">
                            {THAI_MONTHS[currentMonth]} {thaiCurrentYear}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">พิมพ์เอกสารเมื่อ</span>
                          <span className="text-xs font-bold text-slate-300 font-mono">
                            {todayFormatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4 Unified KPI Cards */}
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-3xs">
                        <span className="text-[11px] font-bold text-slate-500 block">วันลาหยุดรวมทั้งหมด</span>
                        <span className="text-2xl font-black text-slate-900 block mt-0.5">{monthStats.totalDays} วัน</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">{monthStats.recordsCount} รายการในเดือนนี้</span>
                      </div>

                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 shadow-3xs">
                        <span className="text-[11px] font-bold text-rose-800 block">🤒 ลาป่วย (Sick Leave)</span>
                        <span className="text-2xl font-black text-rose-950 block mt-0.5">{monthStats.sickDays} วัน</span>
                        <span className="text-[10px] font-bold text-rose-600 mt-0.5 block">
                          สัดส่วน {monthStats.totalDays > 0 ? Math.round((monthStats.sickDays / monthStats.totalDays) * 100) : 0}% ของวันลา
                        </span>
                      </div>

                      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 shadow-3xs">
                        <span className="text-[11px] font-bold text-sky-800 block">💼 ลากิจ & อื่นๆ (Personal)</span>
                        <span className="text-2xl font-black text-sky-950 block mt-0.5">{monthStats.personalAndOtherDays} วัน</span>
                        <span className="text-[10px] font-bold text-sky-600 mt-0.5 block">
                          สัดส่วน {monthStats.totalDays > 0 ? Math.round((monthStats.personalAndOtherDays / monthStats.totalDays) * 100) : 0}% ของวันลา
                        </span>
                      </div>

                      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-300 block">อัตราการมาปฏิบัติงาน</span>
                        <span className="text-2xl font-black text-white block mt-0.5">
                          {monthStats.attendanceRate}%
                        </span>
                        <span className="text-[10px] font-semibold text-rose-400 mt-0.5 block">
                          มีผู้ลา {monthStats.employeeCount} จาก {monthStats.activeEmployees} คน
                        </span>
                      </div>
                    </div>

                    {/* 2-Column Split: Summary by Employee (Left 6 Cols) + Calendar & Daily Breakdown (Right 6 Cols) */}
                    <div className="grid grid-cols-12 gap-5 items-stretch">
                      
                      {/* Left Column (6 Cols): Summary Table + Insights + Signatures */}
                      <div className="col-span-6 flex flex-col justify-between space-y-3.5">
                        
                        {/* 👥 EMPLOYEES LEAVE SUMMARY TABLE */}
                        <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 shadow-3xs space-y-3 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div>
                              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-rose-600" />
                                <span>สรุปยอดวันหยุดพนักงานประจำเดือน</span>
                              </h3>
                              <p className="text-[10.5px] text-slate-500 font-medium">
                                {employeeFilter === 'all' 
                                  ? 'สถิติการลา วันที่ลา เหตุผล และสิทธิ์วันลาคงเหลือทั้งปี' 
                                  : 'แสดงเฉพาะผู้ที่มีประวัติการลาในเดือนนี้ เรียงลำดับจากผู้ที่หยุดมากที่สุด'}
                              </p>
                            </div>
                            <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              แสดง {employeeMonthSummary.length} คน
                            </span>
                          </div>

                          {employeeMonthSummary.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-xl border border-slate-200">
                              ✨ ยอดเยี่ยม! ไม่มีพนักงานลาหยุดงานในเดือนนี้ (อัตราการมาทำงาน 100%)
                            </div>
                          ) : (
                            <div className="border border-slate-200 rounded-xl overflow-hidden flex-1">
                              <table className="w-full text-xs text-left border-collapse table-fixed">
                                <thead>
                                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[10.5px]">
                                    <th className="py-2.5 px-2 text-center w-[6%]">ที่</th>
                                    <th className="py-2.5 px-2.5 w-[26%]">พนักงาน / แผนก</th>
                                    <th className="py-2.5 px-2 text-center w-[14%]">ยอดหยุด</th>
                                    <th className="py-2.5 px-2 text-center w-[18%]">สิทธิ์คงเหลือ</th>
                                    <th className="py-2.5 px-3 w-[36%]">รายละเอียดตามวัน (วันที่ลา • ประเภท • เหตุผล)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {employeeMonthSummary.map((item, idx) => {
                                    const emp = item.employee;
                                    const percentOfTotal = monthStats.totalDays > 0 
                                      ? Math.round((item.totalDays / monthStats.totalDays) * 100) 
                                      : 0;
                                    const q = item.quotaInfo;
                                    const hasLeaves = item.totalDays > 0;

                                    return (
                                      <tr key={emp.id} className={idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}>
                                        {/* 1. ลำดับ */}
                                        <td className="py-2 px-1 text-center font-mono font-bold text-slate-400 text-[11px]">
                                          {idx + 1}
                                        </td>

                                        {/* 2. พนักงาน */}
                                        <td className="py-2 px-2.5 font-bold text-slate-900">
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-black text-[10px] shrink-0">
                                              {emp.firstName.slice(0, 1)}
                                            </span>
                                            <div className="truncate">
                                              <span className="block truncate text-[11.5px] leading-tight">
                                                {emp.firstName} {emp.lastName} {emp.nickname ? `(${emp.nickname})` : ''}
                                              </span>
                                              <span className="text-[9.5px] text-slate-400 font-normal block truncate font-mono">
                                                {emp.employeeCode} • {emp.department}
                                              </span>
                                            </div>
                                          </div>
                                        </td>

                                        {/* 3. ยอดหยุดในเดือนนี้ */}
                                        <td className="py-2 px-2 text-center">
                                          {hasLeaves ? (
                                            <div className="inline-flex flex-col items-center">
                                              <span className="text-sm font-black text-rose-700 font-mono leading-none">
                                                {item.totalDays} <span className="text-[10px] font-normal text-slate-500">วัน</span>
                                              </span>
                                              <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                ({percentOfTotal}% ของยอดลา)
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="inline-flex items-center justify-center">
                                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                0 วัน (มาครบ)
                                              </span>
                                            </div>
                                          )}
                                        </td>

                                        {/* 4. สิทธิ์คงเหลือทั้งปี (Leave Quota Balance) */}
                                        <td className="py-2 px-2 text-center font-mono">
                                          <div className="inline-flex flex-col items-center leading-tight">
                                            <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                              พักร้อน {q.remainVacation}/{q.vacationQuota} ว.
                                            </span>
                                            <span className="text-[9px] text-slate-500 mt-0.5">
                                              ป่วยเหลือ {q.remainSick}/{q.sickQuota} ว.
                                            </span>
                                          </div>
                                        </td>

                                        {/* 5. รายละเอียดตามวัน (วันที่ลา • ประเภท • เหตุผลการลา) */}
                                        <td className="py-2 px-3 text-slate-700 text-xs">
                                          {hasLeaves ? (
                                            <div className="space-y-1">
                                              {item.leaveItems.map((det) => {
                                                const st = LEAVE_TYPE_STYLES[det.type] || LEAVE_TYPE_STYLES.other;
                                                return (
                                                  <div key={det.id} className="flex items-center gap-1.5 py-0.5 leading-tight">
                                                    <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200/90 px-1.5 py-0.5 rounded text-[9.5px] shrink-0">
                                                      {det.dateRangeStr}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border shrink-0 ${st.bgColor} ${st.color} ${st.borderColor}`}>
                                                      {st.emoji} {st.shortLabel} {det.durationDays} วัน
                                                    </span>
                                                    <span className="text-slate-800 font-medium truncate text-[10.5px]" title={det.title}>
                                                      {det.title || 'ตามสิทธิ์'}
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[10.5px] py-1">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                              <span>มาปฏิบัติงานครบ 100% (ไม่มีประวัติการลา)</span>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* 🌟 2 LEADERSHIP INSIGHT CARDS */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* 1. Public & Company Holidays in this month */}
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
                              <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                <span>วันหยุดบริษัท/นักขัตฤกษ์:</span>
                              </span>
                              <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {monthPublicHolidays.length} วัน
                              </span>
                            </div>

                            {monthPublicHolidays.length === 0 ? (
                              <p className="text-[10px] text-slate-500 italic py-1">
                                เดือนนี้ไม่มีวันหยุดนักขัตฤกษ์ (วันทำงานปกติ)
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {monthPublicHolidays.slice(0, 2).map((ph) => (
                                  <div key={ph.id} className="flex items-center justify-between bg-white border border-emerald-200/80 px-2 py-1 rounded-lg text-[10px]">
                                    <span className="font-bold text-slate-800 truncate max-w-[130px]">📢 {ph.title}</span>
                                    <span className="font-mono text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                      {formatThaiDateRange(ph.startDate, ph.endDate)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 2. Department Breakdown */}
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
                              <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-rose-600" />
                                <span>สัดส่วนวันลาตามแผนก:</span>
                              </span>
                              <span className="text-[9.5px] font-bold text-slate-400">
                                {departmentBreakdown.length} แผนก
                              </span>
                            </div>

                            {departmentBreakdown.length === 0 ? (
                              <p className="text-[10px] text-slate-500 italic py-1">
                                ไม่มีการลาแยกตามแผนกในเดือนนี้
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {departmentBreakdown.slice(0, 2).map((dept) => (
                                  <div key={dept.dept} className="space-y-0.5">
                                    <div className="flex justify-between text-[9.5px] font-bold text-slate-700">
                                      <span className="truncate max-w-[120px]">{dept.dept}</span>
                                      <span className="text-slate-500 font-mono">{dept.days} ว. ({dept.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-rose-500 h-full rounded-full transition-all"
                                        style={{ width: `${Math.min(100, dept.percentage)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Executive Signatures Block */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 grid grid-cols-2 gap-3 text-center text-xs">
                          <div className="border-r border-slate-200 pr-2">
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">ผู้จัดทำรายงาน (HR OFFICER)</span>
                            <div className="pt-5 border-b border-slate-300 w-3/4 mx-auto"></div>
                            <p className="font-bold text-slate-700 text-[11px] mt-1">( เจ้าหน้าที่ฝ่ายบุคคล )</p>
                            <span className="text-[9px] text-slate-400 block mt-0.5">วันที่: {todayFormatted}</span>
                          </div>
                          <div className="pl-1">
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">ผู้อนุมัติ (MANAGEMENT)</span>
                            <div className="pt-5 border-b border-slate-300 w-3/4 mx-auto"></div>
                            <p className="font-bold text-slate-700 text-[11px] mt-1">( กรรมการผู้จัดการ )</p>
                            <span className="text-[9px] text-slate-400 block mt-0.5">วันที่: ..... / ..... / ..........</span>
                          </div>
                        </div>

                      </div>

                      {/* Right Column (6 Cols): Wide & Comfortable Calendar + Daily Activity Breakdown */}
                      <div className="col-span-6 flex flex-col justify-between space-y-3.5">
                        
                        {/* 🌟 GORGEOUS & COMFORTABLE CALENDAR MATRIX (ผังปฏิทิน สบายตา กว้างขวาง) */}
                        <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 shadow-3xs space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-rose-600" />
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                ผังปฏิทินวันหยุดและวันลาประจำเดือน
                              </h3>
                              <span className="text-[11px] font-bold text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                {THAI_MONTHS[currentMonth]} {thaiCurrentYear}
                              </span>
                            </div>
                            {/* Soft Legend Bar */}
                            <div className="flex items-center gap-2 text-[9.5px] font-semibold text-slate-600">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>หยุดบริษัท</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>ป่วย</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>พักร้อน</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                <span>ลากิจ</span>
                              </span>
                            </div>
                          </div>

                          {/* Seamless Weekday Ribbon Header */}
                          <div className="grid grid-cols-7 border border-slate-200/90 rounded-t-xl overflow-hidden bg-slate-100/90 text-center">
                            {THAI_FULL_WEEKDAYS.map((day, idx) => (
                              <div 
                                key={idx} 
                                className={`py-1.5 text-center text-[10.5px] font-black tracking-tight ${
                                  idx !== 6 ? 'border-r border-slate-200/60' : ''
                                } ${
                                  day.isWeekend 
                                    ? day.short === 'อา.' ? 'bg-rose-50/70 text-rose-600' : 'bg-sky-50/70 text-sky-700'
                                    : 'text-slate-700'
                                }`}
                              >
                                {day.short}
                              </div>
                            ))}
                          </div>

                          {/* Calendar 7 Columns Grid with Clean Dividers */}
                          <div className="border-x border-b border-slate-200/90 rounded-b-xl overflow-hidden bg-slate-200/70 gap-[1px] grid grid-cols-7">
                            {calendarCells.map((cell, idx) => {
                              const dayLeaves = cell.isCurrentMonth ? getLeavesForDate(cell.dateString) : [];
                              const isSunday = cell.dayOfWeek === 0;
                              const isSaturday = cell.dayOfWeek === 6;
                              const hasPubHol = dayLeaves.some(h => h.employeeId === 'all' || h.type === 'public_holiday');

                              return (
                                <div
                                  key={idx}
                                  className={`min-h-[58px] p-1.5 flex flex-col justify-between transition ${
                                    cell.isCurrentMonth
                                      ? hasPubHol
                                        ? 'bg-emerald-50/50'
                                        : isSunday
                                          ? 'bg-rose-50/25'
                                          : isSaturday
                                            ? 'bg-sky-50/20'
                                            : 'bg-white'
                                      : 'bg-slate-50/50 opacity-25'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-[11px] font-black font-mono ${
                                      hasPubHol 
                                        ? 'text-emerald-800 font-black'
                                        : isSunday 
                                          ? 'text-rose-600 font-black' 
                                          : isSaturday 
                                            ? 'text-sky-700 font-black' 
                                            : cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-300'
                                    }`}>
                                      {cell.dayNum}
                                    </span>
                                    {hasPubHol && (
                                      <span className="text-[8px] font-black px-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        วันหยุด
                                      </span>
                                    )}
                                  </div>

                                  {/* Leaves in cell: High-legibility, spacious tags */}
                                  <div className="space-y-0.5 overflow-hidden">
                                    {dayLeaves.slice(0, 2).map((hol) => {
                                      const st = LEAVE_TYPE_STYLES[hol.type] || LEAVE_TYPE_STYLES.other;
                                      const emp = getEmployee(hol.employeeId);
                                      const isAll = hol.employeeId === 'all';
                                      const empName = emp?.nickname || emp?.firstName || 'พนักงาน';

                                      if (isAll) {
                                        return (
                                          <div
                                            key={hol.id}
                                            title={hol.title}
                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-1 leading-tight shadow-3xs truncate"
                                          >
                                            <span className="shrink-0">📢</span>
                                            <span className="truncate">{hol.title}</span>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div
                                          key={hol.id}
                                          title={`${emp?.firstName} (${empName}): ${hol.title || st.shortLabel}`}
                                          className={`px-1.5 py-0.5 rounded text-[9.5px] border flex items-center gap-1 leading-tight shadow-3xs truncate ${st.bgColor} ${st.color} ${st.borderColor}`}
                                        >
                                          <span className="text-[9px] shrink-0">{st.emoji}</span>
                                          <span className="font-black text-slate-900 shrink-0">{empName}</span>
                                          <span className="opacity-40 shrink-0">·</span>
                                          <span className="truncate font-semibold">{st.shortLabel}</span>
                                        </div>
                                      );
                                    })}
                                    {dayLeaves.length > 2 && (
                                      <div className="text-[8px] font-bold text-rose-700 text-center bg-rose-50 rounded py-0.5 border border-rose-200">
                                        +{dayLeaves.length - 2} คน
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 📋 รายละเอียดการลาตามวัน (Daily Schedule & Activity Breakdown) */}
                        <div className="bg-slate-50/90 border-2 border-slate-200/90 rounded-2xl p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-rose-600" />
                              <h4 className="text-xs font-black text-slate-900">
                                สมุดบันทึกรายละเอียดการลาตามวัน (Daily Activity Log)
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              มีรายการลา/วันหยุด {dailyActivityList.length} วัน
                            </span>
                          </div>

                          {dailyActivityList.length === 0 ? (
                            <div className="py-6 text-center text-slate-500 text-xs font-medium bg-white rounded-xl border border-slate-200">
                              ✨ ยอดเยี่ยม! ไม่มีประวัติการลาในเดือนนี้ (อัตราการมาทำงาน 100%)
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-0.5">
                              {dailyActivityList.map((dayItem) => (
                                <div key={dayItem.dateString} className="bg-white border border-slate-200/90 rounded-xl px-3 py-2 space-y-1 text-xs shadow-3xs">
                                  <div className="flex items-center justify-between text-[11px] font-bold border-b border-slate-100 pb-1">
                                    <span className="text-slate-900 flex items-center gap-1.5 font-mono">
                                      <span className={`w-2 h-2 rounded-full ${dayItem.isWeekend ? (dayItem.dayOfWeekShort === 'อา.' ? 'bg-rose-500' : 'bg-sky-500') : 'bg-slate-700'}`} />
                                      {dayItem.dayOfWeekName}ที่ {dayItem.thaiDate}
                                    </span>
                                    {dayItem.publicHolidays.length > 0 ? (
                                      <span className="text-[9px] font-black px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        วันหยุดบริษัท
                                      </span>
                                    ) : (
                                      <span className="text-[9.5px] font-semibold text-slate-400 font-mono">
                                        {dayItem.employeeLeaves.length} รายการ
                                      </span>
                                    )}
                                  </div>

                                  {dayItem.publicHolidays.map(ph => (
                                    <div key={ph.id} className="text-[10.5px] text-emerald-900 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80">
                                      📢 {ph.title} (หยุดทำการทั้งบริษัท)
                                    </div>
                                  ))}

                                  {dayItem.employeeLeaves.map((l) => {
                                    const st = LEAVE_TYPE_STYLES[l.type] || LEAVE_TYPE_STYLES.other;
                                    return (
                                      <div key={l.id} className="flex items-center justify-between gap-2 text-[10.5px] pt-0.5">
                                        <div className="truncate flex items-center gap-1.5">
                                          <span className="font-bold text-slate-900">
                                            {l.emp?.firstName} {l.emp?.lastName} {l.emp?.nickname ? `(${l.emp.nickname})` : ''}
                                          </span>
                                          <span className="text-slate-400 font-mono text-[9.5px]">[{l.emp?.department}]</span>
                                          <span className="text-slate-400">·</span>
                                          <span className="text-slate-700 truncate font-medium">
                                            เหตุผล: {l.title || 'ตามสิทธิ์'}
                                          </span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border shrink-0 ${st.bgColor} ${st.color} ${st.borderColor}`}>
                                          {st.emoji} {st.shortLabel}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>

                    {/* Document Footer (Full Bleed) */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-200 font-mono">
                      <span>ระบบบริหารงานบุคคล บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด (PONGSAKUL HARDWARE CO., LTD.)</span>
                      <span>INTERNAL USE ONLY • CONFIDENTIAL EXECUTIVE REPORT • สรุปยอดวันหยุดและสิทธิ์คงเหลือ</span>
                    </div>
                  </div>
                ) : (
                  /* ========================================================= */
                  /* 📄 LAYOUT B: PORTRAIT A4 EXECUTIVE REPORT (FULL BLEED)     */
                  /* ========================================================= */
                  <div className="p-8 space-y-4 bg-white">
                    {/* Executive Header Banner */}
                    <div className="flex items-center justify-between border-b-4 border-rose-600 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white font-black flex items-center justify-center text-2xl shadow-md shrink-0 border-2 border-rose-800">
                          PH
                        </div>
                        <div>
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            {companyName}
                          </h1>
                          <p className="text-xs font-bold text-rose-600 tracking-wider">
                            PONGSAKUL HARDWARE CO., LTD. • ฝ่ายทรัพยากรบุคคล (HR)
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            รายงานสรุปสถิติวันหยุด ยอดวันลาพนักงานรายบุคคล และสถานะสิทธิ์คงเหลือ (Monthly Executive Summary)
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black shadow-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                          <span>เอกสารรายงานทางการ A4</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          ประจำเดือน: <strong className="text-slate-900 font-black">{THAI_MONTHS[currentMonth]} {thaiCurrentYear}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          วันที่พิมพ์เอกสาร: {todayFormatted}
                        </div>
                      </div>
                    </div>

                    {/* 4 Unified KPI Cards */}
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-3xs">
                        <span className="text-[11px] font-bold text-slate-500 block">วันลาหยุดรวมทั้งหมด</span>
                        <span className="text-2xl font-black text-slate-900 block mt-0.5">{monthStats.totalDays} วัน</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">{monthStats.recordsCount} รายการในเดือนนี้</span>
                      </div>

                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 shadow-3xs">
                        <span className="text-[11px] font-bold text-rose-800 block">🤒 ลาป่วย (Sick Leave)</span>
                        <span className="text-2xl font-black text-rose-950 block mt-0.5">{monthStats.sickDays} วัน</span>
                        <span className="text-[10px] font-bold text-rose-600 mt-0.5 block">
                          สัดส่วน {monthStats.totalDays > 0 ? Math.round((monthStats.sickDays / monthStats.totalDays) * 100) : 0}% ของวันลา
                        </span>
                      </div>

                      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 shadow-3xs">
                        <span className="text-[11px] font-bold text-sky-800 block">💼 ลากิจ & อื่นๆ (Personal)</span>
                        <span className="text-2xl font-black text-sky-950 block mt-0.5">{monthStats.personalAndOtherDays} วัน</span>
                        <span className="text-[10px] font-bold text-sky-600 mt-0.5 block">
                          สัดส่วน {monthStats.totalDays > 0 ? Math.round((monthStats.personalAndOtherDays / monthStats.totalDays) * 100) : 0}% ของวันลา
                        </span>
                      </div>

                      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-300 block">อัตราการมาปฏิบัติงาน</span>
                        <span className="text-2xl font-black text-white block mt-0.5">
                          {monthStats.attendanceRate}%
                        </span>
                        <span className="text-[10px] font-semibold text-rose-400 mt-0.5 block">
                          มีผู้ลา {monthStats.employeeCount} จาก {monthStats.activeEmployees} คน
                        </span>
                      </div>
                    </div>

                    {/* ⭐️ STAR SECTION: EMPLOYEES LEAVE SUMMARY TABLE (WHO TOOK HOW MANY DAYS + QUOTA BALANCE + REASONS) */}
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-rose-600" />
                            <span>ตารางสรุปยอดวันหยุดพนักงานประจำเดือน (ใครหยุดไปแล้วกี่วัน)</span>
                          </h3>
                          <p className="text-[10.5px] text-slate-500 font-medium">
                            {employeeFilter === 'all' 
                              ? 'สรุปรายละเอียดพนักงานทุกคน จัดสรรพื้นที่เต็มหน้า 100% พร้อมเหตุผลและสิทธิ์คงเหลือ' 
                              : 'สรุปเฉพาะผู้ที่มีประวัติการลาในเดือนนี้ เรียงลำดับตามจำนวนวันลา'}
                          </p>
                        </div>
                        <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          แสดง {employeeMonthSummary.length} คน
                        </span>
                      </div>

                      {employeeMonthSummary.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-xl border border-slate-200">
                          ✨ ไม่มีพนักงานลาหยุดงานในเดือนนี้ (อัตราการมาทำงาน 100%)
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs text-left border-collapse table-fixed">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                                <th className="py-2.5 px-3 text-center w-[4%]">ที่</th>
                                <th className="py-2.5 px-3 w-[22%]">พนักงาน / แผนก / ตำแหน่ง</th>
                                <th className="py-2.5 px-3 text-center w-[11%]">ยอดหยุดเดือนนี้</th>
                                <th className="py-2.5 px-3 text-center w-[15%]">สิทธิ์คงเหลือปีนี้</th>
                                <th className="py-2.5 px-3 w-[48%]">รายละเอียดตามวัน (วันที่ลา • ประเภท • เหตุผลการลา)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {employeeMonthSummary.map((item, idx) => {
                                const emp = item.employee;
                                const percentOfTotal = monthStats.totalDays > 0 
                                  ? Math.round((item.totalDays / monthStats.totalDays) * 100) 
                                  : 0;
                                const q = item.quotaInfo;
                                const hasLeaves = item.totalDays > 0;

                                return (
                                  <tr key={emp.id} className={idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}>
                                    {/* 1. ลำดับ */}
                                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400 text-xs">
                                      {idx + 1}
                                    </td>

                                    {/* 2. พนักงาน */}
                                    <td className="py-2.5 px-3 font-bold text-slate-900">
                                      <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                                          {emp.firstName.slice(0, 1)}
                                        </span>
                                        <div className="truncate">
                                          <span className="text-xs block truncate leading-tight">
                                            {emp.firstName} {emp.lastName} {emp.nickname ? `(${emp.nickname})` : ''}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-normal block truncate font-mono">
                                            {emp.employeeCode} • {emp.department} ({emp.position})
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* 3. ยอดหยุดในเดือนนี้ */}
                                    <td className="py-2.5 px-2 text-center">
                                      {hasLeaves ? (
                                        <div className="inline-flex flex-col items-center">
                                          <span className="text-base font-black text-rose-700 font-mono leading-none">
                                            {item.totalDays} <span className="text-xs font-normal text-slate-500">วัน</span>
                                          </span>
                                          <span className="text-[9.5px] font-bold text-slate-400 mt-0.5">
                                            ({percentOfTotal}% ของยอดรวม)
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="inline-flex items-center justify-center">
                                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            0 วัน (มาครบ)
                                          </span>
                                        </div>
                                      )}
                                    </td>

                                    {/* 4. สิทธิ์คงเหลือทั้งปี */}
                                    <td className="py-2.5 px-2 text-center font-mono">
                                      <div className="inline-flex flex-col items-center gap-0.5">
                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                          พักร้อน {q.remainVacation}/{q.vacationQuota} วัน
                                        </span>
                                        <span className="text-[9.5px] text-slate-500">
                                          ป่วยเหลือ {q.remainSick}/{q.sickQuota} วัน
                                        </span>
                                      </div>
                                    </td>

                                    {/* 5. รายละเอียดตามวัน (วันที่ลา • ประเภท • เหตุผลการลา) */}
                                    <td className="py-2.5 px-3 text-slate-700 text-xs">
                                      {hasLeaves ? (
                                        <div className="space-y-1">
                                          {item.leaveItems.map((det) => {
                                            const st = LEAVE_TYPE_STYLES[det.type] || LEAVE_TYPE_STYLES.other;
                                            return (
                                              <div key={det.id} className="flex items-center gap-1.5 py-0.5 leading-tight">
                                                <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200/90 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                                  {det.dateRangeStr}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border shrink-0 ${st.bgColor} ${st.color} ${st.borderColor}`}>
                                                  {st.emoji} {st.shortLabel} {det.durationDays} วัน
                                                </span>
                                                <span className="text-slate-800 font-medium truncate text-xs" title={det.title}>
                                                  {det.title || 'ลาตามสิทธิ์'}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs py-1">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                          <span>มาปฏิบัติงานครบ 100% (ไม่มีประวัติการลา)</span>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 3-Columns Balanced Stats: Company Holidays, Department Distribution, & Readiness Index */}
                    <div className="grid grid-cols-3 gap-4">
                      
                      {/* 1. วันหยุดนักขัตฤกษ์/บริษัทประจำเดือน */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>วันหยุดนักขัตฤกษ์/บริษัท:</span>
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {monthPublicHolidays.length} วัน
                          </span>
                        </div>

                        {monthPublicHolidays.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">
                            เดือนนี้ไม่มีวันหยุดนักขัตฤกษ์ (วันทำงานปกติ)
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {monthPublicHolidays.slice(0, 2).map((ph) => (
                              <div key={ph.id} className="flex items-center justify-between bg-white border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
                                <span className="font-bold text-slate-800 truncate max-w-[140px]">📢 {ph.title}</span>
                                <span className="font-mono text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  {formatThaiDateRange(ph.startDate, ph.endDate)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. สัดส่วนการลาแยกตามแผนก */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-rose-600" />
                            <span>สัดส่วนการลาแยกแผนก:</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {departmentBreakdown.length} แผนก
                          </span>
                        </div>

                        {departmentBreakdown.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">
                            ไม่มีการลาแยกตามแผนกในเดือนนี้
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {departmentBreakdown.slice(0, 2).map((dept) => (
                              <div key={dept.dept} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                  <span className="truncate max-w-[130px]">{dept.dept}</span>
                                  <span className="text-slate-500 font-mono">
                                    {dept.days} วัน ({dept.percentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-rose-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, dept.percentage)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3. ดัชนีความพร้อมบุคลากร */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                            <span>ดัชนีความพร้อมบุคลากร:</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            {monthStats.attendanceRate}%
                          </span>
                        </div>
                        <div className="pt-1 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">พร้อมปฏิบัติงาน:</span>
                            <span className="font-bold text-emerald-700 font-mono">
                              {monthStats.activeEmployees - monthStats.employeeCount} จาก {monthStats.activeEmployees} คน
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">พนักงานที่ลา:</span>
                            <span className="font-bold text-rose-700 font-mono">
                              {monthStats.employeeCount} คน ({monthStats.leaveRate}%)
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* 🌟 GORGEOUS & COMFORTABLE CALENDAR MATRIX (ผังปฏิทิน สบายตา) */}
                    <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0">
                            <CalendarDays className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                              <span>ผังปฏิทินวันหยุดและวันลาประจำเดือน</span>
                              <span className="text-xs font-bold text-rose-700 font-mono bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                {THAI_MONTHS[currentMonth]} {thaiCurrentYear}
                              </span>
                            </h3>
                          </div>
                        </div>

                        {/* Modern Legend Bar with colored pills */}
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>วันหยุดบริษัท</span>
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 font-bold">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>ลาป่วย</span>
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>พักร้อน</span>
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200/80 font-bold">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            <span>ลากิจ</span>
                          </span>
                        </div>
                      </div>

                      {/* Unified Calendar Table: Seamless Weekday Header + Date Grid */}
                      <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-3xs bg-white">
                        {/* Seamless Weekday Header Row */}
                        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90 text-center">
                          {THAI_FULL_WEEKDAYS.map((day, idx) => (
                            <div 
                              key={idx} 
                              className={`py-2.5 text-center text-xs font-black tracking-tight ${
                                idx !== 6 ? 'border-r border-slate-200/60' : ''
                              } ${
                                day.isWeekend 
                                  ? day.short === 'อา.' ? 'bg-rose-50/60 text-rose-600' : 'bg-sky-50/60 text-sky-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              {day.full}
                            </div>
                          ))}
                        </div>

                        {/* Calendar 7 Columns Grid */}
                        <div className="grid grid-cols-7 bg-slate-200/70 gap-[1px]">
                          {calendarCells.map((cell, idx) => {
                            const dayLeaves = cell.isCurrentMonth ? getLeavesForDate(cell.dateString) : [];
                            const isSunday = cell.dayOfWeek === 0;
                            const isSaturday = cell.dayOfWeek === 6;
                            const hasPubHol = dayLeaves.some(h => h.employeeId === 'all' || h.type === 'public_holiday');

                            return (
                              <div
                                key={idx}
                                className={`min-h-[72px] p-2 flex flex-col justify-between transition-colors ${
                                  cell.isCurrentMonth
                                    ? hasPubHol
                                      ? 'bg-emerald-50/50'
                                      : isSunday
                                        ? 'bg-rose-50/20'
                                        : isSaturday
                                          ? 'bg-sky-50/15'
                                          : 'bg-white'
                                    : 'bg-slate-50/60 opacity-30'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={`text-xs font-bold font-mono ${
                                    hasPubHol
                                      ? 'text-emerald-800 font-bold'
                                      : isSunday
                                        ? 'text-rose-600'
                                        : isSaturday
                                          ? 'text-sky-700'
                                          : cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                                  }`}>
                                    {cell.dayNum}
                                  </span>
                                  {hasPubHol && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      วันหยุด
                                    </span>
                                  )}
                                </div>

                                {/* Leaves in cell with clean, readable, eye-pleasing tags */}
                                <div className="space-y-1 overflow-hidden">
                                  {dayLeaves.slice(0, 2).map((hol) => {
                                    const st = LEAVE_TYPE_STYLES[hol.type] || LEAVE_TYPE_STYLES.other;
                                    const emp = getEmployee(hol.employeeId);
                                    const isAll = hol.employeeId === 'all';
                                    const empName = emp?.nickname || emp?.firstName || 'พนักงาน';

                                    if (isAll) {
                                      return (
                                        <div
                                          key={hol.id}
                                          title={hol.title}
                                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-1 leading-tight shadow-3xs truncate"
                                        >
                                          <span className="shrink-0">📢</span>
                                          <span className="truncate">{hol.title}</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={hol.id}
                                        title={`${emp?.firstName} ${emp?.lastName} (${empName}): ${hol.title || st.shortLabel}`}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] border flex items-center gap-1.5 leading-tight shadow-3xs truncate ${st.bgColor} ${st.color} ${st.borderColor}`}
                                      >
                                        <span className="text-[9.5px] shrink-0">{st.emoji}</span>
                                        <span className="font-bold text-slate-900 shrink-0">{empName}</span>
                                        <span className="opacity-40 shrink-0">·</span>
                                        <span className="truncate font-semibold">{st.shortLabel}</span>
                                      </div>
                                    );
                                  })}
                                  {dayLeaves.length > 2 && (
                                    <div className="text-[9px] font-bold text-rose-700 text-center bg-rose-50 py-0.5 rounded-md border border-rose-200/80">
                                      +{dayLeaves.length - 2} รายการเพิ่มเติม
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 📋 สมุดบันทึกรายละเอียดการลาตามวัน (Daily Schedule & Activity Log) */}
                    <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">
                              สมุดบันทึกรายละเอียดการลาตามวัน (Daily Schedule & Activity Log)
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              รายละเอียดการลาและวันหยุดบริษัท เรียงลำดับตามวันที่ตลอดทั้งเดือน
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 font-mono">
                          มีกิจกรรมวันหยุด/วันลา {dailyActivityList.length} วัน ({monthStats.totalDays} วันลา)
                        </span>
                      </div>

                      {dailyActivityList.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
                          ✨ ยอดเยี่ยม! ไม่มีประวัติการลาในเดือนนี้ (อัตราการมาทำงาน 100%)
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {dailyActivityList.map((dayItem) => (
                            <div key={dayItem.dateString} className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3 space-y-2 hover:border-slate-300 hover:bg-slate-50 transition shadow-3xs">
                              <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                                <span className="text-slate-900 font-bold flex items-center gap-2 font-mono text-xs">
                                  <span className={`w-2 h-2 rounded-full ${dayItem.isWeekend ? (dayItem.dayOfWeekShort === 'อา.' ? 'bg-rose-500' : 'bg-sky-500') : 'bg-slate-700'}`} />
                                  {dayItem.dayOfWeekName}ที่ {dayItem.thaiDate}
                                </span>
                                {dayItem.publicHolidays.length > 0 ? (
                                  <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    วันหยุดบริษัท
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                                    {dayItem.employeeLeaves.length} รายการ
                                  </span>
                                )}
                              </div>

                              {/* Company Public Holidays */}
                              {dayItem.publicHolidays.map(ph => (
                                <div key={ph.id} className="flex items-center gap-2 text-xs text-emerald-950 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                  <span>📢</span>
                                  <span>{ph.title} (หยุดทำการทั้งบริษัท)</span>
                                </div>
                              ))}

                              {/* Employee Leaves */}
                              <div className="space-y-1.5">
                                {dayItem.employeeLeaves.map((l) => {
                                  const st = LEAVE_TYPE_STYLES[l.type] || LEAVE_TYPE_STYLES.other;
                                  return (
                                    <div key={l.id} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200/80 rounded-xl text-xs">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-[10px] shrink-0">
                                          {l.emp?.firstName?.slice(0, 1) || 'พ'}
                                        </span>
                                        <div className="truncate">
                                          <span className="font-bold text-slate-900 text-xs block truncate leading-tight">
                                            {l.emp?.firstName} {l.emp?.lastName} {l.emp?.nickname ? `(${l.emp.nickname})` : ''}
                                          </span>
                                          <span className="text-[10.5px] text-slate-500 block truncate">
                                            {l.emp?.department} • เหตุผล: <strong className="text-slate-800 font-semibold">{l.title || 'ตามสิทธิ์'}</strong>
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${st.bgColor} ${st.color} ${st.borderColor}`}>
                                        {st.emoji} {st.shortLabel} ({l.durationDays} วัน)
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Authorization & Signature Block */}
                    <div className="pt-3 border-t-2 border-slate-200 grid grid-cols-2 gap-6 text-center text-xs">
                      <div className="space-y-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ผู้จัดทำรายงาน (HR OFFICER)</span>
                        <div className="pt-6 border-b border-slate-400 w-2/3 mx-auto"></div>
                        <p className="font-bold text-slate-800">( เจ้าหน้าที่ฝ่ายทรัพยากรบุคคล )</p>
                        <p className="text-[9.5px] text-slate-400">วันที่: {todayFormatted}</p>
                      </div>
                      <div className="space-y-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ผู้ตรวจสอบและอนุมัติ (MANAGEMENT)</span>
                        <div className="pt-6 border-b border-slate-400 w-2/3 mx-auto"></div>
                        <p className="font-bold text-slate-800">( กรรมการผู้จัดการ / ผู้มีอำนาจลงนาม )</p>
                        <p className="text-[9.5px] text-slate-400">วันที่: ..... / ..... / ..........</p>
                      </div>
                    </div>

                    {/* Document Footer (Full Bleed) */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-200 font-mono">
                      <span>ระบบบริหารวันหยุดพนักงาน • {companyName}</span>
                      <span>INTERNAL USE ONLY • CONFIDENTIAL REPORT • หน้า 1/1</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-900 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              สร้างภาพ JPG แบบ Full Bleed ขอบชนขอบ 100% ไม่มีช่องว่างสีขาว ยอดวันลา สิทธิ์คงเหลือครบถ้วน
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={handleDownloadJPG}
              disabled={isExporting}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-950 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดภาพ JPG ทันที</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
