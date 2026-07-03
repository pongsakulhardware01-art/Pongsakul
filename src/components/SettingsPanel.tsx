import React, { useRef, useState } from "react";
import { AppSettings, Prices, Weights } from "../types";
import { defaultSettings, APP_VERSION } from "../data";
import { fmt } from "../utils";
import html2canvas from "html2canvas";
import { Save, RotateCcw, Image, Settings, Percent, DollarSign, Scale, CheckCircle2, Download } from "lucide-react";

interface SettingsPanelProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function SettingsPanel({ settings, setSettings }: SettingsPanelProps) {
  const [pricesInput, setPricesInput] = useState<Prices>({ ...settings.prices });
  const [weightsInput, setWeightsInput] = useState<Weights>({ ...settings.weights });
  const [notif, setNotif] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const showNotify = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  };

  const handlePriceChange = (field: keyof Prices, val: number) => {
    setPricesInput((prev) => ({ ...prev, [field]: val }));
  };

  const handleWeightChange = (field: keyof Weights, val: number) => {
    setWeightsInput((prev) => ({ ...prev, [field]: val }));
  };

  const handleDownloadSingleHTML = () => {
    showNotify("กำลังแพ็คแอปพลิเคชันเป็นไฟล์ HTML ชนิดออฟไลน์ ☁️...");
    const link = document.createElement("a");
    link.href = "/api/download-single-html";
    const cleanVersion = APP_VERSION.replace(/\s+/g, "_");
    link.download = `Pongsakul_Concrete_Calculator_${cleanVersion}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveToLocal = async () => {
    const updated: AppSettings = {
      prices: pricesInput,
      weights: weightsInput,
    };
    setSettings(updated);
    localStorage.setItem("pongsakulSettings", JSON.stringify(updated));
    
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        showNotify("อัปเดตระบบเรียลไทม์บันทึกลงเซิร์ฟเวอร์เรียบร้อยแล้ว! 💾☁️");
      } else {
        showNotify("บันทึกการตั้งค่าในเบราว์เซอร์แล้ว แต่เซิร์ฟเวอร์ยังไม่อัปเกรด ⚠️");
      }
    } catch (e) {
      console.error(e);
      showNotify("บันทึกการตั้งค่าในเบราว์เซอร์แล้ว (ไม่สามารถอัปโหลดไปยังเซิร์ฟเวอร์ร่วมได้) ⚠️");
    }
  };

  const resetToDefaultOriginal = async () => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการคืนค่าระบบเป็นราคาแนะนำตามมาตรฐานโรงงาน (${APP_VERSION})?`)) {
      setPricesInput({ ...defaultSettings.prices });
      setWeightsInput({ ...defaultSettings.weights });
      setSettings({ ...defaultSettings });
      localStorage.setItem("pongsakulSettings", JSON.stringify(defaultSettings));
      
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(defaultSettings),
        });
        if (response.ok) {
          showNotify("รีเซ็ตราคากลางโรงงานและประสานงานไปยังทุกเครื่องเรียบร้อย! 🔄☁️");
        } else {
          showNotify("รีเซ็ตเฉพาะในเบราว์เซอร์ของคุณเรียบร้อยแล้ว 🔄");
        }
      } catch (e) {
        console.error(e);
        showNotify("รีเซ็ตเฉพาะในเบราว์เซอร์ของคุณเรียบร้อยแล้ว 🔄");
      }
    }
  };

  const handleExportJpg = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    showNotify("กำลังสร้างรูปภาพแค็ตตาล็อกราคา... กรุณารอสักครู่ 📸");

    // Force style updates or give some delay for DOM layout
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imageURL = canvas.toDataURL("image/jpeg", 0.9);
      const a = document.createElement("a");
      a.href = imageURL;
      a.download = `POGSAKUL_Price_Catalog_${new Date().toISOString().slice(0, 10)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showNotify("สร้างไฟล์ JPG สรุปราคาสำเร็จและสแตนด์บายดาวน์โหลดแล้ว! 🎉");
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถเรนเดอร์ภาพแค็ตตาล็อกได้เนื่องกัับข้อจำกัดเฟรมเวิร์ก");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Pop notification banner */}
      {notif && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 z-50 bg-[#c62828] text-white py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 border border-red-500/30 font-medium">
          <CheckCircle2 size={18} className="text-amber-300 flex-shrink-0 animate-bounce" />
          <span className="text-xs sm:text-sm font-sans">{notif}</span>
        </div>
      )}

      {/* Corporate Quotation Export & Utility Bar */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-neutral-800 text-lg flex items-center gap-1.5">
              <Settings className="text-[#C62828]" size={20} />
              แผงควบคุมหลัก & ออกรายงานเอกสาร
            </h3>
            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed mt-1">
              แก้ไขราคากลาง, สเปคค่าน้ำหนักจริง และสรุปอัตราราคาส่งมอบเพื่อดาวน์โหลดเป็นภาพใบเสนอราคา (JPG catalog) ได้ในคลิกเดียว
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <button
              onClick={handleExportJpg}
              disabled={isExporting}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-650 hover:bg-blue-700 hover:scale-101 active:scale-99 transition text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-blue-700 bg-blue-600 shadow-sm"
            >
              <Image size={16} />
              {isExporting ? "กำลังบันทึกภาพ..." : "สร้างรายงานราคา (JPG)"}
            </button>
            <button
              onClick={resetToDefaultOriginal}
              className="flex items-center justify-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 active:scale-99 transition text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl border border-neutral-200"
            >
              <RotateCcw size={15} />
              คืนค่าแนะนำ
            </button>
          </div>
        </div>
      </div>

      {/* Grid forms settings layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Prices Section */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <div className="p-1.5 bg-red-50 text-[#C62828] rounded-lg">
              <DollarSign size={16} />
            </div>
            <h4 className="font-semibold text-neutral-800 text-base">ราคาตั้งต้นวัสดุคอนกรีตอัดแรง (บาท)</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* VAT config */}
            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50 sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                <Percent size={14} /> อัตราภาษีมูลค่าเพิ่มทั่วไป (%)
              </label>
              <input
                type="number"
                value={pricesInput.vatPercent}
                onChange={(e) => handlePriceChange("vatPercent", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-bold font-mono focus:ring-1 focus:ring-red-300 outline-none"
              />
            </div>

            {/* Board Core Prices */}
            <div className="sm:col-span-2 border-b border-dashed border-neutral-200 py-1.5">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">กลุ่มเกรดราคาแผ่นพื้น (บาท / ตร.ม.)</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">แผ่นพื้นธรรมดา (ฐานลวด 4)</label>
              <input
                type="number"
                value={pricesInput.normalBoardPrice}
                onChange={(e) => handlePriceChange("normalBoardPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">แผ่นพื้น มอก. (TIS)</label>
              <input
                type="number"
                value={pricesInput.mocBoardPrice}
                onChange={(e) => handlePriceChange("mocBoardPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">แผ่นพื้นกลวง (Hollow Core)</label>
              <input
                type="number"
                value={pricesInput.hcPriceSqm}
                onChange={(e) => handlePriceChange("hcPriceSqm", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            {/* Pile Prices Group */}
            <div className="sm:col-span-2 border-b border-dashed border-neutral-200 py-1.5 pt-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">กลุ่มเสาเข็ม I-Shape ขนาดหน้าเสา (บาท / เมตร)</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มไอ I-15Price</label>
              <input
                type="number"
                value={pricesInput.i15Price}
                onChange={(e) => handlePriceChange("i15Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1 bg-red-50/20 p-2.5 rounded-lg border border-red-500/5">
              <label className="text-xs font-semibold text-neutral-600">I-18 ธรรมดา (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i18NoTISPrice}
                onChange={(e) => handlePriceChange("i18NoTISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1 px-2.5 rounded text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1 bg-red-50/20 p-2.5 rounded-lg border border-red-500/5">
              <label className="text-xs font-semibold text-[#8B0000]">I-18 มอก. (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i18TISPrice}
                onChange={(e) => handlePriceChange("i18TISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1 px-2.5 rounded text-sm font-bold font-mono text-[#8B0000]"
              />
            </div>

            <div className="flex flex-col gap-1 bg-red-50/20 p-2.5 rounded-lg border border-red-500/5">
              <label className="text-xs font-semibold text-neutral-600 font-medium">I-18 ธรรมดา (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.i18JointPrice}
                onChange={(e) => handlePriceChange("i18JointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1 px-2.5 rounded text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1 bg-red-50/20 p-2.5 rounded-lg border border-red-500/5">
              <label className="text-xs font-semibold text-[#8B0000] font-medium">I-18 มอก. (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.i18TISJointPrice}
                onChange={(e) => handlePriceChange("i18TISJointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1 px-2.5 rounded text-sm font-bold font-mono text-[#8B0000]"
              />
            </div>

            <div className="sm:col-span-2 border-b border-neutral-100 my-1"></div>

            <div className="flex flex-col gap-1 bg-[#1976D2]/5 p-2.5 rounded-lg border border-blue-500/5">
              <label className="text-xs font-semibold text-neutral-600">I-22 ธรรมดา (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i22NoTISPrice}
                onChange={(e) => handlePriceChange("i22NoTISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1 px-2.5 rounded text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1 bg-[#1976D2]/5 p-2.5 rounded-lg border border-blue-500/5">
              <label className="text-xs font-semibold text-blue-800">I-22 มอก. (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i22TISPrice}
                onChange={(e) => handlePriceChange("i22TISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1 px-2.5 rounded text-sm font-bold font-mono text-blue-800"
              />
            </div>

            <div className="flex flex-col gap-1 bg-[#1976D2]/5 p-2.5 rounded-lg border border-blue-500/5">
              <label className="text-xs font-semibold text-neutral-600">I-22 ธรรมดา (ท่อนต่อ joint)</label>
              <input
                type="number"
                value={pricesInput.i22JointPrice}
                onChange={(e) => handlePriceChange("i22JointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1 px-2.5 rounded text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1 bg-[#1976D2]/5 p-2.5 rounded-lg border border-blue-500/5">
              <label className="text-xs font-semibold text-blue-800">I-22 มอก. (ท่อนต่อ joint)</label>
              <input
                type="number"
                value={pricesInput.i22TISJointPrice}
                onChange={(e) => handlePriceChange("i22TISJointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-white border border-neutral-200 py-1 px-2.5 rounded text-sm font-bold font-mono text-blue-800"
              />
            </div>

            {/* Higher dimensions I-shapers prices */}
            <div className="sm:col-span-2 border-b border-neutral-100 my-1"></div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">I-26 ธรรมดา (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i26NoTISPrice}
                onChange={(e) => handlePriceChange("i26NoTISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">I-26 มอก. (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i26TISPrice}
                onChange={(e) => handlePriceChange("i26TISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">I-26 ธรรมดา (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.i26NoTISJointPrice}
                onChange={(e) => handlePriceChange("i26NoTISJointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">I-26 มอก. (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.i26TISJointPrice}
                onChange={(e) => handlePriceChange("i26TISJointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            <div className="sm:col-span-2 border-b border-neutral-100 my-1"></div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">I-30 ธรรมดา (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i30NoTISPrice}
                onChange={(e) => handlePriceChange("i30NoTISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">I-30 มอก. (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i30TISPrice}
                onChange={(e) => handlePriceChange("i30TISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">I-30 ธรรมดา (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.i30NoTISJointPrice}
                onChange={(e) => handlePriceChange("i30NoTISJointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">I-30 มอก. (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.i30TISJointPrice}
                onChange={(e) => handlePriceChange("i30TISJointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            <div className="sm:col-span-2 border-b border-neutral-100 my-1"></div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">I-35 มอก. (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i35TISPrice}
                onChange={(e) => handlePriceChange("i35TISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">I-35 มอก. (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.i35TISJointPrice}
                onChange={(e) => handlePriceChange("i35TISJointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">I-40 มอก. (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.i40TISPrice}
                onChange={(e) => handlePriceChange("i40TISPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">I-40 มอก. (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.i40TISJointPrice}
                onChange={(e) => handlePriceChange("i40TISJointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            {/* Fence and HEx */}
            <div className="sm:col-span-2 border-b border-dashed border-neutral-200 py-1.5 pt-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">สเปคเสาเข็มหกเหลี่ยม & เสารั้ว (บาท / เมตร)</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มหกเหลี่ยมกลวง (Hex)</label>
              <input
                type="number"
                value={pricesInput.hexPilePrice}
                onChange={(e) => handlePriceChange("hexPilePrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสารั้วลวดหนามหน้า 3"</label>
              <input
                type="number"
                value={pricesInput.fence3Price}
                onChange={(e) => handlePriceChange("fence3Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสารั้วลวดหนามหน้า 4"</label>
              <input
                type="number"
                value={pricesInput.fence4Price}
                onChange={(e) => handlePriceChange("fence4Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            {/* Solid Square Pile Prices Group */}
            <div className="sm:col-span-2 border-b border-dashed border-neutral-200 py-1.5 pt-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">กลุ่มเสาสี่เหลี่ยมตัน S-Shape (บาท / เมตร)</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-18 (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.s18Price}
                onChange={(e) => handlePriceChange("s18Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-18 (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.s18JointPrice}
                onChange={(e) => handlePriceChange("s18JointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-22 (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.s22Price}
                onChange={(e) => handlePriceChange("s22Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-22 (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.s22JointPrice}
                onChange={(e) => handlePriceChange("s22JointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-26 (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.s26Price}
                onChange={(e) => handlePriceChange("s26Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-26 (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.s26JointPrice}
                onChange={(e) => handlePriceChange("s26JointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-30 (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.s30Price}
                onChange={(e) => handlePriceChange("s30Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-30 (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.s30JointPrice}
                onChange={(e) => handlePriceChange("s30JointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-35 (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.s35Price}
                onChange={(e) => handlePriceChange("s35Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-35 (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.s35JointPrice}
                onChange={(e) => handlePriceChange("s35JointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-40 (ท่อนเดียว)</label>
              <input
                type="number"
                value={pricesInput.s40Price}
                onChange={(e) => handlePriceChange("s40Price", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาสี่เหลี่ยมตัน S-40 (ท่อนต่อ Joint)</label>
              <input
                type="number"
                value={pricesInput.s40JointPrice}
                onChange={(e) => handlePriceChange("s40JointPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            {/* Drainage Pipe Prices Group */}
            <div className="sm:col-span-2 border-b border-dashed border-[#C62828]/20 py-1.5 pt-4">
              <span className="text-xs font-black text-[#C62828] uppercase tracking-wide">กลุ่มท่อระบายน้ำ คสล. (บาท / ท่อน) 🌊</span>
            </div>

            {[
              { size: "0.30", norm: "pipe030NoTISPrice", t3: "pipe030T3Price", t2: "pipe030T2Price" },
              { size: "0.40", norm: "pipe040NoTISPrice", t3: "pipe040T3Price", t2: "pipe040T2Price" },
              { size: "0.50", norm: "pipe050NoTISPrice", t3: "pipe050T3Price", t2: "pipe050T2Price" },
              { size: "0.60", norm: "pipe060NoTISPrice", t3: "pipe060T3Price", t2: "pipe060T2Price" },
              { size: "0.80", norm: "pipe080NoTISPrice", t3: "pipe080T3Price", t2: "pipe080T2Price" },
              { size: "1.00", norm: "pipe100NoTISPrice", t3: "pipe100T3Price", t2: "pipe100T2Price" },
              { size: "1.20", norm: "pipe120NoTISPrice", t3: "pipe120T3Price", t2: "pipe120T2Price" },
              { size: "1.50", norm: "pipe150NoTISPrice", t3: "pipe150T3Price", t2: "pipe150T2Price" }
            ].map((p) => (
              <div key={p.size} className="sm:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-50/60 p-3 rounded-xl border border-neutral-100">
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-neutral-800">ท่อระบายน้ำ ขนาด Ø {p.size} ม.</span>
                  <span className="text-[10px] text-neutral-400">ระบายน้ำ คสล.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500">ราคา ธรรมดา (คสล)</label>
                  <input
                    type="number"
                    value={pricesInput[p.norm as keyof Prices]}
                    onChange={(e) => handlePriceChange(p.norm as keyof Prices, Math.max(0, parseFloat(e.target.value) || 0))}
                    className="bg-white border border-neutral-250 py-1 px-2.5 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500">มอก.3</label>
                    <input
                      type="number"
                      value={pricesInput[p.t3 as keyof Prices]}
                      onChange={(e) => handlePriceChange(p.t3 as keyof Prices, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="bg-white border border-neutral-250 py-1 px-2.5 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500">มอก.2</label>
                    <input
                      type="number"
                      value={pricesInput[p.t2 as keyof Prices]}
                      onChange={(e) => handlePriceChange(p.t2 as keyof Prices, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="bg-white border border-neutral-250 py-1 px-2.5 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Catch Basins Prices Group */}
            <div className="sm:col-span-2 border-b border-dashed border-[#C62828]/20 py-1.5 pt-4">
              <span className="text-xs font-black text-[#C62828] uppercase tracking-wide">กลุ่มบ่อพัก คสล.อัดแรง (บาท / บ่อพัก) 🕳️</span>
            </div>

            {[
              { size: "0.30", field: "basin030Price" },
              { size: "0.40", field: "basin040Price" },
              { size: "0.50", field: "basin050Price" },
              { size: "0.60", field: "basin060Price" },
              { size: "0.80", field: "basin080Price" },
              { size: "1.00", field: "basin100Price" },
              { size: "1.20", field: "basin120Price" }
            ].map((b) => (
              <div key={b.size} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-600">บ่อพัก คสล. ขนาด {b.size} ม.</label>
                <input
                  type="number"
                  value={pricesInput[b.field as keyof Prices]}
                  onChange={(e) => handlePriceChange(b.field as keyof Prices, Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Weights Section */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <div className="p-1.5 bg-red-50 text-[#C62828] rounded-lg">
              <Scale size={16} />
            </div>
            <h4 className="font-semibold text-neutral-800 text-base">น้ำหนักจำเพาะตามสเปคโครงสร้าง (กก. / เมตร)</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* General & S-Piles */}
            <div className="sm:col-span-2 border-b border-dashed border-neutral-200 py-1.5">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">กลุ่มน้ำหนักแผ่นพื้น เสารั้ว และ S-Pile เจาะจง</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">แผ่นพื้นสำเร็จรูป</label>
              <input
                type="number"
                value={weightsInput.slab}
                onChange={(e) => handleWeightChange("slab", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
                step="0.1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสารั้วลวดหนาม 3"</label>
              <input
                type="number"
                value={weightsInput.fence3}
                onChange={(e) => handleWeightChange("fence3", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
                step="0.1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสารั้วลวดหนาม 4"</label>
              <input
                type="number"
                value={weightsInput.fence4}
                onChange={(e) => handleWeightChange("fence4", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
                step="0.1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็ม หกเหลี่ยม</label>
              <input
                type="number"
                value={weightsInput.hex}
                onChange={(e) => handleWeightChange("hex", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
                step="0.1"
              />
            </div>

            {/* S-Piles specifications */}
            <div className="sm:col-span-2 border-b border-neutral-100 my-1"></div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มเหลี่ยม S-18 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.s18}
                onChange={(e) => handleWeightChange("s18", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มเหลี่ยม S-22 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.s22}
                onChange={(e) => handleWeightChange("s22", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มเหลี่ยม S-26 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.s26}
                onChange={(e) => handleWeightChange("s26", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มเหลี่ยม S-30 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.s30}
                onChange={(e) => handleWeightChange("s30", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มเหลี่ยม S-35 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.s35}
                onChange={(e) => handleWeightChange("s35", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มเหลี่ยม S-40 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.s40}
                onChange={(e) => handleWeightChange("s40", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            {/* I-Shape Weights section */}
            <div className="sm:col-span-2 border-b border-dashed border-neutral-200 py-1.5 pt-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">ค่าน้ำหนักมาตรฐานเสาเข็มตัวไอ (I-Shape)</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">ไอ I-15 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.i15}
                onChange={(e) => handleWeightChange("i15", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">ไอ I-18 ธรรมดา (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.i18_no_tis}
                onChange={(e) => handleWeightChange("i18_no_tis", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">ไอ I-18 มอก. (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.i18_tis}
                onChange={(e) => handleWeightChange("i18_tis", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">ไอ I-22 ธรรมดา (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.i22_no_tis}
                onChange={(e) => handleWeightChange("i22_no_tis", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-blue-800">ไอ I-22 มอก. (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.i22_tis}
                onChange={(e) => handleWeightChange("i22_tis", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-blue-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">ไอ I-26 ธรรมดา</label>
              <input
                type="number"
                value={weightsInput.i26_no_tis}
                onChange={(e) => handleWeightChange("i26_no_tis", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">ไอ I-26 มอก.</label>
              <input
                type="number"
                value={weightsInput.i26_tis}
                onChange={(e) => handleWeightChange("i26_tis", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">ไอ I-30 ธรรมดา</label>
              <input
                type="number"
                value={weightsInput.i30_no_tis}
                onChange={(e) => handleWeightChange("i30_no_tis", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#8B0000]">ไอ I-30 มอก.</label>
              <input
                type="number"
                value={weightsInput.i30_tis}
                onChange={(e) => handleWeightChange("i30_tis", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono text-[#8B0000]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มไอ I-35 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.i35}
                onChange={(e) => handleWeightChange("i35", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-600">เสาเข็มไอ I-40 (กก./ม.)</label>
              <input
                type="number"
                value={weightsInput.i40}
                onChange={(e) => handleWeightChange("i40", Math.max(0, parseFloat(e.target.value) || 0))}
                className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
              />
            </div>

            {/* Drainage Pipe Weights Group */}
            <div className="sm:col-span-2 border-b border-dashed border-[#C62828]/20 py-1.5 pt-4">
              <span className="text-xs font-black text-[#C62828] uppercase tracking-wide">ค่าน้ำหนักท่อระบายน้ำ คสล. (กก. / ท่อน) 🌊</span>
            </div>

            {[
              { size: "0.30", norm: "pipe030Weight", t3: "pipe030T3Weight", t2: "pipe030T2Weight" },
              { size: "0.40", norm: "pipe040Weight", t3: "pipe040T3Weight", t2: "pipe040T2Weight" },
              { size: "0.50", norm: "pipe050Weight", t3: "pipe050T3Weight", t2: "pipe050T2Weight" },
              { size: "0.60", norm: "pipe060Weight", t3: "pipe060T3Weight", t2: "pipe060T2Weight" },
              { size: "0.80", norm: "pipe080Weight", t3: "pipe080T3Weight", t2: "pipe080T2Weight" },
              { size: "1.00", norm: "pipe100Weight", t3: "pipe100T3Weight", t2: "pipe100T2Weight" },
              { size: "1.20", norm: "pipe120Weight", t3: "pipe120T3Weight", t2: "pipe120T2Weight" },
              { size: "1.50", norm: "pipe150Weight", t3: "pipe150T3Weight", t2: "pipe150T2Weight" }
            ].map((w) => (
              <div key={w.size} className="sm:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-50/60 p-3 rounded-xl border border-neutral-100">
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-neutral-800">น้ำหนักท่อขนาด Ø {w.size} ม.</span>
                  <span className="text-[10px] text-neutral-400">น้ำหนัก คสล. (ก.ก.)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-500">น้ำหนัก คสล. ปกติ</label>
                  <input
                    type="number"
                    value={weightsInput[w.norm as keyof Weights]}
                    onChange={(e) => handleWeightChange(w.norm as keyof Weights, Math.max(0, parseFloat(e.target.value) || 0))}
                    className="bg-white border border-neutral-250 py-1 px-2.5 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500">มอก.3</label>
                    <input
                      type="number"
                      value={weightsInput[w.t3 as keyof Weights]}
                      onChange={(e) => handleWeightChange(w.t3 as keyof Weights, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="bg-white border border-neutral-250 py-1 px-2.5 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-500">มอก.2</label>
                    <input
                      type="number"
                      value={weightsInput[w.t2 as keyof Weights]}
                      onChange={(e) => handleWeightChange(w.t2 as keyof Weights, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="bg-white border border-neutral-250 py-1 px-2.5 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Catch Basins Weights Group */}
            <div className="sm:col-span-2 border-b border-dashed border-[#C62828]/20 py-1.5 pt-4">
              <span className="text-xs font-black text-[#C62828] uppercase tracking-wide">ค่าน้ำหนักบ่อพัก คสล.อัดแรง (กก. / บ่อพัก) 🕳️</span>
            </div>

            {[
              { size: "0.30", field: "basin030Weight" },
              { size: "0.40", field: "basin040Weight" },
              { size: "0.50", field: "basin050Weight" },
              { size: "0.60", field: "basin060Weight" },
              { size: "0.80", field: "basin080Weight" },
              { size: "1.00", field: "basin100Weight" },
              { size: "1.20", field: "basin120Weight" }
            ].map((wb) => (
              <div key={wb.size} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-600">บ่อพัก คสล. ขนาด {wb.size} ม.</label>
                <input
                  type="number"
                  value={weightsInput[wb.field as keyof Weights]}
                  onChange={(e) => handleWeightChange(wb.field as keyof Weights, Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-neutral-50 border border-neutral-200 py-1.5 px-3 rounded-lg text-sm font-semibold font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Persistent Save Button wrapper */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 p-2">
        <button
          onClick={handleDownloadSingleHTML}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-900 active:scale-98 transition text-white font-bold py-3.5 px-5 rounded-xl shadow-md border-b-2 border-neutral-950 text-sm md:text-base"
          title="ดาวน์โหลดทั้งแอปนี้เป็นไฟล์ HTML ไฟล์เดียวไปเปิดใช้ออฟไลน์ได้ทันที"
        >
          <Download size={18} />
          ดาวน์โหลดไฟล์เดี่ยว (.html) แลกเปลี่ยนออฟไลน์
        </button>
        <button
          onClick={saveToLocal}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#C62828] hover:bg-[#b71c1c] active:scale-98 transition text-white font-bold py-3.5 px-8 rounded-xl shadow-md border-b-2 border-red-800 text-sm md:text-base"
        >
          <Save size={18} />
          บันทึกการตั้งค่าทั้งหมดลงระบบคลาวด์
        </button>
      </div>

      {/* DYNAMIC DRAFT DOCUMENT TO CAPTURE - HIDDEN/VISIBLE ONLY ON EMISSION */}
      <div className="absolute" style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "820px", height: "auto", overflow: "visible" }}>
        <div
          ref={reportRef}
          className="w-[800px] p-10 bg-white font-sans text-neutral-800 relative space-y-8"
          style={{ fontFamily: "'Kanit', sans-serif" }}
        >
          {/* Header decorative */}
          <div className="flex items-start justify-between border-b-4 border-[#C62828] pb-6">
            <div>
              <h1 className="text-2xl font-black text-[#C62828] tracking-tight uppercase">
                PONGSAKUL HARDWARE COMPANY LIMITED
              </h1>
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                Concrete and Prestressed Slab Prestressed Material Catalog ({APP_VERSION})
              </span>
              <p className="text-sm text-neutral-600 font-medium mt-1">
                บริษัท พงษ์สกุลฮาร์ดแวร์ จำกัด
              </p>
            </div>
            <div className="text-right">
              <span className="bg-[#C62828]/10 text-[#C62828] font-bold text-xs py-1 px-3 rounded-full">
                แค็ตตาล็อกอัตราราคากลาง
              </span>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                พิมพ์บิลสะสม: {new Date().toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#8B0000] border-b border-neutral-200 pb-1">
              ตารางกำหนดราคาส่งมอบมาตรฐาน (ภาษีมูลค่าเพิ่มกำหนดอัตรา {pricesInput.vatPercent}%)
            </h2>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium">แผ่นพื้นสำเร็จรูปธรรมดา (กว้าง 0.35ม.):</span>
                  <strong className="text-neutral-900 font-bold">฿{fmt(pricesInput.normalBoardPrice)} / ตร.ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium">แผ่นพื้นสำเร็จรูป มอก.:</span>
                  <strong className="text-neutral-900 font-bold">฿{fmt(pricesInput.mocBoardPrice)} / ตร.ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium">แผ่นพื้นกลวง (Hollow Core Standard):</span>
                  <strong className="text-neutral-900 font-bold">฿{fmt(pricesInput.hcPriceSqm)} / ตร.ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium">เสาเข็มหน้าไอ I-15:</span>
                  <strong className="text-neutral-900 font-bold">฿{fmt(pricesInput.i15Price)} / เมตร</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium">เสาเข็มหกเหลี่ยมกลวง (Hex):</span>
                  <strong className="text-neutral-900 font-bold">฿{fmt(pricesInput.hexPilePrice)} / เมตร</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium">เสารั้วหน้า 3 นิ้ว:</span>
                  <strong className="text-neutral-900 font-bold">฿{fmt(pricesInput.fence3Price)} / เมตร</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium">เสารั้วหน้า 4 นิ้ว:</span>
                  <strong className="text-neutral-900 font-bold">฿{fmt(pricesInput.fence4Price)} / เมตร</strong>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium text-xs">ไอ I-18 ธรรมดา (ท่อนเดียว):</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.i18NoTISPrice)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-[#8B0000] font-semibold text-xs">ไอ I-18 มอก. (ท่อนเดียว):</span>
                  <strong className="text-[#8B0000] font-bold font-mono">฿{fmt(pricesInput.i18TISPrice)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium text-xs">ไอ I-18 ธรรมดา (ท่อนต่อ):</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.i18JointPrice)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-[#8B0000] font-semibold text-xs">ไอ I-18 มอก. (ท่อนต่อ):</span>
                  <strong className="text-[#8B0000] font-bold font-mono">฿{fmt(pricesInput.i18TISJointPrice)} / ม.</strong>
                </div>

                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5 pt-1.5">
                  <span className="text-neutral-500 font-medium text-xs">ไอ I-22 ธรรมดา (ท่อนเดียว):</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.i22NoTISPrice)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-[#8B0000] font-semibold text-xs">ไอ I-22 มอก. (ท่อนเดียว):</span>
                  <strong className="text-[#8B0000] font-bold font-mono">฿{fmt(pricesInput.i22TISPrice)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-neutral-500 font-medium text-xs">ไอ I-22 ธรรมดา (ท่อนต่อ):</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.i22JointPrice)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                  <span className="text-[#8B0000] font-semibold text-xs">ไอ I-22 มอก. (ท่อนต่อ):</span>
                  <strong className="text-[#8B0000] font-bold font-mono">฿{fmt(pricesInput.i22TISJointPrice)} / ม.</strong>
                </div>
              </div>
            </div>

            {/* S-Shape Piles Catalog block */}
            <div className="border-t border-neutral-100 pt-4 space-y-2">
              <h3 className="text-xs font-bold text-[#8B0000] uppercase tracking-wider">
                กลุ่มเสาสี่เหลี่ยมตัน S-Shape (Solid Square Pile - สำหรับงานโครงสร้างหลัก)
              </h3>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
                  <span className="text-neutral-500 font-medium">เสาสี่เหลี่ยมตัน S-18:</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.s18Price)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
                  <span className="text-neutral-500 font-medium">เสาสี่เหลี่ยมตัน S-22:</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.s22Price)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
                  <span className="text-neutral-500 font-medium">เสาสี่เหลี่ยมตัน S-26:</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.s26Price)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
                  <span className="text-neutral-500 font-medium">เสาสี่เหลี่ยมตัน S-30:</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.s30Price)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
                  <span className="text-neutral-500 font-medium">เสาสี่เหลี่ยมตัน S-35:</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.s35Price)} / ม.</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
                  <span className="text-neutral-500 font-medium">เสาสี่เหลี่ยมตัน S-40:</span>
                  <strong className="text-neutral-900 font-semibold font-mono">฿{fmt(pricesInput.s40Price)} / ม.</strong>
                </div>
              </div>
            </div>

            <div className="border border-neutral-150 p-4 rounded-xl bg-neutral-50 text-xs">
              <span className="font-bold block text-neutral-800 mb-1">ข้อพิจารณาและการใช้งาน</span>
              <p className="text-neutral-500 leading-relaxed">
                ราคาระบุข้างต้นเป็นราคาอ้างอิงส่งมอบมาตรฐานโรงงาน ไม่รวมค่าแรงติดตั้งหรือค่าแรงงานขุดเจาะ ค่าพาหนะขนส่งขึ้นอยู่กับระยะทางการจัดส่งหน้างาน และปริมาตรรถบรรทุกที่เหมาะสม
              </p>
            </div>
          </div>

          {/* Footer brand */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-100 pt-6">
            <span>เอกสารสารประโยชน์ราคากลางภายในบริษัท พงษ์สกุลคอนกรีต จำกัด</span>
            <span>{APP_VERSION} | ออกโดยระบบอัตโนมัติ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
