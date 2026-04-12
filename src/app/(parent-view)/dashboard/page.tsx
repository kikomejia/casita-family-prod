"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { base44 } from "@/lib/base44Client";
import { ArrowLeft, Plus, X, Save, Minus, Camera, Users, Target, ListTodo, Calendar, Gift, Lock, Sparkles } from "lucide-react";
import { compressImage } from "@/lib/imageUtils";
import { AvatarBuilderModal } from "@/components/AvatarBuilderModal";
import { AIAvatarModal } from "@/components/AIAvatarModal";
import { auth } from "@/lib/firebase";

const DEFAULT_CHORES = ["Make Bed", "Brush Teeth", "Clean Room", "Read 20 mins", "Help with Dinner"];
const DEFAULT_PRIZES = ["Extra Screen Time", "Ice Cream", "Choose Movie", "Stay Up Late", "New Toy", "Pizza Night", "Skip a Chore", "Small Treat"];
const DEFAULT_EVENT_TYPES = ["Karate", "Playdate", "Doctor", "School Event", "Family Outing", "Other"];

const TABS = [
  { id: "Profiles", label: "Profiles", icon: Users },
  { id: "Family Goal", label: "Goals", icon: Target },
  { id: "Chores", label: "Chores", icon: ListTodo },
  { id: "Events", label: "Events", icon: Calendar },
  { id: "Prizes", label: "Prizes", icon: Gift },
  { id: "PIN", label: "Security", icon: Lock },
];

const MAYA_DEFAULT_CHORES = ["Make up Bed", "Homework", "Comeu Tudo", "Arrumou a Mesa", "Favor", "Read 20 min"];
const LUNA_DEFAULT_CHORES = ["Comeu Tudo", "Brush Teeth", "Clean Up", "Arrumou a Mesa", "Favor"];

function ListEditor({ title, items, onSave }: { title: string, items: string[], onSave: (items: string[]) => void }) {
  const [list, setList] = useState(items);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    setList(items);
  }, [items]);

  const handleAdd = () => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      const updated = [...list, newItem.trim()];
      setList(updated);
      setNewItem("");
    }
  };

  const handleRemove = (item: string) => {
    const updated = list.filter(i => i !== item);
    setList(updated);
  };

  const handleSaveChanges = () => {
    onSave(list);
    alert("Changes saved!");
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
      <div className="space-y-2 mb-4">
        {list.map(item => (
          <div key={item} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
            <span className="text-sm font-bold text-gray-800">{item}</span>
            <button onClick={() => handleRemove(item)} className="text-red-400 hover:text-red-600 p-1"><X className="w-4 h-4"/></button>
          </div>
        ))}
      </div>
      <div className="flex space-x-2 mb-4">
        <input 
          value={newItem} 
          onChange={e => setNewItem(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold" 
          placeholder="Add new..." 
        />
        <button onClick={handleAdd} className="bg-primary text-white rounded-lg px-3 py-2"><Plus className="w-4 h-4" /></button>
      </div>
      <button onClick={handleSaveChanges} className="w-full py-2 bg-primary text-white font-bold rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(255,0,127,0.3)]">
        <Save className="w-4 h-4 mr-2" /> Save Changes
      </button>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [goal, setGoal] = useState<any>({ title: "", target_points: 50, current_points: 0, reward: "" });
  const [pin, setPin] = useState("1234");
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [chores, setChores] = useState<string[]>(DEFAULT_CHORES);
  const [prizes, setPrizes] = useState<string[]>(DEFAULT_PRIZES);
  const [eventTypes, setEventTypes] = useState<string[]>(DEFAULT_EVENT_TYPES);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAIAvatarModalOpen, setIsAIAvatarModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Profiles");

  useEffect(() => {
    let unsubMembers = () => {};
    let unsubGoals = () => {};
    let unsubSettings = () => {};

    const setupSubscriptions = () => {
      if (!auth.currentUser) return;
      
      unsubMembers = base44.entities.FamilyMember.subscribe((mems) => {
        const order = ["Maya", "Luna", "Gabriela", "Francisco"];
        const sorted = [...mems].sort((a, b) => {
          const indexA = order.indexOf(a.name);
          const indexB = order.indexOf(b.name);
          return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });
        setMembers(sorted);
        setLoading(false);
      });

      unsubGoals = base44.entities.FamilyGoal.subscribe((goals) => {
        const active = goals.find(g => g.is_active);
        if (active) setGoal(active);
      });

      unsubSettings = base44.entities.Settings.subscribeOne("family", (s) => {
        if (s) {
          setSettingsId(s.id);
          setChores(s.chores || DEFAULT_CHORES);
          setPrizes(s.prizes || DEFAULT_PRIZES);
          setEventTypes(s.event_types || DEFAULT_EVENT_TYPES);
          setPin(s.pin || "1234");
        }
      });
    };

    if (auth.currentUser) {
      setupSubscriptions();
    } else {
      const unsubAuth = auth.onAuthStateChanged((user) => {
        if (user) setupSubscriptions();
      });
      return () => {
        unsubAuth();
        unsubMembers();
        unsubGoals();
        unsubSettings();
      };
    }

    return () => {
      unsubMembers();
      unsubGoals();
      unsubSettings();
    };
  }, []);

  const updateSettings = async (updates: any) => {
    if (settingsId) {
      await base44.entities.Settings.update(settingsId, updates);
    }
  };

  const updateMemberPoints = async (id: string, delta: number) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    const newPoints = Math.max(0, member.points + delta);
    const newLifetimePoints = delta > 0 ? (member.lifetime_points || 0) + delta : (member.lifetime_points || 0);
    
    await base44.entities.FamilyMember.update(id, { points: newPoints, lifetime_points: newLifetimePoints });
    setMembers(members.map(m => m.id === id ? { ...m, points: newPoints, lifetime_points: newLifetimePoints } : m));

    // Also update family goal if it exists to keep them in sync
    if (goal && goal.id) {
      const newGoalPoints = Math.max(0, (goal.current_points || 0) + delta);
      await base44.entities.FamilyGoal.update(goal.id, { current_points: newGoalPoints });
      setGoal({ ...goal, current_points: newGoalPoints });
      window.dispatchEvent(new Event('casita_refresh_goal'));
    }
  };

  const updateMemberChores = async (id: string, chores: string[]) => {
    await base44.entities.FamilyMember.update(id, { chores });
    setMembers(members.map(m => m.id === id ? { ...m, chores } : m));
  };

  const deleteMember = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      await base44.entities.FamilyMember.delete(id);
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const handleGoalSave = async () => {
    try {
      if (goal.id) {
        const { id, created_date, updated_date, ...goalData } = goal;
        await base44.entities.FamilyGoal.update(id, goalData);
      } else {
        const newGoal = await base44.entities.FamilyGoal.create({ ...goal, is_active: true });
        setGoal(newGoal);
      }
      window.dispatchEvent(new Event('casita_refresh_goal'));
      alert("Goal saved!");
    } catch (error) {
      console.error("Failed to save goal:", error);
      alert("Failed to save goal. Please check your permissions.");
    }
  };

  const handlePinSave = () => {
    if (pin.length === 4 && /^\d+$/.test(pin)) {
      updateSettings({ pin });
      alert("PIN updated!");
    } else {
      alert("PIN must be exactly 4 digits.");
    }
  };

  const handleAvatarClick = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    setUploadingMemberId(memberId);
    setIsAvatarModalOpen(true);
  };

  const handleUploadClick = (memberId?: string) => {
    if (memberId) setUploadingMemberId(memberId);
    setIsAvatarModalOpen(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleSaveAvatar = async (dataUrl: string, config: any) => {
    if (!uploadingMemberId) return;
    try {
      const configStr = JSON.stringify(config);
      await base44.entities.FamilyMember.update(uploadingMemberId, { 
        avatar_url: dataUrl,
        avatar_config: configStr
      });
      setMembers(members.map(m => m.id === uploadingMemberId ? { 
        ...m, 
        avatar_url: dataUrl,
        avatar_config: configStr
      } : m));
    } catch (error) {
      console.error("Failed to save avatar", error);
      alert("Failed to save avatar");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingMemberId) return;

    try {
      const compressedBase64 = await compressImage(file, 200);
      await base44.entities.FamilyMember.update(uploadingMemberId, { avatar_url: compressedBase64 });
      setMembers(members.map(m => m.id === uploadingMemberId ? { ...m, avatar_url: compressedBase64 } : m));
    } catch (error) {
      console.error("Failed to upload avatar", error);
      alert("Failed to upload avatar");
    } finally {
      setUploadingMemberId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-white px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-gray-100 flex items-center sticky top-0 z-20">
        <button onClick={() => router.back()} className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-gray-900">Parent Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex space-x-2 overflow-x-auto nice-scrollbar sticky z-10" style={{ top: "calc(60px + env(safe-area-inset-top))" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl whitespace-nowrap font-bold text-sm transition-all flex-shrink-0 ${
                isActive ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            {/* Family Members */}
            {activeTab === "Profiles" && (
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Manage Points & Avatars</h2>
              <div className="space-y-4">
                {members.map(member => (
                  <div key={member.id} className="space-y-3 pb-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleAvatarClick(member.id)}
                          className="relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden group" 
                          style={{ backgroundColor: member.color || '#ccc' }}
                          title="Click to change avatar"
                        >
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.name.charAt(0)
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                        </button>
                        <div>
                          <p className="font-bold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{member.role} • {member.lifetime_points || 0} lifetime pts</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button onClick={() => updateMemberPoints(member.id, -1)} className="p-1 bg-white rounded shadow-sm text-red-500 hover:bg-red-50"><Minus className="w-4 h-4" /></button>
                        <span className="font-black w-6 text-center">{member.points}</span>
                        <button onClick={() => updateMemberPoints(member.id, 1)} className="p-1 bg-white rounded shadow-sm text-green-500 hover:bg-green-50"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => deleteMember(member.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors ml-2" title="Delete member">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Extra Avatar Options */}
                    <div className="flex space-x-2 pl-14 pt-1 overflow-x-auto nice-scrollbar">
                       <button onClick={() => handleAvatarClick(member.id)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap">Edit Style</button>
                       <button onClick={() => { setUploadingMemberId(member.id); setIsAIAvatarModalOpen(true); }} className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap flex items-center"><Sparkles className="w-3 h-3 mr-1" /> AI Magic</button>
                       <button onClick={() => handleUploadClick(member.id)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap">Upload</button>
                    </div>
                    {member.role === 'child' && (
                      <div className="pl-13 pb-2">
                        <ListEditor 
                          title={`${member.name}'s Chores`} 
                          items={member.chores || (member.name === 'Maya' ? MAYA_DEFAULT_CHORES : member.name === 'Luna' ? LUNA_DEFAULT_CHORES : [])} 
                          onSave={(items) => updateMemberChores(member.id, items)} 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* Family Goal */}
            {activeTab === "Family Goal" && (
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Active Family Goal</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Goal Title</label>
                  <input 
                    value={goal.title} 
                    onChange={e => setGoal({...goal, title: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg font-bold" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Current Pts</label>
                    <input 
                      type="number" 
                      value={goal.current_points} 
                      onChange={e => setGoal({...goal, current_points: Number(e.target.value)})}
                      className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Target Pts</label>
                    <input 
                      type="number" 
                      value={goal.target_points} 
                      onChange={e => setGoal({...goal, target_points: Number(e.target.value)})}
                      className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg font-bold" 
                    />
                  </div>
                </div>
                <button onClick={handleGoalSave} className="w-full py-2 bg-primary text-white font-bold rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(255,0,127,0.3)] transition-all active:scale-95">
                  <Save className="w-4 h-4 mr-2" /> Save Goal
                </button>
              </div>
            </section>
            )}

            {/* Lists (Chores) */}
            {activeTab === "Chores" && (
              <ListEditor 
                title="Global Default Chores" 
                items={chores} 
                onSave={(items) => { setChores(items); updateSettings({ chores: items }); }} 
              />
            )}

            {/* Lists (Prizes) */}
            {activeTab === "Prizes" && (
              <ListEditor 
                title="Roulette Prizes" 
                items={prizes} 
                onSave={(items) => { setPrizes(items); updateSettings({ prizes: items }); }} 
              />
            )}

            {/* Lists (Events) */}
            {activeTab === "Events" && (
              <ListEditor 
                title="Event Types" 
                items={eventTypes} 
                onSave={(items) => { setEventTypes(items); updateSettings({ event_types: items }); }} 
              />
            )}

            {/* PIN Settings */}
            {activeTab === "PIN" && (
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Security & Maintenance</h2>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Parent PIN (4 digits)</label>
                    <input 
                      type="text" 
                      maxLength={4}
                      value={pin} 
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg font-bold tracking-widest" 
                    />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handlePinSave} className="py-2 px-4 bg-primary text-white font-bold rounded-lg shadow-[0_0_10px_rgba(255,0,127,0.3)] transition-all active:scale-95">
                      Update
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-2">If you see duplicate family members, use this to clean them up.</p>
                  <button 
                    onClick={async () => {
                      if (window.confirm("This will remove duplicate family members with the same name. Continue?")) {
                        const seen = new Set();
                        const toDelete = [];
                        for (const m of members) {
                          if (seen.has(m.name)) {
                            toDelete.push(m.id);
                          } else {
                            seen.add(m.name);
                          }
                        }
                        if (toDelete.length > 0) {
                          await base44.entities.FamilyMember.deleteMany(toDelete);
                          alert(`Cleaned up ${toDelete.length} duplicates!`);
                        } else {
                          alert("No duplicates found.");
                        }
                      }
                    }}
                    className="w-full py-2 px-4 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    Cleanup Duplicates
                  </button>
                </div>
              </div>
            </section>
            )}

          </div>
        )}
      </div>

      <AvatarBuilderModal 
        isOpen={isAvatarModalOpen}
        onClose={() => {
          setIsAvatarModalOpen(false);
          setUploadingMemberId(null);
        }}
        onSave={async (dataUrl, config) => {
          await handleSaveAvatar(dataUrl, config);
          setIsAvatarModalOpen(false);
          setUploadingMemberId(null);
        }}
        onUploadClick={handleUploadClick}
        initialName={members.find(m => m.id === uploadingMemberId)?.name}
        initialRole={members.find(m => m.id === uploadingMemberId)?.role}
        initialConfig={members.find(m => m.id === uploadingMemberId)?.avatar_config}
      />

      <AIAvatarModal
        isOpen={isAIAvatarModalOpen}
        onClose={() => {
          setIsAIAvatarModalOpen(false);
          setUploadingMemberId(null);
        }}
        onGenerate={handleSaveAvatar}
        memberName={members.find(m => m.id === uploadingMemberId)?.name || ""}
      />
    </div>
  );
}
