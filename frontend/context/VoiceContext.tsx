import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useVoiceControl } from '../hooks/useVoiceControl';

type VoiceContextType = ReturnType<typeof useVoiceControl> & {
  showCommands: boolean;
  setShowCommands: (v: boolean) => void;
};

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const voice = useVoiceControl();
  const [showCommands, setShowCommands] = [false, (_: boolean) => {}];
  // Use local state via a wrapper to expose showCommands
  return (
    <_VoiceProviderInner voice={voice}>
      {children}
    </_VoiceProviderInner>
  );
}

import { useState } from 'react';

function _VoiceProviderInner({ voice, children }: { voice: ReturnType<typeof useVoiceControl>; children: ReactNode }) {
  const [showCommands, setShowCommands] = useState(false);

  useEffect(() => {
    if (!voice.isSupported) return;
    voice.registerCommands({
      'dashboard': () => { window.location.href = '/'; },
      'go to dashboard': () => { window.location.href = '/'; },
      'home': () => { window.location.href = '/'; },
      'goals': () => { window.location.href = '/goals'; },
      'go to goals': () => { window.location.href = '/goals'; },
      'journal': () => { window.location.href = '/notes'; },
      'notes': () => { window.location.href = '/notes'; },
      'go to journal': () => { window.location.href = '/notes'; },
      'activities': () => { window.location.href = '/activities'; },
      'go to activities': () => { window.location.href = '/activities'; },
      'vault': () => { window.location.href = '/obsidian'; },
      'obsidian': () => { window.location.href = '/obsidian'; },
      'open vault': () => { window.location.href = '/obsidian'; },
      'show commands': () => setShowCommands(true),
      'help': () => setShowCommands(true),
      'what can i say': () => setShowCommands(true),
      'start tour': () => window.dispatchEvent(new CustomEvent('forge:start-tour')),
      'mute': () => window.dispatchEvent(new CustomEvent('forge:toggle-sound')),
      'mute sounds': () => window.dispatchEvent(new CustomEvent('forge:toggle-sound')),
      'unmute': () => window.dispatchEvent(new CustomEvent('forge:toggle-sound')),
    });
  }, [voice.isSupported]);

  const value: VoiceContextType = { ...voice, showCommands, setShowCommands };
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoiceContext(): VoiceContextType {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoiceContext must be used within VoiceProvider');
  return ctx;
}
