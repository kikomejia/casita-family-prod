"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/lib/base44Client";
import { RouletteWheel } from "./RouletteWheel";
import { Gift } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useData } from "@/context/DataContext";

const DEFAULT_PRIZES = ["Extra Screen Time", "Ice Cream", "Choose Movie", "Stay Up Late", "New Toy", "Pizza Night", "Skip a Chore", "Small Treat"];

export function RewardsTab() {
  const { members, settings } = useData();
  const [rewardLogs, setRewardLogs] = useState<any[]>([]);
  const [spinningMember, setSpinningMember] = useState<any>(null);

  const prizes = useMemo(() => settings?.prizes ?? DEFAULT_PRIZES, [settings]);

  // Reward logs are tab-local
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = base44.entities.RewardLog.subscribe((logs) => {
      setRewardLogs(logs);
    }, "-claimed_at", 10);
    return () => unsub();
  }, []);

  const childMembers = useMemo(() => members.filter((m) => m.role === "child"), [members]);

  const handleSpinDone = useCallback(
    async (prize: string) => {
      if (!spinningMember) return;

      // Slight delay to let the user see where it landed
      setTimeout(async () => {
        alert(`🎉 ${spinningMember.name} won: ${prize}!`);

        const newPoints = Math.max(0, spinningMember.points - 10);

        try {
          await base44.entities.FamilyMember.update(spinningMember.id, { points: newPoints });
          await base44.entities.RewardLog.create({
            member_id: spinningMember.id,
            member_name: spinningMember.name,
            prize,
            claimed_at: new Date().toISOString(),
          });

          // We no longer delete chore logs, as we want to keep the "Recent Chores" history.

          setSpinningMember(null);
        } catch (e) {
          console.error(e);
        }
      }, 500);
    },
    [spinningMember],
  );

  return (
    <div className="p-4 space-y-6">
      {!spinningMember ? (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Who is spinning? (10 pts)</h2>
          <div className="grid grid-cols-1 gap-3">
            {childMembers.map((member) => {
              const canSpin = member.points >= 10;
              return (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden" style={{ backgroundColor: member.color || "#ccc" }}>
                      {member.avatar_url ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" /> : member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{member.name}</p>
                      <p className={`text-xs font-bold ${canSpin ? "text-green-500" : "text-gray-400"}`}>{member.points} / 10 pts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSpinningMember(member)}
                    disabled={!canSpin}
                    className={`px-5 py-2 font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-95 ${
                      canSpin
                        ? "bg-[#ff00ff] text-white shadow-[0_0_15px_rgba(255,0,255,0.4)] hover:shadow-[0_0_25px_rgba(255,0,255,0.6)] animate-pulse"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                    }`}
                  >
                    Spin
                  </button>
                </div>
              );
            })}
          </div>

          {rewardLogs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Rewards</h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {rewardLogs.map((log, i) => {
                  const member = members.find((m) => m.id === log.member_id);
                  return (
                    <div key={log.id} className={`p-3 flex items-center justify-between ${i !== rewardLogs.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0" style={{ backgroundColor: member?.color || "#ccc" }}>
                          {member?.avatar_url ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" /> : member?.name?.charAt(0) || log.member_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {log.member_name} won {log.prize}
                          </p>
                          <p className="text-[10px] text-gray-400">{new Date(log.claimed_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-900">{spinningMember.name}&apos;s Spin!</h2>
            <p className="text-sm text-gray-500">Costs 10 points</p>
          </div>

          <RouletteWheel prizes={prizes} onSpinDone={handleSpinDone} />

          <button onClick={() => setSpinningMember(null)} className="text-sm font-bold text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
