"use client";
import { motion } from "framer-motion";

interface FamilyGoalBarProps {
  goal: {
    title: string;
    current_points: number;
    target_points: number;
  } | null;
}

export function FamilyGoalBar({ goal }: FamilyGoalBarProps) {
  if (!goal) return null;

  const percentage = Math.min(100, Math.max(0, (goal.current_points / goal.target_points) * 100));

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[11px] font-black text-gray-700 uppercase tracking-widest truncate mr-4">
          {goal.title}
        </h2>
        <span className="text-[11px] font-black text-[#ff00ff] uppercase tracking-widest shrink-0">
          {goal.current_points} / {goal.target_points} pts
        </span>
      </div>
      
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden relative">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ 
            background: "linear-gradient(90deg, #ff00ff 0%, #00f2fe 50%, #00ff00 100%)" 
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-end mt-1.5">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
          {Math.round(percentage)}% complete
        </span>
      </div>
    </div>
  );
}
