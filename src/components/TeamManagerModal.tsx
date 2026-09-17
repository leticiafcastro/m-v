import React, { useState } from 'react';
import { Users, Plus, Trash2, RotateCcw, X, Check, Sparkles } from 'lucide-react';
import { Team } from '../types';

interface TeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
  onResetScores: () => void;
}

const AVAILABLE_AVATARS = ['🦁', '⚡', '🔥', '🚀', '🦉', '💡', '🎯', '👑', '🐺', '🌟', '🐬', '🦾', '🦅', '🏆', '💎', '🧠'];
const AVAILABLE_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  isOpen,
  onClose,
  teams,
  onUpdateTeams,
  onResetScores,
}) => {
  const [teamList, setTeamList] = useState<Team[]>(teams);
  const [newTeamName, setNewTeamName] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (id: string, name: string) => {
    setTeamList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name } : t))
    );
  };

  const handleAvatarChange = (id: string, avatar: string) => {
    setTeamList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, avatar } : t))
    );
  };

  const handleColorChange = (id: string, color: string) => {
    setTeamList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, color } : t))
    );
  };

  const handleRemoveTeam = (id: string) => {
    if (teamList.length <= 2) {
      alert('É necessário ter ao menos 2 equipes para a dinâmica em grupo.');
      return;
    }
    setTeamList((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTeam = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const count = teamList.length + 1;
    const name = newTeamName.trim() || `Equipe ${count}`;
    const avatar = AVAILABLE_AVATARS[(count - 1) % AVAILABLE_AVATARS.length];
    const color = AVAILABLE_COLORS[(count - 1) % AVAILABLE_COLORS.length];

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name,
      avatar,
      color,
      score: 0,
      streak: 0,
      lastPointsEarned: 0,
      currentAnswer: null,
      answerTimeLeft: null,
    };

    setTeamList((prev) => [...prev, newTeam]);
    setNewTeamName('');
  };

  const handleQuickSetup = (count: number) => {
    const names = [
      'Equipe Alfa', 'Os Neurônios', 'Equipe Fênix', 'Mentes Brilhantes',
      'Trovão Dourado', 'Os Cientistas', 'Equipe Einstein', 'Vanguarda'
    ];
    const newTeams: Team[] = [];
    for (let i = 0; i < count; i++) {
      newTeams.push({
        id: `team-quick-${i + 1}-${Date.now()}`,
        name: names[i] || `Grupo ${i + 1}`,
        avatar: AVAILABLE_AVATARS[i % AVAILABLE_AVATARS.length],
        color: AVAILABLE_COLORS[i % AVAILABLE_COLORS.length],
        score: 0,
        streak: 0,
        lastPointsEarned: 0,
        currentAnswer: null,
        answerTimeLeft: null,
      });
    }
    setTeamList(newTeams);
  };

  const handleSave = () => {
    onUpdateTeams(teamList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-800/80 border-b border-slate-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Equipes & Grupos da Aula</h2>
              <p className="text-xs text-slate-400">
                Organize as equipes que vão competir e debater as questões em sala
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Quick presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Divisão Rápida da Sala:
            </span>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickSetup(num)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  {num} Grupos
                </button>
              ))}
            </div>
          </div>

          {/* Teams List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {teamList.map((team, index) => (
              <div
                key={team.id}
                className="flex items-center gap-3 p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl"
              >
                <span className="text-xs font-bold text-slate-500 w-5 text-center">
                  #{index + 1}
                </span>

                {/* Avatar selection */}
                <select
                  value={team.avatar}
                  onChange={(e) => handleAvatarChange(team.id, e.target.value)}
                  className="w-10 h-10 text-xl bg-slate-900 border border-slate-700 rounded-xl text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                  title="Alterar Mascote"
                >
                  {AVAILABLE_AVATARS.map((emoji) => (
                    <option key={emoji} value={emoji}>
                      {emoji}
                    </option>
                  ))}
                </select>

                {/* Name */}
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => handleNameChange(team.id, e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do grupo..."
                />

                {/* Color Dot Picker */}
                <div className="flex items-center gap-1">
                  {AVAILABLE_COLORS.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(team.id, c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        team.color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                      title="Mudar cor"
                    />
                  ))}
                </div>

                {/* Current Score Tag */}
                <div className="text-xs font-mono px-2 py-1 bg-slate-900 rounded-md text-amber-300 font-bold border border-slate-700">
                  {team.score} pts
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveTeam(team.id)}
                  disabled={teamList.length <= 2}
                  className="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-30 transition-colors"
                  title="Remover equipe"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Team Bar */}
          <form onSubmit={handleAddTeam} className="flex gap-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nome da nova equipe (ex: Grupo dos Matemáticos)..."
              className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Equipe</span>
            </button>
          </form>

          {/* Footer with Reset Scores & Save */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm('Tem certeza que deseja zerar os pontos e acertos de todas as equipes?')) {
                  onResetScores();
                  setTeamList((prev) =>
                    prev.map((t) => ({ ...t, score: 0, streak: 0, lastPointsEarned: 0 }))
                  );
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 border border-red-900/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zerar Pontuação</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Equipes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
