import React, { useState } from 'react';
import { 
  Play, 
  Edit3, 
  Printer, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sparkles,
  Users,
  Award
} from 'lucide-react';
import { AppView, Quiz, Team } from '../types';
import { soundEngine } from '../utils/audio';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  activeQuiz: Quiz;
  teams: Team[];
  onOpenAiModal: () => void;
  onOpenTeamModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  activeQuiz,
  teams,
  onOpenAiModal,
  onOpenTeamModal,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());

  const toggleMute = () => {
    const nextState = !isMuted;
    soundEngine.setMuted(nextState);
    setIsMuted(nextState);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Active Quiz Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl shadow-inner">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white leading-tight">
                Quiz em Grupo para Aula
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Estilo Kahoot
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs" title={activeQuiz.title}>
              {activeQuiz.title} ({activeQuiz.questions.length} questões)
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onViewChange('play')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'play'
                ? 'bg-emerald-600 text-white shadow font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Jogar em Sala</span>
          </button>
          <button
            onClick={() => onViewChange('creator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'creator'
                ? 'bg-indigo-600 text-white shadow font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Quiz</span>
          </button>
          <button
            onClick={() => onViewChange('print')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'print'
                ? 'bg-purple-600 text-white shadow font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </nav>

        {/* Quick Actions & Utility Tools */}
        <div className="flex items-center gap-2">
          {/* AI Quiz Generator Button */}
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95"
            title="Criar novo quiz com IA para o assunto da aula"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span className="hidden md:inline">Gerar com IA</span>
            <span className="md:hidden">IA</span>
          </button>

          {/* Teams Setup Button */}
          <button
            onClick={onOpenTeamModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm transition-colors"
            title="Gerenciar Equipes da Turma"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Equipes ({teams.length})</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isMuted
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos Sonoros'}
            aria-label="Som"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Modo Tela Cheia (Projetor / TV)"
            aria-label="Tela Cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
