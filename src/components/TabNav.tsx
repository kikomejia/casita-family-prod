"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, CheckSquare, Gift, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { PinModal } from "./PinModal";
import { motion } from "framer-motion";

export function TabNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);

  const tabs = [
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "Chores", path: "/chores", icon: CheckSquare },
    { name: "Rewards", path: "/rewards", icon: Gift },
  ];

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-40">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
          className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[2rem] px-6 py-2.5 flex justify-around items-center"
        >
          {tabs.map((tab) => {
            const isActive = pathname === tab.path || (pathname === "/" && tab.path === "/calendar");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={cn(
                  "relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 px-4",
                  isActive ? "text-indigo-600 scale-110" : "text-gray-400 hover:text-indigo-400"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-indigo-50/80 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className={cn(
                  "p-2 rounded-full transition-all duration-300",
                )}>
                  <Icon className={cn("w-6 h-6", isActive && "fill-indigo-100")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                )}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setShowPin(true)}
            className="flex flex-col items-center justify-center space-y-1 transition-all duration-300 px-4 text-gray-400 hover:text-indigo-400"
          >
            <div className="p-2 rounded-full transition-all duration-300">
              <Settings className="w-6 h-6" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 h-0 overflow-hidden">
              Parents
            </span>
          </button>
        </motion.div>
      </div>
      <PinModal 
        isOpen={showPin} 
        onClose={() => setShowPin(false)} 
        onSuccess={() => {
          setShowPin(false);
          router.push("/dashboard");
        }} 
      />
    </>
  );
}
