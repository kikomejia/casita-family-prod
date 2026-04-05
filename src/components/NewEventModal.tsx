"use client";
import { useState, useEffect } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/lib/base44Client";
import { format, setHours, setMinutes } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "@/context/UIContext";

const DEFAULT_EVENT_TYPES = ["Karate", "School of Rock, Band", "School of Rock, Piano", "Playdate", "Birthday Party", "Mathnasium", "Doctor Appointment"];

const DURATIONS = [
  { label: "30m", value: 30 },
  { label: "45m", value: 45 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
  { label: "2h", value: 120 }
];

export function NewEventModal({ isOpen, onClose, onSave, onDelete, event, members, selectedDate }: any) {
  const { setIsModalOpen } = useUI();

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen, setIsModalOpen]);

  const [eventType, setEventType] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [time, setTime] = useState("15:00");
  const [duration, setDuration] = useState(60);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [eventTypes, setEventTypes] = useState(DEFAULT_EVENT_TYPES);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await base44.entities.Settings.list();
      if (settings.length > 0 && settings[0].event_types) {
        setEventTypes(settings[0].event_types);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
      setIsDeleting(false);
      if (event) {
      const isCustom = !eventTypes.includes(event.event_type) && event.event_type !== "Other";
      setEventType(isCustom ? "Custom" : (event.event_type || "Other"));
      setCustomTitle(event.custom_title || (isCustom ? event.event_type : ""));
      
      const d = new Date(event.start_time);
      setTime(format(d, "HH:mm"));
      setDuration(event.duration_minutes || 60);
      
      // Handle legacy string assignee or new array format
      const initialAssignees = Array.isArray(event.assignees) 
        ? event.assignees 
        : (event.assignee ? [event.assignee] : []);
      setAssignees(initialAssignees);
      setNotes(event.notes || "");
      setRepeatWeekly(event.repeat_weekly || false);
    } else {
      setEventType(eventTypes[0]);
      setCustomTitle("");
      setTime("15:00");
      setDuration(60);
      setAssignees([]);
      setNotes("");
      setRepeatWeekly(false);
    }
    }
  }, [event, isOpen, eventTypes]);

  const toggleAssignee = (name: string) => {
    setAssignees(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name) 
        : [...prev, name]
    );
  };

  const setWholeFamily = () => {
    const allNames = members.map((m: any) => m.name);
    if (assignees.length === allNames.length) {
      setAssignees([]);
    } else {
      setAssignees(allNames);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const title = eventType === "Custom" || eventType === "Other" ? customTitle : eventType;
      
      const [hours, mins] = time.split(':').map(Number);
      let startDateTime = new Date(selectedDate || new Date());
      startDateTime = setHours(startDateTime, hours);
      startDateTime = setMinutes(startDateTime, mins);
      startDateTime.setSeconds(0, 0);

      // Use the first assignee's color as the primary event color, or default
      const firstMember = members.find((m: any) => m.name === assignees[0]);

      await onSave({
        title: title || "Untitled Event",
        event_type: eventType === "Custom" ? "Other" : eventType,
        custom_title: customTitle,
        start_time: startDateTime.toISOString(),
        duration_minutes: Number(duration),
        assignees: assignees,
        // Keep legacy assignee field for backward compatibility if needed, but primary is now assignees
        assignee: assignees.length === 1 ? assignees[0] : (assignees.length > 1 ? "Multiple" : ""),
        color: firstMember?.color || "#ccc",
        notes,
        repeat_weekly: repeatWeekly,
        series_id: repeatWeekly ? (event?.series_id || crypto.randomUUID()) : null
      });
    } catch (error) {
      console.error("Failed to save event:", error);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      await onDelete(event.id);
    } catch (error) {
      console.error("Failed to delete event:", error);
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 pb-safe">
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-black text-gray-900">{event ? "Edit Event" : "New Event"}</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8">
              {/* EVENT TYPE */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Event Type</label>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.filter(t => t !== "Other").map(t => (
                    <motion.button
                      key={t}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEventType(t)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
                        eventType === t 
                          ? 'bg-[#e81cff] text-white border-[#e81cff]' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {t}
                    </motion.button>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEventType("Custom")}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border border-dashed ${
                      eventType === "Custom" || eventType === "Other"
                        ? 'bg-[#e81cff] text-white border-[#e81cff]' 
                        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Custom...
                  </motion.button>
                </div>
                
                {(eventType === "Custom" || eventType === "Other") && (
                  <div className="mt-4">
                    <input 
                      type="text" 
                      value={customTitle} 
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Custom event name"
                      className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* TIME */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Time</label>
                <input 
                  type="time" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-4 bg-gray-100 border-none rounded-2xl font-black text-xl text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* DURATION */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map(d => (
                    <motion.button
                      key={d.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDuration(d.value)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
                        duration === d.value 
                          ? 'bg-[#e81cff] text-white border-[#e81cff]' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {d.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* WHO */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Who</label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m: any) => (
                    <motion.button
                      key={m.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleAssignee(m.name)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
                        assignees.includes(m.name) 
                          ? 'bg-[#e81cff] text-white border-[#e81cff]' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {m.name}
                    </motion.button>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={setWholeFamily}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
                      assignees.length === members.length && members.length > 0
                        ? 'bg-[#e81cff] text-white border-[#e81cff]' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Whole Family
                  </motion.button>
                </div>
              </div>

              {/* NOTES */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notes (optional)</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 resize-none"
                />
              </div>

              {/* REPEAT WEEKLY */}
              <motion.div 
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl cursor-pointer" 
                onClick={() => setRepeatWeekly(!repeatWeekly)}
              >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${repeatWeekly ? 'bg-[#e81cff] border-[#e81cff]' : 'border-gray-300 bg-white'}`}>
                  {repeatWeekly && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="font-bold text-gray-700">Repeat Weekly</span>
              </motion.div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-3 pb-safe-offset-4">
              {event && (
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                </motion.button>
              )}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving || isDeleting}
                className="flex-1 p-4 bg-[#ff00ff] text-white font-black text-lg rounded-2xl shadow-[0_8px_20px_-4px_rgba(255,0,255,0.4)] hover:shadow-[0_12px_25px_-5px_rgba(255,0,255,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  event ? "Save Event" : "Create Event"
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
