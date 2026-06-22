/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { toJpeg } from 'html-to-image';
import { Employee, HolidayLeave, HolidayType } from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Filter, 
  Info, 
  Clock, 
  AlertCircle, 
  ChevronDown,
  User,
  X,
  MapPin,
  CalendarDays,
  FileText,
  Image
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

const THAI_SHORT_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const LEAVE_TYPES: { type: HolidayType; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { type: 'vacation', label: 'ลาพักร้อน', color: 'text-amber-800', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
  { type: 'sick', label: 'ลาป่วย', color: 'text-rose-800', bgColor: 'bg-rose-100', borderColor: 'border-rose-300' },
  { type: 'personal', label: 'ลากิจ', color: 'text-sky-800', bgColor: 'bg-sky-100', borderColor: 'border-sky-300' },
  { type: 'public_holiday', label: 'วันหยุดนักขัตฤกษ์', color: 'text-emerald-800', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
  { type: 'other', label: 'ลาประเภทอื่น', color: 'text-purple-800', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' }
];

export default function HolidayCalendar({ employees, holidays, onHolidaysChange }: HolidayCalendarProps) {
  // Use current local date simulation: June 20, 2026
  const simulatedToday = new Date('2026-06-20');
  
  const [currentYear, setCurrentYear] = useState(simulatedToday.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(simulatedToday.getMonth()); // 0-indexed (5 for June)
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  // State for Add Holiday modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formType, setFormType] = useState<HolidayType>('vacation');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Info card active state (to inspect leave details)
  const [inspectedLeave, setInspectedLeave] = useState<HolidayLeave | null>(null);

  // Export to JPG status
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleExportJPG = async () => {
    if (!calendarRef.current) return;
    setIsExporting(true);
    try {
      // Ensure element renders cleanly before snapshot is captured
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toJpeg(calendarRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Increases the resolution/density 3x for crystal clear printing
        backgroundColor: '#ffffff', // Ensures white BG in case page is transparent
        style: {
          transform: 'scale(1)',
          borderRadius: '16px', // Matches 2xl border-radius visually
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

  // Helper: jump to simulated today's month
  const handleJumpToToday = () => {
    setCurrentYear(simulatedToday.getFullYear());
    setCurrentMonth(simulatedToday.getMonth());
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
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday ...
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);

  // Generate date entries on calendar
  const calendarCells: { dateString: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month padding cells
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dNum = daysInPrevMonth - i;
    const mStr = String(prevMonth + 1).padStart(2, '0');
    const dStr = String(dNum).padStart(2, '0');
    calendarCells.push({
      dateString: `${prevYear}-${mStr}-${dStr}`,
      dayNum: dNum,
      isCurrentMonth: false
    });
  }

  // Current month cells
  for (let i = 1; i <= daysInMonth; i++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    calendarCells.push({
      dateString: `${currentYear}-${mStr}-${dStr}`,
      dayNum: i,
      isCurrentMonth: true
    });
  }

  // Next month padding cells
  const cellsRemaining = 42 - calendarCells.length; // standard 6-row layout
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= cellsRemaining; i++) {
    const mStr = String(nextMonth + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    calendarCells.push({
      dateString: `${nextYear}-${mStr}-${dStr}`,
      dayNum: i,
      isCurrentMonth: false
    });
  }

  // Check if holiday is active on a date
  const getHolidaysForDate = (dateStr: string) => {
    return holidays.filter(hol => {
      // Basic overlap lookup
      const cellDate = new Date(dateStr);
      const start = new Date(hol.startDate);
      const end = new Date(hol.endDate);
      const isOverlapping = cellDate >= start && cellDate <= end;

      if (!isOverlapping) return false;

      // Filter by Employee configuration
      if (selectedEmployeeFilter !== 'all' && hol.employeeId !== 'all' && hol.employeeId !== selectedEmployeeFilter) {
        return false;
      }
      // Filter by type
      if (selectedTypeFilter !== 'all' && hol.type !== selectedTypeFilter) {
        return false;
      }

      return true;
    });
  };

  const handleOpenAddForm = (preFilledDate?: string) => {
    setFormEmployeeId(employees[0]?.id || '');
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
      alert('กรุณารอกข้อมูลให้ครบถ้วน');
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
    if (confirm('คุณแน่ใจว่าต้องการลบ บันทึกวันหยุด/วันลานี้?')) {
      onHolidaysChange(holidays.filter(h => h.id !== id));
      setInspectedLeave(null);
    }
  };

  // Find info helper for leaves
  const getEmployeeName = (id: string) => {
    if (id === 'all') return 'ทุกคนในบริษัท (วันหยุดบริษัท)';
    const emp = employees.find(e => e.id === id);
    if (!emp) return 'ไม่พบข้อมูลพนักงาน';
    return `${emp.firstName} ${emp.lastName} (${emp.nickname || emp.position})`;
  };

  const getLeaveTypeDetails = (type: HolidayType) => {
    return LEAVE_TYPES.find(t => t.type === type) || {
      label: 'ทั่วไป',
      color: 'text-gray-800',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300'
    };
  };

  // List of leaves filter
  const currentMonthHolidaysList = holidays.filter(hol => {
    const start = new Date(hol.startDate);
    const end = new Date(hol.endDate);
    
    // Check if start/end matches current month/year or spans across
    const curMonthStart = new Date(currentYear, currentMonth, 1);
    const curMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    const isOverlapCurMonth = (start <= curMonthEnd && end >= curMonthStart);

    if (!isOverlapCurMonth) return false;

    if (selectedEmployeeFilter !== 'all' && hol.employeeId !== 'all' && hol.employeeId !== selectedEmployeeFilter) {
      return false;
    }
    if (selectedTypeFilter !== 'all' && hol.type !== selectedTypeFilter) {
      return false;
    }

    return true;
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-6">
      {/* Dynamic Time Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 id="calendar-view-header" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            ตารางลงวันหยุดและวันลาพนักงาน
          </h2>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
            จำลองวันที่จำหน่ายระบบปัจจุบัน: 20 มิถุนายน 2569 (2026-06-20)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportJPG}
            disabled={isExporting}
            className="inline-flex items-center px-3.5 py-1.5 border border-amber-200 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-xs font-bold rounded-lg transition cursor-pointer"
            title="เซฟภาพตารางปฏิทินวันหยุดเพื่อจัดส่งไลน์/พรินต์"
          >
            <Image className="w-4 h-4 mr-1.5 text-amber-600" />
            {isExporting ? 'กำลังเซฟภาพ...' : 'ส่งออกเป็นภาพ (.jpg)'}
          </button>
          <button
            onClick={handleJumpToToday}
            className="px-3.5 py-1.5 border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            ระบุเดือนปัจจุบัน
          </button>
          <button
            onClick={() => handleOpenAddForm()}
            className="inline-flex items-center px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            ยื่นใบลา / เพิ่มการหยุด
          </button>
        </div>
      </div>

      {/* Control Navigation & Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Calendar View on left */}
        <div ref={calendarRef} className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          
          {/* Calendar Header with Navigation */}
          <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white border hover:border-gray-200 rounded-lg transition text-gray-600 hover:text-gray-950"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white border hover:border-gray-200 rounded-lg transition text-gray-600 hover:text-gray-950"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-base font-bold text-gray-800 ml-2">
                {THAI_MONTHS[currentMonth]} {currentYear + 543} (ค.ศ. {currentYear})
              </span>
            </div>

            {/* Quick dropdown filters */}
            <div className="flex gap-2.5">
              <div className="relative">
                <select
                  value={selectedEmployeeFilter}
                  onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                  className="pl-2.5 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-medium text-gray-700 outline-none appearance-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">พนักงานทุกคน</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} ({emp.nickname || emp.position.substring(0, 8)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Thai Week Days Row */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-gray-400 py-1 border-b border-gray-50">
            {THAI_SHORT_WEEKDAYS.map((day, ix) => (
              <div 
                key={day} 
                className={`py-1.5 ${ix === 0 ? 'text-red-500' : ix === 6 ? 'text-indigo-500' : 'text-gray-400'}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div id="calendar-grid-cells" className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              const activeHols = getHolidaysForDate(cell.dateString);
              // Check if cell is simulated today
              const isToday = cell.dateString === '2026-06-20';

              return (
                <div
                  key={`${cell.dateString}-${idx}`}
                  onClick={() => handleOpenAddForm(cell.dateString)}
                  className={`min-h-[92px] p-1.5 bg-white border rounded-xl flex flex-col justify-between transition-all group relative cursor-pointer ${
                    cell.isCurrentMonth ? 'border-gray-100 hover:border-indigo-200' : 'border-gray-50/70 bg-gray-50/20 opacity-50'
                  } ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1 bg-indigo-50/10' : ''}`}
                >
                  {/* Calendar day digit */}
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                      isToday 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : cell.isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {cell.dayNum}
                    </span>
                    
                    {/* Tiny visual hover add icon */}
                    <div className="opacity-0 group-hover:opacity-100 transition duration-150">
                      <Plus className="w-3.5 h-3.5 text-indigo-500 hover:scale-110" />
                    </div>
                  </div>

                  {/* Holiday listing space */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[58px] scrollbar-thin">
                    {activeHols.map(hol => {
                      const typeDet = getLeaveTypeDetails(hol.type);
                      return (
                        <div
                          key={hol.id}
                          onClick={(e) => {
                            e.stopPropagation(); // prevent opening add form
                            setInspectedLeave(hol);
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium leading-tight border hover:brightness-95 transition-all truncate select-none ${typeDet.bgColor} ${typeDet.color} ${typeDet.borderColor}`}
                          title={`${getEmployeeName(hol.employeeId)}: ${hol.title}`}
                        >
                          {hol.employeeId === 'all' ? '📢 ' : ''}
                          {hol.employeeId !== 'all' ? (employees.find(e => e.id === hol.employeeId)?.firstName || 'พนักงาน') : hol.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Indicators Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-4 border-t border-gray-100 text-[11px] font-semibold text-gray-500">
            <span className="flex items-center gap-1.5 mr-2 text-gray-400">สัญลักษณ์สี:</span>
            {LEAVE_TYPES.map(t => (
              <span key={t.type} className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-md border ${t.bgColor} ${t.borderColor}`} />
                {t.label}
              </span>
            ))}
          </div>

        </div>

        {/* Dynamic Detail List Panel on right */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Inspected Leave Details Card */}
          <AnimatePresence mode="wait">
            {inspectedLeave ? (
              <motion.div
                key="inspected-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-indigo-200 shadow-md rounded-2xl p-5 relative overflow-hidden"
              >
                {/* Visual badge highlight */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${getLeaveTypeDetails(inspectedLeave.type).bgColor}`} />

                <div className="flex justify-between items-start mb-3.5">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${getLeaveTypeDetails(inspectedLeave.type).bgColor} ${getLeaveTypeDetails(inspectedLeave.type).color}`}>
                    {getLeaveTypeDetails(inspectedLeave.type).label}
                  </span>
                  <button 
                    onClick={() => setInspectedLeave(null)}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-gray-950 text-base leading-snug mb-3">
                  {inspectedLeave.title}
                </h3>

                <div className="space-y-2.5 text-sm text-gray-600 mb-4 border-t border-gray-50 pt-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">ชื่อผู้ลาพัก</p>
                      <p className="font-bold text-gray-900">{getEmployeeName(inspectedLeave.employeeId)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">ช่วงเวลา</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(inspectedLeave.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        {' - '}
                        {new Date(inspectedLeave.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">จำนวนวันหยุด</p>
                      <p className="font-bold text-indigo-600">{inspectedLeave.durationDays} วัน</p>
                    </div>
                  </div>

                  {inspectedLeave.notes && (
                    <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">รายละเอียด/เหตุผล</p>
                        <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap">{inspectedLeave.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-[10.5px] text-gray-400 font-medium">รหัสรายการ: {inspectedLeave.id}</span>
                  <button
                    onClick={() => handleDeleteHoliday(inspectedLeave.id)}
                    className="inline-flex items-center text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    ลบวันลา/วันหยุด
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4.5 text-center text-gray-500">
                <Info className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">คลิกเลือกแถบวันลาบนปฏิทิน</p>
                <p className="text-[10px] text-gray-400 mt-1">เพื่อเปิดดูรายละเอียดและลบใบลาการทำงานของพนักงาน</p>
              </div>
            )}
          </AnimatePresence>

          {/* Month Summary Leave List */}
          <div className="bg-white p-5 border border-gray-100 shadow-sm rounded-2xl space-y-3.5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">รายการหยุดงานในเดือนนี้</h3>
              <p className="text-[10.5px] text-gray-400 mt-0.5">รวมทั้งหมด {currentMonthHolidaysList.length} วันหยุด / แผนงาน</p>
            </div>

            <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
              {currentMonthHolidaysList.map(hol => {
                const typeDet = getLeaveTypeDetails(hol.type);
                const employeeInfo = employees.find(e => e.id === hol.employeeId);
                return (
                  <div
                    key={hol.id}
                    onClick={() => setInspectedLeave(hol)}
                    className="p-3 border border-gray-100 hover:border-indigo-100 bg-white hover:bg-indigo-50/10 rounded-xl cursor-pointer transition flex justify-between items-center gap-3"
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${typeDet.bgColor} ${typeDet.color} ring-1 ring-offset-1 ring-gray-100`} />
                        <h4 className="font-bold text-xs text-gray-900 truncate">{hol.title}</h4>
                      </div>
                      
                      <p className="text-[10.5px] text-gray-500 font-medium truncate">
                        {hol.employeeId === 'all' ? '📢 ทุกคนในบริษัท' : `${employeeInfo?.firstName || 'พนักงาน'} (${employeeInfo?.nickname || employeeInfo?.position || 'ไอที'})`}
                      </p>
                      
                      <p className="text-[10px] text-gray-400 font-semibold font-mono">
                        {new Date(hol.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        {hol.startDate !== hol.endDate ? ` - ${new Date(hol.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}` : ''}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-xs font-bold text-indigo-600 block">{hol.durationDays} วัน</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{typeDet.label}</span>
                    </div>
                  </div>
                );
              })}

              {currentMonthHolidaysList.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400">ไม่มีประวัติวันลาพักในระบบสำหรับเดือนนี้</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Model Overlay for ADD LEAVE form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFormOpen(false)}
                className="fixed inset-0 transition-opacity bg-black/40 backdrop-blur-xs"
              />

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative z-10 inline-block overflow-hidden text-left align-bottom bg-white rounded-2xl shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-100"
              >
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900">
                    ลงทะเบียนวันลาหยุดงานพนักงาน
                  </h3>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveHoliday} className="p-6 space-y-4">
                  
                  {/* Select Employee */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-leave-emp" className="text-xs font-semibold text-gray-500 uppercase block">เลือกพนักงาน <span className="text-red-500">*</span></label>
                    <select
                      id="form-leave-emp"
                      value={formEmployeeId}
                      onChange={(e) => setFormEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm bg-white"
                      required
                    >
                      <option value="all">📢 วันหยุดบริษัทพิเศษ (วันหยุดบริษัททุกคน)</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeCode} - {emp.firstName} {emp.lastName} [{emp.position}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="form-leave-start" className="text-xs font-semibold text-gray-500 uppercase block">วันเริ่มต้นหยุด <span className="text-red-500">*</span></label>
                      <input
                        id="form-leave-start"
                        type="date"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="form-leave-end" className="text-xs font-semibold text-gray-500 uppercase block">วันสุดท้ายสิ้นสุด <span className="text-red-500">*</span></label>
                      <input
                        id="form-leave-end"
                        type="date"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Holiday Type & duration preview */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-leave-type" className="text-xs font-semibold text-gray-500 uppercase block">ประเภทการลา / วันหยุด <span className="text-red-500">*</span></label>
                    <select
                      id="form-leave-type"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as HolidayType)}
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm bg-white"
                    >
                      {LEAVE_TYPES.map(t => (
                        <option key={t.type} value={t.type}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Short Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-leave-title" className="text-xs font-semibold text-gray-500 uppercase block">ระบุหัวข้อ / เหตุผลหลัก <span className="text-red-500">*</span></label>
                    <input
                      id="form-leave-title"
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="เช่น ขอลากลับบ้านต่างจังหวัด, มีอาการไข้หวัด"
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm"
                      required
                    />
                  </div>

                  {/* Notes Area */}
                  <div className="space-y-1.5">
                    <label htmlFor="form-leave-notes" className="text-xs font-semibold text-gray-500 uppercase block">รายละเอียดเพิ่มเติม</label>
                    <textarea
                      id="form-leave-notes"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="ข้อมูลบันทึกเพิ่มเติมประกอบการอนุมัติ..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm resize-none"
                    />
                  </div>

                  {/* Total duration preview box */}
                  {formStartDate && formEndDate && (
                    <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg text-center text-xs text-indigo-700 font-medium">
                      ระยะเวลาพักเฉลี่ย: {calculateDaysBetween(formStartDate, formEndDate)} วันที่เลือก
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                    >
                      บันทึกคำขอนี้
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
