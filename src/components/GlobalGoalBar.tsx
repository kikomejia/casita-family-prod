"use client";
import { useEffect, useState } from "react";
import { base44 } from "@/lib/base44Client";
import { FamilyGoalBar } from "./FamilyGoalBar";

export function GlobalGoalBar() {
  const [goal, setGoal] = useState<any>(null);

  useEffect(() => {
    const unsub = base44.entities.FamilyGoal.subscribe((data) => {
      const activeGoal = data.find((g: any) => g.is_active);
      setGoal(activeGoal);
    });
    return () => unsub();
  }, []);

  if (!goal) return null;

  return (
    <div className="pt-6 px-4">
      <FamilyGoalBar goal={goal} />
    </div>
  );
}
