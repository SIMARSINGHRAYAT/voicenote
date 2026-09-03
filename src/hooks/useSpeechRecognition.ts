"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_LANGUAGE } from "@/lib/languages";
import { appendCommittedTranscript, applySpokenPunctuation } from "@/lib/transcript";
import type { RecorderStatus, SpeechHookState } from "@/types/transcription";

interface UseSpeechRecognitionResult {
  state: SpeechHookState;
  language: string;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  clear: () => void;
  setLanguage: (language: string) => void;
}

function mapRecognitionError(error: string): { status: RecorderStatus; message: string } {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return {
        status: "permission-denied",
        message: "Microphone permission was denied. Please allow microphone access and try again.",
      };
    case "audio-capture":
      return {
        status: "microphone-unavailable",
        message: "Microphone access could not be established. Please check your device and browser settings.",
      };
    case "network":
      return {
        status: "reconnecting",
        message: "Connection interrupted. Reconnecting…",
      };
    case "language-not-supported":
      return {
        status: "error",
        message: "The selected language is not supported by your browser speech engine.",
      };
    case "no-speech":
      return {
        status: "listening",
        message: "No speech detected yet. Keep speaking clearly into your microphone.",
      };
    default:
      return {
        status: "error",
        message: "Speech recognition is temporarily unavailable. Please try again.",
      };
  }
}

function getSpeechRecognitionConstructor(): SpeechRecognitionStatic | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [committedText, setCommittedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [status, setStatus] = useState<RecorderStatus>("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [isSupported, setIsSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldKeepRunningRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const isSecureContextAvailable = typeof window === "undefined" ? true : window.isSecureContext;

  useEffect(() => {
    setIsSupported(getSpeechRecognitionConstructor() !== null);
  }, []);

  const stopDurationTicker = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startDurationTicker = useCallback(() => {
    startedAtRef.current = Date.now() - durationMs;
    durationIntervalRef.current = setInterval(() => {
      if (startedAtRef.current) {
        setDurationMs(Date.now() - startedAtRef.current);
      }
    }, 250);
  }, [durationMs]);

  const stopAudioMeter = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const runAudioMeter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      return;
    }

    const samples = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(samples);

      let sumSquares = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const normalized = (samples[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / samples.length);
      const nextLevel = Math.min(1, Math.max(0, rms * 3));
      setAudioLevel((prev) => prev * 0.4 + nextLevel * 0.6);

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const cleanupAudioResources = useCallback(async () => {
    stopAudioMeter();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stopAudioMeter]);

  const setupAudioStream = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("MEDIA_DEVICES_UNAVAILABLE");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    streamRef.current = stream;

    const audioContext = new window.AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.85;

    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    runAudioMeter();
  }, [runAudioMeter]);

  const detachRecognitionHandlers = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    recognitionRef.current.onresult = null;
    recognitionRef.current.onerror = null;
    recognitionRef.current.onend = null;
    recognitionRef.current.onstart = null;
  }, []);

  const stopRecognitionOnly = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    detachRecognitionHandlers();

    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore stop race errors from browser API.
    }

    recognitionRef.current = null;
  }, [detachRecognitionHandlers]);

  const initRecognition = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      return null;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          setCommittedText((previous) => appendCommittedTranscript(previous, transcript));
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }

      setInterimText(applySpokenPunctuation(interim));
      setErrorMessage(null);
      reconnectAttemptsRef.current = 0;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const mapped = mapRecognitionError(event.error);
      setStatus(mapped.status);
      setErrorMessage(mapped.message);

      if (event.error === "network" && shouldKeepRunningRef.current) {
        reconnectAttemptsRef.current += 1;
      }
    };

    recognition.onstart = () => {
      setStatus("listening");
      setErrorMessage(null);
    };

    recognition.onend = () => {
      if (intentionalStopRef.current || !shouldKeepRunningRef.current) {
        return;
      }

      setStatus("reconnecting");
      const retryDelay = Math.min(250 * 2 ** reconnectAttemptsRef.current, 4_000);
      reconnectAttemptsRef.current += 1;

      window.setTimeout(() => {
        if (!recognitionRef.current || !shouldKeepRunningRef.current) {
          return;
        }

        try {
          recognitionRef.current.start();
        } catch {
          setStatus("error");
          setErrorMessage("Speech recognition could not restart automatically.");
        }
      }, retryDelay);
    };

    return recognition;
  }, [language]);

  const start = useCallback(async () => {
    if (!isSupported) {
      setStatus("unsupported");
      setErrorMessage("Your browser does not support real-time speech recognition.");
      return;
    }

    if (!isSecureContextAvailable) {
      setStatus("error");
      setErrorMessage("Microphone access requires HTTPS or localhost.");
      return;
    }

    setStatus("requesting-permission");
    setErrorMessage(null);

    intentionalStopRef.current = false;
    shouldKeepRunningRef.current = true;

    try {
      if (!streamRef.current) {
        await setupAudioStream();
      }

      if (!recognitionRef.current) {
        const recognition = initRecognition();
        if (!recognition) {
          setStatus("unsupported");
          setErrorMessage("Your browser does not support real-time speech recognition.");
          return;
        }

        recognitionRef.current = recognition;
      }

      if (!durationIntervalRef.current) {
        startDurationTicker();
      }

      recognitionRef.current.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

      if (message.includes("denied") || message.includes("Permission") || message === "NotAllowedError") {
        setStatus("permission-denied");
        setErrorMessage("Microphone permission was denied. Please allow microphone access and try again.");
      } else {
        setStatus("microphone-unavailable");
        setErrorMessage("Microphone access could not be established. Please check your browser permissions.");
      }

      shouldKeepRunningRef.current = false;
      stopDurationTicker();
      await cleanupAudioResources();
    }
  }, [cleanupAudioResources, initRecognition, isSecureContextAvailable, isSupported, setupAudioStream, startDurationTicker, stopDurationTicker]);

  const pause = useCallback(() => {
    if (!recognitionRef.current || status !== "listening") {
      return;
    }

    intentionalStopRef.current = true;
    shouldKeepRunningRef.current = false;

    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore API stop races.
    }

    setStatus("paused");
    stopDurationTicker();
  }, [status, stopDurationTicker]);

  const resume = useCallback(() => {
    if (!recognitionRef.current || status !== "paused") {
      return;
    }

    intentionalStopRef.current = false;
    shouldKeepRunningRef.current = true;
    setInterimText("");
    startDurationTicker();

    try {
      recognitionRef.current.start();
    } catch {
      setStatus("error");
      setErrorMessage("Speech recognition could not resume. Please press Start again.");
    }
  }, [startDurationTicker, status]);

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    shouldKeepRunningRef.current = false;
    setStatus("stopping");
    setInterimText("");
    stopDurationTicker();

    stopRecognitionOnly();

    void cleanupAudioResources().finally(() => {
      setStatus("ready");
    });
  }, [cleanupAudioResources, stopDurationTicker, stopRecognitionOnly]);

  const clear = useCallback(() => {
    setCommittedText("");
    setInterimText("");
    setDurationMs(0);
    startedAtRef.current = null;
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      shouldKeepRunningRef.current = false;
      stopDurationTicker();
      stopRecognitionOnly();
      void cleanupAudioResources();
    };
  }, [cleanupAudioResources, stopDurationTicker, stopRecognitionOnly]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const computedStatus: RecorderStatus =
    !isSupported ? "unsupported" : status === "ready" && !isSecureContextAvailable ? "error" : status;

  return {
    state: {
      committedText,
      interimText,
      status: computedStatus,
      errorMessage,
      isSupported,
      isSecureContext: isSecureContextAvailable,
      audioLevel,
      durationMs,
    },
    language,
    start,
    pause,
    resume,
    stop,
    clear,
    setLanguage,
  };
}