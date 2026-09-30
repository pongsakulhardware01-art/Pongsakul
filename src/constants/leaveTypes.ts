/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HolidayType, LeaveQuotas } from '../types';

export interface LeaveTypeMeta {
  type: HolidayType;
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  barColor: string;
  dotColor: string;
  quotaKey?: keyof LeaveQuotas;
  description: string;
}

export const LEAVE_TYPE_MAP: Record<HolidayType, LeaveTypeMeta> = {
  vacation: {
    type: 'vacation',
    label: 'ลาพักร้อน',
    shortLabel: 'พักร้อน',
    emoji: '🏖️',
    color: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    barColor: 'bg-amber-500',
    dotColor: 'bg-amber-400',
    quotaKey: 'vacation',
    description: 'วันลาพักผ่อนประจำปีตามสิทธิ์พนักงาน'
  },
  sick: {
    type: 'sick',
    label: 'ลาป่วย',
    shortLabel: 'ลาป่วย',
    emoji: '🤒',
    color: 'text-rose-800',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
    barColor: 'bg-rose-500',
    dotColor: 'bg-rose-500',
    quotaKey: 'sick',
    description: 'ลาป่วยเนื่องจากอาการเจ็บป่วยหรือเข้ารับการรักษา'
  },
  personal: {
    type: 'personal',
    label: 'ลากิจ',
    shortLabel: 'ลากิจ',
    emoji: '💼',
    color: 'text-sky-800',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    barColor: 'bg-sky-500',
    dotColor: 'bg-sky-400',
    quotaKey: 'personal',
    description: 'ลากิจธุระจำเป็นส่วนตัวหรือติดต่อหน่วยงานราชการ'
  },
  public_holiday: {
    type: 'public_holiday',
    label: 'วันหยุดนักขัตฤกษ์/บริษัท',
    shortLabel: 'วันหยุดบริษัท',
    emoji: '📢',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    barColor: 'bg-emerald-500',
    dotColor: 'bg-emerald-500',
    description: 'วันหยุดประเพณีหรือวันหยุดตามประกาศของบริษัท'
  },
  special_leave: {
    type: 'special_leave',
    label: 'วันลาหยุดพิเศษ',
    shortLabel: 'หยุดพิเศษ',
    emoji: '✨',
    color: 'text-fuchsia-800',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-200',
    badgeBg: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
    barColor: 'bg-fuchsia-500',
    dotColor: 'bg-fuchsia-400',
    quotaKey: 'special_leave',
    description: 'วันลาคลอด, ลาอุปสมบท, ลาฌาปนกิจ หรือกรณีพิเศษ'
  },
  other: {
    type: 'other',
    label: 'ลาประเภทอื่น',
    shortLabel: 'อื่นๆ',
    emoji: '📌',
    color: 'text-purple-800',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
    barColor: 'bg-purple-500',
    dotColor: 'bg-purple-400',
    quotaKey: 'other',
    description: 'การลาอื่นๆ ที่อยู่นอกเหนือจากระเบียบปกติ'
  }
};

export const LEAVE_TYPES_LIST: LeaveTypeMeta[] = Object.values(LEAVE_TYPE_MAP);

export const TRACKABLE_QUOTA_TYPES: { type: HolidayType; quotaKey: keyof LeaveQuotas }[] = [
  { type: 'vacation', quotaKey: 'vacation' },
  { type: 'sick', quotaKey: 'sick' },
  { type: 'personal', quotaKey: 'personal' },
  { type: 'special_leave', quotaKey: 'special_leave' },
  { type: 'other', quotaKey: 'other' }
];

export const DEFAULT_LEAVE_QUOTAS: LeaveQuotas = {
  vacation: 6,
  sick: 30,
  personal: 3,
  special_leave: 5,
  other: 5
};
