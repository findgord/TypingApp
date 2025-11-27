import React, { useRef, useEffect } from 'react';
import { TypingState, InputMode } from '../types';
import { Mic, MicOff } from 'lucide-react';

interface Props {
  targetText: string;
  userInput: string;
  status: TypingState;
  inputMode: InputMode;
  onInput: (val: string) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
}

export const TypingArea: React.FC<Props> = ({ 
  targetText, userInput, status, inputMode, onInput, onStartVoice, onStopVoice 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input automatically if in keyboard mode
  useEffect(() => {
    if (status !== TypingState.FINISHED && inputMode === InputMode.KEYBOARD) {
      inputRef.current?.focus();
    }
  }, [status, targetText, inputMode]);

  // Keep focus when clicking anywhere in the container
  const handleContainerClick = () => {
    if (inputMode === InputMode.KEYBOARD) {
      inputRef.current?.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= targetText.length) {
      onInput(val);
    }
  };

  // Render logic to color characters
  const renderText = () => {
    return targetText.split('').map((char, index) => {
      let className = "transition-colors duration-75 ";
      
      if (index < userInput.length) {
        const inputChar = userInput[index];
        // Looser matching for voice? Strict for now to show accuracy.
        if (inputChar?.toLowerCase() === char.toLowerCase()) {
          className += "text-brand-900 dark:text-brand-100"; // Correct
        } else {
           if (inputMode === InputMode.VOICE) {
             className += "text-brand-accent"; // Soft error for voice
           } else {
             className += "text-red-500 bg-red-100 dark:bg-red-900/30 rounded-sm"; // Hard error for typing
           }
        }
      } else if (index === userInput.length) {
         if (inputMode === InputMode.KEYBOARD) {
            className += "text-brand-800 dark:text-brand-200 border-l-2 border-brand-500 animate-cursor pl-[1px]"; 
         } else {
            // Voice cursor
            className += "text-brand-800 dark:text-brand-200 border-b-2 border-brand-500 animate-pulse";
         }
      } else {
        className += "text-slate-300 dark:text-slate-600"; // Pending
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="relative h-full flex flex-col">
       <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative font-mono text-xl sm:text-2xl leading-relaxed cursor-text outline-none w-full min-h-[150px] flex-grow"
      >
        {inputMode === InputMode.KEYBOARD && (
          <input
            ref={inputRef}
            type="text"
            className="absolute opacity-0 -z-10 w-0 h-0"
            value={userInput}
            onChange={handleChange}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        )}
        
        <div className="break-words whitespace-pre-wrap">
          {renderText()}
        </div>
      </div>

      {/* Voice Controls Overlay */}
      {inputMode === InputMode.VOICE && status !== TypingState.FINISHED && (
        <div className="mt-8 flex flex-col items-center justify-center border-t border-slate-200 dark:border-slate-700 pt-6">
          {status === TypingState.IDLE ? (
            <button
              onClick={onStartVoice}
              className="flex items-center gap-3 bg-brand-800 hover:bg-brand-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-brand-900/10 dark:shadow-none group hover:scale-105"
            >
              <Mic className="w-6 h-6" />
              Start Reading
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-sm animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Listening to you...
              </div>
              <button
                onClick={onStopVoice}
                className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-8 py-4 rounded-full font-bold transition-all shadow-sm hover:scale-105"
              >
                <MicOff className="w-6 h-6" />
                Stop Recording
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};