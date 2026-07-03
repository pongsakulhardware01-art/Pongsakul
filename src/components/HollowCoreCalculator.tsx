import { useState, useEffect } from "react";
import { AppSettings } from "../types";
import { fmt, roundToBeautifulPrice } from "../utils";
import { Hammer, Sparkles } from "lucide-react";

interface HollowCoreCalculatorProps {
  settings: AppSettings;
}

export default function HollowCoreCalculator({ settings }: HollowCoreCalculatorProps) {
  // Auto round prices state (sharing via localStorage)
  const [autoRoundPrice, setAutoRoundPrice] = useState<boolean>(() => {
    return localStorage.getItem("pongsakulAutoRoundPrice") === "true";
  });

  const toggleAutoRoundPrice = () => {
    const newVal = !autoRoundPrice;
    setAutoRoundPrice(newVal);
    localStorage.setItem("pongsakulAutoRoundPrice", String(newVal));
    window.dispatchEvent(new Event("storage_round_price"));
  };

  useEffect(() => {
    const syncVal = () => {
      setAutoRoundPrice(localStorage.getItem("pongsakulAutoRoundPrice") === "true");
    };
    window.addEventListener("storage_round_price", syncVal);
    return () => window.removeEventListener("storage_round_price", syncVal);
  }, []);

  const [hcWidth, setHcWidth] = useState<number | "">(0.35);
  const [hcLength, setHcLength] = useState<number | "">(4.0);
  const [hcPricePerSqm, setHcPricePerSqm] = useState<string>("");
  const [hcVatMode, setHcVatMode] = useState<string>("no");
  const [hcVatPercent, setHcVatPercent] = useState<number | "">(7.0);
  const [hcAdditionalPrice, setHcAdditionalPrice] = useState<number | "">(0);

  const calcHcWidth = hcWidth === "" ? 0 : hcWidth;
  const calcHcLength = hcLength === "" ? 0 : hcLength;
  const calcHcAdditionalPrice = hcAdditionalPrice === "" ? 0 : hcAdditionalPrice;
  const calcHcVatPercent = hcVatPercent === "" ? 0 : hcVatPercent;

  const selectedPricePerSqm = hcPricePerSqm === "" ? settings.prices.hcPriceSqm : parseFloat(hcPricePerSqm) || 0;
  const sqm = calcHcWidth * calcHcLength;
  const priceBeforeVat = selectedPricePerSqm * sqm;
  
  const isVat = hcVatMode === "yes";
  const vatAmount = isVat ? priceBeforeVat * (calcHcVatPercent / 100) : 0;
  const rawTotalPrice = priceBeforeVat + vatAmount + calcHcAdditionalPrice;
  const totalPrice = autoRoundPrice ? roundToBeautifulPrice(rawTotalPrice) : rawTotalPrice;

  const weightPerMeter = settings.weights.slab * 2;
  const totalWeight = weightPerMeter * calcHcLength;

  // Determine standard number of tube holes for SVG visualization based on width
  let holesCount = 4;
  if (calcHcWidth <= 0.45) holesCount = 3;
  else if (calcHcWidth <= 0.7) holesCount = 5;
  else holesCount = 8;

  return (
    <div className="space-y-6">
      {/* Options dashboard panel */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-150 text-[#C62828] rounded-xl">
            <Hammer size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-neutral-800 text-sm md:text-base">คำนวณราคาแผ่นพื้นกลวงพิกัดพิเศษ (Hollow Core) 🕳️</h3>
            <p className="text-xs text-neutral-500 font-light">ระบบเลือกหน้ายางและบวกรวมภาษีและค่าดำเนินการอัตราร่วม</p>
          </div>
        </div>

        {/* Beautiful Auto-Round Price Toggle Button */}
        <button
          onClick={toggleAutoRoundPrice}
          className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold border transition duration-150 shadow-sm cursor-pointer w-full sm:w-auto ${
            autoRoundPrice
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-600"
              : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600"
          }`}
          title="ปันเศษราคาขึ้นให้ลงท้ายด้วย 5 หรือ 0 เพื่อเสนอราคาพิกัดรวมสวยๆ ให้ลูกค้า"
        >
          <Sparkles size={14} className={autoRoundPrice ? "animate-spin text-white" : "text-amber-500"} />
          <span>🪄 ปรับราคาสวยอัตโนมัติ (ปัดขึ้นลงท้าย 5/0): {autoRoundPrice ? "เปิดใช้งาน ✅" : "ปิดอยู่ ❌"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Inputs side */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between space-y-5">
        <div>
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-100">
            <div className="p-2 bg-red-50 text-[#C62828] rounded-lg">
              <Hammer size={18} />
            </div>
            <h3 className="font-semibold text-neutral-800 text-lg">สเปคแผ่นพื้นกลวง (Hollow Core)</h3>
          </div>

          <div className="space-y-4">
            {/* Width Selector / Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700 flex justify-between">
                <span>ความกว้างของแผ่นพื้นกลวง (เมตร)</span>
                <span className="text-xs text-[#C62828] font-bold">ควรอิงตามจริง: 0.35, 0.60, 1.20</span>
              </label>
              <input
                type="number"
                value={hcWidth}
                onChange={(e) => {
                  const val = e.target.value;
                  setHcWidth(val === "" ? "" : parseFloat(val));
                }}
                step="0.01"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                placeholder="ระบุความกว้าง เช่น 0.35, 0.60, 1.20"
              />
            </div>

            {/* Length parameter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#37474F] flex justify-between">
                <span>ความยาวแผ่น (เมตร)</span>
                <span className="text-xs text-neutral-500 font-mono">ใส่แบบทศนิยมได้</span>
              </label>
              <input
                type="number"
                value={hcLength}
                onChange={(e) => {
                  const val = e.target.value;
                  setHcLength(val === "" ? "" : parseFloat(val));
                }}
                step="0.1"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                placeholder="เช่น 4.0"
              />
            </div>

            {/* Custom pricing */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#37474F] flex justify-between">
                <span>ราคาสัญญาตั้งไว้ (บาท / ตร.ม.)</span>
                <span className="text-xs text-neutral-500 font-medium">เว้นว่างไว้จะอิงจากเมนูตั้งค่าราคากลาง ฿{settings.prices.hcPriceSqm}</span>
              </label>
              <input
                type="number"
                value={hcPricePerSqm}
                onChange={(e) => setHcPricePerSqm(e.target.value)}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                placeholder={`ราคากลางบิลหลัก: ${settings.prices.hcPriceSqm} บาท/ตร.ม.`}
              />
            </div>

            {/* Additional expense */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#37474F]">ค่าพาหนะขนส่ง หรือค่าดำเนินการบวกเพิ่ม (บาท)</label>
              <input
                type="number"
                value={hcAdditionalPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  setHcAdditionalPrice(val === "" ? "" : parseFloat(val));
                }}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                placeholder="เช่น 500"
              />
            </div>

            {/* Tax Settings row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#37474F]">ภาษีมูลค่าเพิ่ม (VAT)</label>
                <select
                  value={hcVatMode}
                  onChange={(e) => setHcVatMode(e.target.value)}
                  className="w-full p-3 bg-neutral-50 hover:bg-neutral-100 transition border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                >
                  <option value="no">ไม่รวมภาษีมูลค่าเพิ่ม</option>
                  <option value="yes">รวมภาษีมูลค่าเพิ่ม (VAT)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#37474F]">สัดส่วนอัตรา (%)</label>
                <input
                  type="number"
                  disabled={hcVatMode !== "yes"}
                  value={hcVatPercent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHcVatPercent(val === "" ? "" : parseFloat(val));
                  }}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#C62828]"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Hollow Core Profile Illustration SVG */}
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-150 flex flex-col items-center justify-center gap-2">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">แผ่นพื้นกลวง ภาคตัดขวางเชิงภาพ</span>
          <svg width="220" height="70" viewBox="0 0 220 70">
            {/* Outer slab box */}
            <rect x="10" y="15" width="200" height="30" rx="3" fill="#D4D4D8" stroke="#71717A" strokeWidth="2.5" />
            {/* Draw hollow tubes holes */}
            {Array.from({ length: holesCount }).map((_, idx) => {
              const gapWidth = 200 / (holesCount + 1);
              const cx = 10 + gapWidth * (idx + 1);
              return (
                <circle key={idx} cx={cx} cy="30" r="8" fill="#F4F4F5" stroke="#A1A1AA" strokeWidth="1.5" />
              );
            })}
            {/* Bottom tension wires strands */}
            {Array.from({ length: holesCount + 1 }).map((_, idx) => {
              const gapWidth = 200 / (holesCount + 2);
              const cx = 10 + gapWidth * (idx + 1);
              return (
                <circle key={idx} cx={cx} cy="41" r="1.5" fill="#F59E0B" />
              );
            })}
            <text x="110" y="60" fill="#71717A" fontSize="9" textAnchor="middle" fontFamily="Kanit">
              กว้าง {calcHcWidth} ม. | ช่องกลวงระบายอากาศ {holesCount} ช่อง
            </text>
          </svg>
        </div>
      </div>

      {/* Result summary side */}
      <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
        <div className="bg-gradient-to-br from-[#E53935] to-[#B71C1C] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between h-full min-h-[350px]">
          <div>
            <span className="text-xs font-semibold bg-white/20 text-white py-1 px-3 rounded-full uppercase tracking-wider">
              ผลการประมาณราคาหล่อเสร็จแผ่นพื้นกลวง
            </span>
            <div className="mt-6">
              <span className="text-lg opacity-85 block">ยอดราคารวมสุทธิ</span>
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                ฿{fmt(totalPrice)}
              </span>
              <span className="text-sm opacity-85 block mt-2 font-light">
                (ฐานพื้นที่สุทธิ: {fmt(sqm)} ตร.ม.)
              </span>
            </div>
          </div>

          <div className="border-t border-white/20 pt-5 mt-6 space-y-3 font-light text-neutral-100">
            <div className="flex justify-between items-center text-sm">
              <span>ราคากลาง (ต่อ ตร.ม.):</span>
              <strong className="text-white font-semibold">฿{fmt(selectedPricePerSqm)} / ตร.ม.</strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>ฐานราคากลุ่มมูลค่าสินค้า:</span>
              <strong className="text-white font-semibold">฿{fmt(priceBeforeVat)}</strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>อัตราภาษีมูลค่าเพิ่ม:</span>
              <span className="text-white font-semibold">
                {isVat ? `฿${fmt(vatAmount)} (VAT ${hcVatPercent}%)` : "ไม่มีแวทสินค้า"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>ค่าดำเนินการขนส่งบวกเพิ่ม:</span>
              <strong className="text-white font-semibold">฿{fmt(hcAdditionalPrice)}</strong>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/15 pt-2">
              <span>หน้านิยามน้ำหนักต้านทาน:</span>
              <span className="text-amber-300 font-bold text-base">{fmt(totalWeight)} กก.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
