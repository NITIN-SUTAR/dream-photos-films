// Web Audio API helper for sound FX without external assets
let audioCtx: AudioContext | null = null;
let soundEnabled = false;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  if (enabled && !audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
};

export const getSoundEnabled = () => soundEnabled;

export const playCameraShutterSound = () => {
  if (!soundEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    // Shutter click noise burst
    const bufferSize = audioCtx.sampleRate * 0.05; // 50ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start(now);

    // Mechanical click tone
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    console.error('Audio play error:', e);
  }
};

export const playClickSound = (pitch = 600) => {
  if (!soundEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch (e) {
    console.error('Audio play error:', e);
  }
};
