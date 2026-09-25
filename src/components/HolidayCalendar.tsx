/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { toJpeg } from 'html-to-image';
import { Employee, HolidayLeave, HolidayType } from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Search,
  Filter, 
  Info, 
  Clock, 
  ChevronDown,
  User,
  Users,
  X,
  CalendarDays,
  FileText,
  Image,
  ListFilter,
  CheckCircle2,
  Building,
  Sparkles,
  Eye,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDaysBetween } from '../utils/storage';

interface HolidayCalendarProps {
  employees: Employee[];
  holidays: HolidayLeave[];
  onHolidaysChange: (updatedList: HolidayLeave[]) => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_SHORT_WEEKDAYS = [
  { short: 'อา', full: 'อาทิตย์', isWeekend: true, color: 'text-rose-600', bg: 'bg-rose-50/30' },
  { short: 'จ', full: 'จันทร์', isWeekend: false, color: 'text-slate-700', bg: 'bg-white' },
  { short: 'อ', full: 'อังคาร', isWeekend: false, color: 'text-slate-700', bg: 'bg-white' },
  { short: 'พ', full: 'พุธ', isWeekend: false, color: 'text-slate-700', bg: 'bg-white' },
  { short: 'พฤ', full: 'พฤหัสบดี', isWeekend: false, color: 'text-slate-700', bg: 'bg-white' },
  { short: 'ศ', full: 'ศุกร์', isWeekend: false, color: 'text-slate-700', bg: 'bg-white' },
  { short: 'ส', full: 'เสาร์', isWeekend: true, color: 'text-sky-600', bg: 'bg-sky-50/20' }
];

const LEAVE_TYPES: { 
  type: HolidayType; 
  label: string; 
  shortLabel: string;
  emoji: string;
  color: string; 
  bgColor: string; 
  borderColor: string;
  dotColor: string;
}[] = [
  { type: 'vacation', label: 'ลาพักร้อน', shortLabel: 'พักร้อน', emoji: '🏖️', color: 'text-amber-800', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', dotColor: 'bg-amber-400' },
  { type: 'sick', label: 'ลาป่วย', shortLabel: 'ลาป่วย', emoji: '🤒', color: 'text-rose-800', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', dotColor: 'bg-rose-500' },
  { type: 'personal', label: 'ลากิจ', shortLabel: 'ลากิจ', emoji: '💼', color: 'text-sky-800', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', dotColor: 'bg-sky-400' },
  { type: 'public_holiday', label: 'วันหยุดนักขัตฤกษ์/บริษัท', shortLabel: 'หยุดบริษัท', emoji: '📢', color: 'text-emerald-800', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', dotColor: 'bg-emerald-500' },
  { type: 'special_leave', label: 'วันลาหยุดพิเศษ', shortLabel: 'หยุดพิเศษ', emoji: '✨', color: 'text-fuchsia-800', bgColor: 'bg-fuchsia-50', borderColor: 'border-fuchsia-200', dotColor: 'bg-fuchsia-400' },
  { type: 'other', label: 'ลาประเภทอื่น', shortLabel: 'อื่นๆ', emoji: '📌', color: 'text-purple-800', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', dotColor: 'bg-purple-400' }
];

export default function HolidayCalendar({ employees, holidays, onHolidaysChange }: HolidayCalendarProps) {
  const simulatedToday = new Date();
  
  const [currentYear, setCurrentYear] = useState(simulatedToday.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(simulatedToday.getMonth()); // 0-indexed
  
  // Views: 'grid' (ตารางปฏิทิน), 'agenda' (ไทม์ไลน์รายวัน), 'employee' (สรุปแยกตามคน)
  const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'employee'>('grid');
  
  // Filter states
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected date for day inspector
  const [selectedDate, setSelectedDate] = useState<string>(simulatedToday.toISOString().split('T')[0]);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  
  // State for Add Holiday modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formType, setFormType] = useState<HolidayType>('vacation');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Detail inspected leave
  const [inspectedLeave, setInspectedLeave] = useState<HolidayLeave | null>(null);

  // Export to JPG status
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleExportJPG = async () => {
    if (!calendarRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      const dataUrl = await toJpeg(calendarRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          borderRadius: '16px',
        }
      });
      
      const link = document.createElement('a');
      link.download = `ตารางวันหยุด_${THAI_MONTHS[currentMonth]}_${currentYear + 543}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating JPG image context:', err);
      alert('ไม่สามารถดาวน์โหลดเป็นภาพ JPG ได้ในขณะนี้ โปรดลองอีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Build grid dates for current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);

  // Generate date entries on calendar
  const calendarCells = useMemo(() => {
    const cells: { dateString: string; dayNum: number; isCurrentMonth: boolean; dayOfWeek: number }[] = [];

    // Previous month padding cells
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
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

    // Next month padding cells (fill up to standard 35 or 42 cells)
    const targetLength = cells.length > 35 ? 42 : 35;
    const cellsRemaining = targetLength - cells.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let i = 1; i <= cellsRemaining; i++) {
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
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex]);

  // Helper info for employees & leaves
  const getEmployee = (id: string): Employee | undefined => {
    return employees.find(e => e.id === id);
  };

  const getEmployeeName = (id: string) => {
    if (id === 'all') return 'ทุกคนในบริษัท (วันหยุดบริษัท)';
    const emp = getEmployee(id);
    if (!emp) return 'ไม่พบข้อมูลพนักงาน';
    return `${emp.firstName} ${emp.lastName} ${emp.nickname ? `(${emp.nickname})` : ''}`;
  };

  const getLeaveTypeDetails = (type: HolidayType) => {
    return LEAVE_TYPES.find(t => t.type === type) || LEAVE_TYPES[0];
  };

  // Check if holiday matches active search and filters
  const matchesFilter = (hol: HolidayLeave) => {
    if (selectedEmployeeFilter !== 'all' && hol.employeeId !== 'all' && hol.employeeId !== selectedEmployeeFilter) {
      return false;
    }
    if (selectedTypeFilter !== 'all' && hol.type !== selectedTypeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const emp = getEmployee(hol.employeeId);
      const titleMatch = hol.title.toLowerCase().includes(q);
      const noteMatch = (hol.notes || '').toLowerCase().includes(q);
      const empNameMatch = emp ? `${emp.firstName} ${emp.lastName} ${emp.nickname || ''} ${emp.position}`.toLowerCase().includes(q) : false;
      const isAllMatch = hol.employeeId === 'all' && ('ทุกคนในบริษัท วันหยุดบริษัท'.toLowerCase().includes(q));
      if (!titleMatch && !noteMatch && !empNameMatch && !isAllMatch) {
        return false;
      }
    }
    return true;
  };

  // Check if holiday is active on a date
  const getHolidaysForDate = (dateStr: string) => {
    return holidays.filter(hol => {
      const cellDate = new Date(dateStr);
      const start = new Date(hol.startDate);
      const end = new Date(hol.endDate);
      const isOverlapping = cellDate >= start && cellDate <= end;
      if (!isOverlapping) return false;
      return matchesFilter(hol);
    });
  };

  // Sorted list of leaves overlapping this current month
  const currentMonthHolidaysList = useMemo(() => {
    const curMonthStart = new Date(currentYear, currentMonth, 1);
    const curMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    return holidays.filter(hol => {
      const start = new Date(hol.startDate);
      const end = new Date(hol.endDate);
      const isOverlapCurMonth = (start <= curMonthEnd && end >= curMonthStart);
      if (!isOverlapCurMonth) return false;
      return matchesFilter(hol);
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [holidays, currentYear, currentMonth, selectedEmployeeFilter, selectedTypeFilter, searchQuery, employees]);

  // Grouped by date for the Agenda / Timeline View
  const agendaDatesList = useMemo(() => {
    const datesMap = new Map<string, HolidayLeave[]>();
    
    // Scan all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateString = `${currentYear}-${mStr}-${dStr}`;
      const activeHols = getHolidaysForDate(dateString);
      if (activeHols.length > 0) {
        datesMap.set(dateString, activeHols);
      }
    }

    return Array.from(datesMap.entries()).map(([dateString, leaves]) => ({
      dateString,
      leaves
    }));
  }, [daysInMonth, currentYear, currentMonth, holidays, selectedEmployeeFilter, selectedTypeFilter, searchQuery]);

  // Statistics summary for current month
  const monthStats = useMemo(() => {
    const companyHolidaysCount = currentMonthHolidaysList.filter(h => h.employeeId === 'all').length;
    const employeeLeaves = currentMonthHolidaysList.filter(h => h.employeeId !== 'all');
    const totalLeaveDays = employeeLeaves.reduce((sum, h) => sum + h.durationDays, 0);
    const uniqueEmployeesOnLeave = new Set(employeeLeaves.map(h => h.employeeId)).size;
    return {
      companyHolidaysCount,
      employeeLeavesCount: employeeLeaves.length,
      totalLeaveDays,
      uniqueEmployeesOnLeave
    };
  }, [currentMonthHolidaysList]);

  const handleOpenAddForm = (preFilledDate?: string) => {
    setFormEmployeeId(employees[0]?.id || 'all');
    setFormStartDate(preFilledDate || simulatedToday.toISOString().split('T')[0]);
    setFormEndDate(preFilledDate || simulatedToday.toISOString().split('T')[0]);
    setFormType('vacation');
    setFormTitle('');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStartDate || !formEndDate || !formTitle) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (new Date(formStartDate) > new Date(formEndDate)) {
      alert('วันที่สิ้นสุดต้องไม่เกิดขึ้นก่อนวันที่เริ่มต้น');
      return;
    }

    const durationDays = calculateDaysBetween(formStartDate, formEndDate);

    const newHoliday: HolidayLeave = {
      id: `hol-${Date.now()}`,
      employeeId: formEmployeeId,
      startDate: formStartDate,
      endDate: formEndDate,
      type: formType,
      title: formTitle,
      notes: formNotes || undefined,
      durationDays
    };

    onHolidaysChange([...holidays, newHoliday]);
    setIsFormOpen(false);
  };

  const handleDeleteHoliday = (id: string) => {
    if (confirm('คุณแน่ใจว่าต้องการลบบันทึกวันหยุด/วันลานี้?')) {
      onHolidaysChange(holidays.filter(h => h.id !== id));
      setInspectedLeave(null);
    }
  };

  const selectedDateLeaves = getHolidaysForDate(selectedDate);
  const selectedDateObj = new Date(selectedDate);
  const todayStr = new Date().toLocaleDateString('en-CA');

  return (
    <div className="space-y-5">
      {/* 🧭 Top Banner & Action Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-3xs border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-rose-200">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                ตารางลงวันหยุดและวันลาพนักงาน
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ตรวจสอบและวางแผนวันหยุด วันลาพักร้อน ป่วย กิจ พร้อมระบบส่งออกภาพ .jpg
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleJumpToToday}
            className="px-3 py-2 border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-300 bg-white hover:bg-rose-50 text-xs font-bold rounded-xl transition cursor-pointer min-h-[40px] flex items-center gap-1.5"
            title="ข้ามไปยังเดือนปัจจุบัน"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>เดือนนี้</span>
          </button>

          <button
            onClick={handleExportJPG}
            disabled={isExporting}
            className="inline-flex items-center justify-center px-3.5 py-2 border border-amber-300 text-amber-800 hover:bg-amber-100 bg-amber-50 disabled:opacity-50 text-xs font-bold rounded-xl transition cursor-pointer min-h-[40px] shadow-3xs"
            title="บันทึกภาพตารางปฏิทินเพื่อส่งต่อทาง LINE หรือพิมพ์เอกสาร"
          >
            <Image className="w-4 h-4 mr-1.5 text-amber-600" />
            {isExporting ? 'กำลังบันทึกภาพ...' : 'ส่งออกเป็นภาพ (.jpg)'}
          </button>

          <button
            onClick={() => handleOpenAddForm(selectedDate)}
            className="inline-flex items-center justify-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs hover:shadow-md cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            ยื่นใบลา / บันทึกวันหยุด
          </button>
        </div>
      </div>

      {/* 📊 Month Quick Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Building className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase">วันหยุดบริษัท</span>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {monthStats.companyHolidaysCount} <span className="text-xs font-medium text-slate-400">วัน</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase">คนลาในเดือนนี้</span>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {monthStats.uniqueEmployeesOnLeave} <span className="text-xs font-medium text-slate-400">คน</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase">วันลารวมทั้งหมด</span>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {monthStats.totalLeaveDays} <span className="text-xs font-medium text-slate-400">วัน</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase">จำนวนครั้งที่ลา</span>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {monthStats.employeeLeavesCount} <span className="text-xs font-medium text-slate-400">รายการ</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🎛️ Navigation & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3">
        {/* Row 1: Month/Year Nav + View Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {/* Month / Year Navigator */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-slate-600 hover:text-slate-950 cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Quick Month Selector */}
            <div className="relative">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-rose-500"
              >
                {THAI_MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Year Selector */}
            <div className="relative">
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-rose-500"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                  <option key={y} value={y}>พ.ศ. {y + 543} ({y})</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-slate-600 hover:text-slate-950 cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher (Grid vs Agenda vs Employee) */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto w-full sm:w-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-rose-600 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>ตารางปฏิทิน</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-rose-600 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>ไทม์ไลน์รายวัน ({agendaDatesList.length})</span>
            </button>

            <button
              onClick={() => setViewMode('employee')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'employee'
                  ? 'bg-white text-rose-600 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>แยกตามคน ({employees.length})</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search & Quick Type Filter Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อพนักงาน, ชื่อเล่น, หรือประเภทการลา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedEmployeeFilter}
                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none appearance-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">พนักงานทุกคน</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.nickname ? `(${emp.nickname})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Leave Type Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedTypeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-3xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({currentMonthHolidaysList.length})
            </button>
            {LEAVE_TYPES.map(t => {
              const count = currentMonthHolidaysList.filter(h => h.type === t.type).length;
              const isActive = selectedTypeFilter === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => setSelectedTypeFilter(isActive ? 'all' : t.type)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer border ${
                    isActive 
                      ? `${t.bgColor} ${t.color} ${t.borderColor} ring-1 ring-offset-1 ring-slate-300 font-black` 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.shortLabel}</span>
                  {count > 0 && (
                    <span className="text-[10px] px-1 rounded-full bg-black/5 font-mono">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📅 VIEW 1: MONTH CALENDAR GRID (Full-Width, High Clarity, No Cramping) */}
      {viewMode === 'grid' && (
        <div ref={calendarRef} className="bg-white p-3 sm:p-6 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4">
          
          {/* Header Banner for Export / Print */}
          {isExporting && (
            <div className="border-b-2 border-rose-600 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900">บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด</h3>
                <p className="text-xs text-slate-500 font-bold">
                  ตารางสรุปวันหยุดและวันลาพนักงาน ประจำเดือน{THAI_MONTHS[currentMonth]} {currentYear + 543}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-rose-600 block">เอกสารฝ่ายบุคคล (HR)</span>
                <span className="text-[10px] text-slate-400">ออกเมื่อ: {new Date().toLocaleDateString('th-TH')}</span>
              </div>
            </div>
          )}

          {/* Thai Week Days Row (Sunday to Saturday) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {THAI_SHORT_WEEKDAYS.map((day) => (
              <div 
                key={day.short} 
                className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-black border border-slate-100 ${
                  day.isWeekend 
                    ? day.color === 'text-rose-600' ? 'bg-rose-50/70 text-rose-600' : 'bg-sky-50/70 text-sky-600'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span className="hidden sm:inline">{day.full}</span>
                <span className="sm:hidden">{day.short}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              const activeHols = getHolidaysForDate(cell.dateString);
              const isToday = cell.dateString === todayStr;
              const isSelected = cell.dateString === selectedDate;
              const isSunday = cell.dayOfWeek === 0;
              const isSaturday = cell.dayOfWeek === 6;

              return (
                <div
                  key={`${cell.dateString}-${idx}`}
                  onClick={() => {
                    setSelectedDate(cell.dateString);
                    if (window.innerWidth < 768 || activeHols.length > 0) {
                      setIsDayDetailModalOpen(true);
                    }
                  }}
                  className={`min-h-[75px] sm:min-h-[110px] md:min-h-[125px] p-1 sm:p-2 border transition-all duration-150 relative cursor-pointer rounded-xl sm:rounded-2xl flex flex-col justify-between group ${
                    cell.isCurrentMonth
                      ? isSunday
                        ? 'bg-rose-50/20 border-rose-100/70 hover:border-rose-400'
                        : isSaturday
                          ? 'bg-sky-50/15 border-sky-100/70 hover:border-sky-400'
                          : 'bg-white border-slate-200/90 hover:border-rose-300 hover:shadow-xs'
                      : 'bg-slate-50/40 border-slate-150/40 opacity-40'
                  } ${
                    isToday ? 'ring-2 ring-rose-500 bg-rose-50/30' : ''
                  } ${
                    isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/25 z-10' : ''
                  }`}
                >
                  {/* Top Bar: Day Number + Add Button */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-[11px] sm:text-xs md:text-sm font-black font-mono w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                      isToday 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : isSelected
                          ? 'bg-emerald-600 text-white'
                          : cell.isCurrentMonth 
                            ? isSunday ? 'text-rose-600' : isSaturday ? 'text-sky-600' : 'text-slate-800'
                            : 'text-slate-400'
                    }`}>
                      {cell.dayNum}
                    </span>

                    {/* Quick + Button on Desktop Hover */}
                    {!isExporting && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(cell.dateString);
                          handleOpenAddForm(cell.dateString);
                        }}
                        className="hidden md:flex items-center justify-center w-5 h-5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                        title="ยื่นใบลาสำหรับวันนี้"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Desktop Leaves Listing (Clean pill tags, NO break-all, readable Thai text) */}
                  <div className="hidden sm:block flex-1 space-y-1 overflow-hidden">
                    {activeHols.slice(0, 3).map(hol => {
                      const typeDet = getLeaveTypeDetails(hol.type);
                      const emp = getEmployee(hol.employeeId);
                      const isAll = hol.employeeId === 'all';
                      
                      const labelText = isAll 
                        ? hol.title 
                        : emp 
                          ? `${emp.nickname || emp.firstName}: ${typeDet.shortLabel}`
                          : hol.title;

                      return (
                        <div
                          key={hol.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedLeave(hol);
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] md:text-[10.5px] font-bold border truncate shadow-3xs flex items-center gap-1 cursor-pointer hover:brightness-95 transition ${typeDet.bgColor} ${typeDet.color} ${typeDet.borderColor}`}
                          title={`${getEmployeeName(hol.employeeId)}: ${hol.title}`}
                        >
                          <span className="text-[10px] shrink-0">{typeDet.emoji}</span>
                          <span className="truncate">{labelText}</span>
                        </div>
                      );
                    })}

                    {activeHols.length > 3 && (
                      <div className="text-[9.5px] font-bold text-rose-600 text-center py-0.5 bg-rose-50/80 rounded-md border border-rose-100">
                        +{activeHols.length - 3} รายการเพิ่มเติม
                      </div>
                    )}
                  </div>

                  {/* Mobile Leaves Indicator: Colored dots + count (Tapping opens instant Day Inspector) */}
                  <div className="sm:hidden flex flex-col gap-0.5 mt-auto w-full items-center">
                    {activeHols.length > 0 && (
                      <div className="flex items-center justify-center gap-1 flex-wrap max-w-full">
                        {activeHols.slice(0, 3).map(hol => {
                          const typeDet = getLeaveTypeDetails(hol.type);
                          return (
                            <span
                              key={hol.id}
                              className={`w-2 h-2 rounded-full ${typeDet.dotColor} ring-1 ring-white shrink-0`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {activeHols.length > 0 && (
                      <span className="text-[8.5px] font-black text-slate-700 bg-slate-100 px-1 rounded-sm mt-0.5">
                        {activeHols.length} รายการ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Indicators Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
            <span className="text-slate-400 font-bold">สัญลักษณ์:</span>
            {LEAVE_TYPES.map(t => (
              <span key={t.type} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-md border ${t.bgColor} ${t.borderColor}`} />
                <span className="text-xs">{t.emoji} {t.label}</span>
              </span>
            ))}
          </div>

          {/* Bottom Selected Date Banner for Desktop */}
          <div className="hidden md:flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-slate-700">วันที่เลือก:</span>
              <span className="text-xs font-black text-slate-900 font-sans">
                {selectedDateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md ml-2">
                {selectedDateLeaves.length} รายการ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDayDetailModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>เปิดดูรายละเอียดของวันนี้</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddForm(selectedDate)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>บันทึกวันหยุดวันนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 VIEW 2: AGENDA TIMELINE (Grouped by Date in Chronological Order) */}
      {viewMode === 'agenda' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-rose-600" />
                กำหนดการวันหยุดและวันลาประจำเดือน{THAI_MONTHS[currentMonth]} {currentYear + 543}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                เรียงลำดับตามวันที่ เพื่อให้ตรวจสอบผู้อยู่ปฏิบัติงานได้สะดวกที่สุด
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              พบ {agendaDatesList.length} วันที่มีการลา
            </span>
          </div>

          {agendaDatesList.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">ไม่มีข้อมูลวันหยุดหรือการลาตามเงื่อนไขที่เลือก</p>
              <p className="text-xs text-slate-400">พนักงานทุกคนปฏิบัติงานตามปกติในเดือนนี้</p>
              <button
                type="button"
                onClick={() => handleOpenAddForm()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 px-4 py-2 rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                ยื่นใบลา / บันทึกวันหยุด
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {agendaDatesList.map(({ dateString, leaves }) => {
                const dateObj = new Date(dateString);
                const isSun = dateObj.getDay() === 0;
                const isSat = dateObj.getDay() === 6;
                const isTodayDate = dateString === todayStr;

                return (
                  <div key={dateString} className="border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 bg-white shadow-3xs space-y-3">
                    {/* Date Header Pill */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                          isTodayDate 
                            ? 'bg-rose-600 text-white shadow-xs' 
                            : isSun 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : isSat 
                                ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                                : 'bg-slate-100 text-slate-800'
                        }`}>
                          {dateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </span>
                        {isTodayDate && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            วันนี้
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-bold text-slate-500">
                        {leaves.length} คน/รายการ
                      </span>
                    </div>

                    {/* Leaves cards under this date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {leaves.map(hol => {
                        const typeDet = getLeaveTypeDetails(hol.type);
                        const emp = getEmployee(hol.employeeId);
                        const isAll = hol.employeeId === 'all';

                        return (
                          <div
                            key={hol.id}
                            onClick={() => setInspectedLeave(hol)}
                            className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-rose-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold shrink-0 shadow-3xs">
                                  {typeDet.emoji}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-900 block truncate">
                                    {isAll ? '📢 ทุกคนในบริษัท (วันหยุดบริษัท)' : emp ? `${emp.firstName} ${emp.lastName} ${emp.nickname ? `(${emp.nickname})` : ''}` : 'พนักงาน'}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium block truncate">
                                    {hol.title} {emp?.department ? `• แผนก ${emp.department}` : ''}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${typeDet.bgColor} ${typeDet.color} ${typeDet.borderColor}`}>
                                {typeDet.label}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-150/60 font-sans">
                              <span>
                                รวม {hol.durationDays} วัน ({new Date(hol.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                {hol.startDate !== hol.endDate ? ` - ${new Date(hol.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}` : ''})
                              </span>
                              {hol.notes && (
                                <span className="text-slate-400 truncate max-w-[140px]" title={hol.notes}>
                                  หมายเหตุ: {hol.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 👥 VIEW 3: BY EMPLOYEE MATRIX / SUMMARY */}
      {viewMode === 'employee' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-600" />
                สรุปประวัติวันลาแยกตามรายชื่อพนักงาน
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ตรวจสอบการลาของพนักงานแต่ละคนในเดือน{THAI_MONTHS[currentMonth]} {currentYear + 543}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              พนักงานทั้งหมด {employees.length} คน
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map(emp => {
              const empLeaves = currentMonthHolidaysList.filter(h => h.employeeId === emp.id);
              const totalDays = empLeaves.reduce((sum, h) => sum + h.durationDays, 0);

              return (
                <div key={emp.id} className="p-4 bg-slate-50/60 border border-slate-200/90 rounded-2xl space-y-3 shadow-3xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 font-black text-sm flex items-center justify-center shrink-0 shadow-3xs">
                          {emp.firstName.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {emp.firstName} {emp.lastName} {emp.nickname ? `(${emp.nickname})` : ''}
                          </span>
                          <span className="text-[10.5px] text-slate-400 block truncate">
                            {emp.employeeCode} • {emp.position}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                        totalDays > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {totalDays > 0 ? `ลา ${totalDays} วัน` : 'ไม่ลา'}
                      </span>
                    </div>

                    {/* Leaves list for this employee */}
                    <div className="mt-3 space-y-1.5">
                      {empLeaves.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic bg-white p-2 rounded-xl border border-slate-150 text-center">
                          ไม่มีการลาในเดือนนี้
                        </p>
                      ) : (
                        empLeaves.map(hol => {
                          const typeDet = getLeaveTypeDetails(hol.type);
                          return (
                            <div
                              key={hol.id}
                              onClick={() => setInspectedLeave(hol)}
                              className="p-2 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center gap-2 cursor-pointer hover:border-rose-300 transition"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 block truncate text-[11px]">
                                  {typeDet.emoji} {hol.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {new Date(hol.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                  {hol.startDate !== hol.endDate ? ` - ${new Date(hol.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}` : ''}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-rose-600 shrink-0">
                                {hol.durationDays} วัน
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFormEmployeeId(emp.id);
                      setFormStartDate(selectedDate);
                      setFormEndDate(selectedDate);
                      setFormType('vacation');
                      setFormTitle('');
                      setFormNotes('');
                      setIsFormOpen(true);
                    }}
                    className="w-full py-1.5 px-2 bg-white hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-600" />
                    <span>ยื่นใบลาให้ {emp.nickname || emp.firstName}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🔍 MODAL 1: DAY DETAILS INSPECTOR (Instant popover for any clicked day) */}
      <AnimatePresence>
        {isDayDetailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {selectedDateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      รายการผู้ที่ลาและวันหยุดในวันนี้ ({selectedDateLeaves.length} รายการ)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDayDetailModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
                {selectedDateLeaves.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">ไม่มีการลาหรือวันหยุดในวันนี้</p>
                    <p className="text-[11px] text-slate-400">พนักงานทุกคนปฏิบัติงานตามตารางปกติ</p>
                  </div>
                ) : (
                  selectedDateLeaves.map(hol => {
                    const typeDet = getLeaveTypeDetails(hol.type);
                    const emp = getEmployee(hol.employeeId);
                    const isAll = hol.employeeId === 'all';

                    return (
                      <div
                        key={hol.id}
                        className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 shadow-3xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{typeDet.emoji}</span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {isAll ? '📢 ทุกคนในบริษัท (วันหยุดบริษัท)' : emp ? `${emp.firstName} ${emp.lastName} ${emp.nickname ? `(${emp.nickname})` : ''}` : 'พนักงาน'}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium block truncate">
                                {hol.title} {emp?.department ? `• ${emp.department}` : ''}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${typeDet.bgColor} ${typeDet.color} ${typeDet.borderColor}`}>
                            {typeDet.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200/60">
                          <span>ระยะเวลา: <strong className="text-rose-600">{hol.durationDays} วัน</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDayDetailModalOpen(false);
                              handleDeleteHoliday(hol.id);
                            }}
                            className="text-red-500 hover:text-red-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>ลบรายการ</span>
                          </button>
                        </div>

                        {hol.notes && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 font-sans">
                            {hol.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setIsDayDetailModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDayDetailModalOpen(false);
                    handleOpenAddForm(selectedDate);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกวันหยุด/ลาของวันนี้</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔍 MODAL 2: INSPECTED LEAVE DETAIL CARD */}
      <AnimatePresence>
        {inspectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden relative"
            >
              <div className={`h-2 ${getLeaveTypeDetails(inspectedLeave.type).bgColor}`} />

              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getLeaveTypeDetails(inspectedLeave.type).bgColor} ${getLeaveTypeDetails(inspectedLeave.type).color} ${getLeaveTypeDetails(inspectedLeave.type).borderColor}`}>
                    {getLeaveTypeDetails(inspectedLeave.type).emoji} {getLeaveTypeDetails(inspectedLeave.type).label}
                  </span>
                  <button 
                    onClick={() => setInspectedLeave(null)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-base leading-snug">
                    {inspectedLeave.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {getEmployeeName(inspectedLeave.employeeId)}
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ช่วงวันที่:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(inspectedLeave.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      {' - '}
                      {new Date(inspectedLeave.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">จำนวนวันหยุด:</span>
                    <span className="font-black text-rose-600 text-sm">
                      {inspectedLeave.durationDays} วัน
                    </span>
                  </div>

                  {inspectedLeave.notes && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-slate-400 block mb-1">เหตุผล/หมายเหตุ:</span>
                      <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-150">
                        {inspectedLeave.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => handleDeleteHoliday(inspectedLeave.id)}
                    className="inline-flex items-center text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    ลบวันลา/วันหยุด
                  </button>
                  <button
                    onClick={() => setInspectedLeave(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📝 MODAL 3: ADD LEAVE / RECORD HOLIDAY FORM */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-slate-900 text-base">
                    บันทึกการลา / เพิ่มวันหยุด
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHoliday} className="p-5 space-y-4 text-xs font-sans">
                {/* Employee Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ผู้ลาพัก / บุคลากร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  >
                    <option value="all">📢 ทุกคนในบริษัท (วันหยุดนักขัตฤกษ์ / วันหยุดบริษัท)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} {emp.nickname ? `(${emp.nickname})` : ''} - {emp.position}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Leave Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ประเภทการหยุด <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LEAVE_TYPES.map(t => (
                      <label
                        key={t.type}
                        className={`p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer transition ${
                          formType === t.type 
                            ? `${t.bgColor} ${t.color} ${t.borderColor} ring-1 ring-offset-1 ring-slate-300 font-black` 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="leaveType"
                          value={t.type}
                          checked={formType === t.type}
                          onChange={() => setFormType(t.type)}
                          className="sr-only"
                        />
                        <span>{t.emoji}</span>
                        <span className="truncate">{t.shortLabel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dates Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      วันที่เริ่มต้น <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      วันที่สิ้นสุด <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      required
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    หัวข้อ / ชื่องานลา <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ลาพักผ่อนประจำปี, ลาป่วยมีใบรับรองแพทย์, วันปีใหม่"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    เหตุผล / หมายเหตุเพิ่มเติม (ถ้ามี)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ระบุเหตุผลหรือรายละเอียดการติดต่อฉุกเฉิน..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
