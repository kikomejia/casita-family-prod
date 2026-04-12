"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Sparkles, Wand2, UploadCloud, RefreshCw } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { compressImage } from "@/lib/imageUtils";

interface AIAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (dataUrl: string, config: { style: string; aiGenerated: boolean }) => void;
  memberName: string;
}

const STYLES = [
  { id: "disney", label: "Disney", emoji: "🧚‍♀️" },
  { id: "pixar", label: "Pixar", emoji: "🏰" },
  { id: "anime", label: "Anime", emoji: "🌸" },
  { id: "mario", label: "Mario Bros", emoji: "🍄" },
];

export function AIAvatarModal({ isOpen, onClose, onGenerate, memberName }: AIAvatarModalProps) {
  const { setIsModalOpen } = useUI();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selfie, setSelfie] = useState<string | null>(null);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("pixar");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsModalOpen(isOpen);
    if (isOpen) {
      setSelfie(null);
      setGeneratedAvatar(null);
      setError(null);
      setIsGenerating(false);
    }
  }, [isOpen, setIsModalOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress to ensure it's not too large for API
      const compressedBase64 = await compressImage(file, 512);
      setSelfie(compressedBase64);
      setGeneratedAvatar(null);
      setError(null);
    } catch (err) {
      setError("Failed to process image.");
    }
  };

  const handleGenerate = async () => {
    if (!selfie) {
      setError("Please upload a selfie first.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: selfie, style: selectedStyle, name: memberName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate avatar");
      }

      setGeneratedAvatar(data.avatarUrl);
      onGenerate(data.avatarUrl, { style: selectedStyle, aiGenerated: true });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred during generation.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 text-purple-500 mr-2" />
              AI Magic
            </h2>
            <p className="text-sm font-bold text-gray-500">For {memberName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto nice-scrollbar space-y-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          {/* Step 1: Upload Selfie */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Step 1: Your Selfie</h3>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />

            {selfie ? (
              <div className="relative w-full aspect-square bg-gray-100 rounded-3xl overflow-hidden border-4 border-white shadow-md group">
                <img src={generatedAvatar || selfie} alt={generatedAvatar ? "Generated Avatar" : "Selfie"} className="w-full h-full object-cover" />
                {!generatedAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/90 backdrop-blur text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center"
                    >
                      <Camera className="w-4 h-4 mr-2" /> Retake
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center transition-colors group"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform text-primary">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <span className="font-bold text-gray-600">Tap to upload selfie</span>
                <span className="text-xs text-gray-400 mt-1 font-medium">Clear face, good lighting</span>
              </button>
            )}
          </div>

          {/* Step 2: Choose Style */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Step 2: Choose Style</h3>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center font-bold transition-all ${
                    selectedStyle === style.id
                      ? "bg-purple-50 border-2 border-purple-500 text-purple-700 shadow-sm"
                      : "bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-2xl mb-1">{style.emoji}</span>
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          {generatedAvatar ? (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center transition-all bg-green-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Done! 🎉
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selfie}
              className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center transition-all ${
                isGenerating || !selfie
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  ✨ Create Avatar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
