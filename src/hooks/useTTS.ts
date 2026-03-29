"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type TTSSpeed = 0.75 | 1 | 1.25 | 1.5;

type TTSProvider = "edge" | "browser";

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  speed: TTSSpeed;
  voiceAvailable: boolean;
  provider: TTSProvider;
}

/**
 * Hybrid TTS hook: Edge-TTS (server, neural voices) primary,
 * Web Speech API (browser-native) fallback.
 *
 * Same external API as before — drop-in replacement.
 */
export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    speed: 1,
    voiceAvailable: true, // Edge-TTS is always available (server-side)
    provider: "edge",
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /** Stop everything (both providers) */
  const stop = useCallback(() => {
    // Stop Edge-TTS audio
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Revoke blob URL to free memory
      if (audioRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = "";
    }
    // Stop Web Speech API
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState((s) => ({ ...s, isPlaying: false, isPaused: false }));
  }, []);

  /** Speak via Edge-TTS (server-side neural voices) */
  const speakEdge = useCallback(
    async (text: string, lang: string) => {
      stop();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang, speed: state.speed }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`TTS API ${res.status}`);

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        // Create or reuse audio element
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        audio.src = url;

        audio.onplay = () =>
          setState((s) => ({ ...s, isPlaying: true, isPaused: false, provider: "edge" }));
        audio.onpause = () => {
          if (!audio.ended) {
            setState((s) => ({ ...s, isPaused: true }));
          }
        };
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setState((s) => ({ ...s, isPlaying: false, isPaused: false }));
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setState((s) => ({ ...s, isPlaying: false, isPaused: false }));
        };

        await audio.play();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.warn("[TTS] Edge-TTS failed, falling back to browser:", err);
        // Fallback to Web Speech API
        speakBrowser(text, lang);
      }
    },
    [state.speed, stop] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Fallback: speak via browser Web Speech API */
  const speakBrowser = useCallback(
    (text: string, lang: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = state.speed;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Find best voice for language
      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang.startsWith(lang) && v.name.includes("Google")) ||
        voices.find((v) => v.lang.startsWith(lang)) ||
        voices.find((v) => v.lang.startsWith(lang.split("-")[0])) ||
        null;
      if (voice) utterance.voice = voice;

      utterance.onstart = () =>
        setState((s) => ({ ...s, isPlaying: true, isPaused: false, provider: "browser" }));
      utterance.onend = () =>
        setState((s) => ({ ...s, isPlaying: false, isPaused: false }));
      utterance.onerror = () =>
        setState((s) => ({ ...s, isPlaying: false, isPaused: false }));
      utterance.onpause = () =>
        setState((s) => ({ ...s, isPaused: true }));
      utterance.onresume = () =>
        setState((s) => ({ ...s, isPaused: false }));

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [state.speed]
  );

  /** Start speaking text — tries Edge-TTS first, falls back to browser */
  const speak = useCallback(
    (text: string, lang: string = "en") => {
      speakEdge(text, lang);
    },
    [speakEdge]
  );

  /** Pause speech (works for both providers) */
  const pause = useCallback(() => {
    if (state.provider === "edge" && audioRef.current) {
      audioRef.current.pause();
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, [state.provider]);

  /** Resume speech (works for both providers) */
  const resume = useCallback(() => {
    if (state.provider === "edge" && audioRef.current) {
      audioRef.current.play();
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, [state.provider]);

  /** Change speed */
  const setSpeed = useCallback((speed: TTSSpeed) => {
    setState((s) => ({ ...s, speed }));
    // If Edge-TTS audio is playing, adjust playback rate live
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  return {
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    speed: state.speed,
    voiceAvailable: state.voiceAvailable,
    provider: state.provider,
    speak,
    pause,
    resume,
    stop,
    setSpeed,
  };
}
