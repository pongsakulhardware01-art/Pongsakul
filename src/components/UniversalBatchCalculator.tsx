import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { AppSettings, WeightItem } from "../types";
import { fmt, roundToBeautifulPrice, compressImage } from "../utils";
import {
  Camera,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  FileSpreadsheet,
  Layers,
  Scale,
  DollarSign,
  Send,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronRight,
  Printer,
  ChevronDown,
  Hammer,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UniversalBatchCalculatorProps {
  settings: AppSettings;
  weightItems: WeightItem[];
  setWeightItems: Dispatch<SetStateAction<WeightItem[]>>;
  onNavigateToWeight: () => void;
}

export interface UniversalBatchItem {
  id: string;
  category: "slab" | "pile" | "hollow_core" | "fence" | "drainage";
  model: string; // normal, m.o.c, i15, i18, i22, i26, i30, s18, s22, s26, s30, s35, s40, hex, hc, fence3, fence4, pipe*, basin*
  length: number | "";
  count: number | "";
  wireCount?: "4" | "5" | "6" | "7" | "8" | "5_mm_5" | "auto"; // only for slabs
  tisStandard?: "tis" | "no_tis" | "t2" | "t3"; // pile/slab/drainage standard
  connectionType?: "single" | "joint"; // pile connection
  hcWidth?: 0.35 | 0.60 | 1.20; // hollow core width in meters
  customPrice?: number | ""; // user pricing override
  customStandardRate?: number | ""; // user standard rate override
  customWeightPerMeter?: number | ""; // user weight per meter override
  label?: string; // OCR text label or notes
}

export default function UniversalBatchCalculator({
  settings,
  weightItems,
  setWeightItems,
  onNavigateToWeight
}: UniversalBatchCalculatorProps) {
  // Items in the table state
  const [items, setItems] = useState<UniversalBatchItem[]>([
    {
      id: "demo-slab-1",
      category: "slab",
      model: "normal",
      length: 2.5,
      count: 20,
      wireCount: "auto",
      tisStandard: "no_tis",
      label: "แผ่นพื้นสำเร็จรูป 2.50 ม. (ตัวอย่าง)"
    },
    {
      id: "demo-pile-1",
      category: "pile",
      model: "i18",
      length: 6.0,
      count: 10,
      tisStandard: "tis",
      connectionType: "single",
      label: "เสาเข็มไอ I-18 ยาว 6.00 ม. มอก. (ตัวอย่าง)"
    },
    {
      id: "demo-hc-1",
      category: "hollow_core",
      model: "hc",
      length: 5.0,
      count: 12,
      hcWidth: 0.35,
      label: "แผ่นพื้นกลวง 0.35x5.00 ม. (ตัวอย่าง)"
    }
  ]);

  // Pricing & rounding state
  const [autoRoundPrice, setAutoRoundPrice] = useState<boolean>(() => {
    return localStorage.getItem("pongsakulAutoRoundPrice") === "true";
  });

  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const handleCopyPrice = (id: string, val: number) => {
    navigator.clipboard.writeText(String(val));
    setCopiedItemId(id);
    setTimeout(() => {
      setCopiedItemId(null);
    }, 1200);
  };

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

  const addNewLineItem = (category: "slab" | "pile" | "hollow_core" | "fence" | "drainage") => {
    const newItem: UniversalBatchItem = {
      id: Math.random().toString(36).substring(2, 9),
      category,
      model: category === "slab" ? "normal" : category === "hollow_core" ? "hc" : category === "pile" ? "i18" : category === "drainage" ? "pipe030" : "fence3",
      length: category === "slab" ? 2.5 : category === "hollow_core" ? 4.0 : category === "pile" ? 6.0 : category === "drainage" ? 1.0 : 3.0,
      count: 10,
      customPrice: "",
      customStandardRate: "",
      label: ""
    };

    if (category === "slab") {
      newItem.wireCount = "auto";
      newItem.tisStandard = "no_tis";
    } else if (category === "pile") {
      newItem.tisStandard = "no_tis";
      newItem.connectionType = "single";
    } else if (category === "hollow_core") {
      newItem.hcWidth = 0.35;
    } else if (category === "drainage") {
      newItem.tisStandard = "no_tis";
    }

    setItems((prev) => [...prev, newItem]);
  };

  const editLineItem = (id: string, key: keyof UniversalBatchItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [key]: value };
          
          if (key === "category") {
            const cat = value as "slab" | "pile" | "hollow_core" | "fence" | "drainage";
            updated.model = cat === "slab" ? "normal" : cat === "hollow_core" ? "hc" : cat === "pile" ? "i18" : cat === "drainage" ? "pipe030" : "fence3";
            updated.length = cat === "slab" ? 2.5 : cat === "hollow_core" ? 4.0 : cat === "pile" ? 6.0 : cat === "drainage" ? 1.0 : 3.0;
            updated.count = 10;
            updated.customPrice = "";
            updated.customStandardRate = "";
            updated.customWeightPerMeter = "";
            
            if (cat === "slab") {
              updated.wireCount = "auto";
              updated.tisStandard = "no_tis";
              delete updated.hcWidth;
              delete updated.connectionType;
            } else if (cat === "pile") {
              updated.tisStandard = "no_tis";
              updated.connectionType = "single";
              delete updated.hcWidth;
              delete updated.wireCount;
            } else if (cat === "hollow_core") {
              updated.hcWidth = 0.35;
              delete updated.wireCount;
              delete updated.connectionType;
              delete updated.tisStandard;
            } else if (cat === "fence") {
              delete updated.wireCount;
              delete updated.connectionType;
              delete updated.tisStandard;
              delete updated.hcWidth;
            } else if (cat === "drainage") {
              updated.tisStandard = "no_tis";
              delete updated.wireCount;
              delete updated.connectionType;
              delete updated.hcWidth;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const deleteLineItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // UI Modes inside scanning panel
  const [batchInputType, setBatchInputType] = useState<"image" | "text">("image");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [rawTextLines, setRawTextLines] = useState<string>(
    "แผ่นพื้น 3.50 เมตร 30 แผ่น มอก\n" +
    "เสาเข็มไอ I-22 ยาว 6.00 เมตร 8 ต้น\n" +
    "แผ่นพื้นกลวง 0.35x4.50 ม. 15 แผ่น"
  );

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showQuotationModal, setShowQuotationModal] = useState<boolean>(false);
  const [isExportedNotify, setIsExportedNotify] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Parse mimeType on Ctrl+V paste triggers
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (batchInputType !== "image") return;
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.indexOf("image") !== -1) {
          const file = clipboardItems[i].getAsFile();
          if (file) {
            e.preventDefault();
            setImageMimeType("image/jpeg");
            setScanError(null);
            setSuccessMessage(null);

            compressImage(file)
              .then((compressedBase64) => {
                setSelectedImage(compressedBase64);
                setSuccessMessage("วางภาพใบสั่งงานสเปกเรียบร้อยจากคลิปบอร์ดสำเร็จ! 📋✨ ท่านสามารถกดเริ่มสแกนรูปภาพได้ทันที");
              })
              .catch((err) => {
                console.error("Image compression failed, using fallback:", err);
                const reader = new FileReader();
                reader.onload = () => {
                  setSelectedImage(reader.result as string);
                };
                reader.readAsDataURL(file);
              });
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [batchInputType]);

  // Image uploaded manually
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setScanError("กรุณาเลือกไฟล์ภาพถ่าย บิลจัดซื้อ หรือแผ่นรายการสเปกเท่านั้น (PNG, JPG, JPEG, WebP)");
      setSuccessMessage(null);
      return;
    }

    setImageMimeType("image/jpeg");
    setScanError(null);
    setSuccessMessage(null);

    compressImage(file)
      .then((compressedBase64) => {
        setSelectedImage(compressedBase64);
      })
      .catch((err) => {
        console.error("Image compression failed, using fallback:", err);
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
  };

  // Drag and Drop
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
      setScanError("กรุณาวางเฉพาะไฟล์รูปภาพใบสั่งซื้อหรือรูปข้อความเท่านั้น");
      setSuccessMessage(null);
      return;
    }

    setImageMimeType("image/jpeg");
    setScanError(null);
    setSuccessMessage(null);

    compressImage(file)
      .then((compressedBase64) => {
        setSelectedImage(compressedBase64);
      })
      .catch((err) => {
        console.error("Image compression failed, using fallback:", err);
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
  };

  // Client-Side parsing fallback for Robust Offline usage
  const parseUniversalTextClientSide = (text: string) => {
    const lines = text.split("\n");
    const resultItems: UniversalBatchItem[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let category: "slab" | "pile" | "hollow_core" | "fence" | "drainage" = "slab";
      let model = "normal";
      let length: number | "" = 2.0;
      let count: number | "" = 10;
      let wireCount: "4" | "5" | "6" | "7" | "8" | "5_mm_5" | "auto" = "auto";
      let tisStandard: "tis" | "no_tis" | "t2" | "t3" = "no_tis";
      let connectionType: "single" | "joint" = "single";
      let hcWidth: 0.35 | 0.60 | 1.20 = 0.35;
      let label = trimmed;

      const isMoc = /มอก|ม\.อ\.ก|tis|t.i.s/i.test(trimmed);
      tisStandard = isMoc ? "tis" : "no_tis";

      // 1. Detect Category & Model
      if (/แผ่นกลวง|hollow\s*core|รูกลวง|แผ่นรูกลวง/i.test(trimmed)) {
        category = "hollow_core";
        model = "hc";
        if (/0\.60|0\.6/i.test(trimmed)) hcWidth = 0.60;
        else if (/1\.20|1\.2/i.test(trimmed)) hcWidth = 1.20;
      } else if (/ท่อระบายน้ำคสล\.|ท่อระบายน้ำ|ท่อ|ระบายน้ำ|บ่อพัก|ปากบ่อ/i.test(trimmed)) {
        category = "drainage";
        const isBasin = /บ่อ|บ่อพัก/i.test(trimmed);
        
        let sizeCode = "030";
        if (/30|0\.3/i.test(trimmed)) sizeCode = "030";
        else if (/40|0\.4/i.test(trimmed)) sizeCode = "040";
        else if (/50|0\.5/i.test(trimmed)) sizeCode = "050";
        else if (/60|0\.6/i.test(trimmed)) sizeCode = "060";
        else if (/80|0\.8/i.test(trimmed)) sizeCode = "080";
        else if (/100|1\.0|1ม/i.test(trimmed)) sizeCode = "100";
        else if (/120|1\.2/i.test(trimmed)) sizeCode = "120";
        else if (/150|1\.5/i.test(trimmed)) sizeCode = "150";

        if (isBasin) {
          model = `basin${sizeCode}`;
          tisStandard = "no_tis";
        } else {
          model = `pipe${sizeCode}`;
          if (/มอก\.?\s*2|ชั้น\s*2|มอก2/i.test(trimmed)) {
            tisStandard = "t2";
          } else if (/มอก\.?\s*3|ชั้น\s*3|มอก3/i.test(trimmed)) {
            tisStandard = "t3";
          } else {
            tisStandard = "no_tis";
          }
        }
        length = 1.0;
      } else if (/เสารั้ว|หน้า\s*3|หน้า\s*4|รั้วหน้า|เสาเข็มรั้ว/i.test(trimmed)) {
        category = "pile";
        
        // Find specific Pile Model
        if (/hex|หกเหลี่ยม/i.test(trimmed)) model = "hex";
        else if (/i-?15/i.test(trimmed)) model = "i15";
        else if (/i-?18/i.test(trimmed)) model = "i18";
        else if (/i-?22/i.test(trimmed)) model = "i22";
        else if (/i-?26/i.test(trimmed)) model = "i26";
        else if (/i-?30/i.test(trimmed)) model = "i30";
        else if (/i-?35/i.test(trimmed)) model = "i35";
        else if (/i-?40/i.test(trimmed)) model = "i40";
        else if (/s-?18/i.test(trimmed)) model = "s18";
        else if (/s-?22/i.test(trimmed)) model = "s22";
        else if (/s-?26/i.test(trimmed)) model = "s26";
        else if (/s-?30/i.test(trimmed)) model = "s30";
        else if (/s-?35/i.test(trimmed)) model = "s35";
        else if (/s-?40/i.test(trimmed)) model = "s40";
        else model = "i18"; // default pile

        if (/ต่อ|เหล็กเชื่อม|หูเหล็ก|joint/i.test(trimmed)) {
          connectionType = "joint";
        }
      } else {
        // Defaults to Slab
        category = "slab";
        model = isMoc ? "m.o.c" : "normal";

        // Find wire count
        const slabWireMatch = trimmed.match(/(?:ลวด\s*([4-8])\s*เส้น|ลวด\s*([4-8])|([4-8])\s*เส้น)/i);
        if (slabWireMatch) {
          const matchedW = slabWireMatch[1] || slabWireMatch[2] || slabWireMatch[3];
          if (matchedW) wireCount = matchedW as any;
        }
      }

      // 2. Extract Length
      const lengthMatchByX = trimmed.match(/(?:0\.35|0\.60|1\.20)\s*[*x×:-]\s*(\d+(?:\.\d+)?)/i);
      const metricsLengthMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:เมตร|ม\.?|meter|m)/i);
      const generalDecMatch = trimmed.match(/(\d+\.\d+)/);

      if (lengthMatchByX) {
        length = parseFloat(lengthMatchByX[1]);
      } else if (metricsLengthMatch) {
        length = parseFloat(metricsLengthMatch[1]);
      } else if (generalDecMatch) {
        length = parseFloat(generalDecMatch[1]);
      } else {
        // Deduce from integers
        const integers = trimmed.match(/\b\d+\b/g);
        if (integers) {
          const candidates = integers.map(Number).filter(n => n >= 1 && n <= 18 && n !== 35);
          if (candidates.length > 0) length = candidates[0];
        }
      }

      // 3. Extract quantity/count
      const qtyMatch = trimmed.match(/(\d+)\s*(?:แผ่น|ต้น|ชิ้น|อัน|pcs|ตัว|ชุด|แผ่นพื้น|ใบ|box)/i);
      if (qtyMatch) {
        count = parseInt(qtyMatch[1], 10);
      } else {
        const integers = trimmed.match(/\b\d+\b/g);
        if (integers && integers.length >= 2) {
          const remaining = integers.map(Number).filter(n => n !== 35 && n !== length && n !== parseFloat(wireCount || ""));
          if (remaining.length > 0) count = remaining[0];
        }
      }

      // Guard boundaries
      if (typeof length === "number" && (length < 0.1 || length > 22)) length = 2.0;

      resultItems.push({
        id: Math.random().toString(36).substring(2, 9),
        category,
        model,
        length,
        count,
        wireCount,
        tisStandard,
        connectionType,
        hcWidth,
        label
      });
    }

    return resultItems;
  };

  // AI Online / Offline Parser Trigger
  const triggerGenericScanText = async () => {
    if (!rawTextLines.trim()) {
      setScanError("กรุณากรอกข้อมูลสเปกแผ่นและเสากลวงในช่องก่อนทำการแปลง");
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setSuccessMessage(null);

    try {
      // Hit backend API to parse
      const res = await fetch("/api/parse-universal-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawTextLines })
      });

      if (!res.ok) {
        throw new Error("หมดเวลาเชื่อมต่อ หรือระบบหลังบ้านอยู่ระหว่างปรับปรุงเซิร์ฟเวอร์");
      }

      const responseData = await res.json();
      if (responseData.items && Array.isArray(responseData.items)) {
        if (responseData.items.length === 0) {
          throw new Error("AI วิเคราะห์เสร็จสิ้น แต่ตรวจจับรูปแบบสเปกไม่พบ");
        }

        const parsedItems = responseData.items.map((item: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          category: item.category || "slab",
          model: item.model || "normal",
          length: typeof item.length === "number" ? item.length : 2.5,
          count: typeof item.count === "number" ? item.count : 10,
          wireCount: item.wireCount || "auto",
          tisStandard: item.tisStandard || "no_tis",
          connectionType: item.connectionType || "single",
          hcWidth: item.hcWidth || 0.35,
          customPrice: item.customPrice || "",
          label: item.label || ""
        }));

        setItems((prev) => [...prev, ...parsedItems]);
        setSuccessMessage(`AI สื่อสารวิเคราะห์เสร็จสิ้น นำเข้า ${parsedItems.length} รายการเสา แผ่นพื้นสำเร็จรูปลงตารางเรียบร้อยครับ! 🎉`);
      } else {
        throw new Error("ผลลัพธ์จากเซิร์ฟเวอร์คลาวด์ ไม่สอดรับกับรูปแบบมาตรฐาน");
      }
    } catch (err: any) {
      console.warn("API parse failed, invoking client-side regex engine:", err);
      // Fallback
      const clientItems = parseUniversalTextClientSide(rawTextLines);
      if (clientItems.length > 0) {
        setItems((prev) => [...prev, ...clientItems]);
        setSuccessMessage(`สลับไปรันออฟไลน์: นำเข้าแผ่นคอนกรีต/เสา ${clientItems.length} รายการลงตารางงบประมาณสำเร็จ! 💻⚡`);
      } else {
        setScanError("ไม่สามารถแกะแยกสเปกในข้อความ กรุณาปรับเปลี่ยนข้อความให้ระบุความยาวและจำนวนที่แจ่มแจ้งขึ้น");
      }
    } finally {
      setIsScanning(false);
    }
  };

  // AI Online Image Scan Trigger
  const triggerGenericScanImage = async () => {
    if (!selectedImage) {
      setScanError("กรุณาอัปโหลดรูปภาพใบงาน บิลจดมือ หรือสเปกงานก่อนอัปสแกน");
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setSuccessMessage(null);

    try {
      const base64Data = selectedImage.split(",")[1] || selectedImage;
      const res = await fetch("/api/scan-universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          mimeType: imageMimeType || "image/jpeg"
        })
      });

      if (!res.ok) {
        throw new Error("หมดเวลาเชื่อมต่อระบบคลาวด์ AI หรือหลังบ้านไม่ได้ติดตั้งใช้งาน");
      }

      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        if (data.items.length === 0) {
          setScanError("ระบบวิเคราะห์ภาพสเปกสำเร็จ แต่ไม่แกะข้อมูลพบรายการแผ่นคอนกรีตอัดแรง/เสาเข็มที่สอดคล้อง แนะนำปรับภาพถ่ายให้ใกล้ขึ้น");
          return;
        }

        const parsedItems = data.items.map((item: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          category: item.category || "slab",
          model: item.model || "normal",
          length: typeof item.length === "number" ? item.length : 2.5,
          count: typeof item.count === "number" ? item.count : 10,
          wireCount: item.wireCount || "auto",
          tisStandard: item.tisStandard || "no_tis",
          connectionType: item.connectionType || "single",
          hcWidth: item.hcWidth || 0.35,
          customPrice: item.customPrice || "",
          label: item.label || ""
        }));

        setItems((prev) => [...prev, ...parsedItems]);
        setSuccessMessage(`สแกนวิเคราะห์บิลใบสั่งงานสำเร็จ นำข้อมูล ${parsedItems.length} รายการแผ่นคอนกรีต/เสาเข็มลงตารางแล้ว! 🎉`);
      } else {
        throw new Error("ระบบ AI ไม่ตอบรับข้อมูลที่เป็นโครงสร้างที่ถูกต้อง");
      }
    } catch (err) {
      console.error(err);
      setScanError(err.message || "เกิดปัญหาในการวิเคราะห์ภาพจากสเปกออนไลน์");
    } finally {
      setIsScanning(false);
    }
  };

  const calculatedRows = items.map((item) => {
    const len = item.length === "" ? 0 : item.length;
    const qty = item.count === "" ? 0 : item.count;
    
    let baseWeightPerMeter = 0;
    let defaultStandardRate = 0;
    let standardRateUnit = "ม.";

    // SLA CATEGORY
    if (item.category === "slab") {
      baseWeightPerMeter = settings.weights.slab;
      standardRateUnit = "ตร.ม.";
      
      let finalWires = item.wireCount === "auto" || !item.wireCount ? "4" : item.wireCount;
      if (item.wireCount === "auto") {
        if (len <= 3.0) finalWires = "4";
        else if (len <= 4.0) finalWires = "5";
        else finalWires = "7";
      }

      const isMoc = item.model === "m.o.c";
      let baseRateSqm = item.customStandardRate !== undefined && item.customStandardRate !== "" && Number(item.customStandardRate) >= 0
        ? Number(item.customStandardRate)
        : (isMoc ? settings.prices.mocBoardPrice : settings.prices.normalBoardPrice);
      
      let adj = 0;
      if (!isMoc) {
        if (finalWires === "4") adj = 0;
        else if (finalWires === "5") adj = 10;
        else if (finalWires === "6") adj = 20;
        else if (finalWires === "7") adj = 35;
        else if (finalWires === "8") adj = 55;
        else if (finalWires === "5_mm_5") adj = 55;
      } else {
        if (finalWires === "4") adj = 0;
        else if (finalWires === "5") adj = 15;
        else if (finalWires === "6") adj = 30;
        else if (finalWires === "7") adj = 50;
        else if (finalWires === "8") adj = 75;
        else if (finalWires === "5_mm_5") adj = 75;
      }

      defaultStandardRate = baseRateSqm + adj;

    // PILE CATEGORY
    } else if (item.category === "pile" || item.category === "fence") {
      const pType = item.model;
      const isTis = item.tisStandard === "tis";
      const isJoint = item.connectionType === "joint";
      standardRateUnit = "ม.";

      if (pType === "i15") {
        defaultStandardRate = settings.prices.i15Price;
        baseWeightPerMeter = settings.weights.i15;
      } else if (pType === "hex") {
        defaultStandardRate = settings.prices.hexPilePrice;
        baseWeightPerMeter = settings.weights.hex;
      } else if (pType === "fence3") {
        defaultStandardRate = settings.prices.fence3Price;
        baseWeightPerMeter = settings.weights.fence3;
      } else if (pType === "fence4") {
        defaultStandardRate = settings.prices.fence4Price;
        baseWeightPerMeter = settings.weights.fence4;
      } else if (pType === "i18") {
        baseWeightPerMeter = isTis ? settings.weights.i18_tis : settings.weights.i18_no_tis;
        if (isJoint) {
          defaultStandardRate = isTis ? settings.prices.i18TISJointPrice : settings.prices.i18JointPrice;
        } else {
          defaultStandardRate = isTis ? settings.prices.i18TISPrice : settings.prices.i18NoTISPrice;
        }
      } else if (pType === "i22") {
        baseWeightPerMeter = isTis ? settings.weights.i22_tis : settings.weights.i22_no_tis;
        if (isJoint) {
          defaultStandardRate = isTis ? settings.prices.i22TISJointPrice : settings.prices.i22JointPrice;
        } else {
          defaultStandardRate = isTis ? settings.prices.i22TISPrice : settings.prices.i22NoTISPrice;
        }
      } else if (pType === "i26") {
        baseWeightPerMeter = isTis ? settings.weights.i26_tis : settings.weights.i26_no_tis;
        if (isJoint) {
          defaultStandardRate = isTis ? settings.prices.i26TISJointPrice : settings.prices.i26NoTISJointPrice;
        } else {
          defaultStandardRate = isTis ? settings.prices.i26TISPrice : settings.prices.i26NoTISPrice;
        }
      } else if (pType === "i30") {
        baseWeightPerMeter = isTis ? settings.weights.i30_tis : settings.weights.i30_no_tis;
        if (isJoint) {
          defaultStandardRate = isTis ? settings.prices.i30TISJointPrice : settings.prices.i30NoTISJointPrice;
        } else {
          defaultStandardRate = isTis ? settings.prices.i30TISPrice : settings.prices.i30NoTISPrice;
        }
      } else if (pType === "i35") {
        baseWeightPerMeter = settings.weights.i35;
        defaultStandardRate = isJoint ? settings.prices.i35TISJointPrice : settings.prices.i35TISPrice;
      } else if (pType === "i40") {
        baseWeightPerMeter = settings.weights.i40;
        defaultStandardRate = isJoint ? settings.prices.i40TISJointPrice : settings.prices.i40TISPrice;
      } else if (pType === "s18") {
        baseWeightPerMeter = settings.weights.s18;
        defaultStandardRate = isJoint ? settings.prices.s18JointPrice : settings.prices.s18Price;
      } else if (pType === "s22") {
        baseWeightPerMeter = settings.weights.s22;
        defaultStandardRate = isJoint ? settings.prices.s22JointPrice : settings.prices.s22Price;
      } else if (pType === "s26") {
        baseWeightPerMeter = settings.weights.s26;
        defaultStandardRate = isJoint ? settings.prices.s26JointPrice : settings.prices.s26Price;
      } else if (pType === "s30") {
        baseWeightPerMeter = settings.weights.s30;
        defaultStandardRate = isJoint ? settings.prices.s30JointPrice : settings.prices.s30Price;
      } else if (pType === "s35") {
        baseWeightPerMeter = settings.weights.s35;
        defaultStandardRate = isJoint ? settings.prices.s35JointPrice : settings.prices.s35Price;
      } else if (pType === "s40") {
        baseWeightPerMeter = settings.weights.s40;
        defaultStandardRate = isJoint ? settings.prices.s40JointPrice : settings.prices.s40Price;
      }

    // HOLLOW CORE CATEGORY
    } else if (item.category === "hollow_core") {
      const hcWidthVal = item.hcWidth || 0.35;
      baseWeightPerMeter = settings.weights.slab * 2; // hollow core base weights
      standardRateUnit = "ตร.ม.";
      defaultStandardRate = settings.prices.hcPriceSqm;

    // DRAINAGE CATEGORY
    } else if (item.category === "drainage") {
      const pType = item.model;
      const isPipe = pType.startsWith("pipe");
      const subType = item.tisStandard || "no_tis";
      standardRateUnit = "ชื้น";

      if (isPipe) {
        const sizeStr = pType.replace("pipe", "");
        const priceKey = `pipe${sizeStr}${subType === "no_tis" ? "NoTIS" : (subType === "t3" ? "T3" : "T2")}Price`;
        const weightKey = `pipe${sizeStr}${subType === "no_tis" ? "" : (subType === "t3" ? "T3" : "T2")}Weight`;

        defaultStandardRate = (settings.prices as any)[priceKey] || 0;
        baseWeightPerMeter = (settings.weights as any)[weightKey] || 0;
      } else {
        const sizeStr = pType.replace("basin", "");
        const priceKey = `basin${sizeStr}Price`;
        const weightKey = `basin${sizeStr}Weight`;

        defaultStandardRate = (settings.prices as any)[priceKey] || 0;
        baseWeightPerMeter = (settings.weights as any)[weightKey] || 0;
      }
    }

    // Resolve active standard rate per m/sqm/piece
    const standardRate = item.category === "slab"
      ? defaultStandardRate
      : (item.customStandardRate !== undefined && item.customStandardRate !== "" && Number(item.customStandardRate) >= 0
        ? Number(item.customStandardRate)
        : defaultStandardRate);

    // Calculate normal unit price for single piece from rate
    let rawUnitPriceOfProduct = 0;
    if (item.category === "slab") {
      rawUnitPriceOfProduct = 0.35 * standardRate * len;
    } else if (item.category === "hollow_core") {
      const hcWidthVal = item.hcWidth || 0.35;
      rawUnitPriceOfProduct = standardRate * hcWidthVal * len;
    } else if (item.category === "drainage") {
      rawUnitPriceOfProduct = standardRate; // Drainage is priced per piece!
    } else {
      rawUnitPriceOfProduct = standardRate * len;
    }

    const computedStandardUnitVal = autoRoundPrice ? roundToBeautifulPrice(rawUnitPriceOfProduct) : rawUnitPriceOfProduct;

    // Check custom final piece price override
    let computedUnitPrice = computedStandardUnitVal;
    if (item.customPrice !== "" && item.customPrice !== undefined && Number(item.customPrice) >= 0) {
      computedUnitPrice = Number(item.customPrice);
    }

    const rowPriceTotal = computedUnitPrice * qty;
    
    // Support custom weight per meter override
    const finalWeightPerMeter = item.customWeightPerMeter !== "" && item.customWeightPerMeter !== undefined && Number(item.customWeightPerMeter) >= 0
      ? Number(item.customWeightPerMeter)
      : baseWeightPerMeter;
      
    const rowWeightTotal = finalWeightPerMeter * (item.category === "drainage" ? 1 : len) * qty;

    // Calc areas
    let areaMultiplier = 0;
    if (item.category === "slab") areaMultiplier = 0.35;
    else if (item.category === "hollow_core") areaMultiplier = item.hcWidth || 0.35;
    const rowAreaTotal = areaMultiplier * len * qty;

    return {
      ...item,
      unitWeight: baseWeightPerMeter,
      computedUnitPrice,
      computedStandardUnitVal,
      defaultStandardRate,
      standardRate,
      standardRateUnit,
      rowPriceTotal,
      rowWeightTotal,
      rowAreaTotal
    };
  });

  // KPI calculations
  const totalWeightKg = calculatedRows.reduce((sum, r) => sum + r.rowWeightTotal, 0);
  const totalWeightTons = totalWeightKg / 1000;
  const totalPriceBeforeTax = calculatedRows.reduce((sum, r) => sum + r.rowPriceTotal, 0);
  const vatAmountCost = totalPriceBeforeTax * 0.07;
  const grandTotalCost = totalPriceBeforeTax + vatAmountCost;
  const totalQtyCount = calculatedRows.reduce((sum, r) => sum + (r.count === "" ? 0 : r.count), 0);
  const totalAreaSqm = calculatedRows.reduce((sum, r) => sum + r.rowAreaTotal, 0);

  // Clear Table
  const clearAllItems = () => {
    if (confirm("ท่านต้องการล้างตารางรายการคำนวณทั้งหมดหรือไม่?")) {
      setItems([]);
    }
  };

  // Push items directly to logistics weightItems
  const exportAllToLogistics = () => {
    const freshLogistics: WeightItem[] = calculatedRows.map((row) => {
      // mapping type strings appropriately
      let typeSlug = "slab";
      if (row.category === "pile") {
        if (row.model.startsWith("fence")) typeSlug = "fence3";
        else if (row.model === "hex") typeSlug = "hex";
        else typeSlug = "i18_no_tis";
      } else if (row.category === "hollow_core") {
        typeSlug = "slab"; // fallback weight
      } else if (row.category === "drainage") {
        const pType = row.model;
        const subType = row.tisStandard || "no_tis";
        if (pType.startsWith("pipe")) {
          typeSlug = `${pType}${subType === "no_tis" ? "" : (subType === "t3" ? "_t3" : "_t2")}`;
        } else {
          typeSlug = pType; // e.g. basin030
        }
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        type: typeSlug,
        count: row.count === "" ? 1 : row.count,
        length: row.length === "" ? 2.0 : row.length,
        unitWeight: row.customWeightPerMeter !== "" && row.customWeightPerMeter !== undefined && Number(row.customWeightPerMeter) >= 0
          ? Number(row.customWeightPerMeter)
          : row.unitWeight
      };
    });

    setWeightItems((prev) => [...prev, ...freshLogistics]);
    setIsExportedNotify(true);
    setTimeout(() => {
      setIsExportedNotify(false);
      onNavigateToWeight();
    }, 1500);
  };

  // Thai labels for catalog columns
  const getProductClassTh = (category: string) => {
    switch (category) {
      case "slab": return "แผ่นพื้นสำเร็จรูป";
      case "pile": return "เสาเข็มคอนกรีต / เสารั้ว";
      case "hollow_core": return "แผ่นรูกลวง (Hollow Core)";
      case "drainage": return "ท่อระบายน้ำ / บ่อพัก";
      default: return "สินค้าพงษ์สกุล";
    }
  };

  const getModelLabelTh = (category: string, model: string) => {
    if (category === "slab") {
      return model === "m.o.c" ? "รุ่นมาตรฐาน มอก." : "รุ่นสามัญธรรมดา";
    }
    if (category === "hollow_core") return "รูกลวง Hollow Core";
    
    // Piles & Drainage
    switch (model) {
      case "i15": return "เสาเข็มไอ I-15";
      case "i18": return "เสาเข็มไอ I-18";
      case "i22": return "เสาเข็มไอ I-22";
      case "i26": return "เสาเข็มไอ I-26";
      case "i30": return "เสาเข็มไอ I-30";
      case "i35": return "เสาเข็มไอ I-35";
      case "i40": return "เสาเข็มไอ I-40";
      case "s18": return "สี่เหลี่ยมตัน S-18";
      case "s22": return "สี่เหลี่ยมตัน S-22";
      case "s26": return "สี่เหลี่ยมตัน S-26";
      case "s30": return "สี่เหลี่ยมตัน S-30";
      case "s35": return "สี่เหลี่ยมตัน S-35";
      case "s40": return "สี่เหลี่ยมตัน S-40";
      case "hex": return "หกเหลี่ยมกลวง";
      case "fence3": return "เสารั้วลวดหนาม 3\"";
      case "fence4": return "เสารั้วลวดหนาม 4\"";
      case "pipe": return "ท่อระบายน้ำ คสล.";
      case "basin": return "บ่อพัก คสล.";
      // Drainage mappings:
      case "pipe030": return "ท่อระบายน้ำ Ø 0.30 ม.";
      case "pipe040": return "ท่อระบายน้ำ Ø 0.40 ม.";
      case "pipe050": return "ท่อระบายน้ำ Ø 0.50 ม.";
      case "pipe060": return "ท่อระบายน้ำ Ø 0.60 ม.";
      case "pipe080": return "ท่อระบายน้ำ Ø 0.80 ม.";
      case "pipe100": return "ท่อระบายน้ำ Ø 1.00 ม.";
      case "pipe120": return "ท่อระบายน้ำ Ø 1.20 ม.";
      case "pipe150": return "ท่อระบายน้ำ Ø 1.50 ม.";
      case "basin030": return "บ่อพักท่อ Ø 0.30 ม.";
      case "basin040": return "บ่อพักท่อ Ø 0.40 ม.";
      case "basin050": return "บ่อพักท่อ Ø 0.50 ม.";
      case "basin060": return "บ่อพักท่อ Ø 0.60 ม.";
      case "basin080": return "บ่อพักท่อ Ø 0.80 ม.";
      case "basin100": return "บ่อพักท่อ Ø 1.00 ม.";
      case "basin120": return "บ่อพักท่อ Ø 1.20 ม.";
      default: return model;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic topbar with auto-round toggler */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-[#C62828] rounded-xl">
            <Sparkles size={22} className="text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-neutral-800">
              สแกนบิลใบงาน & คำนวณราคาหลายรายการ AI 🧠📸
            </h2>
            <p className="text-xs text-neutral-500 font-light mt-0.5">
              เมนูคำนวณราคาแบบคลุมตัวเลข: รองรับการสแกนภาพ ป้อนสเปกข้อความ หรือพิมพ์ตารางรวมทุกประเภทวัสดุ
            </p>
          </div>
        </div>

        <button
          onClick={toggleAutoRoundPrice}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold border transition duration-150 shadow-sm cursor-pointer ${
            autoRoundPrice
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-600"
              : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600"
          }`}
          title="ปรับราคาสินค้าขึ้นมาลงท้ายในหลัก 5 หรือ 0 เพื่อเอกสารเสนอราคาที่สวยงาม"
        >
          <Sparkles size={13} className={autoRoundPrice ? "animate-spin" : "text-amber-500"} />
          <span>ปรับราคาสวยงาม (ลงท้าย 5/0): {autoRoundPrice ? "เปิดใช้งาน ✅" : "ปิดอยู่ ❌"}</span>
        </button>
      </div>

      <div className="flex flex-col gap-6 w-full animate-fadeIn">
        
        {/* Top: Scan & OCR tools */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-150 shadow-sm space-y-4 w-full">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="font-bold text-sm text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <Camera size={16} className="text-[#C62828]" /> ระบบวิเคราะห์วัสดุ AI คลังและสัญญากลาง
            </span>
            <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                onClick={() => { setBatchInputType("image"); setScanError(null); setSuccessMessage(null); }}
                className={`py-1 px-2.5 text-[10px] sm:text-xs font-bold rounded-md transition cursor-pointer ${
                  batchInputType === "image" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500"
                }`}
              >
                สแกนภาพเดี่ยว 📸
              </button>
              <button
                onClick={() => { setBatchInputType("text"); setScanError(null); setSuccessMessage(null); }}
                className={`py-1 px-2.5 text-[10px] sm:text-xs font-bold rounded-md transition cursor-pointer ${
                  batchInputType === "text" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500"
                }`}
              >
                พิมพ์ข้อความ 📝
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left side: Uploaders */}
            <div className="md:col-span-7 space-y-4 w-full">
              <AnimatePresence mode="wait">
                {batchInputType === "image" ? (
                  <motion.div
                    key="imageSection"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    {/* Drag and Drop Box */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[190px] ${
                        isDragging
                          ? "border-red-500 bg-red-50/20"
                          : selectedImage
                          ? "border-emerald-500 bg-emerald-50/10"
                          : "border-neutral-300 hover:border-[#C62828] hover:bg-neutral-50"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                      {selectedImage ? (
                        <div className="space-y-3 w-full">
                          <div className="relative mx-auto max-h-[140px] max-w-[180px] overflow-hidden rounded-lg shadow-md border border-neutral-200">
                            <img
                              src={selectedImage}
                              alt="preview specs"
                              className="object-cover w-full h-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="text-xs font-bold text-emerald-700">
                            พร้อมประมวลผลวิเคราะห์เรียบร้อย 📋
                          </div>
                          <p className="text-[10px] text-neutral-400">
                            คลิกซ้ำหากต้องการเปลี่ยนรูปสเปก
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-neutral-500">
                          <div className="mx-auto p-3 bg-red-50 text-[#C62828] rounded-full w-fit">
                            <Upload size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-700">อัปรูปสเปก, บิล หรือภาพถ่ายหน้าสัญญากลาง</p>
                            <p className="text-[10px] text-neutral-400 mt-1">ลากมาวางในกรอบ, คลิกขอบเพื่อเลือกไฟล์ หรือแปะรูปด้วย Ctrl+V</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Live Camera Button */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 hover:bg-neutral-100 font-bold text-xs text-neutral-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera size={14} className="text-[#C62828]" />
                        ถ่ายภาพด่วน 📸
                        <input
                          type="file"
                          ref={cameraInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                        />
                      </button>

                      <button
                        disabled={isScanning || !selectedImage}
                        onClick={triggerGenericScanImage}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-950 text-white font-bold text-xs hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles size={14} className="text-amber-400 animate-pulse" />
                        {isScanning ? "กำลังสแกนวิเคราะห์..." : "สแกนภาพ AI 🧠"}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="textSection"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-600 flex justify-between">
                        <span>วางข้อความแชทข้อตกลงหน้าสเปกโครงการ</span>
                        <span className="text-[10px] text-neutral-400 font-light">สามารถระบุปนกันได้</span>
                      </label>
                      <textarea
                        value={rawTextLines}
                        onChange={(e) => setRawTextLines(e.target.value)}
                        rows={5}
                        className="w-full text-xs font-mono p-3 bg-neutral-900 text-green-400 rounded-xl border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-[#C41C1C] leading-normal"
                        placeholder="แผ่นพื้น 2.5 เมตร 15 แผ่น&#10;เสา i18 ยาว 6 เมตร 5 เลน ต่อjoint&#10;แผ่นพื้นกลวง 0.35x4.2 ม. 20 แผ่น"
                      />
                    </div>

                    <button
                      disabled={isScanning || !rawTextLines.trim()}
                      onClick={triggerGenericScanText}
                      className="w-full py-2.5 px-4 bg-[#C62828] text-white hover:bg-[#B71C1C] rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      <Sparkles size={14} className="text-amber-300" />
                      {isScanning ? "ระบบกำลังถอดสเปก..." : "วิเคราะห์สเปกข้อความด้วย AI ✨"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right side: Alerts and specifications instruction */}
            <div className="md:col-span-5 space-y-4 w-full">
              {scanError && (
                <div className="p-3.5 bg-red-50 rounded-xl border border-red-150 text-red-700 text-xs flex gap-2 items-start leading-relaxed animate-fadeIn">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{scanError}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-150 text-emerald-800 text-xs flex gap-2 items-start leading-relaxed animate-fadeIn">
                  <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-neutral-600 text-[11.5px] leading-relaxed space-y-2">
                <span className="font-extrabold text-[#8B0000] text-xs flex items-center gap-1 bg-amber-100/40 p-1 rounded-lg border border-amber-200/50 block mb-1">
                  <Info size={13} className="text-[#8B0000]" /> ความสามารถประมวลแยกเอกสารด้วย AI 🤖
                </span>
                <p>ระบบแยกสเปกอัจฉริยะแบบแยกแยะเอกสาร จะช่วยวิเคราะห์และบราวซิ่งส่งเข้าตารางด้านล่างให้อัตโนมัติ:</p>
                <ul className="list-disc pr-2 pl-4 space-y-1 font-medium text-[11px] text-neutral-500">
                  <li><strong>แผ่นพื้นสำเร็จสัญญาทั่วไป</strong> และรุ่นมาตรฐานอ้างอิง มอก. (TIS)</li>
                  <li><strong>เสาเข็มไอ I-Shape</strong> (I-15, I-18, I-22, I-26, I-30) ท่อนเดียว/ท่อนต่อ</li>
                  <li><strong>เสาสี่เหลี่ยมตัน S-Piles</strong> (S-18, S-22, S-26, S-30, S-35, S-40)</li>
                  <li><strong>แผ่นพื้นรูกลม Hollow Core (HC)</strong> หน้ากว้าง 35, 60 และ 120 ซม.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic spreadsheet grid - Fully spans 100% width for clean non-cluttered space layout */}
        <div className="bg-white rounded-2xl border border-neutral-150 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-6 w-full">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-[#C62828]" size={18} />
                <h3 className="font-bold text-neutral-800 text-sm sm:text-base">ตารางประเมินงบประมาณและข้อมูลรวมวัสดุ</h3>
              </div>
              
              <div className="flex flex-wrap gap-1.5 justify-end">
                <button
                  onClick={() => addNewLineItem("slab")}
                  className="py-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-[11px] font-bold text-neutral-700 flex items-center gap-1 transition"
                >
                  <Plus size={12} /> แผ่นพื้น
                </button>
                <button
                  onClick={() => addNewLineItem("pile")}
                  className="py-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-[11px] font-bold text-neutral-700 flex items-center gap-1 transition"
                >
                  <Plus size={12} /> เสาเข็ม
                </button>
                <button
                  onClick={() => addNewLineItem("hollow_core")}
                  className="py-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-[11px] font-bold text-neutral-700 flex items-center gap-1 transition"
                >
                  <Plus size={12} /> แผ่นรูกลวง
                </button>
                <button
                  onClick={() => addNewLineItem("drainage")}
                  className="py-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-[11px] font-bold text-neutral-700 flex items-center gap-1 transition"
                >
                  <Plus size={12} /> ท่อระบายน้ำ/บ่อพัก
                </button>
              </div>
            </div>

            {/* Main Spreadsheet Scroll Container */}
            <div className="overflow-x-auto w-full border border-neutral-200/80 rounded-2xl shadow-sm bg-white">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-neutral-50/75 border-b border-neutral-200 text-xs font-bold text-neutral-600 uppercase tracking-wide">
                    <th className="py-3.5 px-4 w-[160px] font-semibold">หมวดหมู่สินค้า</th>
                    <th className="py-3.5 px-4 w-[160px] font-semibold">รุ่นโมเดล & ตรา</th>
                    <th className="py-3.5 px-3 w-[75px] text-center font-semibold">ยาว (ม.)</th>
                    <th className="py-3.5 px-3 w-[70px] text-center font-semibold">จำนวน</th>
                    <th className="py-3.5 px-4 w-[140px] text-center font-semibold">สเปกท่อ/ลวด/หน้ากว้าง</th>
                    <th className="py-3.5 px-4 w-[120px] text-center font-semibold">น้ำหนัก/ม. (กก.)</th>
                    <th className="py-3.5 px-4 w-[130px] text-center font-semibold">ราคาตั้งอ้างอิง</th>
                    <th className="py-3.5 px-4 w-[140px] text-center font-semibold">ราคาต่อชิ้น (บาท)</th>
                    <th className="py-3.5 px-3 w-[50px] text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {calculatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileSpreadsheet size={28} className="text-neutral-300" />
                          <span className="font-medium text-sm text-neutral-500">ไม่พบข้อมูลในตาราง</span>
                          <span className="text-[11px] text-neutral-400">แนะนำกดปุ่มด้านบน หรือทำการสแกนรูปภาพ/พิมพ์ข้อความเพื่อโหลดรายการ</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    calculatedRows.map((row) => (
                      <tr key={row.id} className="hover:bg-neutral-50/60 transition-all duration-150">
                        {/* Category Select cells */}
                        <td className="py-3 px-4">
                          <select
                            value={row.category}
                            onChange={(e) => editLineItem(row.id, "category", e.target.value)}
                            className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl font-bold text-xs w-full transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                          >
                            <option value="slab">แผ่นพื้นสำเร็จ</option>
                            <option value="pile">เสาเข็ม / รั้ว</option>
                            <option value="hollow_core">แผ่นรูกลวง HC</option>
                            <option value="drainage">ท่อระบายน้ำ / บ่อพัก</option>
                          </select>
                        </td>

                        {/* Model select dynamically depending on category */}
                        <td className="py-3 px-4">
                          {row.category === "slab" && (
                            <select
                              value={row.model}
                              onChange={(e) => editLineItem(row.id, "model", e.target.value)}
                              className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl font-semibold text-xs w-full transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                            >
                              <option value="normal">แผ่นพื้นสำเร็จธรรมดา</option>
                              <option value="m.o.c">แผ่นพื้นสำเร็จ มอก. (TIS)</option>
                            </select>
                          )}

                          {row.category === "pile" && (
                            <select
                              value={row.model}
                              onChange={(e) => editLineItem(row.id, "model", e.target.value)}
                              className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl font-semibold text-xs w-full transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                            >
                              <optgroup label="เสาเข็มไอ">
                                <option value="i15">เสาเข็มไอ I-15</option>
                                <option value="i18">เสาเข็มไอ I-18</option>
                                <option value="i22">เสาเข็มไอ I-22</option>
                                <option value="i26">เสาเข็มไอ I-26</option>
                                <option value="i30">เสาเข็มไอ I-30</option>
                                <option value="i35">เสาเข็มไอ I-35</option>
                                <option value="i40">เสาเข็มไอ I-40</option>
                              </optgroup>
                              <optgroup label="เสาสี่เหลี่ยมตัน S-Piles">
                                <option value="s18">สี่เหลี่ยมตัน S-18</option>
                                <option value="s22">สี่เหลี่ยมตัน S-22</option>
                                <option value="s26">สี่เหลี่ยมตัน S-26</option>
                                <option value="s30">สี่เหลี่ยมตัน S-30</option>
                                <option value="s35">สี่เหลี่ยมตัน S-35</option>
                                <option value="s40">สี่เหลี่ยมตัน S-40</option>
                              </optgroup>
                              <optgroup label="เสารั้ว & อื่นๆ">
                                <option value="hex">หกเหลี่ยมกลวง</option>
                                <option value="fence3">เสารั้วลวดหนาม 3"</option>
                                <option value="fence4">เสารั้วลวดหนาม 4"</option>
                              </optgroup>
                            </select>
                          )}

                          {row.category === "hollow_core" && (
                            <span className="p-2 bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-500 font-medium text-xs block text-center">
                              หน้ากลวงรูกลม HC
                            </span>
                          )}

                          {row.category === "drainage" && (
                            <select
                              value={row.model}
                              onChange={(e) => editLineItem(row.id, "model", e.target.value)}
                              className="p-2 bg-[#FAF7F6] hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl font-semibold text-xs w-full transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                            >
                              <optgroup label="ท่อระบายน้ำ คสล.">
                                <option value="pipe030">ท่อระบายน้ำ Ø 0.30 ม.</option>
                                <option value="pipe040">ท่อระบายน้ำ Ø 0.40 ม.</option>
                                <option value="pipe050">ท่อระบายน้ำ Ø 0.50 ม.</option>
                                <option value="pipe060">ท่อระบายน้ำ Ø 0.60 ม.</option>
                                <option value="pipe080">ท่อระบายน้ำ Ø 0.80 ม.</option>
                                <option value="pipe100">ท่อระบายน้ำ Ø 1.00 ม.</option>
                                <option value="pipe120">ท่อระบายน้ำ Ø 1.20 ม.</option>
                                <option value="pipe150">ท่อระบายน้ำ Ø 1.50 ม.</option>
                              </optgroup>
                              <optgroup label="บ่อพักท่อระบายน้ำ">
                                <option value="basin030">บ่อพักท่อ Ø 0.30 ม.</option>
                                <option value="basin040">บ่อพักท่อ Ø 0.40 ม.</option>
                                <option value="basin050">บ่อพักท่อ Ø 0.50 ม.</option>
                                <option value="basin060">บ่อพักท่อ Ø 0.60 ม.</option>
                                <option value="basin080">บ่อพักท่อ Ø 0.80 ม.</option>
                                <option value="basin100">บ่อพักท่อ Ø 1.00 ม.</option>
                                <option value="basin120">บ่อพักท่อ Ø 1.20 ม.</option>
                              </optgroup>
                            </select>
                          )}
                        </td>

                        {/* Length meter inputs */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={row.length}
                            onChange={(e) => editLineItem(row.id, "length", e.target.value === "" ? "" : parseFloat(e.target.value))}
                            step="0.1"
                            placeholder="ยาว"
                            className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl font-bold font-mono text-center w-full min-w-[75px] transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                          />
                        </td>

                        {/* Count items */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={row.count}
                            onChange={(e) => editLineItem(row.id, "count", e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                            placeholder="จำนวน"
                            className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl font-bold font-mono text-center w-full min-w-[75px] transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                          />
                        </td>

                        {/* Contextual parameters depending on categories */}
                        <td className="py-3 px-4">
                          {row.category === "slab" && (
                            <select
                              value={row.wireCount}
                              onChange={(e) => editLineItem(row.id, "wireCount", e.target.value)}
                              className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl text-xs w-full min-w-[124px] transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                            >
                              <option value="auto">คำนวณลวดอัตโนมัติ 🪄</option>
                              <option value="4">ลวด 4 เส้น</option>
                              <option value="5">ลวด 5 เส้น</option>
                              <option value="6">ลวด 6 เส้น</option>
                              <option value="7">ลวด 7 เส้น</option>
                              <option value="8">ลวด 8 เส้น</option>
                            </select>
                          )}

                          {row.category === "pile" && (["i18", "i22", "i26", "i30", "i35", "i40", "s18", "s22", "s26", "s30", "s35", "s40"].includes(row.model)) && (
                            <div className="flex gap-1 min-w-[124px]">
                              {row.model.startsWith("i") && (
                                <select
                                  value={row.tisStandard}
                                  onChange={(e) => editLineItem(row.id, "tisStandard", e.target.value)}
                                  className="p-1 px-1.5 bg-neutral-50 hover:bg-white border border-neutral-200 rounded-xl text-[10px] font-semibold flex-1 transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                                >
                                  <option value="no_tis">ปกติ</option>
                                  <option value="tis">มอก.</option>
                                </select>
                              )}
                              <select
                                value={row.connectionType}
                                onChange={(e) => editLineItem(row.id, "connectionType", e.target.value)}
                                className="p-1 px-1.5 bg-neutral-50 hover:bg-white border border-neutral-200 rounded-xl text-[10px] font-semibold flex-1 transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                              >
                                <option value="single">ท่อนเดียว</option>
                                <option value="joint">มีท่อนต่อ</option>
                              </select>
                            </div>
                          )}

                          {row.category === "hollow_core" && (
                            <select
                              value={row.hcWidth}
                              onChange={(e) => editLineItem(row.id, "hcWidth", parseFloat(e.target.value))}
                              className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl text-xs w-full min-w-[124px] transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                            >
                              <option value={0.35}>กว้าง 0.35 ม.</option>
                              <option value={0.60}>กว้าง 0.60 ม.</option>
                              <option value={1.20}>กว้าง 1.20 ม.</option>
                            </select>
                          )}

                          {row.category === "drainage" && (
                            <div className="min-w-[124px]">
                              {row.model.startsWith("pipe") ? (
                                <select
                                  value={row.tisStandard || "no_tis"}
                                  onChange={(e) => editLineItem(row.id, "tisStandard", e.target.value)}
                                  className="p-2 bg-[#FAF7F6] hover:bg-white border border-neutral-200/85 rounded-xl text-xs w-full transition focus:ring-1 focus:ring-red-400 focus:outline-none font-semibold text-neutral-700 font-sans"
                                >
                                  <option value="no_tis">คสล. ปกติ</option>
                                  <option value="t3">มอก. ชั้น 3</option>
                                  <option value="t2">มอก. ชั้น 2</option>
                                </select>
                              ) : (
                                <span className="text-xs text-neutral-400 font-medium text-center block w-full py-2 bg-neutral-50 rounded-xl border border-dotted border-neutral-200">
                                  บ่อพักสำเร็จรูป
                                </span>
                              )}
                            </div>
                          )}

                          {/* Fallback space for others */}
                          {row.category === "pile" && !["i18", "i22", "i26", "i30", "i35", "i40", "s18", "s22", "s26", "s30", "s35", "s40"].includes(row.model) && (
                            <span className="text-xs text-neutral-400 font-mono text-center block min-w-[124px]">
                              ริ้วปกติ
                            </span>
                          )}
                        </td>

                        {/* นน.ต่อเมตร (กก./ม.) */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center gap-1 justify-center w-full min-w-[120px]">
                            <input
                              type="number"
                              value={row.customWeightPerMeter ?? ""}
                              onChange={(e) => editLineItem(row.id, "customWeightPerMeter", e.target.value === "" ? "" : parseFloat(e.target.value))}
                              placeholder={fmt(row.unitWeight)}
                              className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl font-bold font-mono text-center w-full transition focus:ring-1 focus:ring-red-400 focus:outline-none text-neutral-850"
                              title="กำหนดน้ำหนักต่อเมตรเอง (กิโลกรัม/เมตร) หรือปล่อยว่างเพื่อใช้ตามสูตรทั่วไป"
                            />
                            <span className="text-[10px] text-neutral-400 font-bold whitespace-nowrap">กก./ม.</span>
                          </div>
                        </td>

                        {/* ราคาตั้ง (ต่อ ตร.ม. หรือเมตร) */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-1 justify-center w-full min-w-[110px]">
                            <input
                              type="number"
                              value={row.customStandardRate ?? ""}
                              onChange={(e) => editLineItem(row.id, "customStandardRate", e.target.value === "" ? "" : parseFloat(e.target.value))}
                              placeholder={String(row.category === "slab" ? (row.model === "m.o.c" ? settings.prices.mocBoardPrice : settings.prices.normalBoardPrice) : row.defaultStandardRate)}
                              className="p-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200/85 hover:border-neutral-300 rounded-xl font-bold font-mono text-center w-full transition focus:ring-1 focus:ring-red-400 focus:outline-none"
                              title={`ปรับแก้ไขราคาตั้งอ้างอิงตรงนี้ได้เลย (ต่อ ${row.standardRateUnit})`}
                            />
                            <span className="text-[10px] text-neutral-400 font-bold whitespace-nowrap">/{row.standardRateUnit}</span>
                          </div>
                        </td>

                        {/* ราคาต่อชิ้น */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center gap-1.5 justify-center w-full min-w-[130px]">
                            <input
                              type="number"
                              value={row.customPrice}
                              onChange={(e) => editLineItem(row.id, "customPrice", e.target.value === "" ? "" : parseFloat(e.target.value))}
                              placeholder={fmt(row.computedStandardUnitVal)}
                              className="p-2 border border-red-200 rounded-xl text-xs font-black font-mono text-center w-full focus:ring-2 focus:ring-red-400/20 focus:outline-none text-[#C62828] bg-red-50/30 transition shadow-inner"
                              title="ระบุราคาที่จ้างจริงต่อหน่วยชิ้น (เลือกกรอกราคาต่อชิ้นทับได้)"
                            />
                            <button
                              type="button"
                              onClick={() => handleCopyPrice(row.id, row.computedUnitPrice)}
                              className={`p-2 rounded-xl border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                                copiedItemId === row.id
                                  ? "bg-emerald-50 border-emerald-250 text-emerald-600 scale-105"
                                  : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-400 hover:text-[#C62828]"
                              }`}
                              title={`คัดลอกราคาต่อชิ้น (฿${fmt(row.computedUnitPrice)})`}
                            >
                              {copiedItemId === row.id ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>

                        {/* Trash */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => deleteLineItem(row.id)}
                            className="p-2 text-neutral-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Summary Box with VAT & Shipping weight metric cards */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-2xl">
                <span className="text-[10px] sm:text-xs font-bold text-neutral-400 block uppercase">ปริมาณสุทธิรวม</span>
                <strong className="text-sm sm:text-lg text-neutral-800 font-mono font-black">{totalQtyCount} รายการ</strong>
              </div>
              <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-2xl">
                <span className="text-[10px] sm:text-xs font-bold text-neutral-400 block uppercase">พื้นที่แผ่นพื้นรวม</span>
                <strong className="text-sm sm:text-lg text-neutral-800 font-mono font-black">{fmt(totalAreaSqm)} ตร.ม.</strong>
              </div>
              <div className="bg-neutral-50 border border-neutral-150 p-3 rounded-2xl">
                <span className="text-[10px] sm:text-xs font-bold text-neutral-400 block uppercase">น้ำหนักระวางรวม (ตัน)</span>
                <strong className="text-sm sm:text-lg text-red-600 font-mono font-black flex items-center gap-1">
                  <Scale size={14} className="text-red-500" />
                  {fmt(totalWeightTons)} ตัน
                </strong>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-[#FFF3F3] border border-red-200 p-3 rounded-2xl">
                <span className="text-[10px] sm:text-xs font-bold text-[#8B0000] block uppercase">ราคารวมหลังหักสุทธิ (ม.)</span>
                <strong className="text-base sm:text-xl text-[#C62828] font-mono font-black">฿{fmt(grandTotalCost)}</strong>
                <span className="text-[9px] text-neutral-450 block font-light mt-0.5">(รวมภาษี VAT 7% แล้ว)</span>
              </div>
            </div>

            {/* Bottom tools action indicators */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                ราคาฐานก่อนรวมภาษี: <strong className="font-semibold text-neutral-700">฿{fmt(totalPriceBeforeTax)}</strong> • ค่าภาษี 7%: <strong className="font-semibold text-neutral-700">฿{fmt(vatAmountCost)}</strong>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={items.length === 0}
                  onClick={clearAllItems}
                  className="py-2.5 px-3 rounded-xl border border-neutral-200 text-neutral-600 font-bold hover:bg-neutral-50 text-xs transition"
                >
                  ล้างตารางทั้งหมด 🗑️
                </button>

                <button
                  disabled={items.length === 0}
                  onClick={() => setShowQuotationModal(true)}
                  className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Printer size={13} />
                  พิมพ์ใบราคา 📄
                </button>

                <button
                  disabled={items.length === 0}
                  onClick={exportAllToLogistics}
                  className="py-2.5 px-5 bg-gradient-to-r from-red-650 to-red-850 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md hover:opacity-95"
                >
                  <Send size={13} />
                  {isExportedNotify ? "ขนส่งโหลดรายการเสร็จ! 🚚..." : "จัดส่งรถขนส่ง & คำนวณน้ำหนัก 🚚"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern PDF Quotation Bill Modal */}
      {showQuotationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-6">
              {/* Receipt quotation head banner */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-5">
                <div>
                  <h1 className="text-[#C62828] font-black text-xl tracking-tight family-kanit">PONGSAKUL HARDWARE CO., LTD</h1>
                  <p className="text-xs text-neutral-550 mt-1 leading-relaxed">
                    บริษัท พงษ์สกุลฮาร์ดแวร์ จำกัด • สำนักงานจัดส่งวัสดุแผ่นและโครงสร้างหลัก<br />
                    ผู้จัดจำหน่ายเสาเข็มไอ เสาสี่เหลี่ยมตัน S-Shape แผ่นพื้น และแผ่นกลวงคอนกรีตมาตรฐาน มอก.
                  </p>
                </div>
                <div className="text-right">
                  <span className="p-1 px-3 bg-red-50 text-[#C62828] text-[10px] font-bold rounded-full border border-red-200/50 block w-fit ml-auto">
                    ใบประเมินราคาชั่วคราว
                  </span>
                  <span className="text-[10px] text-neutral-450 block uppercase tracking-wider font-mono mt-1">
                    รหัสสั่งเคาะ: PK-{Math.random().toString(36).substring(2, 7).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Company Customer context detail */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-neutral-50 p-4 border border-neutral-100 rounded-2xl">
                <div>
                  <span className="text-neutral-400 font-bold block mb-1">ผู้เบิกสินค้า / ลูกค้าสเปก:</span>
                  <strong className="text-neutral-800 text-sm">ผู้ติดต่อผ่านช่องทางด่วนหน้าร้าน</strong>
                  <span className="text-neutral-500 block font-light mt-0.5">บริษัทก่อสร้างทั่วไป / นายหน้าสเปกรับเหมา</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 font-bold block mb-1">วันที่ออกและคำนวณข้อตกลง:</span>
                  <strong className="text-neutral-800">{new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</strong>
                  <span className="text-neutral-500 block font-light mt-0.5">สถานะออฟไลน์คงคลัง: 100% เชื่อถือได้</span>
                </div>
              </div>

              {/* PDF item tabular content */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-800 text-white font-bold text-[10px] uppercase">
                      <th className="py-2 px-3">หมวดหมู่</th>
                      <th className="py-2 px-3">รายละเอียดและโมเดลสัญญาทั่วไป</th>
                      <th className="py-2 px-2 text-center">ความยาว</th>
                      <th className="py-2 px-2 text-center">จำนวน</th>
                      <th className="py-2 px-3 text-right">ราคาต่อหน่วย</th>
                      <th className="py-2 px-3 text-right">ยอดสุทธิ (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-150">
                    {calculatedRows.map((it, idx) => (
                      <tr key={it.id} className="text-xs">
                        <td className="py-2 px-3 font-semibold text-neutral-500">{getProductClassTh(it.category)}</td>
                        <td className="py-2 px-3">
                          <span className="font-extrabold text-neutral-800 block text-[11px]">{getModelLabelTh(it.category, it.model)}</span>
                          <span className="text-[10px] text-neutral-450 block font-mono">{it.label || "ไม่มีบันทึกข้อความแนบหน้าบิล"}</span>
                          <span className="text-[9.5px] text-neutral-500 block mt-0.5">ราคาตั้งอ้างอิง: ฿{fmt(it.standardRate)}/{it.standardRateUnit}</span>
                        </td>
                        <td className="py-2 px-2 text-center font-semibold font-mono">{it.length} ม.</td>
                        <td className="py-2 px-2 text-center font-bold font-mono">{it.count}</td>
                        <td className="py-2 px-3 text-right font-semibold font-mono">฿{fmt(it.computedUnitPrice)}</td>
                        <td className="py-2 px-3 text-right font-black font-mono text-[#C62828]">฿{fmt(it.rowPriceTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total final calculations */}
              <div className="border-t border-dashed border-neutral-200 pt-4 flex flex-col items-end text-xs space-y-1.5 leading-none">
                <div>
                  ยอดรวมก่อนคำนวณราคาหักส่ง: <strong className="font-semibold text-neutral-800 font-mono">฿{fmt(totalPriceBeforeTax)}</strong>
                </div>
                <div>
                  ภาษีมูลค่าเพิ่ม VAT 7%: <strong className="font-semibold text-neutral-800 font-mono">฿{fmt(vatAmountCost)}</strong>
                </div>
                <div>
                  รวมพิกัดระวางบรรทุก: <strong className="font-semibold text-neutral-800 font-mono">{fmt(totalWeightTons)} ตัน</strong>
                </div>
                <div className="text-[#C62828] text-base font-black pt-2 flex items-center gap-2">
                  <span>ราคาสุทธิใบประเมินหน้าด่าน (รวม VAT):</span>
                  <span className="font-mono text-lg">฿{fmt(grandTotalCost)}</span>
                </div>
              </div>
            </div>

            {/* Bottom actions inside dialog wrapper */}
            <div className="border-t border-neutral-200 pt-5 mt-6 flex justify-between items-center gap-4">
              <span className="text-[10px] text-neutral-400 font-light max-w-md">
                * เอกสารนี้คำนวณผ่านโมเดลสัญญาล่าสุดของ พงษ์สกุลฮาร์ดแวร์ บนเว็บออฟไลน์ การสั่งจ้างจริงกรุณาแจ้งฝ่ายขายเพื่อยืนยันพิกัดจัดขนส่ง
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuotationModal(false)}
                  className="py-2 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-600 font-bold text-xs transition"
                >
                  ปิดหน้าต่าง ❌
                </button>
                <button
                  onClick={() => window.print()}
                  className="py-2 px-5 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-neutral-850 transition flex items-center gap-1 shadow-sm"
                >
                  <Printer size={13} />
                  พิมพ์ออกมาทางเครื่องมือ 📄
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
