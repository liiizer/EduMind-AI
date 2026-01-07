import React from 'react';
import { PedagogicalState, StructuredAIResponse } from '../types';
import { Activity, BrainCircuit, CheckCircle, ArrowRight } from 'lucide-react';

interface Props {
  currentState: PedagogicalState;
  lastMetadata?: StructuredAIResponse;
}

export const StateVisualizer: React.FC<Props> = ({ currentState, lastMetadata }) => {
  
  const getStateColor = (state: PedagogicalState) => {
    if (currentState === state) return 'bg-blue-600 text-white shadow-lg scale-105';
    return 'bg-gray-100 text-gray-400 border border-gray-200';
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-blue-600" />
        Pedagogical State Machine
      </h3>

      {/* State Flow Visualization */}
      <div className="flex flex-col gap-4 mb-6 relative">
        {/* Connection Line */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100 -z-0"></div>

        <div className={`relative z-10 p-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${getStateColor(PedagogicalState.GUIDING)}`}>
          <div className="font-mono text-xs font-bold w-6 text-center">01</div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Guiding</div>
            <div className="text-xs opacity-80">Socratic Questioning</div>
          </div>
          {currentState === PedagogicalState.GUIDING && <Activity className="w-4 h-4 animate-pulse" />}
        </div>

        <div className={`relative z-10 p-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${getStateColor(PedagogicalState.EXPLAINING)}`}>
          <div className="font-mono text-xs font-bold w-6 text-center">02</div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Explaining</div>
            <div className="text-xs opacity-80">Concept Deep Dive</div>
          </div>
          {currentState === PedagogicalState.EXPLAINING && <Activity className="w-4 h-4 animate-pulse" />}
        </div>

        <div className={`relative z-10 p-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${getStateColor(PedagogicalState.QUIZZING)}`}>
          <div className="font-mono text-xs font-bold w-6 text-center">03</div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Quizzing</div>
            <div className="text-xs opacity-80">Consolidation</div>
          </div>
          {currentState === PedagogicalState.QUIZZING && <Activity className="w-4 h-4 animate-pulse" />}
        </div>
      </div>

      {/* Knowledge Extraction Card (Hidden Output) */}
      {lastMetadata && (
        <div className="mt-auto bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Knowledge Trace (Hidden)</span>
            {lastMetadata.is_direct_answer_attempt && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                Guardrail: Blocked Answer
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="text-xs text-slate-400">Concept ID</div>
              <div className="text-sm font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-100">
                {lastMetadata.knowledge_point_id || 'ANALYZING...'}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Mastery Score</span>
                <span>{lastMetadata.student_mastery_score}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${lastMetadata.student_mastery_score}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400 mb-1">Internal Monologue</div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "{lastMetadata.internal_monologue}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};