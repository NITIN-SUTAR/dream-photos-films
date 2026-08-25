import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoItem } from '../types';
import { PORTFOLIO_PHOTOS } from '../data/portfolioData';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  MapPin,
  Layers,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { playClickSound, playCameraShutterSound } from '../utils/audio';

interface LightboxModalProps {
  photo: PhotoItem | null;
  onClose: () => void;
  onSelectRetouch: (photo: PhotoItem) => void;
  onOpenBooking: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photo,
  onClose,
  onSelectRetouch,
  onOpenBooking
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!photo) return null;

  const currentIndex = PORTFOLIO_PHOTOS.findIndex((p) => p.id === photo.id);
  const nextPhoto = PORTFOLIO_PHOTOS[(currentIndex + 1) % PORTFOLIO_PHOTOS.length];
  const prevPhoto = PORTFOLIO_PHOTOS[(currentIndex - 1 + PORTFOLIO_PHOTOS.length) % PORTFOLIO_PHOTOS.length];

  const handleCopyHex = (hex: string) => {
    playClickSound(900);
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#06070a]/90 backdrop-blur-xl"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-6xl rounded-3xl glass-card border border-white/20 bg-[#0c0f18]/90 overflow-hidden shadow-2xl shadow-black/80 my-auto"
        >
          {/* Header Bar */}
          <div className="p-4 sm:px-6 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Camera className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  {photo.title}
                </h3>
                <span className="font-mono text-xs text-slate-400">
                  {photo.categoryLabel} • {photo.exif.location}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isZoomed ? "Reset Zoom" : "Zoom Image"}
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  playClickSound(500);
                  onClose();
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Grid Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[80vh] overflow-y-auto">
            
            {/* Left Image Viewport */}
            <div className="lg:col-span-7 relative bg-black/80 p-4 flex items-center justify-center min-h-[350px] lg:min-h-[500px]">
              <div className={`relative overflow-hidden transition-all duration-300 ${isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'}`} onClick={() => setIsZoomed(!isZoomed)}>
                <img
                  src={photo.image}
                  alt={photo.title}
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl"
                />
              </div>

              {/* Prev / Next Floating Navigation Buttons */}
              <button
                onClick={() => {
                  playCameraShutterSound();
                  const prevBtn = PORTFOLIO_PHOTOS.find(p => p.id === prevPhoto.id);
                  if (prevBtn) onSelectRetouch ? onSelectRetouch(prevBtn) : null;
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-cyan-500/20 text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer"
                title={`Previous: ${prevPhoto.title}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  playCameraShutterSound();
                  const nextBtn = PORTFOLIO_PHOTOS.find(p => p.id === nextPhoto.id);
                  if (nextBtn) onSelectRetouch ? onSelectRetouch(nextBtn) : null;
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-cyan-500/20 text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer"
                title={`Next: ${nextPhoto.title}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right Information & EXIF Details Drawer */}
            <div className="lg:col-span-5 p-6 space-y-6 bg-[#0c0f18]/60 border-l border-white/10">
              
              {/* Story & Philosophy */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Behind The Lens
                </span>
                <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed">
                  {photo.story}
                </p>
              </div>

              {/* EXIF Technical Breakdown Table */}
              <div className="space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400 block border-b border-white/10 pb-1">
                  Technical EXIF Data
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-500 text-[10px] block">CAMERA</span>
                    <span className="text-white font-medium">{photo.exif.camera}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-500 text-[10px] block">LENS</span>
                    <span className="text-white font-medium">{photo.exif.lens}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-500 text-[10px] block">APERTURE / ISO</span>
                    <span className="text-cyan-300 font-medium">{photo.exif.aperture} • {photo.exif.iso}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-500 text-[10px] block">SHUTTER</span>
                    <span className="text-cyan-300 font-medium">{photo.exif.shutterSpeed}</span>
                  </div>

                  <div className="col-span-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-500 text-[10px] block flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      LIGHTING SETUP
                    </span>
                    <span className="text-slate-200">{photo.exif.lighting}</span>
                  </div>

                  <div className="col-span-2 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px] block flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        LOCATION & COORDINATES
                      </span>
                      <span className="text-slate-200">{photo.exif.location}</span>
                    </div>
                    {photo.exif.coordinates && (
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        {photo.exif.coordinates}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Color Palette Extraction Tool */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                    Extracted Color Palette
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Click code to copy</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {photo.colorPalette.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => handleCopyHex(hex)}
                      className="group flex flex-col items-center gap-1.5 p-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer"
                    >
                      <div
                        className="w-full aspect-square rounded-lg shadow-inner group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="font-mono text-[9px] text-slate-300 group-hover:text-cyan-300">
                        {copiedHex === hex ? 'COPIED!' : hex}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                {photo.rawImage && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectRetouch(photo);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    Compare RAW vs Edit
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onOpenBooking();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Book Similar Shoot
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
