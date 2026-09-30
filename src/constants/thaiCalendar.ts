/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
] as const;

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
] as const;

export interface ThaiWeekdayInfo {
  index: number; // 0 = Sunday, 1 = Monday, ...
  short: string;
  full: string;
  isWeekend: boolean;
  textColor: string;
  headerBg: string;
}

export const THAI_WEEKDAYS: ThaiWeekdayInfo[] = [
  { index: 0, short: 'อา.', full: 'วันอาทิตย์', isWeekend: true, textColor: 'text-rose-600', headerBg: 'bg-rose-50/70 text-rose-600' },
  { index: 1, short: 'จ.', full: 'วันจันทร์', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { index: 2, short: 'อ.', full: 'วันอังคาร', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { index: 3, short: 'พ.', full: 'วันพุธ', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { index: 4, short: 'พฤ.', full: 'วันพฤหัสบดี', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { index: 5, short: 'ศ.', full: 'วันศุกร์', isWeekend: false, textColor: 'text-slate-700', headerBg: 'bg-slate-50 text-slate-700' },
  { index: 6, short: 'ส.', full: 'วันเสาร์', isWeekend: true, textColor: 'text-sky-700', headerBg: 'bg-sky-50/70 text-sky-700' },
];

export const toThaiYear = (ceYear: number): number => ceYear + 543;

export const formatThaiDate = (dateString: string, options?: { showWeekday?: boolean; shortMonth?: boolean }): string => {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length < 3) return dateString;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = options?.shortMonth ? THAI_MONTHS_SHORT[monthIdx] : THAI_MONTHS[monthIdx];
  const thaiYr = toThaiYear(year);

  if (options?.showWeekday) {
    const d = new Date(year, monthIdx, day);
    const dayName = THAI_WEEKDAYS[d.getDay()]?.full || '';
    return `${dayName}ที่ ${day} ${monthName} ${thaiYr}`;
  }

  return `${day} ${monthName} ${thaiYr}`;
};

export const formatThaiDateRange = (startDate: string, endDate: string): string => {
  if (!startDate) return '-';
  if (!endDate || startDate === endDate) {
    return formatThaiDate(startDate, { shortMonth: true });
  }
  const sFormatted = formatThaiDate(startDate, { shortMonth: true });
  const eFormatted = formatThaiDate(endDate, { shortMonth: true });
  return `${sFormatted} - ${eFormatted}`;
};
