import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { AppSettings, WeightItem } from "../types";
import { fmt, roundToBeautifulPrice } from "../utils";
import { Hammer, Sparkles, Scale, Info } from "lucide-react";
import { motion } from "motion/react";

interface DrainageCalculatorProps {
  settings: AppSettings;
  weightItems: WeightItem[];
  setWeightItems: Dispatch<SetStateAction<WeightItem[]>>;
  onNavigateToWeight: () => void;
}

export default function DrainageCalculator({ settings, weightItems, setWeightItems, onNavigateToWeight }: DrainageCalculatorProps) {
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

  const [itemCategory, setItemCategory] = useState<"pipe" | "basin">("pipe");
  const [pipeSize, setPipeSize] = useState<string>("0.30");
  const [basinSize, setBasinSize] = useState<string>("0.30");
  const [pipeStandard, setPipeStandard] = useState<"norm" | "t3" | "t2">("norm");
  const [quantity, setQuantity] = useState<number | " text-center">(10);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [additionalPrice, setAdditionalPrice] = useState<number | "">(0);
  const [addedNotification, setAddedNotification] = useState<string | null>(null);

  // Get active configurations depending on selected category & size
  const getPipeDetails = (size: string, std: "norm" | "t3" | "t2") => {
    const suffix = size.replace(".", ""); // "030", "040", etc
    const priceKey = `pipe${suffix}${std === "norm" ? "NoTIS" : (std === "t3" ? "T3" : "T2")}Price` as keyof typeof settings.prices;
    const weightKey = `pipe${suffix}${std === "norm" ? "" : (std === "t3" ? "T3" : "T2")}Weight` as keyof typeof settings.weights;

    return {
      price: settings.prices[priceKey] || 0,
      weight: settings.weights[weightKey] || 0,
      priceKey,
      weightKey,
      label: `ท่อ คสล. Ø ${size} ม. ${std === "norm" ? "(ธรรมดา)" : (std === "t3" ? "(มอก.3)" : "(มอก.2)")}`
    };
  };

  const getBasinDetails = (size: string) => {
    const suffix = size.replace(".", "");
    const priceKey = `basin${suffix}Price` as keyof typeof settings.prices;
    const weightKey = `basin${suffix}Weight` as keyof typeof settings.weights;

    return {
      price: settings.prices[priceKey] || 0,
      weight: settings.weights[weightKey] || 0,
      priceKey,
      weightKey,
      label: `บ่อพัก คสล. ขนาด ${size} ม.`
    };
  };

  const activeDetails = itemCategory === "pipe" 
    ? getPipeDetails(pipeSize, pipeStandard) 
    : getBasinDetails(basinSize);

  const calcPricePerUnit = customPrice === "" ? activeDetails.price : parseFloat(customPrice) || 0;
  const calcQty = quantity === "" ? 0 : quantity;
  const calcAdditionalPrice = additionalPrice === "" ? 0 : additionalPrice;

  const priceBeforeVat = calcPricePerUnit * calcQty;
  const vatAmount = priceBeforeVat * (settings.prices.vatPercent / 100);
  const rawTotalPrice = priceBeforeVat + vatAmount + calcAdditionalPrice;
  const totalPrice = autoRoundPrice ? roundToBeautifulPrice(rawTotalPrice) : rawTotalPrice;

  // Total weight
  const totalWeight = activeDetails.weight * calcQty;

  const handleAddToWeightList = () => {
    const weightValKey = itemCategory === "pipe" 
      ? `pipe${pipeSize.replace(".", "")}${pipeStandard === "norm" ? "" : (pipeStandard === "t3" ? "_t3" : "_t2")}`
      : `basin${basinSize.replace(".", "")}`;

    // Add directly to persistent items list in App.tsx
    const newItem: WeightItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: weightValKey,
      count: calcQty || 10,
      length: 1.0, // forced
      unitWeight: activeDetails.weight
    };

    setWeightItems((prev) => [...prev, newItem]);
    
    setAddedNotification(`เพิ่ม "${activeDetails.label}" ไปยังตารางวิศวกรรมขนส่งเรียบร้อย!`);
    setTimeout(() => setAddedNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Options dashboard banner */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-150 text-[#C62828] rounded-xl">
            <Hammer size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-neutral-800 text-sm md:text-base">คำนวณราคาท่อระบายน้ำและบ่อพัก คสล.อัดแรง 🌊</h3>
            <p className="text-xs text-neutral-500 font-light">ตรรกะคำนวณราคาท่อมาตรฐาน มอก. แหล่งรับน้ำเสีย และบ่อพักพงษ์สกุล</p>
          </div>
        </div>

        <button
          onClick={toggleAutoRoundPrice}
          className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold border transition duration-150 shadow-sm cursor-pointer w-full sm:w-auto ${
            autoRoundPrice
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-600"
              : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600"
          }`}
        >
          <Sparkles size={14} className={autoRoundPrice ? "animate-spin text-white" : "text-amber-500"} />
          <span>🪄 ปรับราคาสวยอัตโนมัติ: {autoRoundPrice ? "เปิดใช้งาน ✅" : "ปิดอยู่ ❌"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs side */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-100">
              <div className="p-2 bg-red-50 text-[#C62828] rounded-lg">
                <Hammer size={18} />
              </div>
              <h3 className="font-semibold text-neutral-800 text-lg">สเปคท่อและบ่อพักระบายน้ำ</h3>
            </div>

            {addedNotification && (
              <div className="mb-4 bg-emerald-50 text-emerald-800 px-4 py-3 rounded-xl border border-emerald-100 text-xs font-bold flex justify-between items-center animate-fade-in">
                <span>{addedNotification}</span>
                <button 
                  onClick={onNavigateToWeight} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-[11px] transition"
                >
                  เปิดตารางน้ำหนักสะสม &rarr;
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-neutral-700">หมวดหมู่ผลิตภัณฑ์</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setItemCategory("pipe");
                      setCustomPrice("");
                    }}
                    className={`py-3 px-4 rounded-xl font-bold text-center border transition text-sm ${
                      itemCategory === "pipe"
                        ? "bg-[#C62828] text-white border-[#C62828]"
                        : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                    }`}
                  >
                    🌊 ท่อระบายน้ำ คสล.
                  </button>
                  <button
                    onClick={() => {
                      setItemCategory("basin");
                      setCustomPrice("");
                    }}
                    className={`py-3 px-4 rounded-xl font-bold text-center border transition text-sm ${
                      itemCategory === "basin"
                        ? "bg-[#C62828] text-white border-[#C62828]"
                        : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                    }`}
                  >
                    🕳️ บ่อพัก คสล.สำเร็จรูป
                  </button>
                </div>
              </div>

              {/* Dynamic size dropdown depending on category */}
              {itemCategory === "pipe" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-neutral-700 flex justify-between">
                      <span>ขนาดเส้นผ่านศูนย์กลางท่อ (ม.)</span>
                      <span className="text-xs text-neutral-400">Ø มอก./คสล.</span>
                    </label>
                    <select
                      value={pipeSize}
                      onChange={(e) => {
                        setPipeSize(e.target.value);
                        setCustomPrice("");
                      }}
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800"
                    >
                      <option value="0.30">Ø 0.30 ม. (ปกติใช้ล้อมบ่อน้ำข้น/ส่งผ่านเขตสวน)</option>
                      <option value="0.40">Ø 0.40 ม. (ระบายน้ำไหลเบา แถวถนนในซอย)</option>
                      <option value="0.50">Ø 0.50 ม. (ระบายน้ำมาตรฐานโครงสร้างจัดสรร)</option>
                      <option value="0.60">Ø 0.60 ม. (ท่อผ่านเขตขนานใหญ่ ยอดฮิต)</option>
                      <option value="0.80">Ø 0.80 ม. (ขยายพิกัดลำระบายชุมชนหลัก)</option>
                      <option value="1.00">Ø 1.00 ม. (พิกัดแรงดันสูง ลอดทางผ่านถนนหลวง)</option>
                      <option value="1.20">Ø 1.20 ม. (ระบายรวมสายเมนหลักราชการ)</option>
                      <option value="1.50">Ø 1.50 ม. (ขนาดสูงสุดพิเศษ บายพาสน้ำหลากพิเศษ)</option>
                    </select>
                  </div>

                  {/* Standard selector for pipes */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-neutral-700">เกรด / มาตรฐานรองรับ</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: "norm", lab: "ธรรมดา (คสล)" },
                        { val: "t3", lab: "มอก. เกรด 3" },
                        { val: "t2", lab: "มอก. เกรด 2 (หนา)" }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setPipeStandard(item.val as any);
                            setCustomPrice("");
                          }}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center border transition ${
                            pipeStandard === item.val
                              ? "bg-neutral-800 text-white border-neutral-800"
                              : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600"
                          }`}
                        >
                          {item.lab}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-neutral-700">ขนาดความกว้างปากบ่อพักสำเร็จรูป (ม.)</label>
                  <select
                    value={basinSize}
                    onChange={(e) => {
                      setBasinSize(e.target.value);
                      setCustomPrice("");
                    }}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800"
                  >
                    <option value="0.30">ขนาดบ่อขนาดเล็ก 0.30 ม. (สำหรับท่อ Ø 0.30 ม.)</option>
                    <option value="0.40">ขนาดบ่อระดับเข้าสวน 0.40 ม. (สำหรับท่อ Ø 0.30, 0.40 ม.)</option>
                    <option value="0.50">ขนาดบ่อถนนในซอย 0.50 ม. (สำหรับท่อ Ø 0.40, 0.50 ม.)</option>
                    <option value="0.60">ขนาดโครงการฮิต 0.60 ม. (สำหรับท่อ Ø 0.50, 0.60 ม.)</option>
                    <option value="0.80">ขนาดชุมชนหลัก 0.80 ม. (สำหรับท่อ Ø 0.60, 0.80 ม.)</option>
                    <option value="1.00">ขนาดบายพาสเมน 1.00 ม. (สำหรับท่อ Ø 0.80, 1.00 ม.)</option>
                    <option value="1.20">ขนาดราชการเมนใหญ่ 1.20 ม. (สำหรับท่อ Ø 1.00, 1.20 ม.)</option>
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-neutral-700">จำนวนที่ประเมิน (ชิ้น / ท่อน)</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuantity(val === "" ? "" : Math.max(1, parseInt(val) || 0));
                  }}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800"
                  placeholder="เช่น 10"
                />
              </div>

              {/* Custom price per unit */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-neutral-700 flex justify-between">
                  <span>ราคาเสนอขายเองต่อหน่วย (บาท / ตัว)</span>
                  <span className="text-xs text-neutral-400 font-medium">
                    ว่างไว้เพื่ออิงราคาแนะนำพงษ์สกุล: ฿{activeDetails.price} บาท
                  </span>
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800"
                  placeholder={`ราคากลางฐานระบบ: ${activeDetails.price} บาท`}
                />
              </div>

              {/* Additional price */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-neutral-700">ค่าขนส่งด่วนพิเศษ หรือผลต่างบวกเพิ่ม (บาท)</span>
                <input
                  type="number"
                  value={additionalPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdditionalPrice(val === "" ? "" : parseFloat(val));
                  }}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-neutral-800"
                  placeholder="บวกเพิ่มเฉาะกิจพ่วงพิเศษ เช่น 1200"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToWeightList}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-900 hover:to-neutral-950 text-white font-bold py-3.5 px-6 rounded-xl transition shadow"
            >
              <Scale size={18} />
              ส่งน้ำหนักเข้าระวางขนส่งสะสม
            </button>
          </div>
        </div>

        {/* Right Preview Side */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Aesthetic 2D SVG Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">โมเดลลายเส้นโครงสร้างโครงร่าง (2D Architectural Draft)</span>

            {itemCategory === "pipe" ? (
              <svg width="200" height="200" viewBox="0 0 200 200" className="text-[#C62828] filter drop-shadow">
                {/* Outermost circle (with thickness based on grade) */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r={80} 
                  fill="none" 
                  stroke="#E5E7EB" 
                  strokeWidth="24" 
                />
                
                {/* Outermost border design */}
                <circle cx="100" cy="100" r="92" fill="none" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Main pipe wall (Concrete shading) */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r={80} 
                  fill="none" 
                  stroke="#C62828" 
                  strokeWidth={pipeStandard === "t2" ? "20" : (pipeStandard === "t3" ? "16" : "12")} 
                  opacity="0.85"
                />
                
                {/* Inner flow space */}
                <circle cx="100" cy="100" r={80 - (pipeStandard === "t2" ? 10 : (pipeStandard === "t3" ? 8 : 6))} fill="#F9FAFB" />
                
                {/* Outer socket fitting flare representation */}
                <path d="M 60 20 A 90 90 0 0 1 140 20" fill="none" stroke="#991B1B" strokeWidth="5" />

                {/* Inner text markings of diameter */}
                <text x="100" y="95" textAnchor="middle" className="fill-neutral-800 text-[13px] font-black" style={{ fontFamily: "monospace" }}>
                  Ø {pipeSize} M
                </text>
                <text x="100" y="115" textAnchor="middle" className="fill-neutral-400 text-[9px] font-bold">
                  {pipeStandard === "norm" ? "คสล. ธรรมดา" : `มอก. ชั้น ${pipeStandard === "t2" ? "2" : "3"}`}
                </text>
              </svg>
            ) : (
              <svg width="200" height="200" viewBox="0 0 200 200" className="text-[#C62828] filter drop-shadow">
                {/* Catch basin outer slab box */}
                <rect 
                  x="20" 
                  y="20" 
                  width="160" 
                  height="160" 
                  rx="16" 
                  fill="none" 
                  stroke="#C62828" 
                  strokeWidth="16" 
                  opacity="0.9"
                />
                
                {/* Outer detail dashed ring */}
                <rect x="12" y="12" width="176" height="176" rx="20" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="4 4" />
                
                {/* Inner sediment sand trap block */}
                <rect x="36" y="36" width="128" height="128" rx="8" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="2" />
                
                {/* Flow guide inner pipe hole representer */}
                <circle cx="100" cy="100" r="35" fill="none" stroke="#991B1B" strokeWidth="3" strokeDasharray="4 3" opacity="0.4" />

                {/* Info Text inside the box */}
                <text x="100" y="95" textAnchor="middle" className="fill-neutral-800 text-[13px] font-black" style={{ fontFamily: "monospace" }}>
                  บ่อพัก {basinSize} M
                </text>
                <text x="100" y="115" textAnchor="middle" className="fill-neutral-400 text-[9px] font-bold">
                  บ่อคอนกรีตอัดแรง
                </text>
              </svg>
            )}

            <div className="mt-4 text-center max-w-xs space-y-1">
              <span className="inline-block bg-neutral-100 text-neutral-700 font-bold font-mono text-[11px] px-2.5 py-1 rounded">
                นํ้าหนักอ้างอิง: {fmt(activeDetails.weight)} กก. / ตัว
              </span>
              <p className="text-[10px] text-neutral-400 leading-normal">
                น้ำหนักคำนวณตามมาตรฐานคอนกรีตสำเร็จรูปเสริมเหล็กอัดแรง ตราพงษ์สกุล
              </p>
            </div>
          </div>

          {/* Pricing Results Panel */}
          <div className="bg-[#C62828] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
            
            <div className="space-y-4">
              <div className="border-b border-white/20 pb-4">
                <span className="text-white/70 text-[10px] uppercase font-bold tracking-widest block">สรุปเสนอราคารวมบิล</span>
                <span className="font-bold text-lg leading-snug tracking-tight block">
                  {activeDetails.label}
                </span>
                <span className="text-white/60 text-xs block mt-1 font-mono">
                  รหัสอ้างอิง: {activeDetails.priceKey} และ {activeDetails.weightKey}
                </span>
              </div>

              {/* Calculations lists */}
              <div className="space-y-2 text-xs font-semibold text-white/90">
                <div className="flex justify-between items-center">
                  <span>ราคาฐาน (บาท/หน่วย):</span>
                  <span className="font-mono text-sm">฿{fmt(calcPricePerUnit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>จำนวนจำเพาะ:</span>
                  <span className="font-mono text-sm">{calcQty} ชิ้น/ท่อน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ราคาสุทธิก่อนภาษี (VAT):</span>
                  <span className="font-mono text-sm">฿{fmt(priceBeforeVat)}</span>
                </div>
                <div className="flex justify-between items-center text-amber-200">
                  <span>ภาษีมูลค่าเพิ่มทั่วไป (+{settings.prices.vatPercent}%):</span>
                  <span className="font-mono text-sm">฿{fmt(vatAmount)}</span>
                </div>
                {calcAdditionalPrice > 0 && (
                  <div className="flex justify-between items-center text-amber-300">
                    <span>บวกค่าพ่วง/ขนส่งเพิ่มเติม:</span>
                    <span className="font-mono text-sm">฿{fmt(calcAdditionalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-emerald-200">
                  <span>น้ำหนักขนส่งรวมคาดการณ์:</span>
                  <span className="font-mono text-sm font-bold flex items-center gap-1">
                    {fmt(totalWeight)} กก. ({fmt(totalWeight / 1000)} ตัน)
                  </span>
                </div>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="pt-6 mt-6 border-t border-white/20 flex items-end justify-between">
              <div>
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest block">
                  {autoRoundPrice ? "ยอดเสนอราคาสวยงาม (ปัดเศษ)" : "ยอดราคาสุทธิ (ค่าสากล)"}
                </span>
                <span className="text-3xl font-black font-mono">
                  ฿{fmt(totalPrice)}
                </span>
              </div>
              <span className="text-[10px] bg-white/20 py-1 px-2.5 rounded-full font-bold">
                ราคารวมแวต VAT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
