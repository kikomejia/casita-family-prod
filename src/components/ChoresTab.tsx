"use client";
import { useState, useEffect, FormEvent } from "react";
import { base44 } from "@/lib/base44Client";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { Plus, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";

const DEFAULT_CHORES = ["Make Bed", "Brush Teeth", "Clean Room", "Read 20 mins", "Help with Dinner"];
const MAYA_DEFAULT_CHORES = ["Make up Bed", "Homework", "Comeu Tudo", "Arrumou a Mesa", "Favor", "Read 20 min"];
const LUNA_DEFAULT_CHORES = ["Comeu Tudo", "Brush Teeth", "Clean Up", "Arrumou a Mesa", "Favor"];

export function ChoresTab() {
  const [localMembers, setLocalMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [choreLogs, setChoreLogs] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [chores, setChores] = useState<string[]>(DEFAULT_CHORES);
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);
  const [customChoreName, setCustomChoreName] = useState("");

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubMembers = base44.entities.FamilyMember.subscribe((m) => {
      const order = ["Maya", "Luna", "Gabriela", "Francisco"];
      const sorted = [...m].sort((a, b) => {
        const indexA = order.indexOf(a.name);
        const indexB = order.indexOf(b.name);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
      setLocalMembers(sorted);
      
      // Initialize or validate selected ID
      setSelectedMemberId(prevId => {
        if (!prevId && sorted.length > 0) return sorted[0].id;
        // If the member no longer exists in the new list, fall back to the first one
        if (prevId && !sorted.some(sm => sm.id === prevId)) return sorted[0]?.id || null;
        return prevId;
      });
    });

    const unsubSettings = base44.entities.Settings.subscribeOne("family", (s) => {
      if (s && s.chores) setChores(s.chores);
    });

    const unsubLogs = base44.entities.Chore.subscribe((logs) => {
      setChoreLogs(logs);
    }, "-completed_at", 10);

    return () => {
      unsubMembers();
      unsubSettings();
      unsubLogs();
    };
  }, []);

  const addPoint = async (task: string) => {
    if (!selectedMemberId || adding) return;
    const currentMember = localMembers.find(m => m.id === selectedMemberId);
    if (!currentMember) return;
    
    setAdding(true);

    // Optimistic UI
    const newPoints = (currentMember.points || 0) + 1;
    const newLifetimePoints = (currentMember.lifetime_points || 0) + 1;
    
    const updatedMember = { ...currentMember, points: newPoints, lifetime_points: newLifetimePoints };
    setLocalMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    
    const tempLog = { id: 'temp-' + Date.now(), assignee: updatedMember.id, title: task, points: 1, is_completed: true, completed_at: new Date().toISOString() };
    setChoreLogs(prev => [tempLog, ...prev].slice(0, 10));
    
    setShowConfetti(true);

    try {
      await Promise.all([
        base44.entities.FamilyMember.update(updatedMember.id, { points: newPoints, lifetime_points: newLifetimePoints }),
        base44.entities.Chore.create({ assignee: updatedMember.id, title: task, points: 1, is_completed: true, completed_at: new Date().toISOString() }),
        (async () => {
          const goals = await base44.entities.FamilyGoal.filter({ is_active: true });
          if (goals.length > 0) {
            await base44.entities.FamilyGoal.update(goals[0].id, { current_points: (goals[0].current_points || 0) + 1 });
            window.dispatchEvent(new Event('casita_refresh_goal'));
          }
        })()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const subtractPoint = async () => {
    if (!selectedMemberId || adding) return;
    const currentMember = localMembers.find(m => m.id === selectedMemberId);
    if (!currentMember) return;

    setAdding(true);

    const newPoints = Math.max(0, (currentMember.points || 0) - 1);

    const updatedMember = { ...currentMember, points: newPoints };
    setLocalMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));

    const tempLog = { id: 'temp-' + Date.now(), assignee: updatedMember.id, title: '😈 Naughty', points: -1, is_completed: true, completed_at: new Date().toISOString() };
    setChoreLogs(prev => [tempLog, ...prev].slice(0, 10));

    try {
      await Promise.all([
        base44.entities.FamilyMember.update(updatedMember.id, { points: newPoints }),
        base44.entities.Chore.create({ assignee: updatedMember.id, title: '😈 Naughty', points: -1, is_completed: true, completed_at: new Date().toISOString() }),
        (async () => {
          const goals = await base44.entities.FamilyGoal.filter({ is_active: true });
          if (goals.length > 0) {
            const goalPoints = Math.max(0, (goals[0].current_points || 0) - 1);
            await base44.entities.FamilyGoal.update(goals[0].id, { current_points: goalPoints });
            window.dispatchEvent(new Event('casita_refresh_goal'));
          }
        })()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleCustomChoreSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (customChoreName.trim()) {
      addPoint(customChoreName.trim());
      setCustomChoreName("");
      setIsCustomInputOpen(false);
    }
  };

  const neonColors = ["#ff00ff", "#00f2fe", "#00ff00", "#a855f7", "#ff6b00", "#ffff00"];

  const getMemberColor = (member: any, index: number) => {
    return member.color || neonColors[index % neonColors.length];
  };

  const selectedMember = localMembers.find(m => m.id === selectedMemberId);

  return (
    <div className="p-4 space-y-6 pb-24">
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-4">Who did a chore?</h1>
        <div className="flex space-x-3 overflow-x-auto pt-2 pb-2 scrollbar-hide">
          {localMembers.map((member, index) => {
            const isSelected = selectedMemberId === member.id;
            const memberColor = getMemberColor(member, index);
            
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-2xl min-w-[80px] transition-all border",
                  isSelected 
                    ? "text-white shadow-lg scale-105" 
                    : "bg-white text-gray-600 border-gray-100 hover:border-gray-200"
                )}
                style={{ 
                  backgroundColor: isSelected ? memberColor : undefined,
                  borderColor: isSelected ? memberColor : undefined,
                  boxShadow: isSelected ? `0 10px 20px -5px ${memberColor}40` : undefined
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-2 bg-white/20 overflow-hidden" 
                  style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : memberColor }}
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <span className="text-xs font-black uppercase tracking-wider">{member.name}</span>
                <span className="text-[10px] font-bold opacity-80">{member.points} pts</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedMember && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Chore</h2>
          <div className="grid grid-cols-2 gap-3">
            {(selectedMember.chores || (selectedMember.name === 'Maya' ? MAYA_DEFAULT_CHORES : selectedMember.name === 'Luna' ? LUNA_DEFAULT_CHORES : [])).map((chore: string) => {
              const memberIndex = localMembers.findIndex(m => m.id === selectedMember.id);
              const memberColor = getMemberColor(selectedMember, memberIndex);
              
              return (
                <button
                  key={chore}
                  onClick={() => addPoint(chore)}
                  disabled={adding}
                  className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50 group"
                  style={{ 
                    borderColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${memberColor}40`;
                    e.currentTarget.style.boxShadow = `0 4px 12px ${memberColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span className="font-bold text-gray-800 text-sm">{chore}</span>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-2 transition-colors"
                    style={{ 
                      backgroundColor: `${memberColor}15`,
                      color: memberColor
                    }}
                  >
                    <Plus className="w-5 h-5" />
                  </div>
                </button>
              );
            })}
            
            {/* Custom Chore Button or Input */}
            {isCustomInputOpen ? (
              <form 
                onSubmit={handleCustomChoreSubmit}
                className="col-span-2 flex items-center space-x-2 p-3 bg-white border-2 border-primary/20 rounded-2xl shadow-md animate-in zoom-in-95 duration-200"
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="What was the chore?"
                  value={customChoreName}
                  onChange={(e) => setCustomChoreName(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-gray-800 placeholder:text-gray-300"
                />
                <button 
                  type="button"
                  onClick={() => setIsCustomInputOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!customChoreName.trim() || adding}
                  className="p-3 bg-[#ff00ff] text-white rounded-2xl shadow-[0_0_15px_rgba(255,0,255,0.4)] disabled:opacity-50 transition-all active:scale-90"
                >
                  <Check className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCustomInputOpen(true)}
                disabled={adding}
                className="flex items-center justify-between p-4 bg-gray-50 border border-dashed border-gray-300 rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50 group hover:bg-white hover:border-primary/40"
              >
                <span className="font-bold text-gray-500 text-sm group-hover:text-primary transition-colors">Custom...</span>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 ml-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-gray-400">
                  <Plus className="w-5 h-5" />
                </div>
              </button>
            )}
          </div>

          {/* Naughty button — only for children */}
          {selectedMember.role === 'child' && (
            <div className="mt-4">
              <button
                onClick={subtractPoint}
                disabled={adding || (selectedMember.points || 0) <= 0}
                className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 border-2 border-red-200 rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-40 hover:bg-red-100 hover:border-red-300"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                  <Minus className="w-5 h-5" />
                </div>
                <span className="font-black text-red-500 text-sm uppercase tracking-wider">😈 Naughty (-1 pt)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {choreLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Chores</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {choreLogs.map((log, i) => {
              const member = localMembers.find(m => m.id === log.assignee);
              return (
                <div key={log.id} className={`p-3 flex items-center justify-between ${i !== choreLogs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0 shadow-sm" 
                      style={{ backgroundColor: member ? getMemberColor(member, localMembers.indexOf(member)) : '#ccc' }}
                    >
                      {member?.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member?.name?.charAt(0) || '?'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{log.title}</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] font-bold text-gray-500">{member?.name}</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <p className="text-[10px] text-gray-400">{new Date(log.completed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-black ${log.points < 0 ? 'text-red-500' : 'text-green-500'}`}>{log.points < 0 ? log.points : `+${log.points}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
