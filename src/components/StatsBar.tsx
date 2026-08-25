import React from 'react';
import { motion } from 'framer-motion';
import { STATS } from '../data/portfolioData';
import { Award, Camera, Globe, Newspaper } from 'lucide-react';

export const StatsBar: React.FC = () => {
  const icons = [
    <Camera className="w-5 h-5 text-cyan-400" key="1" />,
    <Newspaper className="w-5 h-5 text-purple-400" key="2" />,
    <Award className="w-5 h-5 text-amber-400" key="3" />,
    <Globe className="w-5 h-5 text-emerald-400" key="4" />
  ];

  return (
    <section className="relative py-12 border-y border-white/10 bg-[#0b0d14]/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {STATS.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center group hover:border-cyan-500/30 transition-all"
            >
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-3 group-hover:scale-110 transition-transform">
                {icons[idx]}
              </div>
              <span className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight text-gradient-cyan">
                {stat.value}
              </span>
              <span className="font-mono text-xs text-slate-400 uppercase tracking-widest mt-1">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
