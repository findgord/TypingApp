import React from 'react';
import { Gauge, Target, Activity, Clock, Timer } from 'lucide-react';
import { TypingState } from '../types';

interface Props {
  wpm: number;
  accuracy: number;
  status: TypingState;
  timeLeft: number;
  timeLimit: number;
  errors: number;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const StatsBoard: React.FC<Props> = ({ wpm, accuracy, status, timeLeft, timeLimit, errors }) => {
  // Determine what to show in the time box
  const showCountdown = timeLimit > 0;
  
  // If timed, show timeLeft. If untimed, we could show elapsed (not implemented passed prop yet), 
  // or just status. For now we show Status in untimed, and Time Left in timed.
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-brand-accent shadow-sm flex flex-col items-center justify-center gap-1 transition-colors">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
            <Gauge className="w-4 h-4" /> Gross WPM
        </div>
        <span className="text-3xl font-mono font-bold text-brand-900 dark:text-brand-100 transition-colors">
            {wpm}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-brand-accent shadow-sm flex flex-col items-center justify-center gap-1 transition-colors">
         <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
            <Target className="w-4 h-4" /> Accuracy
        </div>
        <span className={`text-3xl font-mono font-bold transition-colors ${accuracy < 90 ? 'text-brand-accent' : 'text-brand-900 dark:text-brand-100'}`}>
            {accuracy}%
        </span>
      </div>

       <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-brand-accent shadow-sm flex flex-col items-center justify-center gap-1">
         <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
            <Activity className="w-4 h-4" /> Errors
        </div>
        <span className={`text-3xl font-mono font-bold ${errors > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-600'}`}>
            {errors}
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-brand-accent shadow-sm flex flex-col items-center justify-center gap-1">
         <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
            {showCountdown ? <Timer className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {showCountdown ? 'Time Left' : 'Status'}
        </div>
        <span className={`text-xl font-mono font-bold ${showCountdown && timeLeft <= 10 && status === 'RUNNING' ? 'text-red-500 animate-pulse' : 'text-slate-600 dark:text-slate-300'}`}>
            {showCountdown ? formatTime(timeLeft) : (status === 'RUNNING' ? 'Typing...' : status === 'FINISHED' ? 'Done' : 'Ready')}
        </span>
      </div>
    </div>
  );
};