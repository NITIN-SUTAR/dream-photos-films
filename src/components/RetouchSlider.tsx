import React, { useState, useRef, useEffect } from 'react';
import { PhotoItem } from '../types';
import { PORTFOLIO_PHOTOS } from '../data/portfolioData';
import { Layers, Sparkles, MoveHorizontal, RefreshCw } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface RetouchSliderProps {
  initialPhoto?: PhotoItem | null;
}

export const RetouchSlider: React.FC<RetouchSliderProps> = ({ initialPhoto }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem>(
    initialPhoto || PORTFOLIO_PHOTOS[0]
  );
  const [sliderPosition, setSliderPosition] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPhoto) {
      setSelectedPhoto(initialPhoto);
    }
  }, [initialPhoto]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const rawImage = selectedPhoto.rawImage || selectedPhoto.image;
  const retouchedImage = selectedPhoto.image;

  return (
    <section id="retouch" className="relative py-24 bg-[#090b12] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-purple-400 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Master Retouching & Color Grading
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white">
            RAW vs Master <span className="text-gradient-cyan">Edit Comparison</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            Drag the interactive slider below to reveal the transformative power of custom optical color grading, dynamic curve tone mapping, and micro skin retouching.
          </p>
        </div>

        {/* Photo Selector Switcher */}
        <div className="flex items-center justify-start gap-2 mb-10 overflow-x-auto pb-2 px-1 w-full">
          {PORTFOLIO_PHOTOS.map((p) => {
            const isSelected = p.id === selectedPhoto.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  playClickSound();
                  setSelectedPhoto(p);
                }}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30 border border-purple-400'
                    : 'glass-panel text-slate-400 hover:text-white'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </div>

        {/* Interactive Draggable Before / After Container */}
        <div className="max-w-5xl mx-auto glass-card rounded-3xl overflow-hidden border border-white/20 p-2 sm:p-4 shadow-2xl shadow-black/80">
          
          <div
            ref={containerRef}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleMove(e.clientX);
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden select-none cursor-ew-resize bg-black"
          >
            {/* After (Retouched Master) Image (Bottom Layer) */}
            <img
              src={retouchedImage}
              alt="Final Retouched Master"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Top Right Label: Final Master */}
            <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-cyan-950/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>FINAL COLOR GRADED</span>
            </div>

            {/* Before (Unedited RAW) Image (Clipped Top Layer) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={rawImage}
                alt="Unedited RAW Capture"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{
                  width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%'
                }}
              />

              {/* Top Left Label: Unedited RAW */}
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-slate-300 font-mono text-xs flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>UNEDITED RAW CAPTURE</span>
              </div>
            </div>

            {/* Vertical Draggable Divider Bar */}
            <div
              className="absolute inset-y-0 z-20 w-1 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-xl border-2 border-cyan-400 cursor-grab active:cursor-grabbing">
                <MoveHorizontal className="w-5 h-5 text-slate-900" />
              </div>
            </div>
          </div>

          {/* Bottom Retouching Specifications Bar */}
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-display text-sm font-bold text-white">
                {selectedPhoto.title} — Retouching Workflow
              </h4>
              <p className="font-mono text-xs text-slate-400">
                Curves: High-Contrast RGB • Frequency Separation Skin Processing • Chromatic Aberration Correction
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSliderPosition(50)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset 50%</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
