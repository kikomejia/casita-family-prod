"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { base44 } from "@/lib/base44Client";
import { auth } from "@/lib/firebase";

interface DataContextType {
  members: any[];
  settings: any | null;
  activeGoal: any | null;
  refreshGoal: () => void;
}

const DataContext = createContext<DataContextType>({
  members: [],
  settings: null,
  activeGoal: null,
  refreshGoal: () => {},
});

const MEMBER_ORDER = ["Maya", "Luna", "Gabriela", "Francisco"];

function sortMembers(m: any[]): any[] {
  return [...m].sort((a, b) => {
    const indexA = MEMBER_ORDER.indexOf(a.name);
    const indexB = MEMBER_ORDER.indexOf(b.name);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [goalRefreshKey, setGoalRefreshKey] = useState(0);

  const refreshGoal = useCallback(() => {
    setGoalRefreshKey((k) => k + 1);
  }, []);

  // Listen for the custom event dispatched by ChoresTab / RewardsTab
  useEffect(() => {
    const handler = () => refreshGoal();
    window.addEventListener("casita_refresh_goal", handler);
    return () => window.removeEventListener("casita_refresh_goal", handler);
  }, [refreshGoal]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubMembers = base44.entities.FamilyMember.subscribe((m) => {
      setMembers(sortMembers(m));
    });

    const unsubSettings = base44.entities.Settings.subscribeOne("family", (s) => {
      setSettings(s);
    });

    const unsubGoals = base44.entities.FamilyGoal.subscribe((data) => {
      setGoals(data);
    });

    return () => {
      unsubMembers();
      unsubSettings();
      unsubGoals();
    };
  }, [goalRefreshKey]); // re-subscribe when goal is manually refreshed

  const activeGoal = useMemo(() => goals.find((g) => g.is_active) ?? null, [goals]);

  const value = useMemo(
    () => ({ members, settings, activeGoal, refreshGoal }),
    [members, settings, activeGoal, refreshGoal],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
