import React, { useState, useEffect } from 'react';
import { TypingArea } from './components/TypingArea';
import { StatsBoard } from './components/StatsBoard';
import { ConfigPanel } from './components/ConfigPanel';
import { Header } from './components/Header';
import { ResultsModal } from './components/ResultsModal';
import { useTypingEngine } from './hooks/useTypingEngine';
import { generatePracticeText, generateRemedialDrill, analyzeProficiency } from './services/geminiService';
import { GameMode, Difficulty, TypingState, InputMode } from './types';
import { Loader, Wand2 } from 'lucide-react';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Game Configuration State
  const [mode, setMode] = useState<GameMode>(GameMode.STANDARD);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [topic, setTopic] = useState<string>("Technology");

  // Timer Configuration
  const [isTimed, setIsTimed] = useState(false);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(60);

  // Custom Hook for Typing Logic
  const {
    text,
    userInput,
    status,
    wpm,
    accuracy,
    errors,
    startTime,
    inputMode,
    timeLeft,
    timeLimit, // Actual engine time limit
    setInputMode,
    resetEngine,
    setText,
    handleInput,
    startVoiceSession,
    endVoiceSession,
    setVoiceStats
  } = useTypingEngine();

  // Initial Load
  useEffect(() => {
    loadNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNewGame = async (customText?: string) => {
    setLoading(true);
    setError(null);
    try {
      let newText = customText;
      if (!newText) {
         // If timed mode is active, request longer text
         newText = await generatePracticeText(topic, difficulty, isTimed);
      }
      
      // Pass the configured time limit to the engine. 0 if untimed.
      const engineTimeLimit = isTimed ? selectedTimeLimit : 0;
      resetEngine(engineTimeLimit);
      
      setText(newText);
    } catch (err) {
      setError("Failed to generate text. Please check your API key or connection.");
      // Fallback text if API fails
      setText("The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    loadNewGame();
  };

  const handleGenerateDrill = async (missedKeys: Record<string, number>) => {
    setLoading(true);
    try {
      // Find top 3 missed keys
      const sortedErrors = Object.entries(missedKeys).sort((a, b) => b[1] - a[1]);
      const topMissed = sortedErrors.slice(0, 4).map(([key]) => key);
      
      if (topMissed.length === 0) {
        // No errors, just harder text
        const newText = await generatePracticeText(topic, Difficulty.HARD, isTimed);
        const engineTimeLimit = isTimed ? selectedTimeLimit : 0;
        resetEngine(engineTimeLimit);
        setText(newText);
        setMode(GameMode.DRILL);
      } else {
        const drillText = await generateRemedialDrill(topMissed);
        const engineTimeLimit = isTimed ? selectedTimeLimit : 0;
        resetEngine(engineTimeLimit);
        setText(drillText);
        setMode(GameMode.DRILL);
      }
    } catch (err) {
      console.error(err);
      setError("Could not generate drill. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoice = () => {
    startVoiceSession();
  };

  const handleStopVoice = async () => {
    const finalTranscript = await endVoiceSession();
    
    // If user said nothing, just return
    if (!finalTranscript || finalTranscript.trim().length === 0) {
      return;
    }

    setAnalyzing(true);
    try {
      const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
      const results = await analyzeProficiency(text, finalTranscript, elapsedSeconds);
      setVoiceStats(finalTranscript, results.wpm, results.accuracy, results.errors);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze performance. Please try again.");
      resetEngine();
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to safely update timer config and reset engine if not running
  const updateTimerConfig = (newIsTimed: boolean, newLimit: number) => {
    setIsTimed(newIsTimed);
    setSelectedTimeLimit(newLimit);
    
    // If not running, update engine immediately to reflect time on UI
    if (status === TypingState.IDLE) {
      const limit = newIsTimed ? newLimit : 0;
      resetEngine(limit);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-4 py-8">
      <Header />
      
      <main className="flex-grow flex flex-col gap-8 mt-8">
        {/* Top Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
             <ConfigPanel 
               mode={mode} 
               setMode={setMode}
               difficulty={difficulty}
               setDifficulty={setDifficulty}
               topic={topic}
               setTopic={setTopic}
               inputMode={inputMode}
               setInputMode={(m) => {
                 const engineTimeLimit = isTimed ? selectedTimeLimit : 0;
                 resetEngine(engineTimeLimit);
                 setInputMode(m);
               }}
               onApply={(text) => loadNewGame(text)}
               disabled={status === TypingState.RUNNING || analyzing}
               
               // Timer Config
               isTimed={isTimed}
               setIsTimed={(val) => updateTimerConfig(val, selectedTimeLimit)}
               timeLimit={selectedTimeLimit}
               setTimeLimit={(val) => updateTimerConfig(isTimed, val)}
             />
          </div>
          
          <div className="md:col-span-9 flex flex-col gap-4">
            <StatsBoard 
              wpm={wpm} 
              accuracy={accuracy} 
              status={status} 
              timeLeft={timeLeft}
              timeLimit={timeLimit}
              errors={Object.keys(errors).length}
            />
            
            <div className="relative min-h-[300px] bg-white dark:bg-slate-900 rounded-2xl border border-brand-accent p-8 shadow-sm flex flex-col transition-colors duration-300">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10 rounded-2xl transition-colors">
                  <div className="flex flex-col items-center gap-4 text-brand-600 dark:text-brand-400">
                    <Loader className="w-10 h-10 animate-spin" />
                    <span className="font-mono text-sm tracking-widest uppercase">Generating Lesson...</span>
                  </div>
                </div>
              ) : analyzing ? (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl transition-colors">
                   <div className="flex flex-col items-center gap-4 text-brand-600 dark:text-brand-400">
                    <Wand2 className="w-10 h-10 animate-bounce" />
                    <span className="font-mono text-sm tracking-widest uppercase">AI Comparing Speech...</span>
                  </div>
                </div>
              ) : (
                <>
                  <TypingArea 
                    targetText={text}
                    userInput={userInput}
                    status={status}
                    inputMode={inputMode}
                    onInput={handleInput}
                    onStartVoice={handleStartVoice}
                    onStopVoice={handleStopVoice}
                  />
                  
                  {/* Overlay for Restart/Focus hint */}
                  {status === TypingState.IDLE && userInput.length === 0 && inputMode === InputMode.KEYBOARD && (
                    <div className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 text-xs font-mono animate-pulse">
                      {timeLimit > 0 ? `Timed Mode: ${timeLimit}s` : 'Start typing to begin...'}
                    </div>
                  )}
                </>
              )}
            </div>
            
             {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm font-mono">
                  {error}
                </div>
              )}
          </div>
        </div>
      </main>

      {status === TypingState.FINISHED && !analyzing && (
        <ResultsModal 
          wpm={wpm}
          accuracy={accuracy}
          errors={errors}
          onRestart={handleRestart}
          onGenerateDrill={() => handleGenerateDrill(errors)}
        />
      )}

      <footer className="mt-12 text-center text-slate-400 dark:text-slate-600 text-sm pb-8">
        <p>Powered by Google Gemini 2.5 Flash • React • Tailwind</p>
      </footer>
    </div>
  );
};

export default App;