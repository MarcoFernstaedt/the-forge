import { createContext, useContext, ReactNode } from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';

type SoundContextType = ReturnType<typeof useSoundEffects>;

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const sounds = useSoundEffects();
  return <SoundContext.Provider value={sounds}>{children}</SoundContext.Provider>;
}

export function useSoundContext(): SoundContextType {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSoundContext must be used within SoundProvider');
  return ctx;
}
