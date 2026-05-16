import { useCallback, useEffect, useRef, useState } from 'react';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.3,
  startTime?: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = startTime ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);
  gainNode.gain.setValueAtTime(gain, t);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function playFreqRamp(
  freqStart: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType = 'triangle',
  gain = 0.25
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
  gainNode.gain.setValueAtTime(gain, t);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export function useSoundEffects() {
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('forge_sound_muted') === 'true';
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    const handler = () => {
      const next = !mutedRef.current;
      setMuted(next);
      localStorage.setItem('forge_sound_muted', String(next));
    };
    window.addEventListener('forge:toggle-sound', handler);
    return () => window.removeEventListener('forge:toggle-sound', handler);
  }, []);

  const toggleMute = useCallback(() => {
    window.dispatchEvent(new CustomEvent('forge:toggle-sound'));
  }, []);

  const playXPGain = useCallback(() => {
    if (mutedRef.current) return;
    playFreqRamp(440, 880, 0.3, 'triangle', 0.2);
  }, []);

  const playLevelUp = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      playTone(freq, 0.35, 'sine', 0.3, ctx.currentTime + i * 0.18);
    });
  }, []);

  const playNodeUnlock = useCallback(() => {
    if (mutedRef.current) return;
    playTone(880, 0.4, 'sine', 0.28);
    setTimeout(() => playTone(1108.73, 0.25, 'sine', 0.15), 100);
  }, []);

  const playNavClick = useCallback(() => {
    if (mutedRef.current) return;
    playTone(200, 0.08, 'square', 0.1);
  }, []);

  const playVoiceActivate = useCallback(() => {
    if (mutedRef.current) return;
    playFreqRamp(660, 880, 0.25, 'sine', 0.2);
  }, []);

  return { playXPGain, playLevelUp, playNodeUnlock, playNavClick, playVoiceActivate, muted, toggleMute };
}
