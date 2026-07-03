import { loadCapacityTable } from "./data";

export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return "0.00";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function roundToBeautifulPrice(num: number): number {
  if (num <= 0) return 0;
  return Math.ceil(num / 5) * 5;
}

export function getLoadCapacity(length: number, wireCount: string): number {
  const lengthKeys = Object.keys(loadCapacityTable).map(Number).sort((a, b) => a - b);
  const wireIndexMap: Record<string, number> = { "4": 0, "5": 1, "6": 2, "7": 3, "8": 4 };

  let effectiveWireCount = wireCount;
  let index = wireIndexMap[effectiveWireCount] !== undefined
    ? wireIndexMap[effectiveWireCount]
    : (parseInt(effectiveWireCount) > 8 || effectiveWireCount === "5_mm_5" ? 4 : 0);

  if (index > 4) index = 4;

  let closestLengthKey = lengthKeys.find((key) => key >= length);

  if (!closestLengthKey) {
    closestLengthKey = lengthKeys[lengthKeys.length - 1];
  } else if (length < lengthKeys[0]) {
    closestLengthKey = lengthKeys[0];
  }

  const capacityArray = loadCapacityTable[closestLengthKey];

  if (capacityArray && capacityArray[index] !== undefined) {
    return capacityArray[index];
  }

  return 0;
}

export function compressImage(
  fileOrBase64: File | string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processSrc = (src: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src); // Fallback to original if context not available
          return;
        }

        // Fill background with white to handle transparent PNGs nicely when saving as JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = src;
    };

    if (fileOrBase64 instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processSrc(e.target.result as string);
        } else {
          reject(new Error("Cannot read file"));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    } else {
      processSrc(fileOrBase64);
    }
  });
}
