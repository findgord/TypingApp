import React, { useState } from 'react';
import { GameMode, Difficulty, InputMode } from '../types';
import { TOPICS, TIME_OPTIONS } from '../constants';
import { Sliders, RefreshCw, Keyboard, Mic, FileText, Timer, ToggleLeft, ToggleRight } from 'lucide-react';

interface Props {
  mode: GameMode;
  setMode: (m: GameMode) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  topic: string;
  setTopic: (t: string) => void;
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  onApply: (customText?: string) => void;
  disabled: boolean;
  
  // Timer props
  isTimed: boolean;
  setIsTimed: (b: boolean) => void;
  timeLimit: number;
  setTimeLimit: (t: number) => void;
}

export const ConfigPanel: React.FC<Props> = ({ 
  mode, setMode, difficulty, setDifficulty, topic, setTopic, 
  inputMode, setInputMode, onApply, disabled,
  isTimed, setIsTimed, timeLimit, setTimeLimit
}) => {
  const [customText, setCustomText] = useState("");
  const isCustomMode = topic === "General";

  const handleApply = () => {
    if (isCustomMode) {
      if (customText.trim()) {
        onApply(customText);
      }
    } else {
      onApply();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-brand-accent shadow-sm p-6 flex flex-col gap-6 h-full transition-colors duration-300">
      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold border-b border-slate-100 dark:border-slate-800 pb-2 transition-colors">
        <Sliders className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        Configuration
      </div>

      <div className="space-y-5 flex-grow flex flex-col overflow-y-auto no-scrollbar pr-1">
        
        {/* Input Mode */}
        <div>
          <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2 uppercase">Input Mode</label>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
             <button
                onClick={() => setInputMode(InputMode.KEYBOARD)}
                disabled={disabled}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all
                  ${inputMode === InputMode.KEYBOARD 
                    ? 'bg-white dark:bg-slate-700 text-brand-900 dark:text-brand-100 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
             >
               <Keyboard className="w-3 h-3" /> Type
             </button>
             <button
                onClick={() => setInputMode(InputMode.VOICE)}
                disabled={disabled}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all
                  ${inputMode === InputMode.VOICE 
                    ? 'bg-brand-600 dark:bg-brand-700 text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
             >
               <Mic className="w-3 h-3" /> Speak
             </button>
          </div>
        </div>

        {/* Timed Mode Toggle - Only for Keyboard */}
        {inputMode === InputMode.KEYBOARD && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                <Timer className="w-3 h-3" /> Timed Test
              </label>
              <button 
                onClick={() => setIsTimed(!isTimed)}
                disabled={disabled}
                className="text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors"
              >
                {isTimed ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-300 dark:text-slate-600" />}
              </button>
            </div>
            
            {isTimed && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimeLimit(opt.value)}
                    disabled={disabled}
                    className={`px-2 py-2 text-xs rounded-md font-medium transition-all border
                      ${timeLimit === opt.value 
                        ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-100' 
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Topic */}
        <div>
          <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2 uppercase">Topic</label>
          <select 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 transition-colors"
          >
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Difficulty or Custom Text */}
        {isCustomMode ? (
          <div className="flex-grow flex flex-col">
             <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2 uppercase flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Custom Text
             </label>
             <textarea 
               value={customText}
               onChange={(e) => setCustomText(e.target.value)}
               disabled={disabled}
               placeholder="Paste your text here..."
               className="w-full flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 resize-none min-h-[100px] font-mono leading-relaxed placeholder-slate-400 dark:placeholder-slate-600 transition-colors"
             />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2 uppercase">Difficulty</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(Difficulty).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  disabled={disabled}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all
                    ${difficulty === d 
                      ? 'bg-brand-800 dark:bg-brand-700 text-white shadow-lg shadow-brand-900/10 dark:shadow-none' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleApply}
          disabled={disabled || (isCustomMode && !customText.trim())}
          className={`w-full mt-auto flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
             ${isCustomMode 
               ? 'bg-brand-800 dark:bg-brand-700 text-white hover:bg-brand-700 dark:hover:bg-brand-600 shadow-lg shadow-brand-900/10 dark:shadow-none' 
               : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
        >
          {isCustomMode ? (
             <>
               <FileText className="w-4 h-4" />
               Use Custom Text
             </>
          ) : (
             <>
               <RefreshCw className="w-4 h-4" />
               Generate New Text
             </>
          )}
        </button>
      </div>
    </div>
  );
};