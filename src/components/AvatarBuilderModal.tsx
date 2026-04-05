"use client";
import { useState, useEffect } from "react";
import { X, Upload, RefreshCw, Save } from "lucide-react";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { cn } from "../lib/utils";

const SKIN_COLORS = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c'];
const HAIR_COLORS = ['a55728', '2c1b18', 'b58143', 'd6b370', '724133', '4a312c', 'f59797', 'ecdcbf', 'c93305', 'e8e1e1'];

const TOPS = [
  'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'froBand', 
  'longButNotTooLong', 'miaWallace', 'shavedSides', 'straight02', 'straight01', 
  'straightAndStrand', 'dreads01', 'dreads02', 'frizzle', 'shaggy', 'shaggyMullet', 
  'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'sides', 'theCaesar', 
  'theCaesarAndSidePart', 'bigHair', 'hat', 'hijab', 'turban', 'winterHat1', 
  'winterHat02', 'winterHat03', 'winterHat04'
];

const KID_TOPS = [
  'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'frizzle', 
  'bob', 'curly', 'straight01', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04'
];

const CLOTHING = ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'];
const KID_CLOTHING = ['hoodie', 'overall', 'shirtCrewNeck', 'graphicShirt'];
const MOUTHS = ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'];
const EYES = ['closed', 'cry', 'default', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'winkWacky', 'wink', 'xDizzy'];
const EYEBROWS = ['angry', 'angryNatural', 'default', 'defaultNatural', 'flatNatural', 'frownNatural', 'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural'];
const BACKGROUNDS = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"];


export function AvatarBuilderModal({ isOpen, onClose, onSave, onUploadClick, initialName, initialRole, initialConfig }: any) {
  const [isKid, setIsKid] = useState(initialRole === 'kid');
  const [skinColor, setSkinColor] = useState(SKIN_COLORS[2]);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [top, setTop] = useState(TOPS[0]);
  const [clothing, setClothing] = useState(CLOTHING[0]);
  const [mouth, setMouth] = useState(MOUTHS[0]);
  const [eyes, setEyes] = useState(EYES[0]);
  const [eyebrows, setEyebrows] = useState(EYEBROWS[2]); // default
  const [bgColor, setBgColor] = useState(BACKGROUNDS[0]);

  const currentTops = isKid ? KID_TOPS : TOPS;
  const currentClothing = isKid ? KID_CLOTHING : CLOTHING;

  const randomize = (kidMode: boolean) => {
    setSkinColor(SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)]);
    setHairColor(HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)]);
    const tops = kidMode ? KID_TOPS : TOPS;
    const clothes = kidMode ? KID_CLOTHING : CLOTHING;
    setTop(tops[Math.floor(Math.random() * tops.length)]);
    setClothing(clothes[Math.floor(Math.random() * clothes.length)]);
    setMouth(kidMode ? 'smile' : MOUTHS[Math.floor(Math.random() * MOUTHS.length)]);
    setEyes(kidMode ? 'happy' : EYES[Math.floor(Math.random() * EYES.length)]);
    setEyebrows(kidMode ? 'default' : EYEBROWS[Math.floor(Math.random() * EYEBROWS.length)]);
    setBgColor(BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]);
  };

  const handleKidToggle = (kid: boolean) => {
    setIsKid(kid);
    const newTops = kid ? KID_TOPS : TOPS;
    const newClothing = kid ? KID_CLOTHING : CLOTHING;
    if (!newTops.includes(top)) setTop(newTops[0]);
    if (!newClothing.includes(clothing)) setClothing(newClothing[0]);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        try {
          const config = JSON.parse(initialConfig);
          setSkinColor(config.skinColor || SKIN_COLORS[2]);
          setHairColor(config.hairColor || HAIR_COLORS[0]);
          setTop(config.top || TOPS[0]);
          setClothing(config.clothing || CLOTHING[0]);
          setMouth(config.mouth || MOUTHS[0]);
          setEyes(config.eyes || EYES[0]);
          setEyebrows(config.eyebrows || EYEBROWS[2]);
          setBgColor(config.bgColor || BACKGROUNDS[0]);
          setIsKid(config.isKid ?? (initialRole === 'kid'));
        } catch (e) {
          const kidMode = initialRole === 'kid';
          setIsKid(kidMode);
          randomize(kidMode);
        }
      } else {
        const kidMode = initialRole === 'kid';
        setIsKid(kidMode);
        randomize(kidMode);
      }
    }
  }, [isOpen, initialRole, initialConfig]);

  if (!isOpen) return null;

  const currentAvatar = createAvatar(avataaars, {
    seed: initialName || "Custom",
    skinColor: [skinColor as any],
    hairColor: [hairColor as any],
    top: [top as any],
    clothing: [clothing as any],
    mouth: [mouth as any],
    eyes: [eyes as any],
    eyebrows: [eyebrows as any],
    backgroundColor: [bgColor as any],
  });

  const svgString = currentAvatar.toString();
  // Use base64 encoding to avoid issues with special characters in data URLs
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

  const handleSave = () => {
    onSave(dataUrl, {
      skinColor,
      hairColor,
      top,
      clothing,
      mouth,
      eyes,
      eyebrows,
      bgColor,
      isKid
    });
  };

  const handleUploadClick = () => {
    onUploadClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 pb-safe">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">Choose Avatar</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg mb-4">
              <img src={dataUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => randomize(isKid)} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-full hover:bg-gray-200 transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" /> Randomize
              </button>
              <button onClick={handleUploadClick} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-full hover:bg-gray-200 transition-colors">
                <Upload className="w-4 h-4 mr-2" /> Upload Photo
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Role Toggle */}
            <div className="flex items-center justify-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
              <button
                onClick={() => handleKidToggle(false)}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all",
                  !isKid ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Adult
              </button>
              <button
                onClick={() => handleKidToggle(true)}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all",
                  isKid ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Kid
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skin Tone</label>
              <div className="flex space-x-2">
                {SKIN_COLORS.map(color => (
                  <button 
                    key={color}
                    onClick={() => setSkinColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${skinColor === color ? 'border-[#ff00ff] scale-110 shadow-[0_0_8px_rgba(255,0,255,0.3)]' : 'border-transparent'}`}
                    style={{ backgroundColor: `#${color}` }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hair Color</label>
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map(color => (
                  <button 
                    key={color}
                    onClick={() => setHairColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${hairColor === color ? 'border-[#ff00ff] scale-110 shadow-[0_0_8px_rgba(255,0,255,0.3)]' : 'border-transparent'}`}
                    style={{ backgroundColor: `#${color}` }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hair / Head</label>
                <select value={top} onChange={e => setTop(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 capitalize">
                  {currentTops.map(t => <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Clothing</label>
                <select value={clothing} onChange={e => setClothing(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 capitalize">
                  {currentClothing.map(c => <option key={c} value={c}>{c.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Eyes</label>
                <select value={eyes} onChange={e => setEyes(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 capitalize">
                  {EYES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mouth</label>
                <select value={mouth} onChange={e => setMouth(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 capitalize">
                  {MOUTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Eyebrows</label>
                <select value={eyebrows} onChange={e => setEyebrows(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 capitalize">
                  {EYEBROWS.map(e => <option key={e} value={e}>{e.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={handleSave}
            className="w-full p-4 bg-[#ff00ff] text-white font-black text-lg uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:shadow-[0_0_30px_rgba(255,0,255,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center animate-pulse"
          >
            <Save className="w-5 h-5 mr-3" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
