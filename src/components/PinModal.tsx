"use client";
import { useState, useEffect } from "react";
import { X, Delete } from "lucide-react";
import { base44 } from "@/lib/base44Client";
import { useUI } from "@/context/UIContext";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinModal({ isOpen, onClose, onSuccess }: PinModalProps) {
  const { setIsModalOpen } = useUI();

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen, setIsModalOpen]);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [savedPin, setSavedPin] = useState("1234");

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError(false);
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const settings = await base44.entities.Settings.list();
    if (settings.length > 0 && settings[0].pin) {
      setSavedPin(settings[0].pin);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === savedPin) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 500);
      }
    }
  }, [pin, onSuccess, savedPin]);

  if (!isOpen) return null;

  const handlePress = (num: string) => {
    if (pin.length < 4) setPin(p => p + num);
  };

  const handleBackspace = () => {
    setPin(p => p.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex justify-end px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800">
          <X className="w-8 h-8" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Enter Parent PIN</h2>
        <p className="text-sm text-gray-500 mb-8">Default is 1234</p>
        
        <div className="flex space-x-4 mb-12">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full ${pin.length > i ? 'bg-primary' : 'bg-gray-200'} ${error ? 'bg-red-500 animate-bounce' : ''}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 max-w-[280px] w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handlePress(num.toString())} className="w-20 h-20 rounded-full bg-gray-50 text-2xl font-black text-gray-800 flex items-center justify-center active:bg-[#ff00ff] active:text-white active:shadow-[0_0_20px_rgba(255,0,255,0.8)] transition-all">
              {num}
            </button>
          ))}
          <div />
          <button onClick={() => handlePress("0")} className="w-20 h-20 rounded-full bg-gray-50 text-2xl font-black text-gray-800 flex items-center justify-center active:bg-[#ff00ff] active:text-white active:shadow-[0_0_20px_rgba(255,0,255,0.8)] transition-all">
            0
          </button>
          <button onClick={handleBackspace} className="w-20 h-20 rounded-full flex items-center justify-center text-gray-400 active:text-[#ff00ff] active:drop-shadow-[0_0_8px_rgba(255,0,255,0.8)] transition-all">
            <Delete className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
}

