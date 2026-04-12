"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TabNav } from "@/components/TabNav";
import { GlobalGoalBar } from "@/components/GlobalGoalBar";
import { useUI } from "@/context/UIContext";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import { PinModal } from "@/components/PinModal";

export default function KidViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isModalOpen } = useUI();
  const [showPin, setShowPin] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-x-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-pink-200/50 rounded-full blur-3xl pointer-events-none" />

      <header className={cn(
        "px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-4 flex justify-between items-center relative z-20 transition-all duration-300",
        isModalOpen ? "opacity-0 pointer-events-none -translate-y-10" : "opacity-100"
      )}>
        <h1 className="text-4xl font-black text-primary tracking-tighter shrink-0 drop-shadow-[0_0_8px_rgba(255,0,127,0.3)] flex items-center space-x-2">
          <span>Casita</span>
        </h1>
        <button 
          onClick={() => setShowPin(true)}
          className="p-2 text-primary hover:scale-110 active:scale-95 transition-all drop-shadow-[0_0_8px_rgba(255,0,127,0.3)]"
        >
          <Settings className="w-8 h-8" />
        </button>
      </header>

      <div className={cn(
        "px-4 mb-8 relative z-10 transition-all duration-300",
        isModalOpen ? "opacity-0 pointer-events-none scale-95" : "opacity-100"
      )}>
        <GlobalGoalBar />
      </div>
      
      <main className="max-w-md mx-auto px-4 relative z-10 transition-all duration-500">
        {children}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <TabNav />
      </div>

      <PinModal 
        isOpen={showPin} 
        onClose={() => setShowPin(false)} 
        onSuccess={() => {
          setShowPin(false);
          router.push("/dashboard");
        }} 
      />
    </div>
  );
}
