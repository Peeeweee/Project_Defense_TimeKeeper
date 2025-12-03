// Singleton AudioContext to avoid hitting browser limits
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

export const playAlertSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playWarningSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    
    // Create two beeps
    [0, 0.2].forEach(offset => {
      const osc = ctx.createOscillator();
      osc.connect(gainNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now + offset); // E5
      
      gainNode.gain.setValueAtTime(0.1, now + offset);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.1);
      
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });

  } catch (e) {
    console.error("Warning playback failed", e);
  }
};

export const playTickSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Short, high-pitch tick
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    
    // Very short envelope
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.error("Tick playback failed", e);
  }
};