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

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    // OG ALARM CLOCK SOUND
    // Classic "Beep-Beep-Beep-Beep" pattern
    // 4Hz modulation: 0.125s ON, 0.125s OFF
    // 4 beeps per sequence, then pause

    const baseFreq = 2000; // Classic high pitch
    const beepLength = 0.1;
    const gapLength = 0.1;
    const sequenceGap = 0.5;

    // Create 1 sequence of 4 beeps (User requested "just make it 1")
    for (let seq = 0; seq < 1; seq++) {
      const seqStart = now + (seq * (4 * (beepLength + gapLength) + sequenceGap));

      for (let beep = 0; beep < 4; beep++) {
        const start = seqStart + (beep * (beepLength + gapLength));

        const osc = ctx.createOscillator();
        osc.connect(gainNode);
        osc.type = 'square'; // Square wave for "digital" sound
        osc.frequency.setValueAtTime(baseFreq, start);

        gainNode.gain.setValueAtTime(0.15, start);
        gainNode.gain.setValueAtTime(0.15, start + beepLength - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, start + beepLength);

        osc.start(start);
        osc.stop(start + beepLength);
      }
    }

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
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    // BELL SOUND
    // Mix of sine waves at non-integer ratios for metallic timbre
    const ratios = [1.0, 2.0, 3.0, 4.2, 5.4];
    const baseFreq = 600;

    ratios.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.connect(masterGain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      // Sharp attack, long exponential decay
      const gain = 0.3 / (i + 1); // Higher partials are quieter
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(gain, now + 0.01);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Long ring

      osc.start(now);
      osc.stop(now + 1.5);
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