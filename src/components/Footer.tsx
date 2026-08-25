import React, { useState, useEffect } from 'react';
import { Camera, ArrowUp, Globe, Mail, Clock, MessageCircle, PlaySquareIcon } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const Footer: React.FC = () => {
  const [tokyoTime, setTokyoTime] = useState('');
  // const [nycTime, setNycTime] = useState('');
  // const [parisTime, setParisTime] = useState('');

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setTokyoTime(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }));
      // setNycTime(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' }));
      // setParisTime(now.toLocaleTimeString('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }));
    };

    updateTimes();
    const interval = setInterval(updateTimes, 10000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    playClickSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#05060a] border-t border-white/10 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center">
                <Camera className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="font-display font-extrabold text-xl tracking-wider text-white">
                  Dream <span className="text-cyan-400 font-normal text-xs px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/40">Photo's & Film's</span>
                </span>
                <span className="block text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                  Utkarsh Patel Photography
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm font-light leading-relaxed">
              I capture hyper-cinematic editorial fashion, brutalist architectural geometry, and fine-art portraits with medium-format precision and custom optical color science.
            </p>

            {/* Live Time Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono">
              <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>India: <span className="text-white">{tokyoTime || '21:00'} IST</span></span>
              </div>
           {/* <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                <span>NYC: <span className="text-white">{nycTime || '08:00'} EST</span></span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                <span>Paris: <span className="text-white">{parisTime || '14:00'} CET</span></span>
              </div>  */}
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <span className="text-slate-200 font-bold uppercase tracking-wider block">
              Navigation
            </span>
            <ul className="space-y-2">
              {['portfolio', 'lightlab', 'services', 'about', 'gear', 'contact'].map((id) => (
                <li key={id}>
                  <button
                    onClick={() => {
                      playClickSound();
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-cyan-400 transition-colors capitalize cursor-pointer"
                  >
                    {id === 'lightlab' ? 'Virtual Light Lab' : id}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Contact & Socials */}
          <div className="md:col-span-4 space-y-4">
            <span className="text-slate-200 font-bold font-mono text-xs uppercase tracking-wider block">
              Direct Contact
            </span>
            <div className="space-y-2 text-xs font-mono">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <a href="mailto:sutarnitin2525@gmail.com" className="hover:text-white transition-colors">
                  sutarnitin2525@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Studio: Shahada, Maharashtra</span>
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              {[
                { icon: <MessageCircle className="w-4 h-4" />, label: 'Whatsapp', href: 'https://wa.me/919356790612' },
                { icon: <Camera className="w-4 h-4" />, label: 'Instagram', href: 'https://instagram.com/cinematic_utkarshh.05/' },
                { icon: <PlaySquareIcon className="w-4 h-4" />, label: 'Youtube', href: 'https://youtube.com/' }
              ].map((soc, i) => (
                <a
                  key={i}
                  href={soc.href}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title={soc.label}
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© {new Date().getFullYear()} Utkarsh Patel Photography. All Rights Reserved.</p>

          <p>Designed & Developed by{""} <a href="https://instagram.com/mr._nitin_sutar/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">Nitin Sutar</a></p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <span>Back To Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      

      </div>
    </footer>
  );
};
