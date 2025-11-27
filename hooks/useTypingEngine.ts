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

  const timerRef = useRef<number | null>(null);
  
  // Voice State Refs
  const liveSessionRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const calculateStats = useCallback(() => {
    // Only auto-calculate stats in Keyboard mode
    if (inputMode === InputMode.VOICE || !startTime) return;
    
    const now = Date.now();
    const elapsedMin = (now - startTime) / 60000;
    
    const wordsTyped = userInput.length / 5;
    const currentWpm = elapsedMin > 0 ? Math.round(wordsTyped / elapsedMin) : 0;
    
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === text[i]) correctChars++;
    }
    const currentAcc = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100;

    setWpm(currentWpm);
    setAccuracy(currentAcc);
  }, [startTime, userInput, text, inputMode]);

  useEffect(() => {
    if (status === TypingState.RUNNING && inputMode === InputMode.KEYBOARD) {
      timerRef.current = window.setInterval(() => {
        calculateStats();
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, calculateStats, inputMode]);

  const handleInput = useCallback((input: string) => {
    if (status === TypingState.FINISHED || inputMode === InputMode.VOICE) return;

    if (status === TypingState.IDLE && input.length === 1) {
      setStatus(TypingState.RUNNING);
      setStartTime(Date.now());
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

    if (input.length === text.length) {
      setStatus(TypingState.FINISHED);
      calculateStats();
    }
  }, [status, userInput, text, calculateStats, inputMode]);

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
      
      // IMPORTANT: Do NOT await this. We need the promise to queue messages.
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
           onopen: () => console.log("Voice session connected"),
           onmessage: (msg: LiveServerMessage) => {
             // Handle transcription
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
      
      // Catch initial connection errors
      sessionPromise.catch(err => {
        console.error("Session connection failed", err);
        cleanupAudio();
        alert("Failed to connect to Voice API");
      });

      liveSessionRef.current = sessionPromise;

      // Start Microphone
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

      // Use ScriptProcessor for raw PCM access (bufferSize: 4096)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        const base64Data = base64EncodeAudio(pcm16);
        
        // Stream to Gemini using the promise
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

      // UI Updates
      setStatus(TypingState.RUNNING);
      setStartTime(Date.now());
      setWpm(0);
      setAccuracy(100);
      setErrors({});
      setUserInput(""); // Clear for new session

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
        // Resolve the promise to get the actual session object before closing
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
    // We keep the transcription that was built up, or update it if the analysis normalized it
    setUserInput(transcription); 
    setWpm(wpm);
    setAccuracy(accuracy);
    setErrors(errors);
    setStatus(TypingState.FINISHED);
  };

  const resetEngine = () => {
    cleanupAudio();
    if (liveSessionRef.current) {
        try { 
            // @ts-ignore
            liveSessionRef.current.then(s => s.close && s.close());
        } catch(e) {}
        liveSessionRef.current = null;
    }
    setUserInput("");
    setStatus(TypingState.IDLE);
    setStartTime(null);
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
    setInputMode,
    handleInput,
    startVoiceSession,
    endVoiceSession,
    setVoiceStats,
    resetEngine,
    calculateStats
  };
};