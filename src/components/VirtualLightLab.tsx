import React, { useState } from 'react';
import { Sliders, Sun, Zap, Camera, RefreshCcw } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const VirtualLightLab: React.FC = () => {
  const [keyLightAngle, setKeyLightAngle] = useState(45); // degrees
  const [keyLightIntensity, setKeyLightIntensity] = useState(100);
  const [fillLightIntensity, setFillLightIntensity] = useState(40);
  const [rimColor, setRimColor] = useState('#38bdf8'); // cyan
  const [apertureVal, setApertureVal] = useState(1.4); // f/1.4
  const [presetLook, setPresetLook] = useState<'default' | 'cyberpunk' | 'monochrome' | 'golden'>('default');

  const handleReset = () => {
    playClickSound(600);
    setKeyLightAngle(45);
    setKeyLightIntensity(100);
    setFillLightIntensity(40);
    setRimColor('#38bdf8');
    setApertureVal(1.4);
    setPresetLook('default');
  };

  // Calculate simulated filter CSS based on controls
  const computeFilterStyle = () => {
    let brightness = (keyLightIntensity / 100) * 0.8 + (fillLightIntensity / 100) * 0.3;
    let contrast = 100 + (keyLightIntensity - fillLightIntensity) * 0.8;
    let blurPx = Math.max(0, (apertureVal - 1.2) * 0.4);

    let filterString = `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(0)}%)`;

    if (presetLook === 'monochrome') {
      filterString += ' grayscale(100%)';
    } else if (presetLook === 'cyberpunk') {
      filterString += ' hue-rotate(180deg) saturate(180%)';
    } else if (presetLook === 'golden') {
      filterString += ' sepia(60%) saturate(140%)';
    }

    return {
      filter: filterString,
      backdropBlur: `${blurPx}px`
    };
  };

  return (
    <section id="lightlab" className="relative py-24 bg-[#080a10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 inline-flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Interactive Studio Lighting & Lens Lab
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white">
            Virtual <span className="text-gradient-cyan">Light Lab</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            Experiment with studio lighting physics, rim light color temperature, fill ratio, and optical depth-of-field in real time.
          </p>
        </div>

        {/* Interactive Lab Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Canvas Preview Box */}
          <div className="lg:col-span-7 relative">
            <div className="glass-card rounded-3xl p-4 border border-white/20 shadow-2xl shadow-cyan-950/30 overflow-hidden relative">
              
              {/* Image Viewport Container */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                
                {/* Background Simulated Rim Glow Overlay */}
                <div
                  className="absolute inset-0 transition-all duration-300 pointer-events-none z-10 opacity-70"
                  style={{
                    boxShadow: `inset 0 0 80px ${rimColor}`,
                  }}
                />

                {/* Simulated Dynamic Key Light Beam Glow */}
                <div
                  className="absolute w-72 h-72 rounded-full pointer-events-none transition-all duration-300 blur-3xl opacity-40 z-10"
                  style={{
                    backgroundColor: rimColor,
                    transform: `rotate(${keyLightAngle}deg) translate(120px, -120px)`
                  }}
                />

                {/* Portrait Model Image */}
                <img
                  src="https://images.pexels.com/photos/35090173/pexels-photo-35090173.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600"
                  alt="Studio Model Light Simulation"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={computeFilterStyle()}
                />

                {/* Simulated Depth of Field Blur Vignette */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{
                    backdropFilter: `blur(${Math.max(0, (16 - apertureVal) * 0.2)}px)`,
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                  }}
                />

                {/* Top Status Badge Overlay */}
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 font-mono text-xs text-cyan-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>SIMULATED APERTURE: f/{apertureVal}</span>
                </div>

                {/* Bottom Lighting Meter Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-20 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                  <span>KEY LIGHT: {keyLightAngle}° @ {keyLightIntensity}%</span>
                  <span>FILL: {fillLightIntensity}%</span>
                  <span className="flex items-center gap-1">
                    RIM:
                    <span className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: rimColor }} />
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* Right Lighting Controls Panel */}
          <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-cyan-400" />
                Lighting Rig Controls
              </h3>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Slider 1: Key Light Angle */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Key Light Position Angle
                </span>
                <span className="text-cyan-400 font-semibold">{keyLightAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={keyLightAngle}
                onChange={(e) => setKeyLightAngle(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-white/10 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 2: Key Light Power */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Key Light Power (Strobe Ws)</span>
                <span className="text-cyan-400 font-semibold">{keyLightIntensity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                value={keyLightIntensity}
                onChange={(e) => setKeyLightIntensity(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-white/10 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 3: Fill Light Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Fill Light Shadows Softness</span>
                <span className="text-cyan-400 font-semibold">{fillLightIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={fillLightIntensity}
                onChange={(e) => setFillLightIntensity(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-white/10 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 4: Lens Aperture f-stop */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  Lens Aperture (Depth of Field)
                </span>
                <span className="text-purple-300 font-semibold">f/{apertureVal}</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="16"
                step="0.1"
                value={apertureVal}
                onChange={(e) => setApertureVal(Number(e.target.value))}
                className="w-full accent-purple-400 bg-white/10 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Color Rim Tube Palette Picker */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-300 block">
                RGB Hair & Rim Light Tint
              </span>
              <div className="flex items-center gap-3">
                {['#38bdf8', '#e03d52', '#a855f7', '#f59e0b', '#10b981', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      playClickSound(750);
                      setRimColor(color);
                    }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                      rimColor === color ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preset Aesthetic Switcher */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-xs font-mono text-slate-300 block">
                Atmospheric Look Switcher
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'default', label: 'Natural Studio' },
                  { id: 'cyberpunk', label: 'Cyberpunk Neon' },
                  { id: 'monochrome', label: 'Noir Black & White' },
                  { id: 'golden', label: 'Golden Hour' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      playClickSound(850);
                      setPresetLook(p.id as unknown as typeof presetLook);
                    }}
                    className={`p-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                      presetLook === p.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
