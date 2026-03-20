"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type TTSSpeed = 0.75 | 1 | 1.25 | 1.5;

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  speed: TTSSpeed;
  voiceAvailable: boolean;
}

/**
 * Hook for browser-native Text-to-Speech using Web Speech API.
 * Zero cost, zero bundle size, 30+ languages supported.
 */
export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    speed: 1,
    voiceAvailable: false,
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speech synthesis is available
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setState((s) => ({ ...s, voiceAvailable: voices.length > 0 }));
    };

    checkVoices();
    window.speechSynthesis.addEventListener("voiceschanged", checkVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", checkVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  /** Find the best voice for a given language */
  const findVoice = useCallback((lang: string): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined") return null;
    const voices = window.speechSynthesis.getVoices();

    // Prefer Google voices (higher quality on Chrome)
    const googleVoice = voices.find(
      (v) => v.lang.startsWith(lang) && v.name.includes("Google")
    );
    if (googleVoice) return googleVoice;

    // Then any voice matching the language
    const matchingVoice = voices.find((v) => v.lang.startsWith(lang));
    if (matchingVoice) return matchingVoice;

    // Fallback: try base language code
    const base = lang.split("-")[0];
    return voices.find((v) => v.lang.startsWith(base)) || null;
  }, []);

  /** Start speaking text */
  const speak = useCallback(
    (text: string, lang: string = "en") => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = state.speed;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voice = findVoice(lang);
      if (voice) utterance.voice = voice;

      utterance.onstart = () =>
        setState((s) => ({ ...s, isPlaying: true, isPaused: false }));
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
    [state.speed, findVoice]
  );

  /** Pause speech */
  const pause = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.pause();
  }, []);

  /** Resume speech */
  const resume = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.resume();
  }, []);

  /** Stop speech */
  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setState((s) => ({ ...s, isPlaying: false, isPaused: false }));
  }, []);

  /** Change speed */
  const setSpeed = useCallback((speed: TTSSpeed) => {
    setState((s) => ({ ...s, speed }));
  }, []);

  return {
    ...state,
    speak,
    pause,
    resume,
    stop,
    setSpeed,
  };
}
