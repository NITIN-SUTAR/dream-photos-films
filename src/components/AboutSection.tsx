import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GEAR_ITEMS } from '../data/portfolioData';
import {
  User,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const AboutSection: React.FC = () => {
  const [activeGearCat, setActiveGearCat] = useState<'all' | 'camera' | 'lens' | 'lighting' | 'drone'>('all');

  const filteredGear = GEAR_ITEMS.filter(
    (item) => activeGearCat === 'all' || item.category === activeGearCat
  );

  const publications = [
  'WEDDING PHOTOGRAPHY',
  'PORTRAIT PHOTOGRAPHY',
  'FAMILY PORTRAITS',
  'TRADITIONAL CEREMONIES',
  'PRE-WEDDING STORIES',
  'CULTURAL PHOTOGRAPHY'
];


  return (
    <section id="about" className="relative py-24 bg-[#07080d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section 1: Bio & Photographer Portrait */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          
          {/* Photographer Portrait */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[3/4] rounded-3xl overflow-hidden glass-card p-2 border border-white/20 shadow-2xl shadow-cyan-950/40"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900">
                <img
                  src="https://images.pexels.com/photos/6695554/pexels-photo-6695554.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600"
                  alt="Kaizen Vance Photographer"
                  className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
                />

                {/* Glassmorphic Overlay Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-black/80 backdrop-blur-md border border-white/15">
                  <span className="font-display font-bold text-lg text-white block">
                    Utkarsh Patel
                  </span>
                  <span className="font-mono text-xs text-cyan-400">
                    Lead Principal Photographer • Pusanad
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Artist Statement & Philosophy */}
          <div className="lg:col-span-7 space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              About The Artist
            </span>

            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              Capturing Light Beyond <br />
              <span className="text-gradient-cyan">Human Perception</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
              With over 12 years behind the medium-format lens, my work lives at the intersection of high fashion, brutalist architecture, and digital chiaroscuro. I treat light not simply as illumination, but as space, emotion, and architectural geometry.
            </p>

            <p className="text-slate-400 text-xs sm:text-sm font-light leading-relaxed">
              Whether capturing people, landscapes, or brands, my approach remains the same: sharp visuals, thoughtful composition, and colors that bring every story to life.
            </p>

            {/* Quick Achievements Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Wedding & Portrait Photography Specialist</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Professional Visual Storyteller</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Cinematic Drone Photography</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Commercial & Brand Photography</span>
              </div>
            </div>

            {/* Publications Marquee */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block">
                Featured Publications & Monographs
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {publications.map((pub, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-mono text-xs tracking-wider hover:border-cyan-500/40 transition-colors"
                  >
                    {pub}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Section 2: Interactive "In My Camera Bag" Gear Showcase */}
        <div id="gear" className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-purple-400 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Technical Arsenal
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
              In My <span className="text-gradient-cyan">Camera Bag</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-light">
              Explore the medium-format digital backs, prime lenses, and high-speed strobes powering my productions.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Equipment' },
              { id: 'camera', label: 'Camera Bodies' },
              { id: 'lens', label: 'Master Lenses' },
              { id: 'lighting', label: 'Strobes & Lighting' },
              { id: 'drone', label: 'Cinema Drones' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playClickSound();
                  setActiveGearCat(cat.id as typeof activeGearCat);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                  activeGearCat === cat.id
                    ? 'bg-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30 border border-purple-400'
                    : 'glass-panel text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gear Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGear.map((gear) => (
              <motion.div
                key={gear.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-5 border border-white/10 space-y-4 hover:border-purple-400/40 transition-all group"
              >
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-black/60">
                  <img
                    src={gear.image}
                    alt={gear.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/15 font-mono text-[10px] text-purple-300 uppercase">
                    {gear.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-purple-300 transition-colors">
                    {gear.name}
                  </h3>
                  <span className="font-mono text-xs text-slate-400 block mt-0.5">
                    {gear.model}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-cyan-300">
                  {gear.specs}
                </div>

                <p className="text-slate-300 text-xs font-light leading-relaxed">
                  {gear.useCase}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
