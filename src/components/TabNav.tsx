"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CheckSquare, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUI } from "@/context/UIContext";

export function TabNav() {
  const pathname = usePathname();
  const { isModalOpen } = useUI();

  const tabs = [
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "Chores", path: "/chores", icon: CheckSquare },
    { name: "Rewards", path: "/rewards", icon: Gift },
  ];

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-40 px-2 transition-all duration-300 transform",
      isModalOpen ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
    )}>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className="relative group"
      >
        {/* Liquid Glass Background */}
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[32px] rounded-[2.5rem] border border-white/40 shadow-[0_8px_32_0_rgba(255,0,255,0.05),inset_0_0_80px_0_rgba(255,255,255,0.1)] overflow-hidden">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-50" />
          <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_50%)] pointer-events-none group-hover:animate-pulse" />
        </div>

        <div className="relative px-6 py-3 flex justify-around items-center">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path || (pathname === "/" && tab.path === "/calendar");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={cn(
                  "relative flex flex-col items-center justify-center space-y-1 transition-all duration-300 px-3",
                  isActive ? "text-[#ff00ff] scale-110 drop-shadow-[0_0_8px_rgba(255,0,255,0.3)]" : "text-gray-500 hover:text-gray-900"
                )}
              >
                {/* Removed active tab rounded background */}
                <div className={cn(
                  "p-1.5 rounded-full transition-all duration-300",
                )}>
                  <Icon className={cn("w-6 h-6", isActive && "fill-[#ff00ff]/20")} strokeWidth={isActive ? 3 : 2} />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-50"
                )}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
