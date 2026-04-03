import { TabNav } from "@/components/TabNav";
import { GlobalGoalBar } from "@/components/GlobalGoalBar";

export default function KidViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-x-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-pink-200/50 rounded-full blur-3xl pointer-events-none" />

      <header className="px-6 pt-10 pb-4 flex justify-between items-center relative z-20">
        <h1 className="text-4xl font-black text-indigo-600 tracking-tighter shrink-0 drop-shadow-sm flex items-center space-x-2">
          <span>Casita</span>
        </h1>
      </header>

      <div className="px-4 mb-8 relative z-10">
        <GlobalGoalBar />
      </div>
      
      <main className="max-w-md mx-auto px-4 relative z-10">
        {children}
      </main>
      <TabNav />
    </div>
  );
}
