/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemVersionInfo {
  version: string;
  releaseDate: string;
  title: string;
  highlights: string[];
}

export const APP_CONFIG = {
  name: 'บริษัท พงษ์สกุล ฮาร์ดแวร์ จำกัด',
  systemTitle: 'ระบบบริหารจัดการวันหยุดและสถิติการลาพนักงาน',
  systemShortTitle: 'Company Holiday & Leave Manager',
  version: 'v2.0.0',
  defaultWeekendType: 'sat-sun' as const,
  externalLinks: [
    {
      id: 'calculator',
      title: 'โปรแกรมคำนวณ',
      subtitle: 'เปิดระบบคำนวณและประมวลผล',
      url: 'https://pongsakul-aicalculate.onrender.com/',
      category: 'productivity',
    },
    {
      id: 'pdf-tool',
      title: 'แปลงไฟล์ PDF',
      subtitle: 'เปิดระบบเครื่องมือจัดการและแปลงไฟล์ PDF',
      url: 'https://pongsakulpdf.onrender.com/',
      category: 'productivity',
    },
    {
      id: 'quotation',
      title: 'ใบเสนอราคา',
      subtitle: 'เปิดระบบออกใบเสนอราคาออนไลน์',
      url: 'https://pongsakulquotation.onrender.com/',
      category: 'sales',
    },
  ],
  versionHistory: [
    {
      version: 'v2.0.0',
      releaseDate: '2026-09-30',
      title: 'จัดระเบียบโครงสร้างหลังบ้านแบบโมดูลาร์ (Modular Architecture)',
      highlights: [
        'จัดระเบียบสถาปัตยกรรมระบบแยก Services, Context, Utils, และ Constants ชัดเจน',
        'ยกระดับการตั้งค่าระบบ (System Settings) เป็น 4 ส่วน พร้อมรองรับการสำรอง/กู้คืนข้อมูลแบบสมบูรณ์',
        'สร้าง ExportService กลางสำหรับการส่งออกรูปภาพความละเอียดสูง (.jpg) ทุกจุดของระบบ',
        'ปรับปรุง CompanyContext ให้จัดการข้อมูลส่วนกลางแบบ Single Source of Truth พร้อมการแจ้งเตือน Toast',
        'เพิ่มคู่มือโครงสร้างระบบและสถาปัตยกรรมภายในหน้าตั้งค่า สำหรับการดูแลและพัฒนาต่อในอนาคต',
      ],
    },
    {
      version: 'v1.9.0',
      releaseDate: '2026-09-29',
      title: 'ผลสรุปรายปีแบบละเอียดของแต่ละบุคคล (Detailed Annual Summary)',
      highlights: [
        'เพิ่มหน้าผลสรุปรายปีรายบุคคล ละเอียดครบถ้วนทั้ง KPI, โควตาคงเหลือ, และประวัติการลา',
        'ตารางแจกแจงสถิติวันลาสะสมแยก 12 เดือน พร้อมไฮไลต์เดือนที่มีการลาสูงสุด',
        'ระบบส่งออกภาพรายงานประจำปี (.jpg) คุณภาพสูง 300 DPI พร้อมส่วนลายมือชื่ออนุมัติ 3 ฝ่าย',
        'ปุ่มสลับพนักงานก่อนหน้า/ถัดไป และระบบค้นหาพนักงานเพื่อความสะดวกในการตรวจสอบ',
      ],
    },
    {
      version: 'v1.8.0',
      releaseDate: '2026-09-28',
      title: 'รายงานการลาหยุดรายเดือนและปุ่มทางลัดเครื่องมือ',
      highlights: [
        'รายงานสรุปการลาหยุดรายบุคคลประจำเดือน บันทึกเป็นรูปภาพ JPG',
        'เพิ่มปุ่มทางลัด "แปลงไฟล์ PDF" ไปยัง pongsakulpdf.onrender.com',
      ],
    },
  ] as SystemVersionInfo[],
};
