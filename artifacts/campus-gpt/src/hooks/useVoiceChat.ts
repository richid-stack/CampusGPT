import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface UseVoiceChatOptions {
  threadId: number | null;
  onCreateThread?: () => Promise<number>;
  walkMode?: boolean;
}

export function useVoiceChat({ threadId, onCreateThread, walkMode = false }: UseVoiceChatOptions) {
  const [voiceState, setVoiceState]   = useState<VoiceState>('idle');
  const [transcript, setTranscript]   = useState('');
  const [aiResponse, setAiResponse]   = useState('');
  const [error, setError]             = useState<string | null>(null);
  const voiceOutputEnabled = useAppStore(s => s.voiceOutputEnabled);

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioChunksRef    = useRef<Blob[]>([]);
  const abortRef          = useRef<AbortController | null>(null);
  const audioRef          = useRef<HTMLAudioElement | null>(null);
  const activeThreadIdRef = useRef<number | null>(threadId);

  useEffect(() => { activeThreadIdRef.current = threadId; }, [threadId]);

  const stopEverything = useCallback(() => {
    mediaRecorderRef.current?.stop();
    abortRef.current?.abort();
    audioRef.current?.pause();
    setVoiceState('idle');
  }, []);

  /** Call Orpheus TTS via /api/tts and play the result */
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!voiceOutputEnabled) {
      setVoiceState('idle');
      return;
    }
    setVoiceState('speaking');
    try {
      const ac = new AbortController();
      abortRef.current = ac;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended  = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror  = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => resolve());
      });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        // Fallback to browser TTS if Orpheus fails
        await new Promise<void>(resolve => {
          window.speechSynthesis?.cancel();
          const utter = new SpeechSynthesisUtterance(text.slice(0, 500));
          utter.rate = 1.05; utter.lang = 'en-GH';
          const voices = window.speechSynthesis?.getVoices() ?? [];
          const v = voices.find(v => v.lang.startsWith('en')) ?? voices[0];
          if (v) utter.voice = v;
          utter.onend = () => resolve(); utter.onerror = () => resolve();
          window.speechSynthesis?.speak(utter);
        });
      }
    }
  }, [voiceOutputEnabled]);

  /** Transcribe audio blob via /api/stt (Whisper Large v3 Turbo) */
  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const res = await fetch('/api/stt', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('STT failed');
    const { transcript } = await res.json();
    return transcript ?? '';
  }, []);

  /** Send transcribed text to AI, stream response, speak result */
  const sendToAI = useCallback(async (text: string) => {
    setVoiceState('processing');
    setAiResponse('');

    let tid = activeThreadIdRef.current;
    if (!tid && onCreateThread) {
      try { tid = await onCreateThread(); activeThreadIdRef.current = tid; }
      catch { setError('Could not start a session. Please try again.'); setVoiceState('error'); return; }
    }
    if (!tid) { setError('No active thread. Open a chat first.'); setVoiceState('error'); return; }

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
      let buffer = ''; let fullResponse = '';

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
        // Strip markdown, nav tags, and emoji for spoken output
        const clean = fullResponse
          .replace(/<!--NAV:[\s\S]*?-->/g, '')       // strip navigation tag
          .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
          .replace(/#+\s/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/`{1,3}[^`]*`{1,3}/g, '')
          .replace(/[⛔📍🎓📚🏛📋📅💳🔎🏥🏠🍽⚽🏢🚪🏦📖]/gu, '')
          .replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').trim();
        await speak(clean);
      }
      setVoiceState('idle');
    } catch (err: any) {
      if (err?.name !== 'AbortError') { setError('Something went wrong. Please try again.'); setVoiceState('error'); }
    }
  }, [onCreateThread, speak, walkMode]);

  /** Start recording with MediaRecorder → send to Whisper on stop */
  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setAiResponse('');

    // Request mic permission
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access denied. Please allow microphone access.');
      setVoiceState('error');
      return;
    }

    audioChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
      setVoiceState('processing');
      try {
        const text = await transcribe(audioBlob);
        if (text.trim()) {
          setTranscript(text);
          await sendToAI(text);
        } else {
          setError('Could not hear anything. Please try again.');
          setVoiceState('error');
        }
      } catch {
        setError('Transcription failed. Please try again.');
        setVoiceState('error');
      }
    };

    recorder.start();
    setVoiceState('listening');
  }, [transcribe, sendToAI]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => () => {
    mediaRecorderRef.current?.stop();
    abortRef.current?.abort();
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  return { voiceState, transcript, aiResponse, error, supported, startListening, stopListening, stopEverything };
}
