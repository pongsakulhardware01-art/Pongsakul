import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { AppSettings, WeightItem } from "../types";
import { fmt, getLoadCapacity, roundToBeautifulPrice } from "../utils";
import { loadCapacityTable } from "../data";
import SlabVisualizer from "./SlabVisualizer";
import { 
  Check, 
  Info, 
  Hammer, 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calculator, 
  ArrowRightLeft, 
  Layers, 
  Truck, 
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SlabCalculatorProps {
  settings: AppSettings;
  weightItems?: WeightItem[];
  setWeightItems?: Dispatch<SetStateAction<WeightItem[]>>;
  onNavigateToWeight?: () => void;
}

interface ScannedSlabItem {
  id: string;
  length: number | "";
  count: number | "";
  boardType: string; // "normal" | "m.o.c" | "custom" | "m.o.c_custom"
  customPriceSqm: number | ""; 
  wireCount: string; // "4", "5", "6", "7", "8" or "auto"
  label: string;
}

export default function SlabCalculator({ 
  settings, 
  weightItems, 
  setWeightItems, 
  onNavigateToWeight 
}: SlabCalculatorProps) {
  // Modes: "single" for original single calculator, "batch" for AI image scanner
  const [calculatorMode, setCalculatorMode] = useState<"single" | "batch">("single");

  // Auto round prices state (sharing via localStorage)
  const [autoRoundPrice, setAutoRoundPrice] = useState<boolean>(() => {
    return localStorage.getItem("pongsakulAutoRoundPrice") === "true";
  });

  const [copiedSingle, setCopiedSingle] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  const handleCopySinglePrice = (val: number) => {
    navigator.clipboard.writeText(String(val));
    setCopiedSingle(true);
    setTimeout(() => setCopiedSingle(false), 1200);
  };

  const handleCopyRowPrice = (id: string, val: number) => {
    navigator.clipboard.writeText(String(val));
    setCopiedRowId(id);
    setTimeout(() => setCopiedRowId(null), 1200);
  };

  const toggleAutoRoundPrice = () => {
    const newVal = !autoRoundPrice;
    setAutoRoundPrice(newVal);
    localStorage.setItem("pongsakulAutoRoundPrice", String(newVal));
    // Dispatch custom storage event so other mounted components can sync immediately if needed
    window.dispatchEvent(new Event("storage_round_price"));
  };

  useEffect(() => {
    const syncVal = () => {
      setAutoRoundPrice(localStorage.getItem("pongsakulAutoRoundPrice") === "true");
    };
    window.addEventListener("storage_round_price", syncVal);
    return () => window.removeEventListener("storage_round_price", syncVal);
  }, []);

  // --- SINGLE SLAB STATE ---
  const [boardType, setBoardType] = useState<string>("normal");
  const [customPrice, setCustomPrice] = useState<number | "">(0);
  const [length, setLength] = useState<number | "">(2.0);
  const [autoWireAdjust, setAutoWireAdjust] = useState<boolean>(true);
  const [wireCount, setWireCount] = useState<string>("4");
  const [totalArea, setTotalArea] = useState<number | "">(10.0);

  // Auto adjust wire count based on length
  useEffect(() => {
    if (autoWireAdjust) {
      const len = length === "" ? 0 : length;
      if (len <= 3.0) {
        setWireCount("4");
      } else if (len <= 4.0) {
        setWireCount("5");
      } else {
        setWireCount("7");
      }
    }
  }, [length, autoWireAdjust]);

  // Calculations for Single Slab
  const calcLength = length === "" ? 0 : length;
  const calcCustomPrice = customPrice === "" ? 0 : customPrice;
  const calcTotalArea = totalArea === "" ? 0 : totalArea;

  let step = 0;
  if (boardType === "normal" || boardType === "custom") {
    const basePrice = boardType === "custom" ? calcCustomPrice : settings.prices.normalBoardPrice;
    if (wireCount === "4") step = basePrice;
    else if (wireCount === "5") step = basePrice + 10;
    else if (wireCount === "6") step = basePrice + 20;
    else if (wireCount === "7") step = basePrice + 35;
    else if (wireCount === "8") step = basePrice + 55;
    else if (wireCount === "5_mm_5") step = settings.prices.normalBoardPrice + 55;
  } else if (boardType === "m.o.c" || boardType === "m.o.c_custom") {
    const basePrice = boardType === "m.o.c_custom" ? calcCustomPrice : settings.prices.mocBoardPrice;
    if (wireCount === "4") step = basePrice;
    else if (wireCount === "5") step = basePrice + 15;
    else if (wireCount === "6") step = basePrice + 30;
    else if (wireCount === "7") step = basePrice + 50;
    else if (wireCount === "8") step = basePrice + 75;
    else if (wireCount === "5_mm_5") step = settings.prices.mocBoardPrice + 75;
  }

  const rawFinalPrice = 0.35 * step * calcLength;
  const finalPrice = autoRoundPrice ? roundToBeautifulPrice(rawFinalPrice) : rawFinalPrice;
  const boardArea = 0.35 * calcLength;
  const boardCount = boardArea > 0 ? Math.ceil(calcTotalArea / boardArea) : 0;

  const weightPerMeter = settings.weights.slab;
  const totalWeight = weightPerMeter * calcLength * boardCount;

  const loadCapacity = getLoadCapacity(calcLength, wireCount);
  const colKeys = Object.keys(loadCapacityTable).map(Number).sort((a, b) => a - b);
  const rowLabels = ["4", "5", "6", "7", "8"];

  const getHighlightStatus = (rLabel: string, cKey: number) => {
    const wireIndexMap: Record<string, number> = { "4": 0, "5": 1, "6": 2, "7": 3, "8": 4 };
    let currentIdx = wireIndexMap[wireCount] !== undefined ? wireIndexMap[wireCount] : (wireCount === "5_mm_5" ? 4 : 0);
    const mappedRowIdx = wireIndexMap[rLabel];

    let closestLengthKey = colKeys.find((key) => key >= calcLength);
    if (!closestLengthKey) closestLengthKey = colKeys[colKeys.length - 1];
    else if (calcLength < colKeys[0]) closestLengthKey = colKeys[0];

    const isRowMatch = currentIdx === mappedRowIdx;
    const isColMatch = closestLengthKey === cKey;

    if (isRowMatch && isColMatch) return "activeCell";
    if (isRowMatch) return "rowMatch";
    if (isColMatch) return "colMatch";
    return "none";
  };


  // --- BATCH CALCULATOR (AI SCREENSHOT SCAN) STATE ---
  const [scannedItems, setScannedItems] = useState<ScannedSlabItem[]>([
    {
      id: "demo-example-1",
      length: 2.5,
      count: 15,
      boardType: "normal",
      customPriceSqm: "",
      wireCount: "auto",
      label: "แผ่นพื้น 2.50 เมตร (ตัวอย่าง)"
    },
    {
      id: "demo-example-2",
      length: 3.5,
      count: 20,
      boardType: "m.o.c",
      customPriceSqm: "",
      wireCount: "7",
      label: "แผ่น มอก. 3.50 เมตร (ตัวอย่าง)"
    }
  ]);

  const [manualNormalPrice, setManualNormalPrice] = useState<number | "">(settings.prices.normalBoardPrice);
  const [manualMocPrice, setManualMocPrice] = useState<number | "">(settings.prices.mocBoardPrice);

  // Sync manual baseline prices with cloud/shared settings in real-time
  useEffect(() => {
    setManualNormalPrice(settings.prices.normalBoardPrice);
  }, [settings.prices.normalBoardPrice]);

  useEffect(() => {
    setManualMocPrice(settings.prices.mocBoardPrice);
  }, [settings.prices.mocBoardPrice]);
  const [rawTextLines, setRawTextLines] = useState<string>(
    "0.35x2.00\n0.35x2.00 ลวด 5 เส้น\n0.35x2.00 ลวด 4 เส้น มอก."
  );

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCopiedNotify, setIsCopiedNotify] = useState<boolean>(false);

  // Text parsing modes: "ai" for backend Gemini, "offline" for local regex parsing, default to offline on Netlify
  const [textParseMode, setTextParseMode] = useState<"ai" | "offline">(() => {
    const isNetlify = typeof window !== "undefined" && (
      window.location.hostname.includes("netlify") || 
      window.location.hostname.includes("github.io") ||
      (!window.location.hostname.includes("run.app") && 
       window.location.hostname !== "localhost" && 
       window.location.hostname !== "127.0.0.1")
    );
    return isNetlify ? "offline" : "ai";
  });

  // Image Upload Submodes & States
  const [batchInputType, setBatchInputType] = useState<"image" | "text">("image");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [isScanningImage, setIsScanningImage] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler to allow pasting images directly from clipboard (Ctrl+V)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (calculatorMode !== "batch" || batchInputType !== "image") return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setImageMimeType(file.type);
            setScanError(null);
            setSuccessMessage(null);
            
            const reader = new FileReader();
            reader.onload = () => {
              setSelectedImage(reader.result as string);
              setSuccessMessage("วางรูปภาพจากคลิปบอร์ดคลิกบอร์ดสำเร็จ! 📋✨ ท่านสามารถกดเริ่มสแกนรูปภาพ หรือสลับไปแท็บเขียนราคาและแปะข้อมูลข้อความได้ทันที");
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [calculatorMode, batchInputType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setScanError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, JPEG, WebP)");
      setSuccessMessage(null);
      return;
    }

    setImageMimeType(file.type);
    setScanError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.onerror = () => {
      setScanError("เกิดข้อผิดพลาดในการโหลดรูปภาพดังกล่าว");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setScanError("กรุณาเลือกหรือวางเฉพาะไฟล์รูปภาพเท่านั้น");
      setSuccessMessage(null);
      return;
    }

    setImageMimeType(file.type);
    setScanError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const scanProductImage = async () => {
    if (!selectedImage) {
      setScanError("กรุณาเลือกไฟล์หรือถ่ายรูปภาพก่อนเริ่มต้นการสแกนด้วย AI");
      return;
    }

    setIsScanningImage(true);
    setScanError(null);
    setSuccessMessage(null);

    try {
      // Pure base64 content omitting metadata header
      const base64Data = selectedImage.split(",")[1] || selectedImage;

      const res = await fetch("/api/scan-slabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          mimeType: imageMimeType || "image/jpeg"
        })
      });

      let textData = "";
      try {
        textData = await res.text();
      } catch (err) {
        textData = "";
      }

      if (!res.ok) {
        let errorMessage = `เกิดข้อผิดพลาดเซิร์ฟเวอร์ในการสแกนภาพ (รหัส: ${res.status})`;
        if (res.status === 404) {
          errorMessage = "ท่านรันระบบอยู่บน Netlify ซึ่งเป็นระบบเว็บสแตติก (ไม่มีเซิร์ฟเวอร์หลังบ้านรัน Node.js) จึงไม่สามารถเรียกใช้บริการ AI สแกนวิเคราะห์ไฟล์รูปภาพได้ครับ แนะนำให้ใช้แท็บ 'เขียน/พิมพ์สเปกเอง 📝' ด้านบน แล้วป้อนข้อมูล คัดลอกข้อบทสนทนา หรือพิมพ์สเปก เช่น '0.35x2.50 10 แผ่น ลวด 5 เส้น' และกดสแกนผ่านระบบวิเคราะห์ออฟไลน์ด่วนบนบราวเซอร์ ซึ่งรองรับการงานได้สมบูรณ์แบบ 100% โดยไม่ต้องพึ่งระบบหลังบ้านเลยครับ!";
        } else {
          try {
            if (textData) {
              const errObj = JSON.parse(textData);
              if (errObj.error) errorMessage = errObj.error;
            }
          } catch (e) {
            // JSON parsing error
          }
        }
        throw new Error(errorMessage);
      }

      if (!textData) {
        throw new Error("ไม่มีผลลัพธ์ตอบสนองจากบริการ AI สแกนภาพ");
      }

      const parsed = JSON.parse(textData);
      if (parsed.slabs && Array.isArray(parsed.slabs)) {
        if (parsed.slabs.length === 0) {
          setScanError("AI สแกนรูปภาพสำเร็จ แต่ไม่พบบัญชีสเปกหรือรายการแผ่นพื้นสำเร็จรูปในภาพ กรุณาลองใช้รูปแผ่นสเปกที่ชัดเจนกว่านี้");
          return;
        }

        const normalPriceVal = manualNormalPrice === "" ? 210 : manualNormalPrice;
        const mocPriceVal = manualMocPrice === "" ? 230 : manualMocPrice;

        const formatted = parsed.slabs.map((s: any) => {
          let type = "normal";
          if (
            s.boardType === "m.o.c" ||
            s.boardType === "moc" ||
            /มอก/i.test(s.boardType || "") ||
            /ม\.อ\.ก/i.test(s.boardType || "")
          ) {
            type = "m.o.c";
          }

          const fallbackPrice = type === "m.o.c" ? mocPriceVal : normalPriceVal;
          const assignedPrice = (s.customPriceSqm && s.customPriceSqm > 0) ? s.customPriceSqm : fallbackPrice;

          return {
            id: Math.random().toString(36).substring(2, 9),
            length: typeof s.length === "number" && s.length >= 0.1 && s.length <= 22 ? s.length : 2.0,
            count: typeof s.count === "number" && s.count > 0 ? s.count : 1,
            boardType: type,
            customPriceSqm: assignedPrice,
            wireCount: s.wireCount || "auto",
            label: s.label || `แผ่นพื้นขนาดความยาว ${s.length || "2.0"} เมตร`
          };
        });

        setScannedItems((prev) => [...prev, ...formatted]);
        setSelectedImage(null);
        setSuccessMessage(`สแกนแยกแยะรายการสำเร็จ! ตรวจพบและบันทึกแผ่นพื้นอัดแรง ${formatted.length} รายการลงตารางแล้วครับ 🎉`);
      } else {
        throw new Error("ข้อมูลรายการแผ่นสถานที่วิเคราะห์ไม่ตรงตามฟอร์แมตมาตรฐาน");
      }

    } catch (error: any) {
      console.error(error);
      setScanError(error.message || "เกิดอุบัติเหตุไม่คาดคิดในการระบุหรือตรวจพบรายการพื้น AI");
    } finally {
      setIsScanningImage(false);
    }
  };

  // Sync with standard settings when settings update
  useEffect(() => {
    setManualNormalPrice(settings.prices.normalBoardPrice);
    setManualMocPrice(settings.prices.mocBoardPrice);
  }, [settings.prices.normalBoardPrice, settings.prices.mocBoardPrice]);

// Client-side text parsing as a super robust fallback for serverless hosting like Netlify
const parseSlabsTextClientSide = (
  text: string,
  normalPrice: number,
  mocPrice: number
) => {
  const lines = text.split("\n");
  const slabs = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Default values
    let length: number | "" = 2.0;
    let count: number | "" = 1;
    let boardType = "normal";
    let wireCount = "auto";
    let label = trimmed;

    // 1. Detect Slab Type (Normal vs MOC)
    if (/มอก|ม\.อ\.ก|moc|tis|t.i.s/i.test(trimmed)) {
      boardType = "m.o.c";
    }

    // 2. Detect Wire count (ลวด X เส้น, ลวด X, X เส้น, PC X)
    const wireMatchStrict = trimmed.match(/(?:ลวด\s*([4-8])\s*เส้น|ลวด\s*([4-8])|([4-8])\s*เส้น|pc\s*([4-8])|pc\s*([4-8])\s*เส้น)/i);
    if (wireMatchStrict) {
      const wVal = wireMatchStrict[1] || wireMatchStrict[2] || wireMatchStrict[3] || wireMatchStrict[4] || wireMatchStrict[5];
      if (wVal) {
        wireCount = wVal;
      }
    }

    // 3. Detect Length
    // Pattern 3.1: 0.35 x 2.50 or similar
    const pattern35xDecimal = trimmed.match(/0\.35\s*[*x×X:-]\s*(\d+(?:\.\d+)?)/);
    // Pattern 3.2: 35x250 or 35 x 300 (centimeters)
    const pattern35xCm = trimmed.match(/35\s*[*x×X:-]\s*(\d+)/);
    // Pattern 3.3: Decimal numbers with metric suffix e.g., 3.50 ม, 3.5 เมตร, 4m
    const patternLenIndicator = trimmed.match(/(\d+\.\d+)\s*(?:ม|เมตร|m|M|เมตร\.)/);
    const patternIntIndicator = trimmed.match(/(\d+)\s*(?:ม|เมตร|m)/i);
    // Pattern 3.4: General raw decimals
    const patternAnyDec = trimmed.match(/(\d+\.\d+)/);

    if (pattern35xDecimal) {
      length = parseFloat(pattern35xDecimal[1]);
    } else if (pattern35xCm) {
      const cmVal = parseInt(pattern35xCm[1], 10);
      length = cmVal >= 50 ? cmVal / 100 : cmVal;
    } else if (patternLenIndicator) {
      length = parseFloat(patternLenIndicator[1]);
    } else if (patternIntIndicator) {
      length = parseFloat(patternIntIndicator[1]);
    } else if (patternAnyDec) {
      const decVal = parseFloat(patternAnyDec[1]);
      if (decVal !== 0.35) {
        length = decVal;
      } else {
        // If 0.35 is the only decimal, extract other logical integers between 1 and 22
        const allInts = trimmed.match(/\b\d+\b/g);
        if (allInts) {
          const possibleLens = allInts.map(Number).filter(n => n >= 1 && n <= 22 && n !== 35);
          if (possibleLens.length > 0) {
            length = possibleLens[0];
          }
        }
      }
    } else {
      const allNums = trimmed.match(/\d+(?:\.\d+)?/g);
      if (allNums) {
        const candidates = allNums.map(Number).filter(n => n >= 1 && n <= 22 && n !== 35);
        if (candidates.length > 0) {
          length = candidates[0];
        }
      }
    }

    // 4. Detect Count/Quantity (e.g., 10 แผ่น)
    const countPattern = trimmed.match(/(\d+)\s*(?:แผ่น|ชิ้น|อัน|ตัว|แผ่นพื้น|pcs|Pcs|PCS|ชุด|คู่|ใบ)/);
    if (countPattern) {
      count = parseInt(countPattern[1], 10);
    } else {
      const allNumbers = trimmed.match(/\d+(?:\.\d+)?/g);
      if (allNumbers && allNumbers.length >= 2) {
        const remainingNumbers = allNumbers.filter((nStr) => {
          const n = parseFloat(nStr);
          return (
            n !== 0.35 &&
            n !== 35 &&
            n !== length &&
            nStr !== wireCount
          );
        });
        if (remainingNumbers.length > 0) {
          const possibleCount = parseInt(remainingNumbers[0], 10);
          if (!isNaN(possibleCount) && possibleCount > 0 && possibleCount < 1000) {
            count = possibleCount;
          }
        }
      }
    }

    // Clamp values inside logical limits
    if (typeof length === "number" && (length < 0.1 || length > 22)) {
      length = 2.0;
    }

    const customPriceSqm = boardType === "m.o.c" ? mocPrice : normalPrice;

    slabs.push({
      length,
      count,
      boardType,
      customPriceSqm,
      wireCount,
      label
    });
  }

  return slabs;
};

  // Trigger SPEC text analyzer (Local Regex/AI Parser depending on mode)
  const parseMultilineSlabsText = async () => {
    if (!rawTextLines.trim()) {
      setScanError("กรุณาระบุข้อความรายละเอียดแผ่นพื้นสำหรับวิเคราะห์");
      return;
    }
    setIsScanning(true);
    setScanError(null);
    setSuccessMessage(null);

    const normalPriceVal = manualNormalPrice === "" ? 210 : manualNormalPrice;
    const mocPriceVal = manualMocPrice === "" ? 230 : manualMocPrice;

    // 1. OFFLINE MODE (Instant Parser without hitting Node server - Perfect for Static site hostings like Netlify)
    if (textParseMode === "offline") {
      try {
        const localSlabs = parseSlabsTextClientSide(rawTextLines, normalPriceVal, mocPriceVal);
        if (localSlabs.length === 0) {
          setScanError("ระบบวิเคราะห์ข้อมูลท้องถิ่นไม่พบบัญชีสเปกในข้อความ กรุณาลองปรับข้อความให้ชัดเจนขึ้น");
          setIsScanning(false);
          return;
        }

        const formatted = localSlabs.map((s: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          length: s.length,
          count: s.count,
          boardType: s.boardType,
          customPriceSqm: s.customPriceSqm,
          wireCount: s.wireCount,
          label: s.label
        }));

        setScannedItems((prev) => [...prev, ...formatted]);
        setSuccessMessage(`ประมวลผลบนเครื่องด่วนสำเร็จ! นำเข้าแผ่นพื้นอัดแรง ${formatted.length} รายการลงตารางเรียบร้อย 💻🎉`);
      } catch (err: any) {
        console.error("Local offline parser failed:", err);
        setScanError(`เกิดข้อผิดพลาดในการประมวลผลออฟไลน์: ${err.message}`);
      } finally {
        setIsScanning(false);
      }
      return;
    }

    // 2. SERVER-SIDE AI PARSE MODE
    try {
      let res: Response;
      try {
        res = await fetch("/api/parse-slabs-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: rawTextLines,
            normalPrice: normalPriceVal,
            mocPrice: mocPriceVal
          })
        });
      } catch (fetchErr: any) {
        // Automatically switch back to local offline parser and parsing gracefully
        console.warn("เซิร์ฟเวอร์ออฟไลน์หรือไม่มี API Route ให้บริการ สลับไปใช้โหมดประมวลผลด่วนบนเว็บออฟไลน์แทนทันที:", fetchErr);
        const fallbackSlabs = parseSlabsTextClientSide(rawTextLines, normalPriceVal, mocPriceVal);
        if (fallbackSlabs.length > 0) {
          const formatted = fallbackSlabs.map((s: any) => ({
            id: Math.random().toString(36).substring(2, 9),
            length: s.length,
            count: s.count,
            boardType: s.boardType,
            customPriceSqm: s.customPriceSqm,
            wireCount: s.wireCount,
            label: s.label
          }));
          setScannedItems((prev) => [...prev, ...formatted]);
          setSuccessMessage("เซิร์ฟเวอร์ออฟไลน์/Netlify: สลับมาวิเคราะห์ข้อมูลแผ่นพื้นด้วยระบบประมวลผลด่วนบนเว็บแทนสำเร็จ 💻🎉");
          return;
        }
        throw fetchErr;
      }

      let textData = "";
      try {
        textData = await res.text();
      } catch (e) {
        textData = "";
      }

      let parsed: any = null;

      // Handle serverless or static redirection to HTML page
      const looksLikeHtml = textData.trim().startsWith("<!DOCTYPE") || textData.trim().startsWith("<html");

      if (!res.ok || looksLikeHtml) {
        // Fallback directly to local regex parser safely on 404/405/HTML-responses
        console.log(`เซิร์ฟเวอร์ตอบสนอง (สถานะ ${res.status}). สลับไปรันตัวถอดรหัสคอมพิวเตอร์ออฟไลน์เพื่อความทนทาน`);
        const fallbackSlabs = parseSlabsTextClientSide(rawTextLines, normalPriceVal, mocPriceVal);
        if (fallbackSlabs.length > 0) {
          const formatted = fallbackSlabs.map((s: any) => ({
            id: Math.random().toString(36).substring(2, 9),
            length: s.length,
            count: s.count,
            boardType: s.boardType,
            customPriceSqm: s.customPriceSqm,
            wireCount: s.wireCount,
            label: s.label
          }));
          setScannedItems((prev) => [...prev, ...formatted]);
          setSuccessMessage("ระบบสลับประมวลผลบนเครื่องด่วนอัตโนมัติ (ข้ามข้อจำกัดของระบบคลาวด์/Netlify) สำเร็จ 💻🎉");
          return;
        }

        let errorMessage = `เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูลด้วย AI (รหัสห้องทดลอง: ${res.status})`;
        if (looksLikeHtml) {
          errorMessage = "เซิร์ฟเวอร์เป็นสแตติกแบบไม่รองรับ Node API บน Netlify กรุณาเปลี่ยนไปเลือกโหมดด่วนออฟไลน์";
        } else {
          try {
            if (textData) {
              const errJson = JSON.parse(textData);
              if (errJson.error) {
                errorMessage = errJson.error;
              } else if (errJson.message) {
                errorMessage = errJson.message;
              }
            }
          } catch (e) {
            // Unparseable error text
          }
        }
        throw new Error(errorMessage);
      }

      parsed = JSON.parse(textData);
      if (parsed.slabs && Array.isArray(parsed.slabs)) {
        if (parsed.slabs.length === 0) {
          setScanError("AI ไม่พบข้อมูลแผ่นพื้นคอนกรีตสำเร็จรูปในข้อความที่ป้อนเข้ามา กรุณาลองปรับข้อความให้ชัดเจน");
          return;
        }

        // Map and append
        const formatted = parsed.slabs.map((s: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          length: typeof s.length === "number" ? s.length : 2.0,
          count: typeof s.count === "number" ? s.count : 1,
          boardType: s.boardType === "m.o.c" ? "m.o.c" : "normal",
          customPriceSqm: typeof s.customPriceSqm === "number" && s.customPriceSqm > 0 ? s.customPriceSqm : "",
          wireCount: s.wireCount || "auto",
          label: s.label || `แผ่นพื้น ${s.length} ม.`
        }));

        setScannedItems((prev) => [...prev, ...formatted]);
        setSuccessMessage(`แปลข้อมูลด้วยเซิร์ฟเวอร์ AI สำเร็จ! ตรวจพบแผ่นพื้นและวิเคราะห์คำนวณ ${formatted.length} รายการแล้วครับ 🧠🎉`);
      } else {
        throw new Error("โครงสร้างผลลัพธ์ของ AI ไม่สอดคล้องกับเป้าหมายระบบ");
      }
    } catch (err: any) {
      console.error("Text parsing Error:", err);
      setScanError(err.message || "เกิดข้อผิดพลาดจากเครือข่ายระบบ AI");
    } finally {
      setIsScanning(false);
    }
  };

  // Scanned Slabs manual row interactions
  const addManualRow = () => {
    const id = Math.random().toString(36).substring(2, 9);
    setScannedItems((prev) => [
      ...prev,
      {
        id,
        length: 2.5,
        count: 10,
        boardType: "normal",
        customPriceSqm: "",
        wireCount: "auto",
        label: "รายการแผ่นพื้นป้อนมือ"
      }
    ]);
  };

  const deleteRow = (id: string) => {
    setScannedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const editRow = (id: string, field: keyof ScannedSlabItem, value: any) => {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const clearAllScanned = () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างรายการสินค้าแผ่นพื้นทั้งหมด?")) {
      setScannedItems([]);
    }
  };

  // Math for scannedItems
  const computedItems = scannedItems.map((item) => {
    const finalLength = item.length === "" ? 0 : item.length;
    const finalCount = item.count === "" ? 0 : item.count;

    // determine wire
    let currentWire = item.wireCount;
    if (currentWire === "auto" || !currentWire) {
      if (finalLength <= 3.0) {
        currentWire = "4";
      } else if (finalLength <= 4.0) {
        currentWire = "5";
      } else {
        currentWire = "7";
      }
    }

    // Step rate
    let itemStep = 0;
    const isCustom = item.boardType === "custom" || item.boardType === "m.o.c_custom";
    const isMoc = item.boardType === "m.o.c" || item.boardType === "m.o.c_custom";

    if (!isMoc) {
      const base = item.customPriceSqm !== "" ? Number(item.customPriceSqm) : settings.prices.normalBoardPrice;
      if (currentWire === "4") itemStep = base;
      else if (currentWire === "5") itemStep = base + 10;
      else if (currentWire === "6") itemStep = base + 20;
      else if (currentWire === "7") itemStep = base + 35;
      else if (currentWire === "8") itemStep = base + 55;
    } else {
      const base = item.customPriceSqm !== "" ? Number(item.customPriceSqm) : settings.prices.mocBoardPrice;
      if (currentWire === "4") itemStep = base;
      else if (currentWire === "5") itemStep = base + 15;
      else if (currentWire === "6") itemStep = base + 30;
      else if (currentWire === "7") itemStep = base + 50;
      else if (currentWire === "8") itemStep = base + 75;
    }

    const rawPricePerSheet = 0.35 * itemStep * finalLength;
    const finalPricePerSheet = autoRoundPrice ? roundToBeautifulPrice(rawPricePerSheet) : rawPricePerSheet;
    const totalPrice = finalPricePerSheet * finalCount;
    const totalWeight = settings.weights.slab * finalLength * finalCount;
    const totalArea = 0.35 * finalLength * finalCount;

    return {
      ...item,
      stepPrice: itemStep,
      wireResolved: currentWire,
      finalPricePerSheet,
      totalPrice,
      totalWeight,
      totalArea
    };
  });

  const batchTotalPrice = computedItems.reduce((acc, current) => acc + current.totalPrice, 0);
  const batchTotalWeight = computedItems.reduce((acc, current) => acc + current.totalWeight, 0);
  const batchTotalCount = computedItems.reduce((acc, current) => acc + (current.count === "" ? 0 : current.count), 0);
  const batchTotalArea = computedItems.reduce((acc, current) => acc + current.totalArea, 0);

  // Export Batch to Weight (Logistics)
  const exportItemsToLogistics = () => {
    if (!setWeightItems || !onNavigateToWeight) {
      alert("ระบบไม่พบฟังก์ชันส่งต่อสำหรับแท็บขนส่ง");
      return;
    }

    const newWeightItems: WeightItem[] = computedItems.map((item) => {
      const len = item.length === "" ? 2.0 : item.length;
      const cnt = item.count === "" ? 1 : item.count;
      return {
        id: Math.random().toString(36).substring(2, 9),
        type: "slab",
        count: cnt,
        length: len,
        unitWeight: settings.weights.slab // inherit standard weight/meter
      };
    });

    setWeightItems((prev) => [...prev, ...newWeightItems]);
    setIsCopiedNotify(true);
    setTimeout(() => {
      setIsCopiedNotify(false);
      onNavigateToWeight();
    }, 1200);
  };


  return (
    <div className="space-y-6">
      
      {/* Selector tab for modes and Auto-Round Price Option */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-3 rounded-2xl border border-neutral-150 shadow-sm">
        <div className="bg-neutral-100 p-1 rounded-xl flex items-center w-full sm:w-fit border border-neutral-200">
          <button
            onClick={() => setCalculatorMode("single")}
            className={`flex-1 sm:flex-initial py-2.5 px-6 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              calculatorMode === "single"
                ? "bg-white text-[#C62828] shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Calculator size={14} />
            คำนวณรายแผ่นเดี่ยว ✏️
          </button>
          <button
            onClick={() => setCalculatorMode("batch")}
            className={`flex-1 sm:flex-initial py-2.5 px-6 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 focus:outline-none ${
              calculatorMode === "batch"
                ? "bg-white text-[#C62828] shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Sparkles size={14} className="text-amber-500" />
            สแกนภาพคำนวณหลายแผ่น 📸 (AI Scan)
          </button>
        </div>

        {/* Beautiful Auto-Round Price Toggle Button */}
        <button
          onClick={toggleAutoRoundPrice}
          className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold border transition duration-150 shadow-sm cursor-pointer w-full sm:w-auto ${
            autoRoundPrice
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-600"
              : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600"
          }`}
          title="ปัดเศษราคาขึ้นให้ลงท้ายด้วย 5 หรือ 0 เพื่อราคาสุดสวยงามในการเสนอราคาลูกค้า"
        >
          <Sparkles size={14} className={autoRoundPrice ? "animate-spin text-white" : "text-amber-500"} />
          <span>🪄 ปรับราคาสวยอัตโนมัติ (ปัดขึ้นลงท้าย 5/0): {autoRoundPrice ? "เปิดใช้งาน ✅" : "ปิดอยู่ ❌"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- CALCULATOR MODE 1: SINGLE --- */}
        {calculatorMode === "single" && (
          <motion.div
            key="singleView"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
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
                      {autoWireAdjust && (
                        <span className="text-xs text-[#C62828] font-medium flex items-center gap-1">
                          <Check size={12} /> โหมดอัตโนมัติเลือกให้เป็น {wireCount === "5_mm_5" ? "ลวด 5 มม." : `ลวด ${wireCount} เส้น`}
                        </span>
                      )}
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
                <SlabVisualizer length={typeof length === "number" ? length : 0} wireCount={wireCount} />
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
                      <div className="flex items-center gap-3">
                        <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                          ฿{fmt(finalPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySinglePrice(finalPrice)}
                          className={`p-2 rounded-xl transition duration-150 flex items-center justify-center cursor-pointer ${
                            copiedSingle
                              ? "bg-white/20 text-emerald-300 scale-105"
                              : "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
                          }`}
                          title={`คัดลอกราคาต่อแผ่น (฿${fmt(finalPrice)})`}
                        >
                          {copiedSingle ? <Check size={16} className="stroke-[3]" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <span className="text-lg opacity-85 block mt-1 font-light">
                        (กว้าง 35 ซม. x ยาว {typeof length === "number" ? length.toFixed(2) : "0.00"} เมตร)
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
                      <strong className="text-white font-semibold">฿{fmt(step)} / ตร.ม.</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>ความสามารถการรับน้ำหนักสูงสุด:</span>
                      <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        {loadCapacity > 0 ? `${loadCapacity} กก./ตร.ม.` : "ไม่แสดงตามตาราง"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>จำนวนแผ่นที่แนะนำ:</span>
                      <strong className="text-white font-semibold text-base">{boardCount} แผ่น</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs opacity-75">
                      <span>(ครอบคลุมพื้นที่ {fmt(totalArea)} ตร.ม. แผ่นละ {fmt(boardArea)} ตร.ม.)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-white/15 pt-2">
                      <span>ประมาณการน้ำหนักรวมทั้งหมด:</span>
                      <strong className="text-amber-300 font-bold text-base">{fmt(totalWeight)} กก.</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Load Table Section (PONGSAKUL CONCRETE) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="text-neutral-500" size={18} />
                  <h4 className="font-semibold text-neutral-800 text-sm md:text-base">
                    ตารางกำหนดพิกัดแรงแบกทานสูงสุด (กก./ตร.ม.) - PONGSAKUL CONCRETE
                  </h4>
                </div>
                <span className="text-xs text-neutral-400 font-medium hidden sm:inline-block">ไฮไลท์สอดคล้องสเปคปัจจุบันป้อนเข้า</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-neutral-150">
                <table className="min-w-full text-center text-xs font-sans">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-150 text-neutral-600 font-semibold font-sans">
                      <th className="py-3 px-2 border-r border-neutral-150 bg-neutral-100 font-bold font-sans">ลวด PC (เส้น)</th>
                      {colKeys.map((key) => {
                        let closestLengthKey = colKeys.find((k) => k >= length);
                        if (!closestLengthKey) closestLengthKey = colKeys[colKeys.length - 1];
                        else if (length < colKeys[0]) closestLengthKey = colKeys[0];
                        const isCurrentCol = closestLengthKey === key;
                        return (
                          <th
                            key={key}
                            className={`py-3 px-2 border-r border-neutral-150 min-w-[50px] font-mono ${
                              isCurrentCol ? "bg-red-50 text-[#C62828] font-bold ring-2 ring-red-500/10" : ""
                            }`}
                          >
                            {key.toFixed(2)}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rowLabels.map((rLabel, rowIndex) => {
                      return (
                        <tr key={rLabel} className="border-b last:border-b-0 border-neutral-150 hover:bg-neutral-50/50">
                          <td className="py-2.5 px-2 border-r border-neutral-150 bg-neutral-50 font-semibold text-neutral-700 text-[13px]">
                            {rLabel} เส้น
                          </td>
                          {colKeys.map((cKey) => {
                            const capacities = loadCapacityTable[cKey];
                            const val = capacities ? capacities[rowIndex] : 0;
                            const cellStatus = getHighlightStatus(rLabel, cKey);

                            let cellClass = "text-neutral-500";
                            if (cellStatus === "activeCell") {
                              cellClass = "bg-[#C62828] text-white font-extrabold ring-4 ring-[#C62828]/20 scale-102 shadow-sm rounded-md transition-all";
                            } else if (cellStatus === "rowMatch") {
                              cellClass = "bg-red-50/60 text-[#C62828] font-medium";
                            } else if (cellStatus === "colMatch") {
                              cellClass = "bg-neutral-100 text-neutral-800 font-medium";
                            }

                            return (
                              <td
                                key={cKey}
                                className={`py-2 px-1 border-r border-neutral-150 font-mono text-center text-xs transition ${cellClass}`}
                              >
                                {val === 0 || val === undefined ? "-" : val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-400 font-light italic">
                <span>*พิกัดมาตรฐานความปลอดภัย (Safety Weight Factors) อ้างอิงตามสัญญารับมอบการผลิตโรงงาน</span>
                <span>หน่วยวัดความยาวเป็นเมตร (ม.) และความจุแบกทานเป็น กก./ตร.ม.</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- CALCULATOR MODE 2: BATCH / MULTILINE TEXT SCAN --- */}
        {calculatorMode === "batch" && (
          <motion.div
            key="batchView"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Manual inputs & Textarea instead of Image Drag and Drop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-neutral-200/85 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Tab Selector for Batch Input Modes */}
                  <div className="flex border-b border-neutral-150 pb-2.5 mb-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setBatchInputType("image");
                        setScanError(null);
                        setSuccessMessage(null);
                      }}
                      className={`pb-2 text-xs font-extrabold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                        batchInputType === "image"
                          ? "text-[#C62828] border-b-2 border-[#C62828]"
                          : "text-neutral-400 hover:text-neutral-700"
                      }`}
                    >
                      <Camera size={14} />
                      สแกนรูปภาพ/ถ่ายรูปสเปก 📸
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchInputType("text");
                        setScanError(null);
                        setSuccessMessage(null);
                      }}
                      className={`pb-2 text-xs font-extrabold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                        batchInputType === "text"
                          ? "text-[#C62828] border-b-2 border-[#C62828]"
                          : "text-neutral-400 hover:text-neutral-700"
                      }`}
                    >
                      <span>เขียน/พิมพ์สเปกเอง 📝</span>
                    </button>
                  </div>

                  {/* Manual Squares Meter Prices baseline */}
                  <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-150">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">ราคา ธรรมดา (บาท/ตรม)</label>
                      <input 
                        type="number"
                        value={manualNormalPrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualNormalPrice(val === "" ? "" : parseFloat(val));
                        }}
                        className="w-full px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-red-300"
                        placeholder="210"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">ราคา มอก. (บาท/ตรม)</label>
                      <input 
                        type="number"
                        value={manualMocPrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualMocPrice(val === "" ? "" : parseFloat(val));
                        }}
                        className="w-full px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-red-300"
                        placeholder="230"
                      />
                    </div>
                  </div>

                  {/* TAB 1: IMAGE SCANNER */}
                  {batchInputType === "image" && (
                    <div className="space-y-4">
                      {/* Hidden inputs to trigger files */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                      />

                      {!selectedImage ? (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[180px] gap-2.5 ${
                            isDragging
                              ? "border-[#C62828] bg-red-50/30"
                              : "border-neutral-300 hover:border-red-400 bg-neutral-25 hover:bg-neutral-50/50"
                          }`}
                        >
                          <div className="p-3 bg-red-50 text-[#C62828] rounded-full">
                            <Upload size={22} className="animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-700">ลากและวางรูปถ่ายสเปก หรือคลิกเพื่อเลือกไฟล์</p>
                            <p className="text-[10px] text-neutral-400 mt-1">รองรับ JPEG, PNG, WebP หน้าจอสนทนา ใบเสนอราคา หรือลิสต์ส่งสเปก</p>
                          </div>
                          <div className="flex gap-2 mt-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="py-1.5 px-3 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg text-[11px] font-bold shadow-sm transition"
                            >
                              เลือกจากรูปภาพ 📂
                            </button>
                            <button
                              type="button"
                              onClick={() => cameraInputRef.current?.click()}
                              className="py-1.5 px-3 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-lg text-[11px] font-bold shadow-sm transition flex items-center gap-1"
                            >
                              <Camera size={11} />
                              เปิดกล้องมือถือถ่ายรูป 📸
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative rounded-xl overflow-hidden border border-neutral-200 max-h-[160px] bg-neutral-900 flex justify-center items-center">
                            <img
                              src={selectedImage}
                              alt="Spec Preview"
                              className="object-contain max-h-[160px] w-auto h-auto rounded"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImage(null);
                                setSuccessMessage(null);
                              }}
                              className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 text-xs transition h-6 w-6 flex items-center justify-center font-bold"
                              title="ลบออก"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isScanningImage}
                              onClick={scanProductImage}
                              className="flex-grow py-3.5 text-xs bg-gradient-to-r from-amber-500 to-red-600 hover:opacity-95 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer"
                            >
                              {isScanningImage ? (
                                <>
                                  <RefreshCcw size={14} className="animate-spin" />
                                  กำลังสแกนรูปภาพวิเคราะห์ด้วย AI...
                                </>
                              ) : (
                                <>
                                  <Sparkles size={14} />
                                  เริ่มสแกนรูปใบงานด้วยวิเศษ AI 🧠
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: TEXT AREA PARSER */}
                  {batchInputType === "text" && (
                    <div className="space-y-4">
                      {/* Sub-modes selector */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">โหมดประมวลผลข้อความ:</span>
                        <div className="flex bg-neutral-200/60 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setTextParseMode("offline");
                              setScanError(null);
                            }}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-md transition cursor-pointer ${
                              textParseMode === "offline"
                                ? "bg-white text-[#C62828] shadow-sm"
                                : "text-neutral-500 hover:text-neutral-800"
                            }`}
                          >
                            💻 ด่วนบนเว็บออฟไลน์ (สำหรับ Netlify)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTextParseMode("ai");
                              setScanError(null);
                            }}
                            className={`px-2.5 py-1 text-[10px] font-black rounded-md transition cursor-pointer flex items-center gap-1 ${
                              textParseMode === "ai"
                                ? "bg-[#C62828] text-white shadow-sm"
                                : "text-neutral-500 hover:text-neutral-800"
                            }`}
                          >
                            ⚡ AI วิเศษ (ต้องรัน Node Server)
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <textarea
                          rows={5}
                          value={rawTextLines}
                          onChange={(e) => setRawTextLines(e.target.value)}
                          className="w-full p-3 font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-250 focus:bg-white text-neutral-800 leading-relaxed"
                          placeholder="พิมพ์สเปกแผ่นพื้นแต่ละรายการแยกบรรทัด เช่น:&#10;0.35x2.50 ลวด 5 เส้น 20 แผ่น&#10;แผ่นพื้นยาว 3.00 มอก. จำนวน 10 แผ่น&#10;0.35x3.50 15 แผ่น"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={parseMultilineSlabsText}
                        disabled={isScanning}
                        className={`w-full py-3.5 text-xs rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer ${
                          textParseMode === "offline"
                            ? "bg-neutral-850 hover:bg-neutral-900 text-white"
                            : "bg-gradient-to-r from-amber-500 to-red-600 hover:opacity-95 text-white"
                        }`}
                      >
                        {isScanning ? (
                          <>
                            <RefreshCcw size={14} className="animate-spin" />
                            {textParseMode === "offline" 
                              ? "กำลังแยกผลลัพธ์ด่วนบนบราวเซอร์..." 
                              : "กำลังแปลสเปกข้อความด้วย AI 🧠..."}
                          </>
                        ) : (
                          <>
                            {textParseMode === "offline" ? (
                              <>
                                <span>⚡ สแกนข้อมูลด่วนบนเว็บบราวเซอร์ทันที (ไม่ต้องพึ่งเซิร์ฟเวอร์)</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} />
                                <span>สแกนสเปกข้อความด้วย AI ระบบคลาวด์</span>
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Error or Success display */}
                <div className="space-y-2 pt-2">
                  {scanError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100 flex gap-1.5 items-start">
                      <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
                      <span>{scanError}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 bg-green-50 text-green-800 rounded-xl text-xs border border-green-100 flex gap-1.5 items-start">
                      <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-green-600 animate-bounce" />
                      <span>{successMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Totals Bento block */}
              <div className="lg:col-span-6 bg-gradient-to-br from-[#E53935] to-[#B71C1C] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between min-h-[220px]">
                <div>
                  <span className="text-xs font-bold bg-white/25 text-amber-200 py-1 px-3.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                    <Layers size={11} className="animate-bounce" />
                    บัญชีราคารวมหลายรายการ (Batch Summary)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-0.5">
                      <span className="text-xs opacity-80 block">รวมมูลค่าทั้งสิ้น</span>
                      <span className="text-2xl sm:text-3.5xl font-black text-white leading-tight font-sans">
                        ฿{fmt(batchTotalPrice)}
                      </span>
                    </div>
                    <div className="space-y-0.5 border-l border-white/15 pl-4">
                      <span className="text-xs opacity-80 block">น้ำหนักสะสมรวม</span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-300 leading-tight font-sans">
                        {fmt(batchTotalWeight)} <span className="text-xs font-normal">กก.</span>
                      </span>
                    </div>
                    <div className="space-y-0.5 border-t border-white/10 pt-3">
                      <span className="text-xs opacity-80 block">พื้นที่ติดตั้งรวม</span>
                      <span className="text-sm font-bold text-neutral-100 font-mono">
                        {fmt(batchTotalArea)} ตร.ม.
                      </span>
                    </div>
                    <div className="space-y-0.5 border-t border-white/10 border-l border-white/15 pt-3 pl-4">
                      <span className="text-xs opacity-80 block">จำนวนวัสดุรวม</span>
                      <span className="text-sm font-bold text-neutral-100 font-mono">
                        {batchTotalCount} แผ่น
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/15 pt-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-100 font-light">
                  <span>สแกนหรือแอดรายการแผ่นพื้นสำเร็จรูปเพื่อคำนวณราคากลางภายใน</span>
                  
                  {scannedItems.length > 0 && (
                    <button
                      onClick={exportItemsToLogistics}
                      disabled={isCopiedNotify}
                      className="px-4 py-2 bg-white text-[#C62828] hover:bg-neutral-50 transition border border-white/20 rounded-xl font-bold flex items-center justify-center gap-1 shadow disabled:opacity-50"
                    >
                      {isCopiedNotify ? (
                        <>
                          <CheckCircle2 size={13} className="text-green-600 animate-bounce" />
                          ส่งต่อสำเร็จแล้ว!
                        </>
                      ) : (
                        <>
                          <Truck size={13} />
                          ส่งกองขนส่งรถบรรทุก 🚛
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* List & Details table of current items */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-800 text-base">ตารางรายการแผ่นพื้นสำเร็จรูปที่สแกนเข้าระบบ</span>
                  <span className="text-xs bg-red-100 text-[#C62828] font-bold py-0.5 px-2 rounded-full">
                    {scannedItems.length} แถว
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={addManualRow}
                    className="py-2 px-4 bg-red-50 hover:bg-red-150 text-[#C62828] font-semibold text-xs rounded-xl border border-red-100 transition flex items-center gap-1"
                  >
                    <Plus size={14} />
                    เพิ่มแถวป้อนเอง ➕
                  </button>
                  {scannedItems.length > 0 && (
                    <button
                      onClick={clearAllScanned}
                      className="py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-semibold text-xs rounded-xl border border-neutral-200 transition"
                    >
                      ล้างทั้งหมด 🧹
                    </button>
                  )}
                </div>
              </div>

              {scannedItems.length === 0 ? (
                <div className="text-center py-16 text-neutral-400 space-y-2">
                  <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Calculator size={22} className="opacity-50" />
                  </div>
                  <p className="font-semibold text-sm">ยังไม่มีข้อมูลแผ่นพื้นสำเร็จรูปในตาราง</p>
                  <p className="text-xs max-w-sm mx-auto">
                    กรุณาแคปภาพแล้วลากมาวางเพื่อวิเคราะห์ด้วย AI หรือกดปุ่ม 'เพิ่มแถวป้อนเอง' ด้านขวาเพื่อพิมพ์สเปกทีละบรรทึก
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-neutral-200/80 shadow-sm bg-white">
                  <table className="min-w-full text-xs font-sans text-left">
                    <thead>
                      <tr className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-600 font-bold">
                        <th className="py-3.5 px-3 text-center w-[50px] font-sans">#</th>
                        <th className="py-3.5 px-4 min-w-[150px] font-sans">บันทึกสเปก/ป้ายชื่อ</th>
                        <th className="py-3.5 px-3 w-[100px] font-sans text-center">ยาว (ม.)</th>
                        <th className="py-3.5 px-3 w-[100px] font-sans text-center">จำนวน (แผ่น)</th>
                        <th className="py-3.5 px-4 w-[160px] font-sans">ชนิดแผ่นพื้น</th>
                        <th className="py-3.5 px-4 w-[160px] font-sans">สเปคลวด (ลวด)</th>
                        <th className="py-3.5 px-4 w-[130px] font-sans text-center">ราคา ตร.ม. (บาท)</th>
                        <th className="py-3.5 px-4 text-right font-sans">ราคา/แผ่น (บาท)</th>
                        <th className="py-3.5 px-3 text-center w-[60px] font-sans">ลบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computedItems.map((item, index) => {
                        return (
                          <tr key={item.id} className="border-b last:border-b-0 border-neutral-100 hover:bg-neutral-50/50 transition duration-150">
                            <td className="py-3 px-3 text-center text-neutral-400 font-semibold font-mono">
                              {index + 1}
                            </td>
                            {/* Label Input */}
                            <td className="py-3 px-2">
                              <input 
                                type="text"
                                value={item.label}
                                onChange={(e) => editRow(item.id, "label", e.target.value)}
                                className="w-full bg-neutral-50/55 hover:bg-white border border-neutral-200/80 rounded-xl px-2.5 py-2 text-neutral-800 font-medium focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white text-xs transition focus:outline-none"
                                placeholder="แผ่นพื้นสำเร็จรูป"
                              />
                            </td>
                            {/* Length Input */}
                            <td className="py-3 px-2">
                              <input 
                                type="number"
                                value={item.length}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  editRow(item.id, "length", val === "" ? "" : parseFloat(val));
                                }}
                                step="0.1"
                                className="w-full bg-neutral-50/55 hover:bg-white border border-neutral-200/80 rounded-xl px-2.5 py-2 text-neutral-800 font-extrabold focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white text-xs font-mono text-center transition focus:outline-none"
                                placeholder="0"
                              />
                            </td>
                            {/* Count Input */}
                            <td className="py-3 px-2">
                              <input 
                                type="number"
                                value={item.count}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  editRow(item.id, "count", val === "" ? "" : parseInt(val));
                                }}
                                className="w-full bg-neutral-50/55 hover:bg-white border border-neutral-200/80 rounded-xl px-2.5 py-2 text-neutral-800 font-extrabold focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white text-xs font-mono text-center transition focus:outline-none"
                                placeholder="0"
                              />
                            </td>
                            {/* Board Type select */}
                            <td className="py-3 px-2">
                              <select
                                value={item.boardType}
                                onChange={(e) => editRow(item.id, "boardType", e.target.value)}
                                className="w-full bg-neutral-50/55 hover:bg-white border border-neutral-200/80 rounded-xl px-2.5 py-2 text-neutral-800 font-semibold focus:ring-1 focus:ring-red-400 focus:border-red-400 text-xs transition focus:outline-none"
                              >
                                <option value="normal">ธรรมดามาตรฐาน</option>
                                <option value="m.o.c">แผ่นพื้น มอก. (TIS)</option>
                                <option value="custom">ธรรมดา (คีย์ราคากลางเอง)</option>
                                <option value="m.o.c_custom">มอก. (คีย์ราคากลางเอง)</option>
                              </select>
                            </td>
                            {/* Wire count select */}
                            <td className="py-3 px-2">
                              {/* Option wire count */}
                              <select
                                value={item.wireCount}
                                onChange={(e) => editRow(item.id, "wireCount", e.target.value)}
                                className="w-full bg-neutral-50/55 hover:bg-white border border-neutral-200/80 rounded-xl px-2.5 py-2 text-neutral-800 font-semibold focus:ring-1 focus:ring-red-400 focus:border-red-400 text-xs transition focus:outline-none"
                              >
                                <option value="auto">คำนวณลวดออโต้ ({item.wireResolved} เส้น)</option>
                                <option value="4">ลวด PC 4 เส้น</option>
                                <option value="5">ลวด PC 5 เส้น</option>
                                <option value="6">ลวด PC 6 เส้น</option>
                                <option value="7">ลวด PC 7 เส้น</option>
                                <option value="8">ลวด PC 8 เส้น</option>
                              </select>
                            </td>
                            {/* Custom Sqm rate Input */}
                            <td className="py-3 px-2">
                              <input 
                                type="number"
                                value={item.customPriceSqm}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  editRow(item.id, "customPriceSqm", val === "" ? "" : parseFloat(val));
                                }}
                                className="w-full bg-neutral-50/55 hover:bg-white border border-neutral-200/80 rounded-xl px-2.5 py-2 text-neutral-800 font-extrabold focus:ring-1 focus:ring-red-400 focus:border-red-400 focus:bg-white text-xs font-mono transition text-center focus:outline-none"
                                placeholder={item.boardType.includes("m.o.c") ? String(settings.prices.mocBoardPrice) : String(settings.prices.normalBoardPrice)}
                              />
                            </td>
                            {/* Price per Sheet / Slab */}
                            <td className="py-3 px-4 text-right text-neutral-800 font-black text-[13px] font-mono whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <div>
                                  <div className="font-black text-neutral-800 text-[13px]">
                                    ฿{fmt(item.finalPricePerSheet)}
                                  </div>
                                  <span className="text-[10px] text-neutral-400 block font-normal">
                                    (น้ำหนัก {fmt(settings.weights.slab * (item.length === "" ? 0 : item.length))} กก. | {fmt(0.35 * (item.length === "" ? 0 : item.length))} ตร.ม.)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyRowPrice(item.id, item.finalPricePerSheet)}
                                  className={`p-1.5 rounded-lg border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                                    copiedRowId === item.id
                                      ? "bg-emerald-50 border-emerald-250 text-emerald-600 scale-105"
                                      : "bg-neutral-50 hover:bg-neutral-100 border-neutral-150 text-neutral-400 hover:text-[#C62828]"
                                  }`}
                                  title={`คัดลอกราคาต่อแผ่น (฿${fmt(item.finalPricePerSheet)})`}
                                >
                                  {copiedRowId === item.id ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </td>
                            {/* Row Delete Button */}
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => deleteRow(item.id)}
                                className="text-neutral-400 hover:text-red-650 p-2 hover:bg-red-50 rounded-xl transition"
                                title="ลบรายการแผ่นพื้น"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between text-xs text-neutral-400 font-light gap-2 mt-2">
                <span>*สูตรคำนวณราคากอง: 0.35 x ราคาก้าวตารางเมตรถัวเฉลี่ย x ความยาวมิติ และน้ำหนักเฉลี่ย {settings.weights.slab} กก./เมตร</span>
                <span>บริษัท พงษ์สกุลคอนกรีต จำกัด</span>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
