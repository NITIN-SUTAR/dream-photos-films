import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SERVICES_LIST } from '../data/portfolioData';
import {
  Sparkles,
  Building2,
  UserCheck,
  Crown,
  CheckCircle2,
  Calculator,
  ArrowRight,
  Clock,
  Briefcase
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface ServicesSectionProps {
  onOpenBookingWithDetails: (serviceTitle: string, estimatedPrice: number) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenBookingWithDetails }) => {
  // Configurator States
  const [selectedServiceId, setSelectedServiceId] = useState(SERVICES_LIST[0].id);
  const [duration, setDuration] = useState<'half' | 'full' | 'multi'>('full');
  const [includeDrone, setIncludeDrone] = useState(false);
  const [includePrintRights, setIncludePrintRights] = useState(true);
  const [locationType, setLocationType] = useState<'studio' | 'local' | 'international'>('studio');

  const iconsMap: Record<string, React.ReactNode> = {
    Sparkles: <Sparkles className="w-6 h-6 text-cyan-400" />,
    Building2: <Building2 className="w-6 h-6 text-indigo-400" />,
    UserCheck: <UserCheck className="w-6 h-6 text-amber-400" />,
    Crown: <Crown className="w-6 h-6 text-purple-400" />
  };

  const selectedService = SERVICES_LIST.find((s) => s.id === selectedServiceId) || SERVICES_LIST[0];

  // Calculate dynamic price estimate
  const computeEstimate = () => {
    let base = selectedService.startingPrice;
    
    // Duration multiplier
    if (duration === 'half') base *= 0.7;
    if (duration === 'multi') base *= 2.2;

    // Add-ons
    if (includeDrone) base += 8000;
    if (includePrintRights) base += 6000;

    // Location
    if (locationType === 'local') base += 500;
    if (locationType === 'international') base += 2500;

    return Math.round(base);
  };

  const estimatedPrice = computeEstimate();

  return (
    <section id="services" className="relative py-24 bg-[#08090d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 inline-flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            Services & Investment
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white">
            Tailored Photography <span className="text-gradient-cyan">Packages</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            From high-fashion magazine covers to architectural monographs and global brand campaigns, every production is executed with medium-format precision.
          </p>
        </div>

        {/* 4 Core Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {SERVICES_LIST.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card rounded-3xl p-8 border border-white/10 flex flex-col justify-between hover:border-cyan-500/40 group transition-all"
            >
              <div className="space-y-6">
                {/* Top Title & Icon */}
                <div className="flex items-start justify-between">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    {iconsMap[service.iconName]}
                  </div>

                  <span className="font-mono text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {service.turnaroundTime}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    {service.subtitle}
                  </p>
                </div>

                <p className="text-slate-300 text-xs italic font-mono bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/20">
                  "{service.tagline}"
                </p>

                {/* Features List */}
                <ul className="space-y-2.5 pt-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Price & Select Button */}
              <div className="pt-8 mt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Starting From</span>
                  <span className="font-display text-3xl font-extrabold text-white text-gradient-cyan">
                    ₹{service.startingPrice.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => {
                    playClickSound();
                    setSelectedServiceId(service.id);
                    document.getElementById('estimator')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-cyan-500/20 border border-white/20 text-white text-xs font-semibold hover:border-cyan-400 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Plan Shoot</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>

            </motion.div>
          ))}
        </div>

        {/* Interactive Shoot Cost Estimator Builder */}
        <div id="estimator" className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/20 relative overflow-hidden shadow-2xl">
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                Interactive Shoot Package Builder
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Customize shoot options for an instant real-time price estimate & booking preview.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Controls */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Option 1: Select Service Discipline */}
              <div className="space-y-2">
                <label className="font-mono text-xs text-slate-300 uppercase block">
                  1. Photography Discipline
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERVICES_LIST.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => {
                        playClickSound();
                        setSelectedServiceId(srv.id);
                      }}
                      className={`p-3 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer flex items-center justify-between ${
                        selectedServiceId === srv.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{srv.title}</span>
                      <span className="font-mono text-[10px] text-cyan-300">₹{srv.startingPrice}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Shoot Duration */}
              <div className="space-y-2">
                <label className="font-mono text-xs text-slate-300 uppercase block">
                  2. Shoot Production Duration
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'half', label: 'Half Day (4 hrs)' },
                    { id: 'full', label: 'Full Day (8 hrs)' },
                    { id: 'multi', label: 'Multi-Day (2 Days)' }
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      onClick={() => {
                        playClickSound();
                        setDuration(dur.id as typeof duration);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-mono border transition-all cursor-pointer text-center ${
                        duration === dur.id
                          ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Location Scope */}
              <div className="space-y-2">
                <label className="font-mono text-xs text-slate-300 uppercase block">
                  3. Production Location
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'studio', label: 'Private Studio' },
                    { id: 'local', label: 'On-Location (Local)' },
                    { id: 'international', label: 'Global Tour Travel' }
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        playClickSound();
                        setLocationType(loc.id as typeof locationType);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-mono border transition-all cursor-pointer text-center ${
                        locationType === loc.id
                          ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 4: Add-Ons Checkboxes */}
              <div className="space-y-2">
                <label className="font-mono text-xs text-slate-300 uppercase block">
                  4. Add-Ons & Licensing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      playClickSound();
                      setIncludeDrone(!includeDrone);
                    }}
                    className={`p-3 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center justify-between ${
                      includeDrone
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>4K Aerial Drone Coverage (+ ₹8000)</span>
                    <span className="text-emerald-400">{includeDrone ? 'ADDED' : '+'}</span>
                  </button>

                  <button
                    onClick={() => {
                      playClickSound();
                      setIncludePrintRights(!includePrintRights);
                    }}
                    className={`p-3 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center justify-between ${
                      includePrintRights
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Perpetual Commercial Print Rights (+ ₹6000)</span>
                    <span className="text-emerald-400">{includePrintRights ? 'ADDED' : '+'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Price Card Summary */}
            <div className="lg:col-span-4 glass-card p-6 rounded-2xl border border-white/15 flex flex-col justify-between bg-black/40">
              <div className="space-y-4">
                <span className="font-mono text-xs text-slate-400 uppercase block border-b border-white/10 pb-2">
                  Estimate Breakdown
                </span>

                <div className="space-y-2 font-mono text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Base Service</span>
                    <span className="text-white">₹{selectedService.startingPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="text-white">{duration.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location</span>
                    <span className="text-white">{locationType.toUpperCase()}</span>
                  </div>
                  {includeDrone && (
                    <div className="flex justify-between text-emerald-300">
                      <span>4K Drone Aerial</span>
                      <span>+₹8000</span>
                    </div>
                  )}
                  {includePrintRights && (
                    <div className="flex justify-between text-emerald-300">
                      <span>Perpetual Licensing</span>
                      <span>+₹6000</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <span className="font-mono text-[10px] text-slate-400 uppercase block">Estimated Total</span>
                  <span className="font-display text-4xl font-extrabold text-white text-gradient-gold">
                    ₹{estimatedPrice.toLocaleString()} INR
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  playClickSound(900);
                  onOpenBookingWithDetails(selectedService.title, estimatedPrice);
                }}
                className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white font-semibold text-xs tracking-wider uppercase shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Reserve Shoot With Estimate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
