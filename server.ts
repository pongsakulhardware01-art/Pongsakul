import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc, setLogLevel, onSnapshot } from "firebase/firestore";

// Set Firestore log level to silent to minimize SDK internal output
try {
  setLogLevel("silent");
} catch (e) {
  console.warn("Failed to set Firestore log level to silent:", e);
}

// Intercept and suppress harmless Firestore idle stream timeout messages from console logs.
// These are benign connection lifecycle events that the Firestore client SDK automatically recovers from,
// but they litter logs and trigger false-alarm alerts in standard server runtime environments.
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

function shouldIgnoreLog(args: any[]): boolean {
  try {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return arg.stack || arg.message;
      }
      return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
    }).join(" ");

    return (
      message.includes("Disconnecting idle stream") || 
      message.includes("Timed out waiting for new targets") ||
      message.includes("Listen' stream") ||
      message.includes("@firebase/firestore") ||
      message.includes("GrpcConnection")
    );
  } catch (e) {
    return false;
  }
}

console.error = function (...args: any[]) {
  if (shouldIgnoreLog(args)) return;
  originalConsoleError.apply(console, args);
};

console.warn = function (...args: any[]) {
  if (shouldIgnoreLog(args)) return;
  originalConsoleWarn.apply(console, args);
};

console.log = function (...args: any[]) {
  if (shouldIgnoreLog(args)) return;
  originalConsoleLog.apply(console, args);
};

console.info = function (...args: any[]) {
  if (shouldIgnoreLog(args)) return;
  originalConsoleInfo.apply(console, args);
};

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON body parsing for API endpoints (with high payload limits for images)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // In-memory cache for fast retrieves and temporary persistence fallback
  let cachedSettings: any = null;

  // Initialize Firebase Firestore for shared cloud persistence
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let db: any = null;

  if (fs.existsSync(configPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const app = initializeApp(firebaseConfig);
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId);
      console.log("Firebase initialized successfully with database ID:", firebaseConfig.firestoreDatabaseId);
    } catch (err) {
      console.error("Error initializing Firebase:", err);
    }
  } else {
    console.warn("firebase-applet-config.json not found. Using local settings-db.json fallback.");
  }

  // Force migration / update of settings-db.json with new prices and weights
  const defaultUpdatedSettings = {
    prices: {
      normalBoardPrice: 210,
      mocBoardPrice: 230,
      i15Price: 90,
      // I-18
      i18NoTISPrice: 120,
      i18TISPrice: 140,
      i18JointPrice: 140,
      i18TISJointPrice: 160,
      // I-22
      i22NoTISPrice: 170,
      i22TISPrice: 190,
      i22JointPrice: 180,
      i22TISJointPrice: 200,
      // Others
      i26NoTISPrice: 210,
      i26NoTISJointPrice: 220,
      i26TISPrice: 235,
      i26TISJointPrice: 250,
      i30NoTISPrice: 240,
      i30NoTISJointPrice: 255,
      i30TISPrice: 290,
      i30TISJointPrice: 310,
      i35TISPrice: 370,
      i35TISJointPrice: 395,
      i40TISPrice: 500,
      i40TISJointPrice: 530,
      hexPilePrice: 70,
      // S-Piles default prices
      s18Price: 170,
      s18JointPrice: 180,
      s22Price: 230,
      s22JointPrice: 240,
      s26Price: 280,
      s26JointPrice: 300,
      s30Price: 370,
      s30JointPrice: 400,
      s35Price: 490,
      s35JointPrice: 520,
      s40Price: 590,
      s40JointPrice: 645,
      fence3Price: 60,
      fence4Price: 75,
      hcPriceSqm: 655,
      vatPercent: 7,
      // Pipe and Basin Prices
      pipe030NoTISPrice: 130,
      pipe030T3Price: 160,
      pipe030T2Price: 180,
      pipe040NoTISPrice: 190,
      pipe040T3Price: 240,
      pipe040T2Price: 270,
      pipe050NoTISPrice: 280,
      pipe050T3Price: 360,
      pipe050T2Price: 400,
      pipe060NoTISPrice: 380,
      pipe060T3Price: 500,
      pipe060T2Price: 560,
      pipe080NoTISPrice: 750,
      pipe080T3Price: 980,
      pipe080T2Price: 1100,
      pipe100NoTISPrice: 1200,
      pipe100T3Price: 1550,
      pipe100T2Price: 1750,
      pipe120NoTISPrice: 1800,
      pipe120T3Price: 2300,
      pipe120T2Price: 2600,
      pipe150NoTISPrice: 3200,
      pipe150T3Price: 4000,
      pipe150T2Price: 4500,
      basin030Price: 350,
      basin040Price: 500,
      basin050Price: 750,
      basin060Price: 1100,
      basin080Price: 2200,
      basin100Price: 3400,
      basin120Price: 4900,
    },
    weights: {
      slab: 42.0,
      fence3: 14.0,
      fence4: 24.0,
      hex: 30.0,
      // I-Piles
      i15: 43.0,
      i18_no_tis: 50.0,
      i18_tis: 66.0,
      i22_no_tis: 80.0,
      i22_tis: 93.0,
      i26_no_tis: 105.0,
      i26_tis: 117.0,
      i30_no_tis: 137.0,
      i30_tis: 160.0,
      i35: 212.0,
      i40: 298.0,
      // S-Piles
      s18: 78.0,
      s22: 117.0,
      s26: 163.0,
      s30: 216.0,
      s35: 294.0,
      s40: 384.0,
      // Pipe and Basin Weights
      pipe030Weight: 120,
      pipe030T3Weight: 140,
      pipe030T2Weight: 145,
      pipe040Weight: 200,
      pipe040T3Weight: 220,
      pipe040T2Weight: 225,
      pipe050Weight: 252,
      pipe050T3Weight: 320,
      pipe050T2Weight: 325,
      pipe060Weight: 335,
      pipe060T3Weight: 412,
      pipe060T2Weight: 417,
      pipe080Weight: 650,
      pipe080T3Weight: 700,
      pipe080T2Weight: 750,
      pipe100Weight: 900,
      pipe100T3Weight: 1000,
      pipe100T2Weight: 1000,
      pipe120Weight: 1250,
      pipe120T3Weight: 1305,
      pipe120T2Weight: 1310,
      pipe150Weight: 1870,
      pipe150T3Weight: 1870,
      pipe150T2Weight: 1870,
      basin030Weight: 400,
      basin040Weight: 600,
      basin050Weight: 785,
      basin060Weight: 1000,
      basin080Weight: 1955,
      basin100Weight: 2000,
      basin120Weight: 2875,
    }
  };

  const dbPath = path.join(process.cwd(), "settings-db.json");

  async function loadAndInitializeSettings() {
    let currentSettings: any = null;

    // 1. Try loading from Firestore
    if (db) {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "config"));
        if (settingsDoc.exists()) {
          currentSettings = settingsDoc.data();
          console.log("Loaded settings from Firestore during startup");
        }
      } catch (e) {
        console.error("Error reading settings from Firestore during startup:", e);
      }
    }

    // 2. Try loading from disk fallback
    if (!currentSettings && fs.existsSync(dbPath)) {
      try {
        const fileData = fs.readFileSync(dbPath, "utf-8");
        currentSettings = JSON.parse(fileData);
        console.log("Loaded settings from local file during startup");
      } catch (e) {
        console.error("Error reading settings from local file during startup:", e);
      }
    }

    // 3. If nothing loaded, use default settings
    if (!currentSettings) {
      currentSettings = defaultUpdatedSettings;
      console.log("No existing settings found, using default updated settings");
    } else {
      // 4. Merge default settings to ensure any newly added keys are present
      const mergedPrices = { ...defaultUpdatedSettings.prices, ...currentSettings.prices };
      const mergedWeights = { ...defaultUpdatedSettings.weights, ...currentSettings.weights };
      currentSettings = {
        prices: mergedPrices,
        weights: mergedWeights
      };
      console.log("Merged existing settings with defaults to backfill any missing keys");
    }

    // Save to cache
    cachedSettings = currentSettings;

    // Save back to Firestore and disk to persist the merged/initialized state
    if (db) {
      try {
        await setDoc(doc(db, "settings", "config"), currentSettings);
        console.log("Successfully persisted initialized settings to Firestore");
      } catch (e) {
        console.error("Error persisting initialized settings to Firestore:", e);
      }
    }

    try {
      fs.writeFileSync(dbPath, JSON.stringify(currentSettings, null, 2), "utf-8");
      console.log("Successfully persisted initialized settings to settings-db.json");
    } catch (e) {
      console.error("Error saving initialized settings to local disk:", e);
    }
  }

  // Call the initializer
  await loadAndInitializeSettings();

  // Set up real-time listener on settings in Firestore to update cachedSettings instantly across multiple server container instances
  if (db) {
    try {
      onSnapshot(doc(db, "settings", "config"), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const freshData = docSnapshot.data();
          // Ensure it matches AppSettings structure approximately
          if (freshData && freshData.prices && freshData.weights) {
            cachedSettings = freshData;
            console.log("Real-time settings updated from Firestore successfully.");
            try {
              fs.writeFileSync(dbPath, JSON.stringify(cachedSettings, null, 2), "utf-8");
            } catch (err) {
              // Silently ignore disk write errors
            }
          }
        }
      }, (error) => {
        console.error("Error in real-time Firestore settings listener:", error);
      });
    } catch (e) {
      console.error("Failed to register real-time settings listener:", e);
    }
  }

  // API 1: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", cached: !!cachedSettings });
  });

  // API 2: Get shared settings (Always check Firestore first for 100% accurate cloud sync, fallback to cachedSettings or local disk if offline)
  app.get("/api/settings", async (req, res) => {
    // Check Firestore first if available for immediate real-time sync across the entire organization
    if (db) {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "config"));
        if (settingsDoc.exists()) {
          cachedSettings = settingsDoc.data();
          return res.json(cachedSettings);
        }
      } catch (e) {
        console.error("Error loading settings from Firestore on demand:", e);
      }
    }

    // Fallback to memory cache
    if (cachedSettings) {
      return res.json(cachedSettings);
    }

    // Double-check disk just in case
    if (fs.existsSync(dbPath)) {
      try {
        const data = fs.readFileSync(dbPath, "utf-8");
        cachedSettings = JSON.parse(data);
        return res.json(cachedSettings);
      } catch (e) {
        console.error(e);
      }
    }
    
    res.json(null);
  });

  // API 3: Save shared settings
  app.post("/api/settings", async (req, res) => {
    try {
      const settings = req.body;
      cachedSettings = settings;
      
      // Save to Firestore for global cloud persistence
      if (db) {
        try {
          await setDoc(doc(db, "settings", "config"), settings);
          console.log("Successfully saved settings to Firestore");
        } catch (e) {
          console.error("Error saving settings to Firestore:", e);
        }
      }

      // Write to disk for fallback persistence across restarts
      fs.writeFileSync(dbPath, JSON.stringify(settings, null, 2), "utf-8");
      console.log("Saved new settings to settings-db.json");
      
      res.json({ success: true, settings });
    } catch (e) {
      console.error("Error saving settings", e);
      res.status(500).json({ error: "Could not save settings on backend" });
    }
  });

  // API 5: Scan slabs using multimodal Gemini API
  app.post("/api/scan-slabs", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "กรุณาส่งไฟล์ภาพและ mimeType เข้ามาในระบบ" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "ไม่พบการตั้งค่า GEMINI_API_KEY ในระบบเซิร์ฟเวอร์ กรุณากำหนดค่าปุ่มคำสั่งหรือ Settings ก่อนใช้งาน" 
        });
      }

      // Initialize GoogleGenAI client (as recommended in skill guidelines)
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Format image content
      const imagePart = {
        inlineData: {
          mimeType,
          data: image,
        },
      };

      const systemInstruction = 
        "You are an expert material estimator specializing in precast prestressed concrete slabs (แผ่นพื้นคอนกรีตสำเร็จรูปอัดแรง) for construction projects. " +
        "Your task is to analyze the image (which could be a handwritten list, a printed quotation page, table screenshot, or messages list) and extract a list of precast slabs. " +
        "Slabs normally have length in meters, count/quantity in sheet units. Standard width is 0.35m (35 centimeters). " +
        "Detect specifications carefully: length, count, optional custom price per square meter (ราคาต่อตารางเมตร บาท/ตร.ม. - ไม่รวมลวด ตั้งต้น) if explicitly listed, wireCount if mentioned, and a title label. " +
        "Only extract precast concrete slab (แผ่นพื้น หรือ แผ่นพื้นสำเร็จรูป) items, ignore other materials. Format output strictly according to the requested JSON response schema.";

      const prompt = 
        "Please read this image carefully, extract all precast concrete slabs (แผ่นพื้นสำเร็จรูป) lists/rows you can find, and formulate them in the requested JSON structure. " +
        "Ensure all lengths are correctly parsed as decimal numbers in meters (e.g. 2.0, 3.5, etc.), counts as integers (number of slabs), " +
        "type as 'normal' or 'm.o.c' based on keywords, and any listed custom price/rate in Thai Baht.";

      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];
      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting Gemini API with model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: [imagePart, { text: prompt }],
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  slabs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        length: {
                          type: Type.NUMBER,
                          description: "ความยาวของแผ่นพื้นกี่เมตร (เมตร)"
                        },
                        count: {
                          type: Type.INTEGER,
                          description: "จำนวนแผ่นพื้นกี่แผ่น (แผ่น / ชิ้น)"
                        },
                        boardType: {
                          type: Type.STRING,
                          description: "ประเภทแผ่นพื้น: 'normal' (ธรรมดา) หรือ 'm.o.c' (มอก.)"
                        },
                        customPriceSqm: {
                          type: Type.NUMBER,
                          description: "ราคาเฉพาะตารางเมตรกรณีที่ระบุในภาพโดยตรง ถ้าไม่มีให้กำหนดเป็น 0 หรือ null"
                        },
                        wireCount: {
                          type: Type.STRING,
                          description: "จำนวนลวดสายอัดแรง ถ้ามีระบุ เช่น '4', '5', '6', '7', '8' หรือถ้าไม่มีใช้ 'auto'"
                        },
                        label: {
                          type: Type.STRING,
                          description: "บันทึกย่อหรือรายละเอียดสั้นๆ รวบรวมจากภาพ เช่น 'แผ่นพื้น 2.50 ม. (สายไฟ 4 เส้น)'"
                        }
                      },
                      required: ["length", "count"]
                    }
                  }
                },
                required: ["slabs"]
              }
            }
          });
          if (response) {
            lastError = null;
            break;
          }
        } catch (err: any) {
          console.warn(`Error with model ${modelName}:`, err?.message || err);
          lastError = err;
        }
      }

      if (lastError) {
        throw lastError;
      }

      if (!response) {
        throw new Error("ไม่มีข้อมูลตอบรับจาก Gemini API หลังจากพยายามทุกโมเดลแล้ว");
      }

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error("ไม่มีข้อมูลตอบรับจาก Gemini API");
      }

      const parsed = JSON.parse(textOutput.trim());
      res.json(parsed);

    } catch (error: any) {
      console.error("Gemini API error during slab scan:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการแปลภาพด้วย AI: " + (error.message || String(error)) });
    }
  });

  // API 6: Parse slab descriptions using text-based Gemini API
  app.post("/api/parse-slabs-text", async (req, res) => {
    try {
      const { text, normalPrice, mocPrice } = req.body;
      if (!text) {
        return res.status(400).json({ error: "กรุณาส่งข้อความแผ่นพื้นเข้ามาในระบบ" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "ไม่พบการตั้งค่า GEMINI_API_KEY ในระบบเซิร์ฟเวอร์ กรุณากำหนดค่าปุ่มคำสั่งหรือ Settings ก่อนใช้งาน" 
        });
      }

      // Initialize GoogleGenAI client (as recommended in skill guidelines)
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = 
        "You are an expert material estimator specializing in precast prestressed concrete slabs (แผ่นพื้นคอนกรีตสำเร็จรูปอัดแรง) for construction projects in Thailand. " +
        "Your task is to analyze a list of concrete slab descriptions/specifications provided by the user (separated by lines). " +
        "Slabs have key attributes: length (เมตร), quantity/count (แผ่น/ชิ้น) and optionally wire counts (ลวด 4 เส้น, 5 เส้น, etc.). Standard width is 35cm (0.35m). " +
        "For each line, extract the length of the slab in meters as a decimal number, the quantity (count, defaults to 1 if not specified), slab type ('normal' or 'm.o.c'), " +
        "the wire count if mentioned ('4', '5', '6', '7', '8' or 'auto'), and a short friendly title label in Thai. " +
        "The user has also provided manual unit rates (ราคา/ตรม.): " +
        `- For 'normal' slabs: ${normalPrice ?? 210} Baht/sqm ` +
        `- For 'm.o.c' slabs: ${mocPrice ?? 230} Baht/sqm. ` +
        "Your output must be a JSON array of slabs. Each slab must contain boardType, length, count, and customPriceSqm populated with either the specified normal or moc price based on its type.";

      const prompt = 
        `Please parse the following list of slabs text lines, group or list them, and map them to the correct attributes.\n` +
        `Text to parse:\n${text}\n\n` +
        `Standard rates to apply:\n` +
        `- Normal sheet: ${normalPrice ?? 210} Baht/sqm\n` +
        `- M.O.C. sheet: ${mocPrice ?? 230} Baht/sqm\n\n` +
        `Output strictly according to the requested JSON response schema. Ensure lengths are floating point numbers (e.g. 2.0, 3.5, etc.) and count is an integer.`;

      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];
      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting Gemini API with model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  slabs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        length: {
                          type: Type.NUMBER,
                          description: "ความยาวของแผ่นพื้นกี่เมตร (เมตร) เช่น 2.00, 3.50"
                        },
                        count: {
                          type: Type.INTEGER,
                          description: "จำนวนแผ่นพื้นกี่แผ่น (ชิ้น / แผ่น), ปล่อยว่างหรือดีฟอลต์เป็น 1"
                        },
                        boardType: {
                          type: Type.STRING,
                          description: "ประเภทแผ่นพื้น: 'normal' (ธรรมดา) หรือ 'm.o.c' (มอก.)"
                        },
                        customPriceSqm: {
                          type: Type.NUMBER,
                          description: "ราคากลางต่อ ตร.ม. ที่ผู้ใช้ระบุ (เช่น สำหรับ normal ใช้ราคา normalPrice, สำหรับ m.o.c ใช้ราคา mocPrice)"
                        },
                        wireCount: {
                          type: Type.STRING,
                          description: "จำนวนลวดสายอัดแรง ถ้ามีในข้อความ เช่น '4', '5', '6', '7', '8' ดีฟอลต์คือ 'auto'"
                        },
                        label: {
                          type: Type.STRING,
                          description: "บันทึกข้อมูลดั้งเดิมสั้นๆ ของแถว เช่น 'แผ่นพื้น 2.00 เมตร ลวด 5 เส้น'"
                        }
                      },
                      required: ["length", "count", "boardType", "customPriceSqm"]
                    }
                  }
                },
                required: ["slabs"]
              }
            }
          });
          if (response) {
            lastError = null;
            break;
          }
        } catch (err: any) {
          console.warn(`Error with model ${modelName}:`, err?.message || err);
          lastError = err;
        }
      }

      if (lastError) {
        throw lastError;
      }

      if (!response) {
        throw new Error("ไม่มีข้อมูลตอบรับจาก Gemini API หลังจากพยายามทุกโมเดลแล้ว");
      }

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error("ไม่มีข้อมูลตอบรับจาก Gemini API");
      }

      const parsed = JSON.parse(textOutput.trim());
      res.json(parsed);

    } catch (error: any) {
      console.error("Gemini API error during slabs text parsing:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการประมวลผลข้อความด้วย AI: " + (error.message || String(error)) });
    }
  });

  // API 7: Scan all concrete products using multimodal Gemini API (Universal Scanner)
  app.post("/api/scan-universal", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "กรุณาส่งไฟล์ภาพและ mimeType เข้ามาในระบบ" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "ไม่พบการตั้งค่า GEMINI_API_KEY ในระบบเซิร์ฟเวอร์ กรุณากำหนดค่าปุ่มคำสั่งหรือ Settings ก่อนใช้งาน" 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const imagePart = {
        inlineData: {
          mimeType,
          data: image,
        },
      };

      const systemInstruction = 
        "You are an expert material estimator specializing in precast concrete products (แผ่นพื้นสำเร็จรูป, เสาเข็ม, แผ่นกลวง, เสารั้ว, ท่อระบายน้ำ คสล., บ่อพัก คสล.) for construction projects. " +
        "Your task is to analyze the image (handwritten note, table screenshot, quotation bill) and extract ALL concrete items. " +
        "Support Categories & Models:\n" +
        "1. Category 'slab': precast concrete slabs. Model: 'normal' (แผ่นพื้นธรรมดา) or 'm.o.c' (แผ่นพื้น มอก.). Attributes: length (meters), count (quantity), wireCount ('4', '5', '6', '7', '8', '5_mm_5' or 'auto').\n" +
        "2. Category 'pile': prestressed concrete piles. Model: 'i15', 'i18', 'i22', 'i26', 'i30' (เสาเข็มไอ), 's18', 's22', 's26', 's30', 's35', 's40' (เสาสี่เหลี่ยมตัน), 'hex' (หกเหลี่ยม), 'fence3' (เสารั้ว 3 นิ้ว), 'fence4' (เสารั้ว 4 นิ้ว). Attributes: length (meters), count (quantity), tisStandard ('tis' or 'no_tis'), connectionType ('single' or 'joint' - only for i18 and i22).\n" +
        "3. Category 'hollow_core': precast hollow core slabs. Model: 'hc'. Attributes: length (meters), count (quantity), thickness (optional).\n" +
        "4. Category 'fence': fence posts. Model: 'fence3' (หน้า 3\" นิ้ว) or 'fence4' (หน้า 4\" นิ้ว). Attributes: length (meters), count (quantity).\n" +
        "5. Category 'drainage': concrete pipes (ท่อระบายน้ำ คสล.) and catch basins (บ่อพัก คสล.). \n" +
        "   - Pipes: Model MUST be 'pipe030' (30cm / 0.30m), 'pipe040' (40cm), 'pipe050' (50cm), 'pipe060' (60cm), 'pipe080' (80cm), 'pipe100' (100cm), 'pipe120' (120cm), 'pipe150' (150cm). Set tisStandard to 't2' (for มอก.ชั้น 2), 't3' (for มอก.ชั้น 3), or 'no_tis' (ปกติ/คสล.).\n" +
        "   - Catch basins: Model MUST be 'basin030' (for pipe 30cm), 'basin040', 'basin050', 'basin060', 'basin080', 'basin100', 'basin120'. Length of drainage is 1.0.\n" +
        "Ignore other construction materials (sand, cement bricks, steel rebars, labor fees) and only extract precast concrete elements manufactured by Pongsakul.";

      const prompt = 
        "Please read this image carefully, extract all concrete slabs, piles, hollow cores, and fence posts lists/rows you can find, and formulate them in the requested JSON structure. " +
        "Ensure lengths and counts are always positive numbers, handle unit rates (customPrice) in Baht if listed directly, and provide Thai description labels.";

      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];
      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: [imagePart, { text: prompt }],
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: {
                          type: Type.STRING,
                          description: "ประเภทหลัก: 'slab', 'pile', 'hollow_core', 'fence', หรือ 'drainage'"
                        },
                        model: {
                          type: Type.STRING,
                          description: "รุ่นโมเดล: สำหรับ slab ('normal','m.o.c'), สำหรับ pile ('i15','i18','i22','i26','i30','s18','s22','s26','s30','s35','s40','hex','fence3','fence4'), สำหรับ hollow_core ('hc'), สำหรับ fence ('fence3','fence4'), สำหรับ drainage ('pipe030','pipe040','pipe050','pipe060','pipe080','pipe100','pipe120','pipe150','basin030','basin040','basin050','basin060','basin080','basin100','basin120')"
                        },
                        length: {
                          type: Type.NUMBER,
                          description: "ความยาวต่อหน่วย (เมตร)"
                        },
                        count: {
                          type: Type.INTEGER,
                          description: "จำนวนสเปกนี้กี่แผ่น/ต้น/ชิ้น"
                        },
                        wireCount: {
                          type: Type.STRING,
                          description: "จำนวนเส้นลวดสายอัดแรง ถ้ามีในงานแผ่นพื้น เช่น '4', '5', '6', '7', '8', หรือ 'auto' (กรณีไม่มีระบุ)"
                        },
                        tisStandard: {
                          type: Type.STRING,
                          description: "มาตรฐานการรองรับ: สำหรับเสาเข็ม/แผ่นพื้น: 'tis' หรือ 'no_tis'. สำหรับ drainage คสล./ท่อ: 'no_tis' (ปกติ), 't3' (มอก.3), หรือ 't2' (มอก.2)"
                        },
                        connectionType: {
                          type: Type.STRING,
                          description: "ลักษณะท่อนเชื่อมต่อสำหรับเสาเข็มไอ I-18 และ I-22: 'single' (ท่อนเดี่ยว) หรือ 'joint' (ท่อนต่อหูเหล็กเชื่อม)"
                        },
                        customPrice: {
                          type: Type.NUMBER,
                          description: "ราคาต่อหน่วยที่ตกลงกันไว้ (บาท) หรือถ้าไม่มีให้ใส่ 0"
                        },
                        label: {
                          type: Type.STRING,
                          description: "คำอธิบายภาษาไทยย่อสั้นๆ สำหรับรายการ เช่น 'แผ่นพื้นสำเร็จสเปก 2.50 ม. ลวด 5 เส้น' หรือ 'เสาเข็มไอ I-22 ยาว 6.00 ม.'"
                        }
                      },
                      required: ["category", "model", "length", "count"]
                    }
                  }
                },
                required: ["items"]
              }
            }
          });
          if (response) {
            lastError = null;
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (lastError) throw lastError;
      if (!response || !response.text) {
        throw new Error("ไม่มีข้อมูลสรุปตอบสนองจากการประมวลผลรูปภาพระบบคลาวด์");
      }

      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);

    } catch (error: any) {
      console.error("Gemini API error during universal scan:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการแปลภาพเพื่อคำนวณราคา AI: " + (error.message || String(error)) });
    }
  });

  // API 8: Parse multi-line descriptions of all concrete products using text-based Gemini API (Universal Text Parser)
  app.post("/api/parse-universal-text", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "กรุณาระบุข้อความสเปกในการส่งวิเคราะห์" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "ไม่พบการตั้งค่า GEMINI_API_KEY ในระบบเซิร์ฟเวอร์ กรุณากำหนดค่าปุ่มคำสั่งหรือ Settings ก่อนใช้งาน" 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const systemInstruction = 
        "You are an expert material estimator specializing in construction products of Pongsakul Hardware (Thailand). " +
        "Your task is to parse unstructured, multi-line construction material specifications in Thai, extracting ALL matching concrete products into a structured JSON database.\n" +
        "Key Classes to Extract:\n" +
        "1. Category 'slab': precast concrete slabs (แผ่นพื้นสำเร็จ, แผ่นพื้นคอนกรีต). Model: 'normal' or 'm.o.c' (มอก.). Detect wireCount ('4', '5', '6', '7', '8', '5_mm_5' or 'auto'). Width is always 35cm (0.35m).\n" +
        "2. Category 'pile': precast concrete piles. Model could be I-shape: 'i15', 'i18', 'i22', 'i26', 'i30' OR Solid Square: 's18', 's22', 's26', 's30', 's35', 's40' OR 'hex' (เสาเข็มหกเหลี่ยม) OR fence posts ('fence3', 'fence4'). Detect tisStandard ('tis' / 'no_tis') and connectionType ('single' / 'joint' for i18,i22 if mentioned).\n" +
        "3. Category 'hollow_core': hollow core slabs (แผ่นกลวง). Model: 'hc'.\n" +
        "4. Category 'fence': fence post. Model: 'fence3' (3 นิ้ว) or 'fence4' (4 นิ้ว).\n" +
        "5. Category 'drainage': concrete drainage pipes (ท่อระบายน้ำ คสล., ท่อระบายน้ำ มอก.) and catch basins (บ่อพัก คสล.).\n" +
        "   - Pipes: Model MUST be 'pipe030' (diameter 30cm or 0.30m), 'pipe040', 'pipe050', 'pipe060', 'pipe080', 'pipe100', 'pipe120', 'pipe150'. Set tisStandard to 't2' (for มอก.ชั้น 2), 't3' (for มอก.ชั้น 3), or 'no_tis'.\n" +
        "   - Catch basins: Model MUST be 'basin030', 'basin040', 'basin050', 'basin060', 'basin080', 'basin100', 'basin120'. Length of drainage defaults to 1.0.\n" +
        "Extract attributes strictly: category, model, length (in meters as numeric), count (quantity), wireCount, connectionType, tisStandard, optional customPrice/rate if listed directly, and label in Thai.";

      const prompt = 
        `Extract and organize all listed concrete items from this description:\n\n` +
        `Text:\n${text}\n\n` +
        `Ensure numbers (length, check counts) are carefully parsed. Output strictly in the requested JSON format.`;

      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];
      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING },
                        model: { type: Type.STRING },
                        length: { type: Type.NUMBER },
                        count: { type: Type.INTEGER },
                        wireCount: { type: Type.STRING },
                        tisStandard: { type: Type.STRING },
                        connectionType: { type: Type.STRING },
                        customPrice: { type: Type.NUMBER },
                        label: { type: Type.STRING }
                      },
                      required: ["category", "model", "length", "count"]
                    }
                  }
                },
                required: ["items"]
              }
            }
          });
          if (response) {
            lastError = null;
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (lastError) throw lastError;
      if (!response || !response.text) {
        throw new Error("ไม่มีข้อมูลสเปกตอบสนองจากการระบุของระบบ AI");
      }

      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);

    } catch (error: any) {
      console.error("Gemini API error during universal text parse:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดคลาวด์ขณะแปลงข้อความเป็นโครงสร้าง AI: " + (error.message || String(error)) });
    }
  });

  // API 4: Get single-file compiled offline HTML package
  app.get("/api/download-single-html", (req, res) => {
    try {
      const distPath = path.join(process.cwd(), "dist");
      const indexPath = path.join(distPath, "index.html");

      if (!fs.existsSync(indexPath)) {
        return res.status(404).send(
          "<h3 style='font-family: sans-serif; text-align: center; margin-top: 50px;'>กรุณารอสักครู่หรือขอให้ระบบทำการ Build ก่อน เนื่องจากยังไม่พบไฟล์ index.html ในระบบ</h3>"
        );
      }

      let html = fs.readFileSync(indexPath, "utf-8");

      // Match links & scripts dynamically with optional leading slash
      const linkRegex = /<link\s+[^>]*href=["']\/?([^"']+\.css)["'][^>]*>/g;
      const scriptRegex = /<script\s+[^>]*src=["']\/?([^"']+\.js)["'][^>]*><\/script>/g;

      // Inline CSS
      html = html.replace(linkRegex, (match, urlPath) => {
        const fullPath = path.join(distPath, urlPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          return `<style>${content}</style>`;
        }
        return match;
      });

      // Inline JS
      html = html.replace(scriptRegex, (match, urlPath) => {
        const fullPath = path.join(distPath, urlPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          return `<script type="module">${content}</script>`;
        }
        return match;
      });

      // Embed the currently active server-cached settings so they load automatically offline as default
      const bakedState = cachedSettings || null;
      const bStateScript = `<script>window.BAKED_SETTINGS = ${JSON.stringify(bakedState)};</script>\n<head>`;
      html = html.replace("<head>", bStateScript);

      // Extract version dynamically from src/data.ts for the filename
      let versionSlug = "V22";
      try {
        const dataTsPath = path.join(process.cwd(), "src", "data.ts");
        if (fs.existsSync(dataTsPath)) {
          const content = fs.readFileSync(dataTsPath, "utf-8");
          const vMatch = content.match(/export const APP_VERSION = "([^"]+)"/);
          if (vMatch && vMatch[1]) {
            versionSlug = vMatch[1].replace(/\s+/g, "_");
          }
        }
      } catch (err) {
        // Fallback safely
      }

      res.setHeader("Content-Disposition", `attachment; filename=Pongsakul_Concrete_Calculator_${versionSlug}.html`);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err) {
      console.error(err);
      res.status(500).send("เกิดข้อผิดพลาดในการแพ็ครวมไฟล์ standalone HTML: " + String(err));
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded as middleware");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pongsakul Server running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
  });
}

startServer();
