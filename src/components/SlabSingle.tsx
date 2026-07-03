import React, { Dispatch, SetStateAction } from "react";
import { AppSettings, WeightItem } from "../types";
import { Hammer, Check } from "lucide-react";
import SlabVisualizer from "./SlabVisualizer";

interface SlabSingleProps {
  settings: AppSettings;
  boardType: string;
  setBoardType: Dispatch<SetStateAction<string>>;
  customPrice: number | "";
  setCustomPrice: Dispatch<SetStateAction<number | "">>;
  length: number | "";
  setLength: Dispatch<SetStateAction<number | "">>;
  autoWireAdjust: boolean;
  setAutoWireAdjust: Dispatch<SetStateAction<boolean>>;
  wireCount: string;
  setWireCount: Dispatch<SetStateAction<string>>;
  totalArea: number | "";
  setTotalArea: Dispatch<SetStateAction<number | "">>;
  finalPrice: number;
  step: number;
  loadCapacity: number;
  boardCount: number;
  totalAreaVal: number;
  boardArea: number;
  totalWeight: number;
}

export default function SlabSingle({
  settings,                boardType,      setBoardType,
  customPrice,             setCustomPrice, length,      setLength,
  autoWireAdjust,          setAutoWireAdjust, wireCount, setWireCount,
  totalArea,               setTotalArea,   finalPrice,  step,
  loadCapacity,            boardCount,     totalAreaVal, boardArea,
  totalWeight
}: SlabSingleProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Input Panel */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between space-y-5">
        <div>
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-100">
            <div className="p-2 bg-red-50 text-[#C62828] rounded-lg">
              <Hammer size={18} />
            </div>
            <h3 className="font-semibold text-neutral-800 text-lg">ข้อมูลการคำนวณแผ่นพื้นเดี่ยว</h3>
          </div>

          <div className="space-y-4">
            {/* Board Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700">ชนิดแผ่นพื้น</label>
              <select
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
                className="w-full p-3 bg-neutral-50 hover:bg-neutral-100 transition border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="normal">แผ่นพื้นธรรมดา</option>
                <option value="m.o.c">แผ่นพื้น มอก. (TIS)</option>
                <option value="custom">แผ่นพื้นธรรมดา (กำหนดราคาเอง)</option>
                <option value="m.o.c_custom">แผ่นพื้น มอก. (กำหนดราคาเอง)</option>
              </select>
            </div>

            {/* Custom price inputs if boardType has custom prefix */}
            {(boardType === "custom" || boardType === "m.o.c_custom") && (
              <div className="flex flex-col gap-1.5 bg-red-50/50 p-4 rounded-xl border border-red-100">
                <label className="text-sm font-semibold text-[#8B0000]">ราคานำเข้า (บาท/ตร.ม. ไม่รวมลวด ตั้งต้น)</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomPrice(val === "" ? "" : parseFloat(val));
                  }}
                  className="w-full p-3 bg-white border border-red-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                  placeholder="ใส่ราคาตั้งต้นเอง"
                />
              </div>
            )}

            {/* Length input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700 flex justify-between">
                <span>ความยาวแผ่น (เมตร)</span>
                <span className="text-xs text-neutral-500 font-mono">ขอบเขตแนะนำ: 1.0 - 5.0 ม.</span>
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => {
                  const val = e.target.value;
                  setLength(val === "" ? "" : parseFloat(val));
                }}
                step="0.1"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                placeholder="เช่น 2.0"
              />
            </div>

            {/* Toggle switch for auto wire alignment */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-150 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-neutral-800">การปรับจำนวนลวดอัตโนมัติ</span>
                <span className="text-xs text-neutral-500">
                  {autoWireAdjust ? "อ้างอิงกำลังรับตามความยาวแผ่น" : "กำหนดค่าด้วยตนเองทีละสเปค"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoWireAdjust(!autoWireAdjust)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoWireAdjust ? "bg-[#C41C1C]" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoWireAdjust ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Wire Count Select List */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700">จำนวนลวดสายอัดแรง (PC Wire)</label>
              <select
                disabled={autoWireAdjust}
                value={wireCount}
                onChange={(e) => setWireCount(e.target.value)}
                className={`w-full p-3 border rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 ${
                  autoWireAdjust
                    ? "bg-neutral-150 border-neutral-200 text-neutral-400 cursor-not-allowed"
                    : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                <option value="4">ลวด 4 เส้น (เล็ก)</option>
                <option value="5">ลวด 5 เส้น</option>
                <option value="6">ลวด 6 เส้น</option>
                <option value="7">ลวด 7 เส้น (ใหญ่)</option>
                <option value="8">ลวด 8 เส้น</option>
                <option value="5_mm_5">ลวด 5 มม. (5 เส้น)</option>
              </select>
            </div>

            {/* Total Area */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700">
                พื้นที่ติดตั้งรวมที่ต้องการทั้งหมด (ตร.ม.)
              </label>
              <input
                type="number"
                value={totalArea}
                onChange={(e) => {
                  const val = e.target.value;
                  setTotalArea(val === "" ? "" : parseFloat(val));
                }}
                step="0.1"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                placeholder="เช่น 10.0"
              />
            </div>
          </div>
        </div>

        {/* SVG Visual Model Projection inside Slab */}
        <SlabVisualizer length={typeof length === "number" ? length : 2.0} wireCount={wireCount} />
      </div>

      {/* Calculation Summary Panel */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-gradient-to-br from-[#E53935] to-[#B71C1C] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between h-full min-h-[350px]">
          <div>
            <span className="text-xs font-semibold bg-white/20 text-white py-1 px-3 rounded-full uppercase tracking-wider">
              ผลการคำนวณแผ่นพื้น
            </span>
            <div className="mt-6">
              <span className="text-lg opacity-85 block">ราคาต่อแผ่น</span>
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                ฿{finalPrice.toFixed(0)}
              </span>
              <span className="text-lg opacity-85 block mt-1 font-light">
                (กว้าง 35 ซม. x ยาว {typeof length === "number" ? length.toFixed(2) : "2.00"} เมตร)
              </span>
            </div>
          </div>

          <div className="border-t border-white/20 pt-5 mt-6 space-y-3 font-light text-neutral-100">
            <div className="flex justify-between items-center text-sm">
              <span>สเปคลวดแผ่นพื้น:</span>
              <strong className="text-white font-semibold">
                {wireCount === "5_mm_5" ? "ลวด 5 มม. (5 เส้น)" : `ลวด PC ${wireCount} เส้น`}
              </strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>อัตราประมาณการ (Step):</span>
              <strong className="text-white font-semibold">฿{step} / ตร.ม.</strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>ความสามารถการรับน้ำหนักสูงสุด:</span>
              <strong className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-xs">{loadCapacity} กก./ตร.ม.</strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>จำนวนแผ่นที่แนะนำ:</span>
              <strong className="text-white font-semibold text-base">{boardCount} แผ่น</strong>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/15 pt-2">
              <span>ประมาณการน้ำหนักรวมทั้งหมด:</span>
              <strong className="text-amber-300 font-bold text-base">{totalWeight.toFixed(0)} กก.</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
