import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface UseVoiceChatOptions {
  threadId: number | null;
  onCreateThread?: () => Promise<number>;
  walkMode?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

export function useVoiceChat({ threadId, onCreateThread, walkMode = false }: UseVoiceChatOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeThreadIdRef = useRef<number | null>(threadId);

  useEffect(() => { activeThreadIdRef.current = threadId; }, [threadId]);

  const supported = typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ('SpeechRecognition' in (window as any) || 'webkitSpeechRecognition' in (window as any));

  const stopEverything = useCallback(() => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    abortRef.current?.abort();
    setVoiceState('idle');
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.05;
      utter.pitch = 1;
      utter.lang = 'en-GH';
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en')) ?? voices[0];
      if (preferred) utter.voice = preferred;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      synthRef.current = utter;
      window.speechSynthesis.speak(utter);
    });
  }, []);

  const sendToAI = useCallback(async (text: string) => {
    setVoiceState('processing');
    setAiResponse('');

    let tid = activeThreadIdRef.current;
    if (!tid && onCreateThread) {
      try {
        tid = await onCreateThread();
        activeThreadIdRef.current = tid;
      } catch {
        setError('Could not start a chat session. Please try again.');
        setVoiceState('error');
        return;
      }
    }
    if (!tid) {
      setError('No active chat thread. Open a chat first.');
      setVoiceState('error');
      return;
    }

    try {
      const ac = new AbortController();
      abortRef.current = ac;

      const mode = walkMode ? 'walk' : 'fast';

      const res = await fetch(`/api/threads/${tid}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, mode }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) throw new Error('AI request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6).trim());
            if (payload.delta) { fullResponse += payload.delta; setAiResponse(fullResponse); }
          } catch { /* skip */ }
        }
      }

      if (fullResponse) {
        setVoiceState('speaking');
        const clean = fullResponse
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/#+\s/g, '')
          .replace(/🔴.*?$/gm, '')
          .replace(/⚠️.*?$/gm, '')
          .replace(/📍\s*/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        await speak(clean);
      }
      setVoiceState('idle');
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError('Something went wrong. Please try again.');
        setVoiceState('error');
      }
    }
  }, [onCreateThread, speak, walkMode]);

  const startListening = useCallback(() => {
    if (!supported) {
      setError('Voice is not supported in your browser. Try Chrome.');
      setVoiceState('error');
      return;
    }
    window.speechSynthesis?.cancel();
    setError(null);
    setTranscript('');
    setAiResponse('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR: AnyRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    const recognition: AnyRecognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-GH';

    recognition.onstart = () => setVoiceState('listening');
    recognition.onresult = (event: any) => {
      let interim = ''; let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t; else interim += t;
      }
      setTranscript(final || interim);
    };
    recognition.onend = () => {
      setTranscript(prev => {
        if (prev.trim()) sendToAI(prev.trim());
        else setVoiceState('idle');
        return prev;
      });
    };
    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        setError(`Microphone error: ${event.error}`);
        setVoiceState('error');
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, sendToAI]);

  const stopListening = useCallback(() => recognitionRef.current?.stop(), []);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    abortRef.current?.abort();
  }, []);

  return { voiceState, transcript, aiResponse, error, supported, startListening, stopListening, stopEverything };
}
