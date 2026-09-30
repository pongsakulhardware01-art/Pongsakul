/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, HolidayLeave, HolidayType, LeaveQuotas } from '../types';
import { TRACKABLE_QUOTA_TYPES, LEAVE_TYPE_MAP } from '../constants/leaveTypes';
import { THAI_MONTHS, THAI_WEEKDAYS } from '../constants/thaiCalendar';

export interface EmployeeQuotaItem {
  type: HolidayType;
  quotaKey: keyof LeaveQuotas;
  label: string;
  shortLabel: string;
  emoji: string;
  quota: number;
  used: number;
  remain: number;
  exceeded: boolean;
  overDays: number;
  usagePercent: number;
}

export interface EmployeeAnnualSummary {
  employee: Employee;
  year: number;
  yearLeaves: HolidayLeave[];
  totalLeaveDays: number;
  totalLeavesCount: number;
  attendanceRate: number; // e.g. 98.5%
  attendedDays: number;
  workingDaysTotal: number;
  quotaItems: EmployeeQuotaItem[];
  totalQuota: number;
  totalUsed: number;
  totalRemain: number;
  hasAnyExceeded: boolean;
  monthDistribution: {
    monthIdx: number;
    monthName: string;
    counts: Record<HolidayType, number>;
    totalDays: number;
    percentageOfYear: number;
    leavesCount: number;
  }[];
  peakMonth: { monthIdx: number; monthName: string; totalDays: number } | null;
  longestStreak: number;
  mostFrequentDay: { dayName: string; count: number } | null;
}

/**
 * Standard annual working days in business context (approx 260 days for 5-day week, 52 weeks * 5)
 */
export const STANDARD_ANNUAL_WORKING_DAYS = 260;

/**
 * Calculates complete annual leave summary and metrics for an employee
 */
export const calculateAnnualLeaveSummary = (
  employee: Employee,
  allHolidays: HolidayLeave[],
  leaveQuotas: LeaveQuotas,
  year: number
): EmployeeAnnualSummary => {
  // Filter leaves that belong to this employee and fall within target year
  const yearLeaves = allHolidays
    .filter((h) => {
      if (h.employeeId !== employee.id) return false;
      const startYear = parseInt(h.startDate.split('-')[0], 10);
      const endYear = parseInt(h.endDate.split('-')[0], 10);
      return startYear === year || endYear === year;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Tally usage per type
  const typeCounts: Record<HolidayType, number> = {
    vacation: 0,
    sick: 0,
    personal: 0,
    public_holiday: 0,
    special_leave: 0,
    other: 0,
  };

  yearLeaves.forEach((h) => {
    if (typeCounts[h.type] !== undefined) {
      typeCounts[h.type] += h.durationDays;
    }
  });

  const totalLeaveDays = yearLeaves.reduce((sum, h) => sum + h.durationDays, 0);

  // Compute quotas
  const quotaItems: EmployeeQuotaItem[] = TRACKABLE_QUOTA_TYPES.map((cat) => {
    const quota = leaveQuotas[cat.quotaKey] || 0;
    const used = typeCounts[cat.type] || 0;
    const remain = Math.max(0, quota - used);
    const exceeded = used > quota;
    const overDays = Math.max(0, used - quota);
    const usagePercent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
    const meta = LEAVE_TYPE_MAP[cat.type];

    return {
      type: cat.type,
      quotaKey: cat.quotaKey,
      label: meta.label,
      shortLabel: meta.shortLabel,
      emoji: meta.emoji,
      quota,
      used,
      remain,
      exceeded,
      overDays,
      usagePercent,
    };
  });

  const totalQuota = quotaItems.reduce((sum, q) => sum + q.quota, 0);
  const totalUsed = quotaItems.reduce((sum, q) => sum + q.used, 0);
  const totalRemain = quotaItems.reduce((sum, q) => sum + q.remain, 0);
  const hasAnyExceeded = quotaItems.some((q) => q.exceeded);

  // 12-month distribution matrix
  const monthDistribution = Array.from({ length: 12 }, (_, monthIdx) => {
    const monthLeaves = yearLeaves.filter((h) => {
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

    monthLeaves.forEach((h) => {
      if (counts[h.type] !== undefined) {
        counts[h.type] += h.durationDays;
      }
    });

    const totalDaysInMonth = monthLeaves.reduce((sum, h) => sum + h.durationDays, 0);
    const percentageOfYear = totalLeaveDays > 0 ? Math.round((totalDaysInMonth / totalLeaveDays) * 100) : 0;

    return {
      monthIdx,
      monthName: THAI_MONTHS[monthIdx],
      counts,
      totalDays: totalDaysInMonth,
      percentageOfYear,
      leavesCount: monthLeaves.length,
    };
  });

  // Peak month
  const sortedMonths = [...monthDistribution].sort((a, b) => b.totalDays - a.totalDays);
  const peakMonth = sortedMonths[0]?.totalDays > 0 
    ? { monthIdx: sortedMonths[0].monthIdx, monthName: sortedMonths[0].monthName, totalDays: sortedMonths[0].totalDays } 
    : null;

  // Attendance rate
  const attendedDays = Math.max(0, STANDARD_ANNUAL_WORKING_DAYS - totalLeaveDays);
  const attendanceRate = Number(((attendedDays / STANDARD_ANNUAL_WORKING_DAYS) * 100).toFixed(1));

  // Longest streak
  const longestStreak = yearLeaves.length > 0 ? Math.max(...yearLeaves.map((h) => h.durationDays)) : 0;

  // Most frequent weekday
  let mostFrequentDay: { dayName: string; count: number } | null = null;
  if (yearLeaves.length > 0) {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    yearLeaves.forEach((h) => {
      const d = new Date(h.startDate).getDay();
      dayCounts[d]++;
    });
    let maxIdx = 0;
    let maxCount = 0;
    dayCounts.forEach((cnt, idx) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxIdx = idx;
      }
    });
    if (maxCount > 0) {
      mostFrequentDay = {
        dayName: THAI_WEEKDAYS[maxIdx]?.full || '',
        count: maxCount,
      };
    }
  }

  return {
    employee,
    year,
    yearLeaves,
    totalLeaveDays,
    totalLeavesCount: yearLeaves.length,
    attendanceRate,
    attendedDays,
    workingDaysTotal: STANDARD_ANNUAL_WORKING_DAYS,
    quotaItems,
    totalQuota,
    totalUsed,
    totalRemain,
    hasAnyExceeded,
    monthDistribution,
    peakMonth,
    longestStreak,
    mostFrequentDay,
  };
};

/**
 * Calculates leave balance summary for all employees (for company dashboard table)
 */
export const calculateAllEmployeesLeaveSummary = (
  employees: Employee[],
  holidays: HolidayLeave[],
  leaveQuotas: LeaveQuotas
) => {
  return employees.map((emp) => {
    const empHolidays = holidays.filter((h) => h.employeeId === emp.id);

    const usedVacation = empHolidays.filter((h) => h.type === 'vacation').reduce((sum, h) => sum + h.durationDays, 0);
    const usedSick = empHolidays.filter((h) => h.type === 'sick').reduce((sum, h) => sum + h.durationDays, 0);
    const usedPersonal = empHolidays.filter((h) => h.type === 'personal').reduce((sum, h) => sum + h.durationDays, 0);
    const usedSpecial = empHolidays.filter((h) => h.type === 'special_leave').reduce((sum, h) => sum + h.durationDays, 0);
    const usedOther = empHolidays.filter((h) => h.type === 'other').reduce((sum, h) => sum + h.durationDays, 0);

    const totalUsed = usedVacation + usedSick + usedPersonal + usedSpecial + usedOther;

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
      totalUsed,
      hasExceeded: hasAnyExceeded,
      hasAnyExceeded,
      used: {
        vacation: usedVacation,
        sick: usedSick,
        personal: usedPersonal,
        special_leave: usedSpecial,
        other: usedOther,
      },
      remain: {
        vacation: remainVacation,
        sick: remainSick,
        personal: remainPersonal,
        special_leave: remainSpecial,
        other: remainOther,
      },
      exceeded: {
        vacation: isVacationExceeded,
        sick: isSickExceeded,
        personal: isPersonalExceeded,
        special_leave: isSpecialExceeded,
        other: isOtherExceeded,
      },
    };
  });
};
