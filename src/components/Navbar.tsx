import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, MousePointer, Camera, Menu, X, ArrowRight } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface NavbarProps {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  cursorEnabled: boolean;
  setCursorEnabled: (enabled: boolean) => void;
  onOpenBooking: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  soundEnabled,
  setSoundEnabled,
  cursorEnabled,
  setCursorEnabled,
  onOpenBooking
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
  const sections = [
    'hero',
    'portfolio',
    'lightlab',
    'services',
    'about',
    'gear',
    'testimonials',
    'contact'
  ];

  const handleScroll = () => {
    setScrolled(window.scrollY > 40);

    const scrollPosition = window.scrollY + 200;

    let currentSection = 'hero';

    for (const section of sections) {
      const element = document.getElementById(section);

      if (!element) continue;

      const sectionTop = element.offsetTop;
      const sectionBottom = sectionTop + element.offsetHeight;

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionBottom
      ) {
        currentSection = section;
        break;
      }
    }

    setActiveSection(currentSection);
  };

  handleScroll();

  window.addEventListener('scroll', handleScroll);

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);


  const navLinks = [
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'lightlab', label: 'Light Lab' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    //{ id: 'gear', label: 'Gear' },
    { id: 'contact', label: 'Booking' }
  ];

  const handleNavClick = (id: string) => {
  playClickSound(700);
  setMobileMenuOpen(false);

  // Immediately activate clicked nav item
  setActiveSection(id);

  const element = document.getElementById(id);

  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};


  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'py-3 bg-[#08090d]/80 backdrop-blur-md border-b border-white/10 shadow-2xl shadow-black/50'
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('hero')}
            className="group flex items-center space-x-3 text-left cursor-pointer focus:outline-none"
          >
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Camera className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-md group-hover:bg-cyan-500/25 transition-all" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-wider text-white flex items-center gap-1.5">
                Dream <span className="text-cyan-400 font-normal text-xs px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/40">Photo's & Film's</span>
              </span>
              <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Utkarsh patel Photography
              </span>
            </div>
          </button>

          {/* Status Indicator Pill (Desktop)
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>AVAILABLE Q3/Q4 • TOKYO / NYC / PARIS</span>
          </div> */}

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 glass-panel rounded-full px-4 py-1.5 border border-white/10">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors cursor-pointer rounded-full ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls & CTA */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playClickSound(800);
              }}
              title={soundEnabled ? 'Disable Audio FX' : 'Enable Audio FX'}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {soundEnabled ? (
                <div className="flex items-center gap-1">
                  <Volume2 className="w-4 h-4" />
                  <div className="flex items-end space-x-0.5 h-3">
                    <div className="w-0.5 bg-cyan-400 animate-sound-1" />
                    <div className="w-0.5 bg-cyan-400 animate-sound-2" />
                    <div className="w-0.5 bg-cyan-400 animate-sound-3" />
                  </div>
                </div>
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Custom Pointer Toggle */}
            <button
              onClick={() => {
                setCursorEnabled(!cursorEnabled);
                playClickSound(650);
              }}
              title={cursorEnabled ? 'Disable Custom Spotlight Cursor' : 'Enable Custom Spotlight Cursor'}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                cursorEnabled
                  ? 'bg-purple-950/50 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <MousePointer className="w-4 h-4" />
            </button>

            {/* Book Shoot CTA */}
            <button
              onClick={() => {
                playClickSound(900);
                onOpenBooking();
              }}
              className="relative group overflow-hidden px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium text-xs lg:text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all cursor-pointer active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Book Shoot
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/10 bg-[#0c0e17]/95 backdrop-blur-xl px-4 pt-4 pb-6 mt-3 space-y-4"
          >
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <button
  key={link.id}
  onClick={() => {
    playClickSound(700);
    setActiveSection(link.id);
    setMobileMenuOpen(false);

    setTimeout(() => {
      const element = document.getElementById(link.id);

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 300);
  }}
  className="px-4 py-2.5 text-left text-base font-medium text-slate-200 hover:bg-white/5 rounded-xl transition-colors cursor-pointer flex items-center justify-between"
>
  <span>{link.label}</span>
  <ArrowRight className="w-4 h-4 text-cyan-400" />
</button>

              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2.5 rounded-xl border ${
                    soundEnabled
                      ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setCursorEnabled(!cursorEnabled)}
                  className={`p-2.5 rounded-xl border ${
                    cursorEnabled
                      ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <MousePointer className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-center text-sm shadow-lg cursor-pointer"
              >
                Book Shoot
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
