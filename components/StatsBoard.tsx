import React from 'react';
import { Gauge, Target, Activity, Clock } from 'lucide-react';
import { TypingState } from '../types';

interface Props {
  wpm: number;
  accuracy: number;
  status: TypingState;
  timeLeft: number;
  errors: number;
}

export const StatsBoard: React.FC<Props> = ({ wpm, accuracy, status, errors }) => {
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
            <Clock className="w-4 h-4" /> Status
        </div>
        <span className="text-lg font-mono font-bold text-slate-600 dark:text-slate-300">
            {status === 'RUNNING' ? 'Typing...' : status === 'FINISHED' ? 'Done' : 'Ready'}
        </span>
      </div>
    </div>
  );
};