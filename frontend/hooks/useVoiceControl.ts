import { useCallback, useEffect, useRef, useState } from 'react';

export type CommandMap = Record<string, () => void>;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function matchCommand(transcript: string, commands: CommandMap): string | null {
  const norm = normalize(transcript);
  // Exact matches first
  for (const key of Object.keys(commands)) {
    if (norm === key) return key;
  }
  // Contains match
  for (const key of Object.keys(commands)) {
    if (norm.includes(key) || key.includes(norm)) return key;
  }
  // Word overlap: prefer key with most matching words
  const words = norm.split(/\s+/);
  let best: string | null = null;
  let bestScore = 0;
  for (const key of Object.keys(commands)) {
    const keyWords = key.split(/\s+/);
    const overlap = words.filter(w => keyWords.includes(w)).length;
    if (overlap > 0 && overlap > bestScore) {
      bestScore = overlap;
      best = key;
    }
  }
  return best;
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  utterance.volume = 0.7;
  window.speechSynthesis.speak(utterance);
}

export function useVoiceControl() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const commandsRef = useRef<CommandMap>({});
  const recognitionRef = useRef<any>(null);
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const registerCommands = useCallback((commands: CommandMap) => {
    commandsRef.current = { ...commandsRef.current, ...commands };
  }, []);

  const unregisterCommands = useCallback((keys: string[]) => {
    const next = { ...commandsRef.current };
    keys.forEach(k => delete next[k]);
    commandsRef.current = next;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || listening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(final || interim);
      if (final) {
        const matched = matchCommand(final, commandsRef.current);
        if (matched) {
          setLastCommand(matched);
          commandsRef.current[matched]();
          speak(`OK`);
          setTimeout(() => setLastCommand(''), 2000);
        }
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') setListening(false);
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript('');
  }, [isSupported, listening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
    setTranscript('');
  }, []);

  const toggleListening = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    listening,
    transcript,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
    registerCommands,
    unregisterCommands,
    isSupported,
  };
}
