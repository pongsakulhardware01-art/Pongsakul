/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee } from '../types';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Filter,
  User,
  Phone,
  Mail,
  Briefcase,
  Layers,
  X,
  Plus,
  Upload,
  Download,
  Clipboard,
  Check,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeSettingsProps {
  employees: Employee[];
  onEmployeesChange: (updatedList: Employee[]) => void;
}

export default function EmployeeSettings({ employees, onEmployeesChange }: EmployeeSettingsProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Import / Export states
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(employees, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `employees_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์');
    }
  };

  const handleCopyToClipboard = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(employees, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      alert('ไม่สามารถคัดลอกลงคลิปบอร์ดได้');
    }
  };

  const handleImportJSON = (jsonString: string, mode: 'merge' | 'replace') => {
    try {
      setImportStatusMsg(null);
      const parsed = JSON.parse(jsonString);
      
      if (!Array.isArray(parsed)) {
        throw new Error('รูปแบบข้อมูลต้องเป็น Array ([ ... ]) ของรายชื่อพนักงาน');
      }

      const validatedEmployees: Employee[] = parsed.map((item: any, idx: number) => {
        if (!item.firstName || !item.lastName) {
          throw new Error(`รายการที่ ${idx + 1} ข้อมูลชื่อจริงหรือนามสกุลไม่สมบูรณ์`);
        }
        return {
          id: item.id || `emp-imported-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          employeeCode: item.employeeCode || `EMP-IMP${idx + 1}`,
          firstName: item.firstName,
          lastName: item.lastName,
          nickname: item.nickname || undefined,
          position: item.position || 'พนักงานทั่วไป',
          department: item.department || 'ไอที',
          phone: item.phone || undefined,
          email: item.email || undefined,
          isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
          joinDate: item.joinDate || new Date().toISOString().split('T')[0]
        };
      });

      if (mode === 'replace') {
        onEmployeesChange(validatedEmployees);
        setImportStatusMsg({ 
          type: 'success', 
          text: `นำเข้าพนักงานใหม่ทดแทนทั้งหมดสำเร็จ! จำนวน ${validatedEmployees.length} คน` 
        });
      } else {
        const mergedList = [...employees];
        let addedCount = 0;
        let updatedCount = 0;

        validatedEmployees.forEach(newEmp => {
          const index = mergedList.findIndex(e => e.employeeCode === newEmp.employeeCode);
          if (index > -1) {
            mergedList[index] = { ...mergedList[index], ...newEmp, id: mergedList[index].id };
            updatedCount++;
          } else {
            mergedList.push(newEmp);
            addedCount++;
          }
        });

        onEmployeesChange(mergedList);
        setImportStatusMsg({ 
          type: 'success', 
          text: `นำเข้าข้อมูลแบบรวมสำเร็จ (เพิ่มรายใหม่ ${addedCount} คน, อัปเดตทับรหัสเดิม ${updatedCount} คน)` 
        });
      }
      setBulkInputText('');
    } catch (err: any) {
      setImportStatusMsg({ 
        type: 'error', 
        text: `ข้อผิดพลาดรูปแบบข้อมูล: ${err?.message || 'โปรดตรวจสอบความถูกต้องของโครงสร้าง JSON'}` 
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkInputText(content);
    };
    reader.readAsText(file);
  };

  // Form states (Add/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Input fields state
  const [empCode, setEmpCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Departments list for filter & select dropdown
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // Merge pre-defined standard departments and already inputted custom departments for datalist suggestions
  const suggestedDepts = Array.from(new Set([
    'บริหาร',
    'ไอที',
    'ฝ่ายบุคคล (HR)',
    'ออกแบบ',
    'การตลาด',
    'ฝ่ายขาย (Sales)',
    'บัญชี/การเงิน',
    'คลังสินค้า',
    ...departments
  ]));

  const handleOpenAddForm = () => {
    // Generate next employee code representation
    const nextNum = employees.length + 1;
    const paddedNum = String(nextNum).padStart(3, '0');
    
    setEditingEmployee(null);
    setEmpCode(`EMP${paddedNum}`);
    setFirstName('');
    setLastName('');
    setNickname('');
    setPosition('');
    setDepartment('ไอที');
    setPhone('');
    setEmail('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpCode(emp.employeeCode);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setNickname(emp.nickname || '');
    setPosition(emp.position);
    setDepartment(emp.department);
    setPhone(emp.phone || '');
    setEmail(emp.email || '');
    setIsActive(emp.isActive);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCode || !firstName || !lastName || !position || !department) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รหัสพนักงาน, ชื่อ, นามสกุล, ตำแหน่ง, แผนก)');
      return;
    }

    if (editingEmployee) {
      // Modify existing
      const updated = employees.map(emp => {
        if (emp.id === editingEmployee.id) {
          return {
            ...emp,
            employeeCode: empCode,
            firstName,
            lastName,
            nickname: nickname || undefined,
            position,
            department,
            phone: phone || undefined,
            email: email || undefined,
            isActive
          };
        }
        return emp;
      });
      onEmployeesChange(updated);
    } else {
      // Create new
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        employeeCode: empCode,
        firstName,
        lastName,
        nickname: nickname || undefined,
        position,
        department,
        phone: phone || undefined,
        email: email || undefined,
        isActive,
        joinDate: new Date().toISOString().split('T')[0]
      };
      onEmployeesChange([...employees, newEmp]);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (empId: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบพนักงาน "${name}" ออกจากระบบ? ข้อมูลวันหยุดที่บันทึกไว้ของพนักงานคนนี้จะยังคงอยู่หรืออาจอ้างอิงไม่ได้`)) {
      const filtered = employees.filter(emp => emp.id !== empId);
      onEmployeesChange(filtered);
    }
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      `${emp.firstName} ${emp.lastName} ${emp.nickname || ''} ${emp.employeeCode} ${emp.position}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    const matchesStatus = 
      selectedStatus === 'all' || 
      (selectedStatus === 'active' && emp.isActive) || 
      (selectedStatus === 'inactive' && !emp.isActive);

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 id="employee-list-title" className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-rose-600" />
            รายชื่อพนักงานทั้งหมด ({filteredEmployees.length} คน)
          </h2>
          <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลรายชื่อ พนักงาน ตำแหน่ง แผนก และสถานะปฏิบัติงาน</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
          <button
            id="btn-toggle-import-export"
            onClick={() => setIsImportExportOpen(!isImportExportOpen)}
            className={`inline-flex items-center justify-center px-4 py-2.5 border text-sm font-semibold rounded-xl transition shadow-sm cursor-pointer ${
              isImportExportOpen 
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800' 
                : 'bg-white hover:bg-gray-50 border-slate-200 text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4 mr-2 text-rose-500" />
            นำเข้า / ส่งออกรายชื่อ
          </button>
          
          <button
            id="btn-add-employee"
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            เพิ่มพนักงานใหม่
          </button>
        </div>
      </div>

      {/* Import/Export Panel */}
      <AnimatePresence>
        {isImportExportOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-2xl border border-dashed border-rose-200 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4.5 h-4.5 text-rose-600" />
                  แผงข้อมูลนำเข้า / ส่งออกรายชื่อพนักงาน (Employee Import & Export Backup)
                </h3>
                <button
                  onClick={() => {
                    setIsImportExportOpen(false);
                    setImportStatusMsg(null);
                  }}
                  className="rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Column */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-slate-500" />
                      ส่งออกสำรองข้อมูล (Export Backup)
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      คุณสามารถดาวน์โหลดรายชื่อพนักงานทั้งหมด ({employees.length} คน) เก็บไว้เป็นไฟล์ .json สำรอง หรือคัดลอกโค้ดเก็บรักษาไว้ภายนอกเพื่อย้ายเครื่องหรือนำเข้าใหม่ในอนาคตได้
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleExportJSON}
                        className="inline-flex items-center justify-center px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        ดาวน์โหลดไฟล์ .json
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyToClipboard}
                        className="inline-flex items-center justify-center px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            คัดลอกลงคลิปบอร์ดแล้ว!
                          </>
                        ) : (
                          <>
                            <Clipboard className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            คัดลอกข้อความเป็น JSON
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Schema Info Card */}
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-1">
                    <h5 className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      คำแนะนำโครงสร้างข้อมูลนำเข้า
                    </h5>
                    <p className="text-[11.5px] text-amber-700 leading-relaxed font-sans">
                      ระบบรองรับค่าฟิลด์ <code>firstName</code>, <code>lastName</code>, <code>employeeCode</code>, <code>position</code>, และ <code>department</code> โดยระบบจะสร้างชุดรหัส ID และตั้งวันที่ลงทะเบียนเริ่มต้นให้อัตโนมัติหากไม่พบข้อมูลเดิม
                    </p>
                  </div>
                </div>

                {/* Import Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest block">
                      อัปโหลดไฟล์ หรือวางชุดข้อมูล JSON (Import Data)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="import-raw-file"
                      />
                      <label
                        htmlFor="import-raw-file"
                        className="inline-flex items-center justify-center px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition border border-slate-200"
                      >
                        {bulkInputText ? '📂 เลือกไฟล์ใหม่พึ่งส่งเข้า' : '📂 เลือกอัปโหลดไฟล์ backup (.json)'}
                      </label>
                      {bulkInputText && (
                        <button
                          type="button"
                          onClick={() => setBulkInputText('')}
                          className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                        >
                          ล้างเนื้อหาข้อมูลในกล่อง
                        </button>
                      )}
                    </div>

                    <textarea
                      value={bulkInputText}
                      onChange={(e) => setBulkInputText(e.target.value)}
                      placeholder='วาง JSON ที่คัดลอกมาที่นี่ เช่น:
[
  { "firstName": "ชูเกียรติ", "lastName": "รุ่งเรือง", "employeeCode": "EMP006", "position": "วิศวกร", "department": "ไอที" }
]'
                      rows={4}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Actions for importing */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!bulkInputText}
                      onClick={() => handleImportJSON(bulkInputText, 'merge')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition text-white cursor-pointer ${
                        bulkInputText 
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-sm' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      🔗 รวมกับข้อมูลพนักงานเดิม (Merge)
                    </button>
                    <button
                      type="button"
                      disabled={!bulkInputText}
                      onClick={() => {
                        if (confirm('คุณแน่ใจว่าต้องการลบพนักงานเดิม "ทั้งหมด" และแทนที่ด้วยพนักงานใหม่กลุ่มนี้หรือไม่? การกระทำนี้ไม่คืนค่าเดิมได้')) {
                          handleImportJSON(bulkInputText, 'replace');
                        }
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                        bulkInputText 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      💥 แทนที่รายชื่อเดิมทั้งหมด (Replace)
                    </button>
                  </div>

                  {/* Status msg notification */}
                  {importStatusMsg && (
                    <div className={`p-3 rounded-lg text-xs font-bold border flex items-start gap-1.5 ${
                      importStatusMsg.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{importStatusMsg.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Area */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2 space-y-1.5">
          <label htmlFor="search-emp" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ค้นหาพนักงาน</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-emp"
              type="text"
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, ตำแหน่ง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-500 rounded-xl text-sm transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="filter-dept" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">แผนก</label>
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              id="filter-dept"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-500 rounded-xl text-sm transition appearance-none"
            >
              <option value="all">ทุกแผนก ({departments.length})</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="filter-status" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</label>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-500 rounded-xl text-sm transition"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">กำลังทำงาน</option>
            <option value="inactive">หยุดพักงาน/ออก</option>
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredEmployees.map((emp) => (
            <motion.div
              layout
              id={`employee-card-${emp.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={emp.id}
              className={`bg-white rounded-2xl border ${
                emp.isActive ? 'border-gray-100 shadow-sm' : 'border-gray-200 bg-gray-50/50 opacity-80'
              } p-5 hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              {/* Status indicator pill top right */}
              <div className="absolute right-4 top-4">
                {emp.isActive ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    ทำงานอยู่
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    หยุดพัก
                  </span>
                )}
              </div>

              {/* Profile header */}
              <div className="flex items-center space-x-3.5 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg select-none ${
                  emp.isActive 
                    ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {emp.firstName.substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    {emp.nickname && (
                      <span className="text-xs text-gray-500 font-medium">({emp.nickname})</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{emp.employeeCode}</p>
                </div>
              </div>

              {/* Details stack */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-sm h-36 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600 gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-700 truncate">{emp.position}</span>
                  </div>
                  <div className="flex items-center text-gray-600 gap-2">
                    <Layers className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      {emp.department}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-mono text-gray-700">{emp.phone || '-'}</span>
                  </div>
                  <div className="flex items-center text-gray-600 gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 truncate">{emp.email || '-'}</span>
                  </div>
                </div>

                {/* Card actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-50">
                  <button
                    id={`btn-edit-${emp.id}`}
                    onClick={() => handleOpenEditForm(emp)}
                    className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-rose-600 rounded-lg transition"
                    title="แก้ไขข้อมูล"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-delete-${emp.id}`}
                    onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition"
                    title="ลบข้อมูล"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
            <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">ไม่พบรายชื่อพนักงานที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มเพื่อทดลองลงทะเบียนพนักงานเพิ่ม</p>
          </div>
        )}
      </div>

      {/* Slide-over or Modal Popup for Add/Edit Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              
              {/* Background overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFormOpen(false)}
                className="fixed inset-0 transition-opacity bg-black/40 backdrop-blur-xs"
              />

              {/* Center spacer */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Form card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative z-10 inline-block overflow-hidden text-left align-bottom bg-white rounded-2xl shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-gray-100"
              >
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900" id="modal-title">
                    {editingEmployee ? `แก้ไขข้อมูลพนักงาน: ${editingEmployee.firstName}` : 'เพิ่มพนักงานใหม่'}
                  </h3>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-1">
                      <label htmlFor="form-emp-code" className="text-xs font-semibold text-gray-600 block">รหัสพนักงาน <span className="text-red-500">*</span></label>
                      <input
                        id="form-emp-code"
                        type="text"
                        value={empCode}
                        onChange={(e) => setEmpCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg text-sm"
                        placeholder="เช่น EMP01"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label htmlFor="form-nickname" className="text-xs font-semibold text-gray-600 block">ชื่อเล่น</label>
                      <input
                        id="form-nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg text-sm"
                        placeholder="เช่น มาร์ค"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label htmlFor="form-first-name" className="text-xs font-semibold text-gray-600 block">ชื่อจริง <span className="text-red-500">*</span></label>
                      <input
                        id="form-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg text-sm"
                        placeholder="เช่น สิทธิชัย"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label htmlFor="form-last-name" className="text-xs font-semibold text-gray-600 block">นามสกุล <span className="text-red-500">*</span></label>
                      <input
                        id="form-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg text-sm"
                        placeholder="เช่น รักเจริญ"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label htmlFor="form-position" className="text-xs font-semibold text-gray-600 block">ตำแหน่งงาน <span className="text-red-500">*</span></label>
                      <input
                        id="form-position"
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg text-sm"
                        placeholder="เช่น UI/UX Designer"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label htmlFor="form-dept" className="text-xs font-semibold text-gray-600 block">แผนก <span className="text-red-500">*</span></label>
                      <input
                        id="form-dept"
                        type="text"
                        list="dept-suggestions"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg text-sm bg-white"
                        placeholder="พิมพ์หรือเลือกแผนก เช่น ผลิต, บัญชี"
                        required
                      />
                      <datalist id="dept-suggestions">
                        {suggestedDepts.map(dept => (
                          <option key={dept} value={dept} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label htmlFor="form-phone" className="text-xs font-semibold text-gray-600 block">เบอร์โทรศัพท์</label>
                      <input
                        id="form-phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg text-sm"
                        placeholder="เช่น 089-xxxx"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-1">
                      <label htmlFor="form-email" className="text-xs font-semibold text-gray-600 block">อีเมล</label>
                      <input
                        id="form-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-lg text-sm"
                        placeholder="เช่น email@domain.com"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 mr-2 h-4 w-4"
                      />
                      สถานะเปิดใช้งานพนักงาน (Active Employee)
                    </label>
                  </div>

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
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                    >
                      บันทึกข้อมูล
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
