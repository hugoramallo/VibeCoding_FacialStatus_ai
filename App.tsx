import React, { useState, useCallback } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { AnalysisCard } from './components/AnalysisCard';
import { analyzeFace } from './services/geminiService';
import { AnalysisResult, AppState, FaceMetrics } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING_MODEL);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleModelLoaded = useCallback(() => {
    setAppState(AppState.IDLE);
  }, []);

  const handleCapture = useCallback(async (imageSrc: string, metrics: FaceMetrics) => {
    setAppState(AppState.ANALYZING);
    setError(null);
    
    try {
      // We pass the metrics captured from MediaPipe to Gemini logic if we needed to enhance context,
      // but mostly we merge them into the final result.
      const analysis = await analyzeFace(imageSrc, metrics);
      setResult(analysis);
      setAppState(AppState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("No se pudo analizar la imagen. Intenta nuevamente.");
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-dark text-white p-4 md:p-8 font-sans selection:bg-primary selection:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-secondary">
                VibeCheck AI
              </span>
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Análisis Biométrico + Gemini 2.5 Intelligence
            </p>
          </div>
          
          <div className="hidden md:block text-right">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gray-700">
               <div className={`w-2 h-2 rounded-full ${appState === AppState.LOADING_MODEL ? 'bg-yellow-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></div>
               <span className="text-sm font-mono text-gray-300">
                 {appState === AppState.LOADING_MODEL ? 'Initializing Neural Net...' : 'Systems Online'}
               </span>
             </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Camera Section - Spans 7 columns on large screens */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface p-1 rounded-3xl shadow-2xl shadow-primary/10 border border-gray-700 relative overflow-hidden">
              <CameraFeed 
                appState={appState} 
                onCapture={handleCapture} 
                onModelLoad={handleModelLoaded}
              />
            </div>
            
            {appState === AppState.ANALYZING && (
               <div className="text-center p-4 animate-pulse">
                 <p className="text-primary font-mono text-lg">Procesando tensores multimodales...</p>
                 <div className="flex justify-center gap-1 mt-2">
                    <span className="w-1 h-4 bg-primary animate-[pulse_1s_ease-in-out_infinite]"></span>
                    <span className="w-1 h-4 bg-primary animate-[pulse_1s_ease-in-out_0.2s_infinite]"></span>
                    <span className="w-1 h-4 bg-primary animate-[pulse_1s_ease-in-out_0.4s_infinite]"></span>
                 </div>
               </div>
            )}
            
            {appState === AppState.ERROR && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* Results Section - Spans 5 columns on large screens */}
          <div className="lg:col-span-5">
            {result ? (
              <div className="flex flex-col gap-4">
                <AnalysisCard result={result} />
                <button 
                  onClick={handleReset}
                  className="w-full py-4 rounded-xl bg-surface border border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-300 font-bold transition-all uppercase tracking-widest text-sm shadow-lg"
                >
                  Escanear Nuevo Sujeto
                </button>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-600 bg-surface/30 rounded-3xl border-2 border-dashed border-gray-700 p-8 relative overflow-hidden">
                {appState === AppState.LOADING_MODEL && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <p className="text-primary font-mono animate-pulse">Cargando MediaPipe...</p>
                  </div>
                )}
                <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-6 relative">
                   <div className="absolute inset-0 border-4 border-gray-700 rounded-full border-t-primary animate-spin duration-[3s]"></div>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                   </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Sistema en Espera</h3>
                <p className="text-center text-sm max-w-xs text-gray-500">
                  Alinea tu rostro con la malla de realidad aumentada para comenzar el análisis profundo.
                </p>
                
                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-xs opacity-50">
                   <div className="text-center">
                      <div className="text-xs font-mono text-gray-600">LANDMARKS</div>
                      <div className="text-lg font-bold text-gray-500">478</div>
                   </div>
                   <div className="text-center">
                      <div className="text-xs font-mono text-gray-600">LATENCY</div>
                      <div className="text-lg font-bold text-gray-500">~15ms</div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-800 text-center text-gray-600 text-sm flex flex-col md:flex-row justify-center gap-4">
          <p>Google Gemini 2.5 Flash</p>
          <span className="hidden md:inline">•</span>
          <p>MediaPipe Vision Tasks</p>
          <span className="hidden md:inline">•</span>
          <p>React + Tailwind</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
