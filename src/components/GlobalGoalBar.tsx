"use client";
import { FamilyGoalBar } from "./FamilyGoalBar";
import { useData } from "@/context/DataContext";

export function GlobalGoalBar() {
  const { activeGoal } = useData();

  if (!activeGoal) return null;

  return (
    <div className="pt-6 px-4">
      <FamilyGoalBar goal={activeGoal} />
    </div>
  );
}
