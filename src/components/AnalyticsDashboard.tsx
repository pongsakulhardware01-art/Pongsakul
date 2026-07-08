/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
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
  AlertTriangle
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

export default function AnalyticsDashboard({ employees, holidays, leaveQuotas }: AnalyticsDashboardProps) {
  
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
