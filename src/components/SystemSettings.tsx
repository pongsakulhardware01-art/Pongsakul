/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Trash2, 
  RefreshCcw, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  CalendarDays,
  Download,
  Upload,
  Database,
  AlertTriangle,
  FileJson,
  Layers,
  Sparkles,
  Save,
  Check,
  Server,
  CloudLightning,
  GitBranch,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sliders,
  FolderTree
} from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { createSystemBackup } from '../services/settingsService';
import { APP_CONFIG } from '../constants/appConfig';
import { DEFAULT_LEAVE_QUOTAS } from '../constants/leaveTypes';

export default function SystemSettings() {
  const {
    employees,
    holidays,
    companyName: storedCompanyName,
    weekendType: storedWeekendType,
    leaveQuotas: storedLeaveQuotas,
    updateSettings,
    seedDemoData,
    clearAllData,
    restoreBackup,
    showToast
  } = useCompany();

  // Active settings tab
  const [activeTab, setActiveTab] = useState<'policy' | 'backup' | 'maintenance' | 'architecture'>('policy');

  // Form states for policy
  const [companyName, setCompanyName] = useState(storedCompanyName);
  const [weekendType, setWeekendType] = useState(storedWeekendType);
  const [vacationQuota, setVacationQuota] = useState(storedLeaveQuotas.vacation);
  const [sickQuota, setSickQuota] = useState(storedLeaveQuotas.sick);
  const [personalQuota, setPersonalQuota] = useState(storedLeaveQuotas.personal);
  const [specialQuota, setSpecialQuota] = useState(storedLeaveQuotas.special_leave);
  const [otherQuota, setOtherQuota] = useState(storedLeaveQuotas.other);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal / Confirm dialog states
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Backup / Restore states
  const [importJsonText, setImportJsonText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Sync state when stored context values change
  useEffect(() => {
    setCompanyName(storedCompanyName);
    setWeekendType(storedWeekendType);
    setVacationQuota(storedLeaveQuotas.vacation);
    setSickQuota(storedLeaveQuotas.sick);
    setPersonalQuota(storedLeaveQuotas.personal);
    setSpecialQuota(storedLeaveQuotas.special_leave);
    setOtherQuota(storedLeaveQuotas.other);
  }, [storedCompanyName, storedWeekendType, storedLeaveQuotas]);

  const handleSaveCompanyPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateSettings({
        companyName: companyName.trim() || APP_CONFIG.name,
        weekendType,
        quotas: {
          vacation: Number(vacationQuota) || DEFAULT_LEAVE_QUOTAS.vacation,
          sick: Number(sickQuota) || DEFAULT_LEAVE_QUOTAS.sick,
          personal: Number(personalQuota) || DEFAULT_LEAVE_QUOTAS.personal,
          special_leave: Number(specialQuota) || DEFAULT_LEAVE_QUOTAS.special_leave,
          other: Number(otherQuota) || DEFAULT_LEAVE_QUOTAS.other,
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      showToast('error', 'บันทึกการตั้งค่าไม่สำเร็จ', err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const backup = createSystemBackup(
        companyName,
        weekendType,
        {
          vacation: vacationQuota,
          sick: sickQuota,
          personal: personalQuota,
          special_leave: specialQuota,
          other: otherQuota,
        },
        employees,
        holidays
      );

      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().split('T')[0];
      const safeCompany = companyName.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
      link.href = url;
      link.download = `backup_${safeCompany}_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('success', 'ดาวน์โหลดไฟล์สำรองเรียบร้อย', `${employees.length} พนักงาน, ${holidays.length} รายการวันลา`);
    } catch (err: any) {
      showToast('error', 'ส่งออกข้อมูลสำรองไม่สำเร็จ', err?.message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus({ type: 'idle', message: '' });
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!importJsonText.trim()) {
      setImportStatus({ type: 'error', message: 'กรุณาเลือกหรือวางเนื้อหาไฟล์ JSON ก่อนดำเนินการ' });
      return;
    }

    setIsProcessingAction(true);
    setImportStatus({ type: 'idle', message: '' });

    const result = await restoreBackup(importJsonText);
    if (result.success) {
      setImportStatus({ type: 'success', message: result.message });
      setImportJsonText('');
      setImportFileName('');
    } else {
      setImportStatus({ type: 'error', message: result.message });
    }
    setIsProcessingAction(false);
  };

  const handleExecuteSeed = async () => {
    setIsProcessingAction(true);
    try {
      await seedDemoData();
      setShowSeedConfirm(false);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExecuteClear = async () => {
    setIsProcessingAction(true);
    try {
      await clearAllData();
      setShowClearConfirm(false);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🧭 Top Navigation Sub-Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-3xs flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('policy')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'policy'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>นโยบาย & โควตาวันลา</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4 shrink-0" />
          <span>สำรอง & กู้คืนข้อมูล</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Server className="w-4 h-4 shrink-0" />
          <span>ข้อมูลสาธิต & ดูแลระบบ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('architecture')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'architecture'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FolderTree className="w-4 h-4 shrink-0" />
          <span>สถาปัตยกรรม & เวอร์ชั่น</span>
        </button>
      </div>

      {/* 🏢 TAB 1: Company Policy & Leave Quotas */}
      {activeTab === 'policy' && (
        <form onSubmit={handleSaveCompanyPolicy} className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-rose-600" />
                <span>การตั้งค่านโยบายองค์กรและสิทธิ์วันลา</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดชื่อองค์กร นโยบายวันหยุดสุดสัปดาห์ และโควตาวันลาประจำปีมาตรฐานของพนักงาน
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <Check className="w-4 h-4" /> บันทึกสำเร็จ
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                ชื่อองค์กร / บริษัท (Company Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ระบุชื่อบริษัท..."
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-medium"
              />
              <p className="text-[11px] text-slate-400">
                ชื่อนี้จะปรากฏบนหัวเอกสารรายงาน ใบส่งออก และหัวปฏิทินของระบบ
              </p>
            </div>

            {/* Weekend Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                รูปแบบวันหยุดประจำสัปดาห์ (Weekend Policy)
              </label>
              <select
                value={weekendType}
                onChange={(e) => setWeekendType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-medium bg-white"
              >
                <option value="sat-sun">หยุดวันเสาร์ - อาทิตย์ (ทำงาน 5 วัน/สัปดาห์)</option>
                <option value="sun-only">หยุดเฉพาะวันอาทิตย์ (ทำงาน 6 วัน/สัปดาห์)</option>
                <option value="none">ไม่มีวันหยุดสุดสัปดาห์ตายตัว (พนักงานเข้ากะ/ผลัดเวร)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                ใช้กำหนดการแสดงไฮไลต์สีบนปฏิทินและคำนวณวันทำการมาตรฐาน
              </p>
            </div>
          </div>

          {/* Leave Quotas Section */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-rose-500" />
              <span>โควตาวันลาประจำปีมาตรฐาน (วัน/คน/ปี)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                  🏖️ ลาพักร้อน
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={vacationQuota}
                    onChange={(e) => setVacationQuota(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-slate-500">วัน</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
                <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                  🤒 ลาป่วย
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={sickQuota}
                    onChange={(e) => setSickQuota(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-[11px] text-slate-500">วัน</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1">
                <span className="text-[11px] font-bold text-sky-800 flex items-center gap-1">
                  💼 ลากิจ
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={personalQuota}
                    onChange={(e) => setPersonalQuota(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[11px] text-slate-500">วัน</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50/50 space-y-1">
                <span className="text-[11px] font-bold text-fuchsia-800 flex items-center gap-1">
                  ✨ ลาพิเศษ
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={specialQuota}
                    onChange={(e) => setSpecialQuota(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-fuchsia-300 rounded-lg text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <span className="text-[11px] text-slate-500">วัน</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1">
                  📌 ลาอื่นๆ
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={otherQuota}
                    onChange={(e) => setOtherQuota(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[11px] text-slate-500">วัน</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              * ค่าโควตานี้จะถูกนำไปใช้ในหน้าสถิติแดชบอร์ด รายงานสรุปประจำปี และการแจ้งเตือนสิทธิ์ลาเกินกำหนด
            </p>
          </div>
        </form>
      )}

      {/* 💾 TAB 2: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Box */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">ส่งออกข้อมูลสำรองทั้งระบบ (.json)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                สร้างไฟล์สำรองข้อมูล JSON ที่มีข้อมูลครบถ้วน ทั้งรายชื่อพนักงาน ข้อมูลการลาหยุด นโยบายองค์กร และโควตาวันลา เพื่อจัดเก็บไว้ในคอมพิวเตอร์ของคุณอย่างปลอดภัย
              </p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>จำนวนพนักงานในระบบ:</span>
                  <span className="font-bold text-slate-800">{employees.length} ท่าน</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนรายการวันลาทั้งหมด:</span>
                  <span className="font-bold text-slate-800">{holidays.length} รายการ</span>
                </div>
                <div className="flex justify-between">
                  <span>เวอร์ชั่นโครงสร้างข้อมูล:</span>
                  <span className="font-bold font-mono text-rose-600">{APP_CONFIG.version}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์สำรองข้อมูล (Download JSON)</span>
            </button>
          </div>

          {/* Import / Restore Box */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-6 space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">กู้คืนข้อมูลจากไฟล์สำรอง (.json)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                เลือกไฟล์ JSON สำรองที่เคยดาวน์โหลดไว้ ระบบจะตรวจสอบความถูกต้องของโครงสร้างก่อนกู้คืนข้อมูล
              </p>

              <label className="border-2 border-dashed border-slate-200 hover:border-rose-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition bg-slate-50/50 hover:bg-rose-50/20">
                <FileJson className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">
                  {importFileName ? `ไฟล์ที่เลือก: ${importFileName}` : 'คลิกเพื่อเลือกไฟล์สำรอง JSON'}
                </span>
                <span className="text-[10px] text-slate-400">รองรับไฟล์ .json ทุกเวอร์ชั่น</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {importStatus.type === 'error' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importStatus.message}</span>
                </div>
              )}

              {importStatus.type === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!importJsonText || isProcessingAction}
              onClick={handleExecuteRestore}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessingAction ? 'กำลังกู้คืนข้อมูล...' : 'เริ่มกระบวนการกู้คืนข้อมูล (Restore)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 🛠️ TAB 3: Demo Data & Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Cloud Health Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CloudLightning className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>สถานะการเชื่อมต่อฐานข้อมูลคลาวด์ (Cloud Firestore)</span>
              </h3>
              <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                ออนไลน์แบบเรียลไทม์ (Connected)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">จำนวนข้อมูลพนักงาน</span>
                <span className="text-lg font-black text-slate-800 font-mono mt-0.5 block">{employees.length} ท่าน</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">จำนวนบันทึกวันลา</span>
                <span className="text-lg font-black text-slate-800 font-mono mt-0.5 block">{holidays.length} รายการ</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">รูปแบบซิงค์ข้อมูล</span>
                <span className="text-xs font-bold text-rose-600 mt-1.5 block">Two-way Firestore Realtime Snapshot</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Seed / Clear) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seed Demo Data Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">โหลดชุดข้อมูลสาธิตตัวอย่าง (Seed Demo Data)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  สร้างพนักงานตัวอย่าง 4 ท่าน พร้อมประวัติการลาหลากหลายรูปแบบ (พักร้อน, ลาป่วย, ลากิจ, วันหยุดนักขัตฤกษ์) เพื่อทดสอบการทำงานของระบบแดชบอร์ดและรายงานสรุป
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSeedConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>โหลดข้อมูลสาธิตตัวอย่าง</span>
              </button>
            </div>

            {/* Clear All Data Card */}
            <div className="bg-white rounded-2xl border border-rose-100 shadow-3xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-rose-800">ล้างข้อมูลทั้งหมดในระบบ (Clear All Data)</h3>
                <p className="text-xs text-rose-600/80 leading-relaxed">
                  ล้างรายชื่อพนักงานและประวัติวันลาทั้งหมดออกจากฐานข้อมูล Cloud เหมาะสำหรับกรณีต้องการเริ่มต้นใช้งานระบบใหม่ทั้งหมดจากศูนย์ (แนะนำให้ส่งออกสำรองไว้ก่อน)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>ล้างข้อมูลทั้งหมดในระบบ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏛️ TAB 4: Architecture & Version History */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          {/* Architecture Layout Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-rose-600" />
                <span>โครงสร้างหลังบ้านแบบโมดูลาร์ (Organized Modular Architecture)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                โครงสร้างระบบได้รับการจัดระเบียบให้แยกความรับผิดชอบอย่างชัดเจน (Separation of Concerns) เพื่อให้การอัปเดต แก้ไข หรือต่อยอดฟีเจอร์ในอนาคตทำได้สะดวกรวดเร็ว
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <span className="font-mono font-bold text-rose-600 text-[11px] block">📁 /src/services</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  รวมบริการจัดการข้อมูลทั้งหมด: <code className="text-slate-800 bg-slate-200/60 px-1 rounded">employeeService</code>, <code className="text-slate-800 bg-slate-200/60 px-1 rounded">holidayService</code>, <code className="text-slate-800 bg-slate-200/60 px-1 rounded">leaveCalculationService</code>, <code className="text-slate-800 bg-slate-200/60 px-1 rounded">exportService</code>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <span className="font-mono font-bold text-rose-600 text-[11px] block">📁 /src/context</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <code className="text-slate-800 bg-slate-200/60 px-1 rounded">CompanyContext.tsx</code> ทำหน้าที่เป็น Single Source of Truth สำหรับข้อมูลพนักงาน วันหยุด โควตา และแจ้งเตือน Toast ทั่วทั้งแอป
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <span className="font-mono font-bold text-rose-600 text-[11px] block">📁 /src/constants</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  ศูนย์รวมค่าคงที่: <code className="text-slate-800 bg-slate-200/60 px-1 rounded">leaveTypes.ts</code> (ประเภทวันลา สี ไอคอน), <code className="text-slate-800 bg-slate-200/60 px-1 rounded">thaiCalendar.ts</code> (ปฏิทินไทย), และ <code className="text-slate-800 bg-slate-200/60 px-1 rounded">appConfig.ts</code> (เวอร์ชั่น ลิงก์ภายนอก)
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <span className="font-mono font-bold text-rose-600 text-[11px] block">📁 /src/components</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  คอมโพเนนต์หลักที่แยกเป็นอิสระ: ปฏิทินวันหยุด (<code className="text-slate-800 bg-slate-200/60 px-1 rounded">HolidayCalendar</code>), ทะเบียนพนักงาน, แดชบอร์ดสถิติ, รายงานสรุปรายบุคคล (<code className="text-slate-800 bg-slate-200/60 px-1 rounded">IndividualAnnualReport</code>)
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <span className="font-mono font-bold text-rose-600 text-[11px] block">📁 /src/utils</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  ฟังก์ชันอเนกประสงค์: คำนวณช่วงวัน (<code className="text-slate-800 bg-slate-200/60 px-1 rounded">dateUtils.ts</code>), แปลง พ.ศ., และ LocalStorage fallback handler
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <span className="font-mono font-bold text-rose-600 text-[11px] block">🔗 ลิงก์เครื่องมือภายนอก</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  เชื่อมโยงระบบคำนวณ (<code className="text-slate-800 bg-slate-200/60 px-1 rounded">pongsakul-aicalculate</code>), ระบบแปลงไฟล์ PDF (<code className="text-slate-800 bg-slate-200/60 px-1 rounded">pongsakulpdf</code>), และระบบใบเสนอราคา (<code className="text-slate-800 bg-slate-200/60 px-1 rounded">pongsakulquotation</code>) รวมศูนย์ที่ <code className="text-slate-800 bg-slate-200/60 px-1 rounded">appConfig.ts</code>
                </p>
              </div>
            </div>
          </div>

          {/* Version Changelog History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <GitBranch className="w-4 h-4 text-rose-600" />
              <span>ประวัติการพัฒนาและบันทึกการเปลี่ยนแปลง (Changelog)</span>
            </h3>

            <div className="space-y-4">
              {APP_CONFIG.versionHistory.map((item, idx) => (
                <div key={item.version} className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-transparent">
                  <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-rose-600' : 'bg-slate-400'}`}></span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{item.title}</span>
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {item.version}
                    </span>
                    <span className="text-[10px] text-slate-400">({item.releaseDate})</span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-600 list-disc list-inside">
                    {item.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="leading-relaxed">{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Seed Demo Data */}
      {showSeedConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">ยืนยันการโหลดชุดข้อมูลสาธิต</h3>
                <p className="text-xs text-slate-500">ระบบจะเพิ่มพนักงาน 4 ท่าน และประวัติวันหยุดตัวอย่าง</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              ข้อมูลสาธิตนี้จะถูกเขียนลงใน Cloud Firestore ทันที หากคุณมีข้อมูลจริงอยู่แนะนำให้กดส่งออกสำรองข้อมูลไว้ก่อน
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setShowSeedConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleExecuteSeed}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isProcessingAction ? 'กำลังโหลด...' : 'ยืนยันโหลดข้อมูลสาธิต'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-800">ยืนยันการล้างข้อมูลระบบทั้งหมด?</h3>
                <p className="text-xs text-rose-600/80">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              ระบบจะลบรายชื่อพนักงานทั้งหมด ({employees.length} ท่าน) และประวัติวันหยุดทั้งหมด ({holidays.length} รายการ) ออกจากฐานข้อมูลคลาวด์อย่างถาวร
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleExecuteClear}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isProcessingAction ? 'กำลังล้างข้อมูล...' : 'ยืนยันลบข้อมูลทั้งหมด'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
