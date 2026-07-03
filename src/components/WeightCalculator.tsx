import { Dispatch, SetStateAction } from "react";
import { AppSettings, WeightItem } from "../types";
import { weightOptions, truckCapacities } from "../data";
import { fmt } from "../utils";
import { Plus, Trash2, ArrowUpRight, Scale, Truck, Minus, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WeightCalculatorProps {
  settings: AppSettings;
  items: WeightItem[];
  setItems: Dispatch<SetStateAction<WeightItem[]>>;
}

export default function WeightCalculator({ settings, items, setItems }: WeightCalculatorProps) {
  const getWeightPerMeter = (typeValue: string): number => {
    const opt = weightOptions.find((o) => o.value === typeValue);
    if (!opt) return 0;
    return settings.weights[opt.weightKey] || 0;
  };

  const getLabel = (typeValue: string): string => {
    const opt = weightOptions.find((o) => o.value === typeValue);
    return opt ? opt.label : "";
  };

  const addItem = () => {
    const newItem: WeightItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: "slab",
      count: 10,
      length: 2.0,
      unitWeight: undefined,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof WeightItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculateItemWeight = (item: WeightItem): number => {
    const rawWPerMeter = item.unitWeight !== undefined ? item.unitWeight : getWeightPerMeter(item.type);
    const wPerMeter = rawWPerMeter === "" ? 0 : rawWPerMeter;
    const isPerPieceItem = item.type.startsWith("pipe") || item.type.startsWith("basin");
    const len = isPerPieceItem ? 1.0 : (item.length === "" ? 0 : item.length);
    const cnt = item.count === "" ? 0 : item.count;
    return wPerMeter * len * cnt;
  };

  const totalWeight = items.reduce((sum, item) => sum + calculateItemWeight(item), 0);

  // Quick adjust adjustments helpers
  const adjustCount = (id: string, current: number | "", delta: number) => {
    const currNum = current === "" ? 0 : current;
    updateItem(id, "count", Math.max(0, currNum + delta));
  };

  const adjustLength = (id: string, current: number | "", delta: number) => {
    const currNum = current === "" ? 0 : current;
    // Round to 1 decimal place to prevent floating issues
    const val = parseFloat((currNum + delta).toFixed(1));
    updateItem(id, "length", Math.max(0, val));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Dynamic List panel */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 text-[#C62828] rounded-lg">
                <Scale size={18} />
              </div>
              <h3 className="font-semibold text-neutral-800 text-lg">รายการวัสดุบวกคำนวณน้ำหนัก</h3>
            </div>
            <button
              onClick={addItem}
              className="flex items-center gap-1 text-sm bg-red-50 text-[#C62828] hover:bg-red-100 transition font-semibold px-3 py-1.5 rounded-lg border border-red-100"
            >
              <Plus size={16} />
              เพิ่มรายการ
            </button>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {items.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Truck size={36} className="mx-auto mb-2 opacity-30 text-neutral-500" />
                  <p className="font-semibold">ไม่มีรายการวัสดุ</p>
                  <p className="text-xs">กดปุ่ม + เพิ่มรายการ ด้านบนเพื่อเริ่มต้นคำนวณ</p>
                </div>
              ) : (
                items.map((item, index) => {
                  const isPerPieceItem = item.type.startsWith("pipe") || item.type.startsWith("basin");
                  const rawWPerMeter = item.unitWeight !== undefined ? item.unitWeight : getWeightPerMeter(item.type);
                  const wPerMeter = rawWPerMeter === "" ? 0 : rawWPerMeter;
                  const itemLen = isPerPieceItem ? 1.0 : (item.length === "" ? 0 : item.length);
                  const itemCnt = item.count === "" ? 0 : item.count;
                  const itemWeight = wPerMeter * itemLen * itemCnt;

                  const unitText = item.type.startsWith("pipe") ? "กก./ท่อน" : (item.type.startsWith("basin") ? "กก./บ่อ" : "กก./ม.");

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-neutral-50 rounded-xl p-4 border border-neutral-150 flex flex-col gap-3 relative hover:border-neutral-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center bg-neutral-200 text-xs text-neutral-600 rounded-full font-bold">
                            {index + 1}
                          </span>
                          <select
                            value={item.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              setItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? { ...it, type: newType, unitWeight: undefined }
                                    : it
                                )
                              );
                            }}
                            className="bg-transparent border-0 hover:bg-neutral-150 rounded px-2 py-1 font-semibold text-neutral-800 text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                          >
                            {weightOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="absolute sm:relative top-4 right-4 sm:top-auto sm:right-auto text-neutral-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition"
                          title="ลบรายการ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Controls rows for Count & Length */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-150/65 pt-3">
                        {/* Length selector with - / + */}
                        {!isPerPieceItem ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500 font-semibold">ความยาวต่อหน่วย (เมตร)</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => adjustLength(item.id, item.length, -0.5)}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 rounded-lg active:bg-neutral-100"
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                value={item.length}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateItem(item.id, "length", val === "" ? "" : parseFloat(val));
                                }}
                                step="0.1"
                                className="w-16 text-center border-0 bg-white py-1.5 text-sm font-semibold text-neutral-800 rounded-lg"
                                placeholder="0"
                              />
                              <button
                                type="button"
                                onClick={() => adjustLength(item.id, item.length, 0.5)}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 rounded-lg active:bg-neutral-100"
                              >
                                <Plus size={14} />
                              </button>
                              {/* Fast additions */}
                              <div className="flex gap-1 pl-1">
                                <button
                                  onClick={() => adjustLength(item.id, item.length, 1.0)}
                                  className="text-[10px] bg-neutral-200 text-neutral-600 font-medium py-1 px-1.5 rounded active:bg-neutral-300"
                                >
                                  +1ม
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col justify-center bg-neutral-100 rounded-xl p-3 border border-neutral-200/50">
                            <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                              <Info size={14} className="text-[#C62828]" /> คำนวณรายชิ้นโดยตรง
                            </span>
                            <span className="text-[10px] text-neutral-500 mt-0.5">
                              คิดน้ำหนักมาตรฐานรายตัว (ท่อน / บ่อพัก) ไม่ต้องระบุความยาวเมตร
                            </span>
                          </div>
                        )}

                        {/* Number selector with - / + */}
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-neutral-500 font-semibold">จำนวน (ชิ้น/แผ่น/ต้น)</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => adjustCount(item.id, item.count, -1)}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 rounded-lg active:bg-neutral-100"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              value={item.count}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateItem(item.id, "count", val === "" ? "" : parseInt(val));
                              }}
                              className="w-16 text-center border-0 bg-white py-1.5 text-sm font-semibold text-neutral-800 rounded-lg"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => adjustCount(item.id, item.count, 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 rounded-lg active:bg-neutral-100"
                            >
                              <Plus size={14} />
                            </button>
                            {/* Fast additions */}
                            <div className="flex gap-1 pl-1">
                              <button
                                onClick={() => adjustCount(item.id, item.count, 10)}
                                className="text-[10px] bg-neutral-200 text-neutral-600 font-medium py-1 px-1.5 rounded active:bg-neutral-300"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Display item total weight with inline editable field */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 text-xs border-t border-neutral-150/40 pt-2 text-neutral-400 font-medium gap-2">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span>น้ำหนักหน่วยละ:</span>
                          <input
                            type="number"
                            value={item.unitWeight !== undefined ? item.unitWeight : getWeightPerMeter(item.type)}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateItem(item.id, "unitWeight", val === "" ? "" : parseFloat(val));
                            }}
                            className="w-16 px-1.5 py-0.5 text-center font-bold bg-white border border-neutral-200 rounded text-neutral-800 focus:outline-none focus:ring-1 focus:ring-red-200"
                            step="0.01"
                          />
                          <span>{unitText}</span>
                          {item.unitWeight !== undefined && item.unitWeight !== getWeightPerMeter(item.type) && (
                            <button
                              onClick={() => {
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id ? { ...it, unitWeight: undefined } : it
                                  )
                                );
                              }}
                              className="text-[10px] text-[#C62828] underline hover:text-red-800 font-bold ml-1"
                              title="คืนค่าอ้างอิงมาตรฐาน"
                            >
                              คืนค่าเริ่มต้น
                            </button>
                          )}
                        </div>
                        <span className="text-[#C62828] font-bold text-sm">
                          น้ำหนักสะสม: {fmt(itemWeight)} กก.
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Informative logistics footer */}
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex gap-2.5 text-xs text-amber-800">
          <Info className="flex-shrink-0 text-amber-600 mt-0.5" size={16} />
          <div>
            <p className="font-semibold mb-0.5">การคำนวณน้ำหนักเชิงโลจิสติกส์</p>
            <p className="leading-relaxed">
              สเปคน้ำหนักที่ใช้ต่อเมตร ได้จัดสรรตามการรับรองน้ำหนักบรรทุกและการขนถ่ายหน้างานของบริษัท พงษ์สกุลคอนกรีต จำกัด เพื่อประเมินรถรับจ้างหรือจัดส่งได้ง่ายขึ้น
            </p>
          </div>
        </div>
      </div>

      {/* Aggregate / Truck Weight metrics */}
      <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
        {/* Sum Card */}
        <div className="bg-gradient-to-br from-[#E53935] to-[#B71C1C] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between h-[180px]">
          <div>
            <span className="text-xs font-semibold bg-white/20 text-white py-1 px-3 rounded-full uppercase tracking-wider">
              ยอดสะสมกองวัสดุ
            </span>
            <div className="mt-4">
              <span className="text-sm opacity-85 block">น้ำหนักสุทธิแปรสภาพขนส่ง</span>
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {fmt(totalWeight)} <span className="text-lg">กก.</span>
              </span>
            </div>
          </div>
          <p className="text-xs font-light opacity-80 text-right">
            ({(totalWeight / 1000).toFixed(3)} ตันเมตริก)
          </p>
        </div>

        {/* Truck visual Loading meters */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4 flex-1">
          <h4 className="font-semibold text-neutral-800 text-sm flex items-center gap-1.5 border-b border-neutral-100 pb-2.5">
            <Truck size={16} className="text-[#C62828]" />
            ประมาณกำลังรับน้ำหนักของยานพาหนะบรรทุก
          </h4>

          <div className="space-y-4 pt-1">
            {truckCapacities.map((truck) => {
              const capPercent = Math.min(100, (totalWeight / truck.capacityKg) * 100);
              const isOver = totalWeight > truck.capacityKg;

              // Color determination
              let colorBar = "bg-green-500";
              let colorBg = "bg-green-50 text-green-700";
              if (capPercent > 100) {
                colorBar = "bg-red-500 animate-pulse";
                colorBg = "bg-red-50 text-red-700";
              } else if (capPercent > 75) {
                colorBar = "bg-amber-500";
                colorBg = "bg-amber-50 text-amber-700";
              }

              return (
                <div key={truck.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-700">{truck.name}</span>
                    <span className="font-mono text-neutral-500">
                      สูงสุด: {truck.label}
                    </span>
                  </div>

                  <div className="relative">
                    {/* Progress Bar background */}
                    <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${colorBar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${capPercent}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-medium ${colorBg}`}>
                      {isOver ? "❌ เกินพิกัดน้ำหนักปลอดภัย" : capPercent > 80 ? "⚠️ ใกล้เต็มขีดจำกัด" : "✅ บรรทุกรอดปลอดภัย"}
                    </span>
                    <span className="font-semibold text-neutral-600 font-mono">
                      {capPercent.toFixed(1)}% ({fmt(totalWeight)} / {fmt(truck.capacityKg)} กก.)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}