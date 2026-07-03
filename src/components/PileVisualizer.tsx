import { motion } from "motion/react";

interface PileVisualizerProps {
  pileType: string;
  isJoint: boolean;
  isTis: boolean;
  length: number;
}

export function PileVisualizer({ pileType, isJoint, isTis, length }: PileVisualizerProps) {
  const numLength = typeof length === "number" ? length : (parseFloat(length as any) || 0);
  // Renders a modern preview of the selected pile design
  const getShapeName = () => {
    switch (pileType) {
      case "hex":
        return "เสาเข็มหกเหลี่ยมกลวง";
      case "i15":
        return "เสาเข็มไอ I-15";
      case "i18":
      case "i22":
      case "i26":
      case "i30":
      case "i35":
      case "i40": {
        const num = pileType.replace("i", "");
        return `เสาเข็มไอ I-${num} ${isJoint ? "(ท่อนต่อ Joint)" : "(ท่อนเดียว)"}`;
      }
      case "s18":
      case "s22":
      case "s26":
      case "s30":
      case "s35":
      case "s40": {
        const num = pileType.replace("s", "");
        return `เสาสี่เหลี่ยมตัน S-${num} ${isJoint ? "(ท่อนต่อ Joint)" : "(ท่อนเดียว)"}`;
      }
      case "fence3":
        return "เสารั้วหน้า 3 นิ้ว";
      case "fence4":
        return "เสารั้วหน้า 4 นิ้ว";
      default:
        return "เสาเข็มมาตรฐาน";
    }
  };

  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-150 flex flex-col items-center justify-center gap-4">
      <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">ภาพโครงสร้างเสาคอนกรีตอัดแรง</span>
      
      <div className="flex flex-wrap items-center justify-center gap-8 w-full">
        {/* Cross Section SVG */}
        <div className="flex flex-col items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 100 100">
            {pileType === "hex" ? (
              // Hexagonal profile
              <g>
                <polygon points="50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5" fill="#D4D4D8" stroke="#71717A" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="18" fill="#F4F4F5" stroke="#A1A1AA" strokeWidth="1.5" />
                <text x="50" y="54" fill="#71717A" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="Kanit">กลวง</text>
              </g>
            ) : pileType.startsWith("i") ? (
              // I-Shape Profile
              <g>
                <path
                  d="M 25,20 L 75,20 L 75,32 L 60,38 L 60,62 L 75,68 L 75,80 L 25,80 L 25,68 L 40,62 L 40,38 L 25,32 Z"
                  fill="#D4D4D8"
                  stroke="#71717A"
                  strokeWidth="2.5"
                />
                <circle cx="50" cy="50" r="3" fill="#A1A1AA" />
                {/* Visual steel wire strands in I-Shape */}
                <circle cx="32" cy="26" r="2.5" fill="#F59E0B" />
                <circle cx="68" cy="26" r="2.5" fill="#F59E0B" />
                <circle cx="32" cy="74" r="2.5" fill="#F59E0B" />
                <circle cx="68" cy="74" r="2.5" fill="#F59E0B" />
              </g>
            ) : pileType.startsWith("s") ? (
              // Solid Square Pile Profile
              <g>
                <rect x="20" y="20" width="60" height="60" rx="4" fill="#D4D4D8" stroke="#71717A" strokeWidth="2.5" />
                {/* Visual steel wire strands at 4 corners */}
                <circle cx="28" cy="28" r="3" fill="#F59E0B" />
                <circle cx="72" cy="28" r="3" fill="#F59E0B" />
                <circle cx="28" cy="72" r="3" fill="#F59E0B" />
                <circle cx="72" cy="72" r="3" fill="#F59E0B" />
                <text x="50" y="54" fill="#71717A" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="Kanit">ตัน</text>
              </g>
            ) : (
              // Square/Post profile for fences
              <g>
                <rect x="25" y="25" width="50" height="50" rx="4" fill="#D4D4D8" stroke="#71717A" strokeWidth="2.5" />
                <line x1="25" y1="25" x2="75" y2="75" stroke="#E4E4E7" strokeWidth="1.5" />
                <line x1="75" y1="25" x2="25" y2="75" stroke="#E4E4E7" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="4" fill="#F59E0B" />
              </g>
            )}
            
            {/* TIS Badge inside SVG */}
            {isTis && (
              <g transform="translate(68, 8)">
                <circle cx="8" cy="8" r="9" fill="#C62828" />
                <text x="8" y="11" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">มอก</text>
              </g>
            )}
          </svg>
          <span className="text-xs text-neutral-600 mt-2 font-medium">{getShapeName()}</span>
        </div>

        {/* Height Side projection */}
        <div className="flex flex-col items-center">
          <svg width="150" height="100" viewBox="0 0 150 100">
            {/* Long pole */}
            <rect x="20" y="25" width="110" height="16" rx="2" fill="#E4E4E7" stroke="#71717A" strokeWidth="1.5" />
            
            {/* If there is a joint, draw welding plate in the middle */}
            {isJoint && (
              <g>
                <rect x="73" y="23" width="4" height="20" fill="#3F3F46" />
                <text x="75" y="15" fill="#52525B" fontSize="8" textAnchor="middle" fontFamily="Kanit">ข้อต่อเชื่อม</text>
              </g>
            )}

            {/* Dimension arrow */}
            <line x1="20" y1="65" x2="130" y2="65" stroke="#71717A" strokeWidth="1" />
            <polygon points="20,65 25,62 25,68" fill="#71717A" />
            <polygon points="130,65 125,62 125,68" fill="#71717A" />
            <text x="75" y="82" fill="#27272A" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="Kanit">
              ความยาว {numLength.toFixed(2)} ม.
            </text>
          </svg>
          <span className="text-xs text-neutral-600 font-medium">มุมภาพด้านหน้า</span>
        </div>
      </div>
    </div>
  );
}
export default PileVisualizer;
