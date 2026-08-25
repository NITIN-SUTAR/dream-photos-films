import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryType, PhotoItem } from '../types';
import { PORTFOLIO_PHOTOS } from '../data/portfolioData';
import {
  Search,
  Eye,
  Camera,
  Layers
} from 'lucide-react';
import { playClickSound, playCameraShutterSound } from '../utils/audio';

interface PortfolioGalleryProps {
  onSelectPhoto: (photo: PhotoItem) => void;
  onSelectRetouch: (photo: PhotoItem) => void;
}

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'all', label: 'All Spectrum' },
  { id: 'editorial', label: 'Editorial & Fashion' },
  { id: 'architecture', label: 'Cyber Architecture' },
  { id: 'landscapes', label: 'Cinematic Landscapes' },
  { id: 'portraits', label: 'Fine Art Portraits' },
  { id: 'luxury', label: 'Luxury & Automotive' }
];

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  onSelectPhoto,
  onSelectRetouch
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPhotos = useMemo(() => {
    return PORTFOLIO_PHOTOS.filter((photo) => {
      const matchesCategory =
        activeCategory === 'all' || photo.category === activeCategory;

      const matchesSearch =
        searchQuery === '' ||
        photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.exif.camera.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.exif.location.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="portfolio" className="relative py-24 bg-[#08090d]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 inline-block">
            Curated Works
          </span>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white">
            Interactive Portfolio{' '}
            <span className="text-gradient-cyan">Gallery</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light">
            Filter by photographic discipline, search technical camera EXIF details,
            compare unedited RAW vs retouched files, or inspect extracted color palettes.
          </p>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="space-y-6 mb-10">
          
          {/* Search Bar */}
          <div className="flex items-center justify-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                placeholder="Search location, camera, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playClickSound();
                    setActiveCategory(cat.id);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400'
                      : 'glass-panel text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid Container */}
        <AnimatePresence mode="popLayout">
          {filteredPhotos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center glass-panel rounded-3xl border border-white/10"
            >
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />

              <p className="text-white font-medium text-lg">
                No photos found in this filter.
              </p>

              <p className="text-slate-400 text-xs mt-1">
                Try searching for a different keyword or resetting categories.
              </p>

              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono hover:bg-cyan-500/30 transition-all cursor-pointer"
              >
                Reset All
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              transition={{
                layout: {
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1]
                }
              }}
            >
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  layout="position"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    opacity: {
                      duration: 0.3
                    },
                    y: {
                      duration: 0.5,
                      delay: index * 0.05
                    },
                    layout: {
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1]
                    }
                  }}
                  onClick={() => {
                    playCameraShutterSound();
                    onSelectPhoto(photo);
                  }}
                  className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 cursor-pointer"
                >
                  {/* Main Photo Image */}
                  <div className="relative w-full overflow-hidden bg-slate-900">
                    <img
                      src={photo.image}
                      alt={photo.title}
                      className="block w-full h-auto group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />


                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-black/70 backdrop-blur-md border border-white/15 text-cyan-300 tracking-wider">
                        {photo.categoryLabel}
                      </span>
                    </div>

                    {/* Hover Glassmorphism Panel Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end">
                      
                      {/* Title & Description */}
                      <div className="space-y-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="font-display font-bold text-xl text-white">
                          {photo.title}
                        </h3>

                        <p className="text-slate-300 text-xs line-clamp-2">
                          {photo.description}
                        </p>

                        {/* EXIF Mini Badges */}
                        <div className="pt-2 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-cyan-300">
                          <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                            {photo.exif.camera}
                          </span>

                          <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                            {photo.exif.aperture}
                          </span>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-3 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playCameraShutterSound();
                              onSelectPhoto(photo);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-200 text-xs font-mono flex items-center justify-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect EXIF</span>
                          </button>

                          {photo.rawImage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playClickSound();
                                onSelectRetouch(photo);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/50 text-purple-200 text-xs font-mono flex items-center gap-1 transition-colors"
                              title="Compare RAW vs Final Edit"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>RAW</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Static Card Footer */}
                  <div className="p-4 flex items-center justify-between border-t border-white/5 bg-[#0e111a]/80">
                    <div>
                      <h4 className="font-display text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {photo.title}
                      </h4>

                      <span className="font-mono text-[10px] text-slate-400">
                        {photo.exif.location} • {photo.exif.year}
                      </span>
                    </div>

                    {/* Color Palette Micro Dots */}
                    <div className="flex items-center -space-x-1">
                      {photo.colorPalette.slice(0, 4).map((color, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
