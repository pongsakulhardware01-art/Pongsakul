import { useState, useEffect } from "react";
import { AppSettings, WeightItem } from "./types";
import { defaultSettings, APP_VERSION } from "./data";
import SlabCalculator from "./components/SlabCalculator";
import PileCalculator from "./components/PileCalculator";
import HollowCoreCalculator from "./components/HollowCoreCalculator";
import DrainageCalculator from "./components/DrainageCalculator";
import WeightCalculator from "./components/WeightCalculator";
import SettingsPanel from "./components/SettingsPanel";
import UniversalBatchCalculator from "./components/UniversalBatchCalculator";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator,
  Scale,
  Settings,
  Hammer,
  Clock,
  ChevronRight,
  ChevronLeft,
  User,
  LayoutGrid,
  Zap,
  Package,
  Layers,
  Home,
  Sparkles,
  Droplets,
} from "lucide-react";

const MenuCard = ({
  onClick,
  icon: Icon,
  title,
  description,
}: {
  onClick: () => void;
  icon: any;
  title: string;
  description: string;
}) => (
  <motion.button
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="bg-white hover:border-[#C62828] text-left p-6 md:p-8 rounded-3xl border border-neutral-200/80 shadow-md group transition flex flex-col justify-between h-[230px]"
  >
    <div className="p-3.5 bg-red-50 text-[#C62828] rounded-2xl group-hover:bg-[#C62828] group-hover:text-white transition w-fit">
      <Icon size={28} />
    </div>
    <div className="space-y-2">
      <h3 className="font-extrabold text-neutral-800 text-lg md:text-xl group-hover:text-[#C62828] transition flex items-center justify-between">
        <span>{title}</span>
        <ChevronRight size={18} className="text-neutral-300 group-hover:text-[#C62828] transition" />
      </h3>
      <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">{description}</p>
    </div>
  </motion.button>
);

export default function App() {
  // Navigation State
  // "menu", "price", "weight", "settings"
  const [currentScreen, setCurrentScreen] = useState<string>("menu");
  // Sub-tab inside Price category
  // "slab", "pile", "hollowCore"
  const [priceSubTab, setPriceSubTab] = useState<string>("slab");

  // Load configuration from local storage, baked in state, or fallback to defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Clear old localStorage if version changed (e.g. from V.33 to V.34)
    const storedVer = localStorage.getItem("pongsakulVersion");
    if (storedVer !== APP_VERSION) {
      localStorage.removeItem("pongsakulSettings");
      localStorage.setItem("pongsakulVersion", APP_VERSION);
    }

    const baked = (window as any).BAKED_SETTINGS;
    if (baked && typeof baked === "object") {
      return {
        prices: { ...defaultSettings.prices, ...baked.prices },
        weights: { ...defaultSettings.weights, ...baked.weights },
      };
    }

    const saved = localStorage.getItem("pongsakulSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          prices: { ...defaultSettings.prices, ...parsed.prices },
          weights: { ...defaultSettings.weights, ...parsed.weights },
        };
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    return defaultSettings;
  });

  // Fetch from Express server on mount + start real-time polling every 3 seconds
  useEffect(() => {
    const fetchSharedSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const cloudSettings = await res.json();
          if (cloudSettings && typeof cloudSettings === "object") {
            setSettings((prev) => {
              // Deep compare settings to prevent infinite state updates
              if (JSON.stringify(prev) !== JSON.stringify(cloudSettings)) {
                localStorage.setItem("pongsakulSettings", JSON.stringify(cloudSettings));
                return cloudSettings;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Fallback silently if offline or backend is initializing
      }
    };

    fetchSharedSettings();
    const syncInterval = setInterval(fetchSharedSettings, 3000);
    return () => clearInterval(syncInterval);
  }, []);

  // Global list of items inside Weight Calculator to preserve stats when switching screens
  const [weightItems, setWeightItems] = useState<WeightItem[]>([
    { id: "1", type: "slab", count: 10, length: 2.0 },
  ]);

  // Current Thai Date Formatted
  const thaiDate = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Premium Crimson Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#C62828] bg-gradient-to-r from-[#C62828] to-[#B71C1C] text-white shadow-lg border-b border-red-800/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Hammer className="text-amber-300 animate-pulse" size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight family-kanit uppercase">
                PONGSAKUL HARDWARE
              </h1>
              <p className="text-xs font-light text-red-100 flex items-center gap-1.5 mt-0.5">
                <span className="bg-amber-300/20 text-amber-200 text-[10px] font-bold py-0.5 px-2 rounded-full border border-amber-300/20">
                  {APP_VERSION}
                </span>
                เครื่องคำนวณราคาและน้ำหนักโครงสร้างคอนกรีตอัดแรง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs md:text-sm text-red-50 font-medium">
            <span className="flex items-center gap-1.5 opacity-90">
              <Clock size={15} className="text-amber-300" />
              {thaiDate}
            </span>
            <span className="hidden sm:inline-block border-l border-white/20 h-4" />
            <span className="flex items-center gap-1 opacity-80">
              <User size={14} className="text-amber-300" />
              pongsakul.co.th
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Space wrapper with container sizing */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Dynamic Nav breadcrumbs if inside a subscreen */}
        {currentScreen !== "menu" && (
          <nav className="mb-6 flex items-center gap-2 text-xs md:text-sm font-semibold">
            <button
              onClick={() => setCurrentScreen("menu")}
              className="text-neutral-500 hover:text-[#C62828] transition flex items-center gap-1"
            >
              <LayoutGrid size={15} />
              เมนูหลัก
            </button>
            <ChevronRight size={14} className="text-neutral-300" />
            <span className="text-neutral-800">
              {currentScreen === "price" && "คำนวณราคาเดี่ยว"}
              {currentScreen === "scan" && "สแกนภาพและคำนวณหลายรายการ AI"}
              {currentScreen === "weight" && "คำนวณน้ำหนักรวมวิศวกรรม"}
              {currentScreen === "settings" && "ตั้งค่าตารางกลาง & ออกรายงาน"}
            </span>
          </nav>
        )}

        <AnimatePresence mode="wait">
          {currentScreen === "menu" ? (
            /* ========================================= */
            /* SCREEN 1: MAIN MENU (BENTO DASHBOARD)      */
            /* ========================================= */
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Beautiful Welcome and Hero Section */}
              <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-[#991B1B] to-[#7F1D1D] text-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_45%)] pointer-events-none" />
                <div className="space-y-3 relative z-10 text-center md:text-left">
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/20">
                    <Zap size={12} className="text-amber-400 animate-pulse" />
                    ระบบสแตนด์บายทำงานแบบออฟไลน์ได้ 100%
                  </span>
                  <h2 className="text-xl md:text-3xl font-black tracking-tight font-display bg-gradient-to-r from-white via-neutral-100 to-amber-200 bg-clip-text text-transparent">
                    ระบบคำนวณงานแผ่นพื้นและเสาเข็มพงษ์สกุล
                  </h2>
                  <p className="text-xs md:text-sm text-neutral-200 max-w-xl font-light leading-relaxed">
                    เครื่องมือสนับสนุนการขายและวิศวกรรมขนส่งโดยบริษัท พงษ์สกุลฮาร์ดแวร์ จำกัด ช่วยคำนวณราคาสั่งซื้อทั่วไปและ มอก. ตลอดจนช่วยคำนวณระเบียบน้ำหนักโครงสร้างเพื่อวางแผนจัดสรรยานพาหนะ
                  </p>
                </div>

              </div>

              {/* Bento menu matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <MenuCard
                  onClick={() => setCurrentScreen("price")}
                  icon={Calculator}
                  title="คำนวณราคาเดี่ยว"
                  description="คำนวณเฉพาะแผ่นพื้นสามัญ/มอก., เสาเข็ม I-Shape/สี่เหลี่ยม S-Piles หรือแผ่นพื้นกลวงกลมแยกเป็นรายการเดี่ยว"
                />
                <MenuCard
                  onClick={() => setCurrentScreen("scan")}
                  icon={Sparkles}
                  title="คำนวณหลายรายการ AI"
                  description="สแกนเอกสารด้วย AI, วางข้อความสเปก หรือแก้ไขแบบสเปรดชีตเพื่อทำใบประเมินราคาเสร็จสมบูรณ์ในหน้าเดียว"
                />
                <MenuCard
                  onClick={() => setCurrentScreen("weight")}
                  icon={Scale}
                  title="คำนวณระวางขนส่ง"
                  description="คำนวณระวางกองสะสมและจำลองน้ำหนักรวมเพื่อเทียบพิกัดตูดรถส่งของ ปลอดภัย สรรพสามิตไม่จับ 100%"
                />
                <MenuCard
                  onClick={() => setCurrentScreen("settings")}
                  icon={Settings}
                  title="ราคากลาง & แค็ตตาล็อก"
                  description={`ปรับแต่งราคารวมขนส่ง ปรับน้ำหนักผลิตภัณฑ์ และดาวน์โหลดโบรชัวร์รุ่นหลัก ${APP_VERSION} แค็ตตาล็อก`}
                />
              </div>

            </motion.div>
          ) : currentScreen === "price" ? (
            /* ========================================= */
            /* SCREEN 2: PRICE CALCULATIONS (3 SUB-TABS)  */
            /* ========================================= */
            <motion.div
              key="price"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* Professional nested tab triggers */}
              <div className="bg-white p-2 rounded-2xl border border-neutral-150 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 w-fit">
                <button
                  onClick={() => setPriceSubTab("slab")}
                  className={`py-3 px-5 rounded-xl font-bold text-sm text-center transition flex items-center justify-center gap-2 ${
                    priceSubTab === "slab"
                      ? "bg-[#C62828] text-white shadow-sm"
                      : "text-neutral-500 hover:text-[#C62828] hover:bg-neutral-50"
                  }`}
                >
                  <Package size={16} />
                  แผ่นพื้นสำเร็จรูป
                </button>
                <button
                  onClick={() => setPriceSubTab("pile")}
                  className={`py-3 px-5 rounded-xl font-bold text-sm text-center transition flex items-center justify-center gap-2 ${
                    priceSubTab === "pile"
                      ? "bg-[#C62828] text-white shadow-sm"
                      : "text-neutral-500 hover:text-[#C62828] hover:bg-neutral-50"
                  }`}
                >
                  <Zap size={16} />
                  เสาเข็มคอนกรีต / เสารั้ว
                </button>
                <button
                  onClick={() => setPriceSubTab("hollowCore")}
                  className={`py-3 px-5 rounded-xl font-bold text-sm text-center transition flex items-center justify-center gap-2 ${
                    priceSubTab === "hollowCore"
                      ? "bg-[#C62828] text-white shadow-sm"
                      : "text-neutral-500 hover:text-[#C62828] hover:bg-neutral-50"
                  }`}
                >
                  <Layers size={16} />
                  แผ่นพื้นกลวง (Hollow Core)
                </button>
                <button
                  onClick={() => setPriceSubTab("drainage")}
                  className={`py-3 px-5 rounded-xl font-bold text-sm text-center transition flex items-center justify-center gap-2 ${
                    priceSubTab === "drainage"
                      ? "bg-[#C62828] text-white shadow-sm"
                      : "text-neutral-500 hover:text-[#C62828] hover:bg-neutral-50"
                  }`}
                >
                  <Droplets size={16} />
                  ท่อระบายน้ำ / บ่อพัก
                </button>
              </div>

              {/* Display correct price subtab */}
              {priceSubTab === "slab" && (
                <SlabCalculator 
                  settings={settings} 
                  weightItems={weightItems}
                  setWeightItems={setWeightItems}
                  onNavigateToWeight={() => setCurrentScreen("weight")}
                />
              )}
              {priceSubTab === "pile" && <PileCalculator settings={settings} />}
              {priceSubTab === "hollowCore" && <HollowCoreCalculator settings={settings} />}
              {priceSubTab === "drainage" && (
                <DrainageCalculator 
                  settings={settings} 
                  weightItems={weightItems}
                  setWeightItems={setWeightItems}
                  onNavigateToWeight={() => setCurrentScreen("weight")}
                />
              )}
            </motion.div>
          ) : currentScreen === "scan" ? (
            /* ========================================================= */
            /* SCREEN 2.5: UNIVERSAL AI SCAN & MULTI-PRODUCT ESTIMATOR  */
            /* ========================================================= */
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.18 }}
            >
              <UniversalBatchCalculator 
                settings={settings} 
                weightItems={weightItems}
                setWeightItems={setWeightItems} 
                onNavigateToWeight={() => setCurrentScreen("weight")}
              />
            </motion.div>
          ) : currentScreen === "weight" ? (
            /* ========================================= */
            /* SCREEN 3: WEIGHT ACCUMULATOR              */
            /* ========================================= */
            <motion.div
              key="weight"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.18 }}
            >
              <WeightCalculator settings={settings} items={weightItems} setItems={setWeightItems} />
            </motion.div>
          ) : (
            /* ========================================= */
            /* SCREEN 4: GLOBAL SETTINGS & REPORT EXPORT  */
            /* ========================================= */
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.18 }}
            >
              <SettingsPanel settings={settings} setSettings={setSettings} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Professional Brand Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-8 border-t border-neutral-800 text-xs sm:text-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1">
            <span className="font-extrabold font-display text-white uppercase tracking-wider text-sm block">
              บริษัท พงษ์สกุลฮาร์ดแวร์ จำกัด
            </span>
            <p className="font-light text-neutral-500">
              ผู้ผลิตและจัดจำหน่ายแผ่นพื้นคอนกรีตอัดแรง แผ่นพื้นรูกลวง (Hollow Core) และเสาเข็มมาตรฐานอุตสาหกรรม มอก.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1.5 text-neutral-500 font-mono text-[11px]">
            <span>© {new Date().getFullYear()} Pongsakul Hardware. All Rights Reserved.</span>
            <span className="bg-neutral-800 text-neutral-400 py-0.5 px-2.5 rounded-full border border-neutral-700/50">
              ระบบพร้อมทำงานแบบออฟไลน์
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

