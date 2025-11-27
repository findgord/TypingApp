import React from 'react';
import { RotateCcw, BrainCircuit, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  wpm: number;
  accuracy: number;
  errors: Record<string, number>;
  onRestart: () => void;
  onGenerateDrill: () => void;
}

export const ResultsModal: React.FC<Props> = ({ wpm, accuracy, errors, onRestart, onGenerateDrill }) => {
  const errorData = Object.entries(errors)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([char, count]) => ({ char, count }));

  return (
    <div className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-[fadeIn_0.2s_ease-out] transition-colors">
        
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-3xl font-bold text-brand-900 dark:text-brand-100 mb-1">Session Complete</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Here is how you performed</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Gross WPM</div>
              <div className="text-4xl font-bold text-brand-800 dark:text-brand-200">{wpm}</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Accuracy</div>
              <div className={`text-4xl font-bold ${accuracy >= 95 ? 'text-brand-600 dark:text-brand-400' : 'text-brand-accent'}`}>
                {accuracy}%
              </div>
            </div>
          </div>

          {/* Error Analysis Chart */}
          {errorData.length > 0 ? (
            <div className="h-40 w-full">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase font-bold tracking-wider flex items-center gap-2">
                 <XCircle className="w-4 h-4" /> Missed Keys
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorData}>
                  <XAxis dataKey="char" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ 
                      backgroundColor: 'var(--tw-content-bg, #fff)', 
                      borderColor: 'var(--tw-content-border, #e2e8f0)', 
                      borderRadius: '8px', 
                      color: 'var(--tw-content-color, #0f172a)' 
                    }}
                    itemStyle={{ color: 'inherit' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {errorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#f87171" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/20 p-4 rounded-lg border border-brand-100 dark:border-brand-800">
               Perfect run! No errors detected.
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {errorData.length > 0 && (
              <button
                onClick={onGenerateDrill}
                className="w-full flex items-center justify-center gap-2 bg-brand-800 dark:bg-brand-700 hover:bg-brand-700 dark:hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-900/10 dark:shadow-none group"
              >
                <BrainCircuit className="w-5 h-5" />
                <span>Create Personalized AI Drill</span>
              </button>
            )}
            
            <button
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Next Random Lesson</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};