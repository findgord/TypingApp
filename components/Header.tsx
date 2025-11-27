import React from 'react';
import { Keyboard, Cpu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="relative">
       {/* Decorative Orange Circle from design */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-accent rounded-full opacity-100 -z-10 blur-0 mix-blend-multiply dark:mix-blend-normal dark:opacity-20" />

      <header className="flex justify-between items-center pb-6 pt-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-brand-800 dark:bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-900/10 dark:shadow-none transition-colors">
            <Keyboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-900 dark:text-brand-100 tracking-tight transition-colors">
              Somewhere
            </h1>
            <p className="text-xs text-brand-700 dark:text-brand-300 font-semibold uppercase tracking-widest transition-colors">
              Typing Test
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-brand-800 dark:text-brand-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-brand-800 dark:text-brand-200 bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 px-3 py-1 rounded-full shadow-sm transition-colors">
             <Cpu className="w-3 h-3" />
             <span>Engine: Gemini 2.5 Flash</span>
          </div>
        </div>
      </header>
    </div>
  );
};