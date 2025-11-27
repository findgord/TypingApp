import { useState, useEffect, useCallback, useRef } from 'react';
import { TypingState, InputMode } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Audio Helpers
function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function base64EncodeAudio(int16Array: Int16Array) {
  let binary = '';
  const bytes = new Uint8Array(int16Array.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const useTypingEngine = () => {
  const [text, setText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<TypingState>(TypingState.IDLE);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.KEYBOARD);
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState<Record<string, number>>({});

  // Timer State
  const [timeLimit, setTimeLimit] = useState<number>(0); // 0 means untimed
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Refs for Game Loop to avoid dependency staleness without re-renders
  const userInputRef = useRef("");
  const startTimeRef = useRef<number | null>(null);
  
  // Voice State Refs
  const liveSessionRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Sync refs with state
  useEffect(() => {
    userInputRef.current = userInput;
  }, [userInput]);

  // Main Game Loop (Timer & Stats)
  useEffect(() => {
    let intervalId: number;

    if (status === TypingState.RUNNING && inputMode === InputMode.KEYBOARD) {
      intervalId = window.setInterval(() => {
        const now = Date.now();
        const start = startTimeRef.current || now;
        const elapsedSeconds = (now - start) / 1000;
        
        // 1. Handle Timer Countdown
        if (timeLimit > 0) {
          const remaining = Math.max(0, Math.ceil(timeLimit - elapsedSeconds));
          setTimeLeft(remaining);

          if (remaining <= 0) {
            // Time is up!
            setStatus(TypingState.FINISHED);
            // We do not need to clear interval here, React cleanup will do it when status changes
          }
        }

        // 2. Live Stats Update
        // Avoid calculating if time is 0 to prevent Infinity
        if (elapsedSeconds > 0) {
          const currentInput = userInputRef.current;
          const wordsTyped = currentInput.length / 5;
          const currentWpm = Math.round(wordsTyped / (elapsedSeconds / 60));
          setWpm(currentWpm);
          
          // Recalculate accuracy based on current snapshot
          let correctChars = 0;
          for (let i = 0; i < currentInput.length; i++) {
             // Safe access even if text isn't in ref (it's stable usually)
             if (currentInput[i] === text[i]) correctChars++;
          }
          const currentAcc = currentInput.length > 0 ? Math.round((correctChars / currentInput.length) * 100) : 100;
          setAccuracy(currentAcc);
        }

      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, inputMode, timeLimit, text]); // Intentionally exclude userInput to prevent timer resets

  // Calculates final stats (used for completion)
  const calculateFinalStats = useCallback(() => {
    if (!startTime) return;
    const now = Date.now();
    const elapsedMin = (now - startTime) / 60000;
    if (elapsedMin <= 0) return;

    const wordsTyped = userInput.length / 5;
    const currentWpm = Math.round(wordsTyped / elapsedMin);
    setWpm(currentWpm);
  }, [startTime, userInput]);


  const handleInput = useCallback((input: string) => {
    if (status === TypingState.FINISHED || inputMode === InputMode.VOICE) return;

    if (status === TypingState.IDLE && input.length === 1) {
      setStatus(TypingState.RUNNING);
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now;
      
      // Initialize countdown display immediately
      if (timeLimit > 0) {
        setTimeLeft(timeLimit);
      }
    }

    if (input.length > userInput.length) {
      const newCharIndex = input.length - 1;
      const typedChar = input[newCharIndex];
      const targetChar = text[newCharIndex];

      if (typedChar !== targetChar) {
        setErrors(prev => ({
          ...prev,
          [targetChar]: (prev[targetChar] || 0) + 1
        }));
      }
    }

    setUserInput(input);

    // End condition for standard mode: typed everything
    if (input.length === text.length) {
      setStatus(TypingState.FINISHED);
      calculateFinalStats();
    }
  }, [status, userInput, text, calculateFinalStats, inputMode, timeLimit]);

  // --- Voice Logic (Gemini Live API) ---

  const cleanupAudio = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startVoiceSession = async () => {
    if (!process.env.API_KEY) {
      alert("API Key missing");
      return;
    }

    try {
      cleanupAudio(); // Ensure clean state
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
           onopen: () => console.log("Voice session connected"),
           onmessage: (msg: LiveServerMessage) => {
             if (msg.serverContent?.inputTranscription) {
               const chunk = msg.serverContent.inputTranscription.text;
               if (chunk) {
                 setUserInput(prev => prev + chunk);
               }
             }
           },
           onerror: (err) => {
             console.error("Voice session error", err);
           },
           onclose: () => console.log("Voice session closed")
        },
        config: {
          responseModalities: [Modality.AUDIO], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          inputAudioTranscription: {},
          systemInstruction: "You are a transcription assistant. Your only job is to receive audio and listen. Do not generate spoken responses.",
        }
      });
      
      sessionPromise.catch(err => {
        console.error("Session connection failed", err);
        cleanupAudio();
        alert("Failed to connect to Voice API");
      });

      liveSessionRef.current = sessionPromise;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        const base64Data = base64EncodeAudio(pcm16);
        
        sessionPromise.then((session) => {
          session.sendRealtimeInput({
            media: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Data
            },
          });
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setStatus(TypingState.RUNNING);
      setStartTime(Date.now());
      startTimeRef.current = Date.now();
      setWpm(0);
      setAccuracy(100);
      setErrors({});
      setUserInput(""); 

    } catch (err) {
      console.error("Failed to start voice session:", err);
      alert("Microphone access failed or API error.");
      cleanupAudio();
    }
  };

  const endVoiceSession = async (): Promise<string> => {
    cleanupAudio();
    if (liveSessionRef.current) {
      try {
        const session = await liveSessionRef.current;
        // @ts-ignore
        session.close && session.close();
      } catch (e) { /* ignore */ }
      liveSessionRef.current = null;
    }
    setStatus(TypingState.FINISHED);
    return userInput;
  };

  const setVoiceStats = (transcription: string, wpm: number, accuracy: number, errors: Record<string, number>) => {
    setUserInput(transcription); 
    setWpm(wpm);
    setAccuracy(accuracy);
    setErrors(errors);
    setStatus(TypingState.FINISHED);
  };

  const resetEngine = (newTimeLimit?: number) => {
    cleanupAudio();
    if (liveSessionRef.current) {
        try { 
            // @ts-ignore
            liveSessionRef.current.then(s => s.close && s.close());
        } catch(e) {}
        liveSessionRef.current = null;
    }
    
    if (newTimeLimit !== undefined) {
      setTimeLimit(newTimeLimit);
      setTimeLeft(newTimeLimit);
    } else {
      setTimeLeft(timeLimit);
    }

    setUserInput("");
    setStatus(TypingState.IDLE);
    setStartTime(null);
    startTimeRef.current = null;
    setWpm(0);
    setAccuracy(100);
    setErrors({});
  };

  return {
    text,
    setText,
    userInput,
    status,
    wpm,
    accuracy,
    errors,
    startTime,
    inputMode,
    timeLimit,
    timeLeft,
    setTimeLimit,
    setInputMode,
    handleInput,
    startVoiceSession,
    endVoiceSession,
    setVoiceStats,
    resetEngine
  };
};