import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TESTIMONIALS } from '../data/portfolioData';
import { Quote, Star, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    playClickSound();
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const handleNext = () => {
    playClickSound();
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const activeTestimonial = TESTIMONIALS[currentIndex];

  return (
    <section id="testimonials" className="relative py-24 bg-[#08090e] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Client & Press Reviews
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white">
            Words From Creative <span className="text-gradient-cyan">Directors</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            Endorsements from global luxury houses, publication editors, and architectural visionaries.
          </p>
        </div>

        {/* Featured Testimonial Showcase Card */}
        <div className="max-w-4xl mx-auto glass-card rounded-3xl p-8 sm:p-12 border border-white/15 relative overflow-hidden shadow-2xl">
          
          <Quote className="w-16 h-16 text-cyan-500/20 absolute top-6 right-6 pointer-events-none" />

          <motion.div
            key={activeTestimonial.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 relative z-10"
          >
            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              {[...Array(activeTestimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Quote Body */}
            <blockquote className="font-display text-lg sm:text-2xl font-medium text-slate-100 leading-relaxed italic">
              "{activeTestimonial.quote}"
            </blockquote>

            {/* Client Info Bar */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={activeTestimonial.avatar}
                  alt={activeTestimonial.clientName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50"
                />
                <div>
                  <h4 className="font-display font-bold text-white text-base">
                    {activeTestimonial.clientName}
                  </h4>
                  <span className="font-mono text-xs text-slate-400">
                    {activeTestimonial.role} • <span className="text-cyan-400">{activeTestimonial.company}</span>
                  </span>
                </div>
              </div>

              <div className="font-mono text-xs text-slate-400 bg-white/5 px-3.5 py-1.5 rounded-xl border border-white/10">
                Project: <span className="text-slate-200">{activeTestimonial.shootName} ({activeTestimonial.year})</span>
              </div>
            </div>

          </motion.div>

          {/* Carousel Arrows */}
          <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-white/10">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
