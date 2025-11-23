import React from 'react';
import { AnalysisResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AnalysisCardProps {
  result: AnalysisResult;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ result }) => {
  // Prepare data for Radar Chart (Emotions)
  const emotionData = [
    { subject: 'Alegría', A: Math.round(result.metrics.joy * 100), fullMark: 100 },
    { subject: 'Tristeza', A: Math.round(result.metrics.sorrow * 100), fullMark: 100 },
    { subject: 'Ira', A: Math.round(result.metrics.anger * 100), fullMark: 100 },
    { subject: 'Sorpresa', A: Math.round(result.metrics.surprise * 100), fullMark: 100 },
  ];

  // Prepare data for linear metrics
  const confidenceData = [
    { name: 'Confianza (IA)', value: result.sentiment.confidence, fill: '#6366f1' },
    { name: 'Apertura Ojos', value: Math.round(result.metrics.eyeOpenness * 100), fill: '#ec4899' },
  ];

  return (
    <div className="w-full bg-surface rounded-2xl p-6 shadow-xl border border-gray-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {result.sentiment.primary}
          </h2>
          <p className="text-gray-400 mt-1">{result.sentiment.description}</p>
        </div>
        <div className="flex items-center gap-4 bg-dark/50 p-2 rounded-lg border border-gray-700">
           <div className="text-right">
             <div className="text-[10px] text-gray-500 uppercase tracking-wider">Edad Estimada</div>
             <div className="text-xl font-mono font-bold text-white leading-none">{result.demographics.ageRange}</div>
           </div>
           <div className="h-8 w-[1px] bg-gray-700"></div>
           <div className="text-right">
             <div className="text-[10px] text-gray-500 uppercase tracking-wider">Género</div>
             <div className="text-lg font-mono text-white leading-none">{result.demographics.genderPrediction}</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Radar Chart for Emotions */}
        <div className="bg-dark/50 p-4 rounded-xl border border-gray-700 relative overflow-hidden">
          <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider absolute top-4 left-4 z-10">Biometría Emocional</h3>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={emotionData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Intensidad"
                  dataKey="A"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="#6366f1"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">Análisis de micro-expresiones via MediaPipe</div>
        </div>

        {/* Linear Metrics */}
        <div className="bg-dark/50 p-4 rounded-xl border border-gray-700 flex flex-col">
          <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Indicadores Técnicos</h3>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={confidenceData}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={90} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff'}}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {confidenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
             <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Estilo / Vibe</span>
                <span className="text-sm font-bold text-secondary">{result.aesthetics.vibe}</span>
             </div>
             <div className="mt-2 flex flex-wrap gap-1 justify-end">
                {result.aesthetics.colors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-gray-600" style={{backgroundColor: 'gray'}} title={c}></div>
                ))}
                <span className="text-xs text-gray-500 ml-1 self-center">Paleta detectada</span>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="group p-4 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
          <div className="text-indigo-400 text-xs font-bold uppercase mb-1">Soundtrack</div>
          <div className="text-white flex items-center gap-2 text-sm md:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            {result.recommendations.music}
          </div>
        </div>

        <div className="group p-4 rounded-xl bg-gradient-to-br from-pink-900/20 to-rose-900/20 border border-pink-500/20 hover:border-pink-500/40 transition-colors">
          <div className="text-pink-400 text-xs font-bold uppercase mb-1">Actividad Sugerida</div>
          <div className="text-white flex items-center gap-2 text-sm md:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {result.recommendations.activity}
          </div>
        </div>
      </div>
    </div>
  );
};
