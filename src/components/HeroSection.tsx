import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Play, Sparkles, Sliders, ArrowDown, ChevronRight, Eye } from 'lucide-react';
import { playCameraShutterSound, playClickSound } from '../utils/audio';

interface HeroSectionProps {
  onOpenBooking: () => void;
  onSelectPhoto: (photoId: string) => void;
}

const HERO_SLIDES = [
  {
    id: 'photo-1',
    title: 'Neon Odyssey',
    subtitle: 'Tokyo Crimson Editorial',
    tagline: 'CAPTURING LIGHT BEYOND PERCEPTION',
    image: 'https://images.pexels.com/photos/38149408/pexels-photo-38149408.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600',
    exif: '100mm • f/2.2 • 1/250s • ISO 64',
    accentColor: '#38bdf8'
  },
  {
    id: 'photo-4',
    title: 'Crimson Velvet',
    subtitle: 'Milan Fine Art Portraiture',
    tagline: 'TIMELISS CHIAROSCURO ELEGANCE',
    image: 'https://images.pexels.com/photos/7277907/pexels-photo-7277907.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600',
    exif: '120mm Macro • f/4.0 • 1/160s • ISO 64',
    accentColor: '#e03d52'
  },
  {
    id: 'photo-2',
    title: 'Monolith in the Void',
    subtitle: 'Reykjavik Cyber Architecture',
    tagline: 'FUTURISTIC BRUTALIST GEOMETRY',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    exif: '21mm Wide • f/8.0 • 1/125s • ISO 100',
    accentColor: '#818cf8'
  }
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenBooking, onSelectPhoto }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentSlide = HERO_SLIDES[currentSlideIndex];

  const handleNextSlide = () => {
    playCameraShutterSound();
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const scrollToPortfolio = () => {
    playClickSound();
    document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLightLab = () => {
    playClickSound();
    document.getElementById('lightlab')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen pt-28 pb-16 flex items-center justify-center overflow-hidden">
      {/* Background Dynamic Backdrop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-cover opacity-25 filter blur-[2px] brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-transparent to-[#08090d]/80" />
        </motion.div>
      </AnimatePresence>

      {/* Grid Pattern and Ambient Light Orbs */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[130px] animate-ambient-1 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[150px] animate-ambient-2 pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Hero Typography & CTAs */}
          <div className="lg:col-span-7 space-y-8">
            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-cyan-500/30 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-cyan-300 uppercase">
                {currentSlide.tagline}
              </span>
            </motion.div>

            {/* Dynamic Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="space-y-2"
            >
              <h1 className="font-display text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
                Visual Art <br />
                <span className="text-gradient-cyan">In High Spectrum</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-xl font-light max-w-xl leading-relaxed pt-2">
                I capture hyper-cinematic editorial fashion, brutalist architectural geometry, and fine-art portraits with medium-format precision and custom optical color science.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button
                onClick={scrollToPortfolio}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-semibold text-sm tracking-wide shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Explore Portfolio
              </button>

              <button
                onClick={scrollToLightLab}
                className="px-6 py-3.5 rounded-full glass-panel hover:bg-white/10 border border-white/15 text-white font-medium text-sm tracking-wide hover:border-cyan-400/50 transition-all cursor-pointer flex items-center gap-2 group"
              >
                <Sliders className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
                <span>Virtual Light Lab</span>
              </button>

              <button
                onClick={onOpenBooking}
                className="px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white font-medium text-sm tracking-wide transition-all cursor-pointer border border-cyan-500/30 flex items-center gap-1.5"
              >
                <span>Book Shoot</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Live Featured Slide Selector Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="pt-6 border-t border-white/10 flex items-center gap-6"
            >
              <div className="flex items-center gap-2">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => {
                      playCameraShutterSound();
                      setCurrentSlideIndex(idx);
                      setIsAutoPlaying(false);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentSlideIndex
                        ? 'w-10 bg-cyan-400 shadow-[0_0_10px_#38bdf8]'
                        : 'w-3 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
                <span className="text-cyan-400">EXIF:</span>
                <span className="bg-white/5 px-2.5 py-1 rounded border border-white/10">
                  {currentSlide.exif}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Interactive Framed Hero Showcase Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden glass-card p-2 border border-white/20 shadow-2xl shadow-cyan-950/40 group"
            >
              {/* Image Container */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Aperture Focus Overlay Graphic */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-between p-6">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-black/60 backdrop-blur-md border border-white/15 text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Camera className="w-3 h-3 text-cyan-400" />
                      FEATURED MASTER
                    </span>

                    <button
                      onClick={handleNextSlide}
                      title="Next Featured Frame"
                      className="p-2 rounded-full bg-black/60 hover:bg-cyan-500/20 text-white border border-white/15 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Text & View Trigger */}
                  <div className="space-y-2">
                    <span className="font-mono text-xs text-cyan-400 tracking-widest block">
                      {currentSlide.subtitle}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-white">
                      {currentSlide.title}
                    </h3>
                    
                    <button
                      onClick={() => onSelectPhoto(currentSlide.id)}
                      className="w-full mt-2 py-2.5 rounded-xl bg-white/10 hover:bg-cyan-500/30 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>VIEW FULL EXIF & PALETTE</span>
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>

        {/* Bottom Scroll Down Indicator */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={scrollToPortfolio}
            className="flex flex-col items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer group"
          >
            <span className="font-mono text-[11px] tracking-widest uppercase text-slate-400 group-hover:text-cyan-300">
              Scroll To Gallery
            </span>
            <div className="p-2 rounded-full border border-white/10 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10 transition-all animate-bounce">
              <ArrowDown className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
