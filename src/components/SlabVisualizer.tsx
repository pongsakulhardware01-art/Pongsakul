import { motion } from "motion/react";

interface SlabVisualizerProps {
  length: number;
  wireCount: string;
}

export function SlabVisualizer({ length, wireCount }: SlabVisualizerProps) {
  const numLength = typeof length === "number" ? length : (parseFloat(length as any) || 0);
  // Determine dots to show representing wires
  let dots = 4;
  if (wireCount === "5") dots = 5;
  else if (wireCount === "6") dots = 6;
  else if (wireCount === "7") dots = 7;
  else if (wireCount === "8" || wireCount === "5_mm_5") dots = 8;

  // Render a lovely SVG representing the cross section and side view of our prestressed slab
  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-150 flex flex-col items-center justify-center gap-4">
      <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">แบบจำลองภาพ 3 มิติและภาคตัดขวาง</span>
      
      <div className="flex flex-wrap items-center justify-center gap-8 w-full">
        {/* Cross Section */}
        <div className="flex flex-col items-center">
          <svg width="120" height="90" viewBox="0 0 120 90" className="drop-shadow-sm">
            {/* Concrete Slab Shape */}
            <rect x="10" y="20" width="100" height="40" rx="3" fill="#D4D4D8" stroke="#71717A" strokeWidth="2" />
            {/* Top chamfers for a professional plank slab shape */}
            <polygon points="10,20 20,20 15,30 10,30" fill="#E4E4E7" />
            <polygon points="110,20 100,20 105,30 110,30" fill="#E4E4E7" />
            {/* Plank Dimension Marks */}
            <line x1="10" y1="75" x2="110" y2="75" stroke="#A1A1AA" strokeWidth="1" strokeDasharray="2" />
            <text x="60" y="87" fill="#71717A" fontSize="10" textAnchor="middle" fontFamily="Kanit">กว้าง 35 ซม.</text>
            
            {/* Wires (PC strand dots) */}
            {Array.from({ length: dots }).map((_, i) => {
              // Distribute dots inside plank slab
              const offset = 100 / (dots + 1);
              const cx = 10 + offset * (i + 1);
              return (
                <motion.circle
                  key={i}
                  cx={cx}
                  cy="40"
                  r="3.5"
                  fill="#F59E0B"
                  stroke="#D97706"
                  strokeWidth="1"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                />
              );
            })}
          </svg>
          <span className="text-xs text-neutral-600 mt-1 font-medium">แผ่นพื้นสำเร็จรูป (ลวด {dots} เส้น)</span>
        </div>

        {/* Longitude Side View represent length */}
        <div className="flex flex-col items-center">
          <svg width="160" height="90" viewBox="0 0 160 90">
            {/* Side projection of slab */}
            <rect x="10" y="25" width="140" height="24" rx="2" fill="#E4E4E7" stroke="#909090" strokeWidth="1.5" />
            {/* Metal reinforcement lines showing through */}
            <line x1="10" y1="37" x2="150" y2="37" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3" />
            
            {/* Length Mark */}
            <line x1="10" y1="65" x2="150" y2="65" stroke="#71717A" strokeWidth="1" />
            <polygon points="10,65 15,62 15,68" fill="#71717A" />
            <polygon points="150,65 145,62 145,68" fill="#71717A" />
            <text x="80" y="80" fill="#27272A" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="Kanit">
              ยาว {numLength.toFixed(2)} ม.
            </text>
          </svg>
          <span className="text-xs text-neutral-600 mt-1 font-medium">มุมมองด้านความยาวด้านข้าง</span>
        </div>
      </div>
    </div>
  );
}
export default SlabVisualizer;
