"use client";
import { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { NewEventModal } from "./NewEventModal";
import { Plus, Calendar as CalendarIcon, CalendarPlus, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { startOfWeek, addDays, format, isSameDay, parseISO, subWeeks, addWeeks } from "date-fns";
import { auth } from "@/lib/firebase";

export function CalendarTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubEvents = base44.entities.CalendarEvent.subscribe((evts) => {
      setEvents(evts);
    }, "-start_time");

    const unsubMembers = base44.entities.FamilyMember.subscribe((mems) => {
      const order = ["Maya", "Luna", "Gabriela", "Francisco"];
      const sorted = [...mems].sort((a, b) => {
        const indexA = order.indexOf(a.name);
        const indexB = order.indexOf(b.name);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
      setMembers(sorted);
    });

    return () => {
      unsubEvents();
      unsubMembers();
    };
  }, []);

  const handleSave = async (eventData: any) => {
    if (editingEvent) {
      await base44.entities.CalendarEvent.update(editingEvent.id, eventData);
      
      // If it's an edit and they just turned on repeat_weekly for a non-series event
      if (eventData.repeat_weekly && !editingEvent.series_id && eventData.series_id) {
        const eventsToCreate = [];
        const baseDate = new Date(eventData.start_time);
        for (let i = 1; i < 26; i++) {
          const nextDate = addWeeks(baseDate, i);
          eventsToCreate.push({
            ...eventData,
            start_time: nextDate.toISOString()
          });
        }
        if (eventsToCreate.length > 0) {
          await base44.entities.CalendarEvent.createMany(eventsToCreate);
        }
      }
    } else {
      if (eventData.repeat_weekly && eventData.series_id) {
        // Create 26 weeks of events (half a year)
        const eventsToCreate = [];
        const baseDate = new Date(eventData.start_time);
        for (let i = 0; i < 26; i++) {
          const nextDate = addWeeks(baseDate, i);
          eventsToCreate.push({
            ...eventData,
            start_time: nextDate.toISOString()
          });
        }
        if (eventsToCreate.length > 0) {
          await base44.entities.CalendarEvent.createMany(eventsToCreate);
        }
      } else {
        await base44.entities.CalendarEvent.create(eventData);
      }
    }
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleDelete = async (id: string, deleteAll: boolean = false) => {
    const event = events.find(e => e.id === id);
    if (deleteAll && event?.series_id) {
      const seriesEvents = events.filter(e => e.series_id === event.series_id);
      if (seriesEvents.length > 0) {
        await base44.entities.CalendarEvent.deleteMany(seriesEvents.map(e => e.id));
      }
    } else {
      await base44.entities.CalendarEvent.delete(id);
    }
    setShowModal(false);
    setShowDeleteConfirm(false);
    setEditingEvent(null);
    setEventToDelete(null);
  };

  const confirmDelete = (id: string) => {
    const event = events.find(e => e.id === id);
    if (event?.series_id) {
      setEventToDelete(event);
      setShowDeleteConfirm(true);
    } else {
      handleDelete(id);
    }
  };

  const openNewModal = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const addToCalendar = (event: any) => {
    const start = new Date(event.start_time);
    const end = new Date(start.getTime() + (event.duration_minutes || 60) * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:${event.title}`, `DESCRIPTION:${event.notes || ''}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  
  const selectedDayEvents = events.filter(e => isSameDay(parseISO(e.start_time), selectedDay))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="p-4 space-y-6 pb-24">
      <button 
        onClick={openNewModal}
        className="fixed bottom-28 right-6 w-14 h-14 bg-[#ff00ff] text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:bg-[#ff00ff]/90 transition-all active:scale-95 z-30"
      >
        <Plus className="w-8 h-8" />
      </button>

      <div className="w-full py-2">
        <div className="flex items-center justify-between mb-6 px-2">
          <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="p-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 font-bold" />
          </button>
          <h2 className="text-lg font-black text-[#0f172a] tracking-tight">
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </h2>
          <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6 font-bold" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, new Date());
            const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), day));
            const dotCount = Math.min(dayEvents.length, 3);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center p-1 py-4 rounded-[20px] transition-all ${
                  isSelected 
                    ? 'bg-[#ff00ff] text-white shadow-[0_8px_20px_-4px_rgba(255,0,255,0.4)] scale-105' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                  {format(day, "EEE").charAt(0)}
                </span>
                <span className={`text-lg font-black mt-1 mb-1 ${isToday && !isSelected ? 'text-[#ff00ff]' : ''}`}>
                  {format(day, "d")}
                </span>
                <div className="flex space-x-0.5 h-1.5 items-center justify-center">
                  {Array.from({ length: dotCount }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#00ff00]'}`} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          {isSameDay(selectedDay, new Date()) ? "Today's Events" : format(selectedDay, "EEEE, MMM d")}
        </h2>
        
        {selectedDayEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100 border-dashed">
            <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-400">No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayEvents.map(event => (
              <div 
                key={event.id} 
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col"
                style={{ borderLeftWidth: '4px', borderLeftColor: event.color || '#ccc' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 cursor-pointer" onClick={() => openEditModal(event)}>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-gray-900">{event.title}</h3>
                      {event.series_id && (
                        <RefreshCw className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-500">
                      {format(parseISO(event.start_time), "h:mm a")} • {event.duration_minutes} min
                    </p>
                  </div>
                  <button 
                    onClick={() => addToCalendar(event)}
                    className="p-2 text-gray-400 hover:text-primary bg-gray-50 rounded-full transition-colors ml-2"
                    title="Add to Calendar"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </button>
                </div>
                
                {(event.assignees || event.assignee) && (() => {
                  const assigneeList = Array.isArray(event.assignees) 
                    ? event.assignees 
                    : (event.assignee ? [event.assignee] : []);
                  
                  if (assigneeList.length === 0) return null;

                  return (
                    <div className="flex items-center mt-2 -space-x-2 overflow-hidden">
                      {assigneeList.map((name: string, idx: number) => {
                        const member = members.find(m => m.name === name);
                        return (
                          <div 
                            key={name}
                            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold overflow-hidden shrink-0 shadow-sm" 
                            style={{ backgroundColor: member?.color || event.color || '#ccc', zIndex: 10 - idx }}
                            title={name}
                          >
                            {member?.avatar_url ? (
                              <img src={member.avatar_url} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              name.charAt(0)
                            )}
                          </div>
                        );
                      })}
                      <span className="text-[10px] font-bold text-gray-500 ml-3">
                        {assigneeList.length > 2 
                          ? `${assigneeList[0]}, ${assigneeList[1]} +${assigneeList.length - 2}`
                          : assigneeList.join(", ")}
                      </span>
                    </div>
                  );
                })()}
                
                {event.notes && (
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">{event.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <NewEventModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleSave}
        onDelete={confirmDelete}
        event={editingEvent}
        members={members}
        selectedDate={selectedDay}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete Event</h3>
              <p className="text-sm font-bold text-gray-500">This is a repeating event. What would you like to delete?</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => handleDelete(eventToDelete.id, false)}
                className="w-full p-4 bg-gray-100 text-gray-900 font-black rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Just this one
              </button>
              <button 
                onClick={() => handleDelete(eventToDelete.id, true)}
                className="w-full p-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
              >
                All instances
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full p-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
