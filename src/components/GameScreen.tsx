import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  Users, 
  Sparkles,
  ChevronRight,
  Crown,
  Medal,
  Volume2
} from 'lucide-react';
import { Quiz, Team, GamePhase } from '../types';
import { KAHOOT_COLORS } from '../data/defaultQuizzes';
import { soundEngine } from '../utils/audio';

interface GameScreenProps {
  quiz: Quiz;
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
  onOpenTeamModal: () => void;
  onExitToCreator: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  quiz,
  teams,
  onUpdateTeams,
  onOpenTeamModal,
  onExitToCreator,
}) => {
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [getReadyCountdown, setGetReadyCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(25);
  const [activeTeamList, setActiveTeamList] = useState<Team[]>(teams);

  // Keep local team list in sync if parent teams change
  useEffect(() => {
    setActiveTeamList(teams);
  }, [teams]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const timerRef = useRef<any>(null);

  // Trigger Podium Confetti
  const triggerConfetti = () => {
    try {
      soundEngine.playFanfare();
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch {
      // Ignore confetti issues if canvas not supported
    }
  };

  // Start the 3-2-1 get-ready phase
  const startQuestionRound = (qIndex: number) => {
    setCurrentQuestionIndex(qIndex);
    setGetReadyCountdown(3);
    setPhase('get-ready');

    // Reset current answers for all teams
    setActiveTeamList((prev) =>
      prev.map((t) => ({
        ...t,
        currentAnswer: null,
        answerTimeLeft: null,
        lastPointsEarned: 0,
      }))
    );
  };

  // Get-ready 3, 2, 1 effect
  useEffect(() => {
    if (phase !== 'get-ready') return;

    soundEngine.playTick();
    const interval = setInterval(() => {
      setGetReadyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('question');
          setTimeLeft(quiz.questions[currentQuestionIndex]?.timeLimit || 25);
          return 0;
        }
        soundEngine.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, currentQuestionIndex, quiz.questions]);

  // Main Question Countdown Timer
  useEffect(() => {
    if (phase !== 'question') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }

        if (prev <= 5) {
          soundEngine.playUrgentTick();
        } else {
          soundEngine.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, activeTeamList]);

  // Handle a team submitting an answer
  const handleTeamSelectAnswer = (teamId: string, answerIndex: number) => {
    if (phase !== 'question') return;

    soundEngine.playTeamAnswer();

    setActiveTeamList((prev) => {
      const updated = prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            currentAnswer: answerIndex,
            answerTimeLeft: timeLeft,
          };
        }
        return t;
      });

      // Check if ALL teams have answered
      const allAnswered = updated.every((t) => t.currentAnswer !== null);
      if (allAnswered) {
        setTimeout(() => {
          handleTimeUp(updated);
        }, 400);
      }

      return updated;
    });
  };

  // Calculate scores and transition to Reveal phase
  const handleTimeUp = (teamsState?: Team[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    soundEngine.playReveal();

    const currentTeams = teamsState || activeTeamList;
    const correctIdx = currentQuestion.correctIndex;
    const totalTime = currentQuestion.timeLimit || 25;

    const scoredTeams = currentTeams.map((team) => {
      if (team.currentAnswer === correctIdx) {
        // Kahoot-style speed points formula
        const timeRatio = Math.max((team.answerTimeLeft || 0) / totalTime, 0.1);
        const speedBonus = Math.round(500 * timeRatio);
        const streakBonus = (team.streak || 0) * 100;
        const earned = 500 + speedBonus + streakBonus;

        return {
          ...team,
          score: team.score + earned,
          streak: (team.streak || 0) + 1,
          lastPointsEarned: earned,
        };
      } else {
        return {
          ...team,
          streak: 0,
          lastPointsEarned: 0,
        };
      }
    });

    setActiveTeamList(scoredTeams);
    onUpdateTeams(scoredTeams);
    setPhase('reveal');
  };

  // Move to round leaderboard
  const handleGoToLeaderboard = () => {
    setPhase('leaderboard');
  };

  // Move to next question or final podium
  const handleNextStep = () => {
    if (currentQuestionIndex + 1 < quiz.questions.length) {
      startQuestionRound(currentQuestionIndex + 1);
    } else {
      setPhase('podium');
      triggerConfetti();
    }
  };

  // Restart the whole quiz
  const handleRestartQuiz = () => {
    const reset = activeTeamList.map((t) => ({
      ...t,
      score: 0,
      streak: 0,
      lastPointsEarned: 0,
      currentAnswer: null,
      answerTimeLeft: null,
    }));
    setActiveTeamList(reset);
    onUpdateTeams(reset);
    setCurrentQuestionIndex(0);
    setPhase('lobby');
  };

  // Count distribution of answers for reveal phase
  const answerCounts = [0, 1, 2, 3].map(
    (idx) => activeTeamList.filter((t) => t.currentAnswer === idx).length
  );
  const totalSubmissions = activeTeamList.filter((t) => t.currentAnswer !== null).length;

  // Sorted teams for leaderboard and podium
  const sortedTeams = [...activeTeamList].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-950 text-white flex flex-col justify-between select-none">
      {/* ===================== PHASE 1: LOBBY ===================== */}
      {phase === 'lobby' && (
        <div className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Atividade de Fechamento de Aula
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {quiz.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              {quiz.description || 'Desafio interativo em equipes para testar e consolidar os aprendizados de hoje.'}
            </p>
          </div>

          {/* Teams Joined Grid */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Equipes Prontas na Sala ({activeTeamList.length})
              </span>
              <button
                onClick={onOpenTeamModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Gerenciar Equipes
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeTeamList.map((team) => (
                <div
                  key={team.id}
                  className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex flex-col items-center gap-1.5 text-center shadow-sm"
                >
                  <span className="text-3xl">{team.avatar}</span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                    {team.name}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quick instructions for the teacher */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 max-w-xl text-left space-y-1">
            <p className="font-semibold text-slate-300">Como funciona em sala:</p>
            <p>1. Projete esta tela para todos os alunos verem as perguntas e o cronômetro.</p>
            <p>2. Cada grupo debate em equipe e seleciona a cor correspondente no painel de respostas.</p>
            <p>3. As respostas ficam ocultas até o fim do tempo para garantir o sigilo entre os grupos!</p>
          </div>

          {/* Start Button */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onExitToCreator}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Voltar ao Editor
            </button>
            <button
              onClick={() => startQuestionRound(0)}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg sm:text-xl shadow-2xl shadow-emerald-950/60 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>Iniciar Desafio!</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== PHASE 2: GET-READY ===================== */}
      {phase === 'get-ready' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in zoom-in-95 duration-200">
          <span className="text-sm font-bold uppercase tracking-wider text-indigo-400">
            Questão {currentQuestionIndex + 1} de {quiz.questions.length}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white max-w-2xl">
            Preparem-se, Equipes!
          </h2>
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl sm:text-7xl font-black text-white shadow-2xl shadow-purple-950/80 animate-pulse">
            {getReadyCountdown}
          </div>
          <p className="text-xs sm:text-sm text-slate-400">Debatam em silêncio e fiquem atentos à tela...</p>
        </div>
      )}

      {/* ===================== PHASE 3: QUESTION ===================== */}
      {phase === 'question' && currentQuestion && (
        <div className="max-w-7xl mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-between gap-4">
          {/* Top Bar: Progress & Timer */}
          <div className="flex items-center justify-between gap-4">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-bold text-xs sm:text-sm text-indigo-300">
              Questão {currentQuestionIndex + 1} de {quiz.questions.length}
            </span>

            {/* Circular / Pill Timer */}
            <div
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-black text-lg sm:text-2xl shadow-lg transition-colors ${
                timeLeft <= 5
                  ? 'bg-red-600 text-white animate-bounce'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>{timeLeft}s</span>
            </div>

            {/* Submissions count & Early end button */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {totalSubmissions} / {activeTeamList.length} responderam
              </span>
              <button
                onClick={() => handleTimeUp()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold"
                title="Encerrar tempo da questão imediatamente"
              >
                Encerrar Tempo
              </button>
            </div>
          </div>

          {/* Question Display Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl min-h-[140px] sm:min-h-[180px] flex items-center justify-center">
            <h2 className="text-xl sm:text-3xl font-black text-white leading-snug max-w-4xl">
              {currentQuestion.question}
            </h2>
          </div>

          {/* 4 Kahoot Options (Screen Board) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentQuestion.options.map((optionText, optIdx) => {
              const colorConfig = KAHOOT_COLORS[optIdx];
              return (
                <div
                  key={optIdx}
                  className={`p-4 sm:p-5 rounded-2xl ${colorConfig.bg} text-white shadow-lg flex items-center gap-3.5 transition-transform`}
                >
                  <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-black/25 flex items-center justify-center text-xl sm:text-2xl font-black shrink-0">
                    {colorConfig.symbol}
                  </span>
                  <span className="text-sm sm:text-lg font-bold leading-tight flex-1">
                    {optionText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Classroom Group Answer Pad: Each team locks in their choice */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Painel de Resposta das Equipes (Clique na cor escolhida pelo seu grupo):
              </span>
              <span className="text-xs text-amber-400 font-medium">
                {totalSubmissions === activeTeamList.length ? 'Todas as equipes responderam!' : `${totalSubmissions}/${activeTeamList.length} grupos prontos`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {activeTeamList.map((team) => {
                const hasAnswered = team.currentAnswer !== null;

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-xl border transition-all ${
                      hasAnswered
                        ? 'bg-slate-800/90 border-emerald-500/60 shadow-inner'
                        : 'bg-slate-800/40 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xl">{team.avatar}</span>
                        <span className="text-xs font-bold text-white truncate max-w-[110px]">
                          {team.name}
                        </span>
                      </div>

                      {hasAnswered ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Salvo
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Aguardando...</span>
                      )}
                    </div>

                    {/* Team Color Selector Buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {KAHOOT_COLORS.map((col, cIdx) => {
                        const isChosen = team.currentAnswer === cIdx;
                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleTeamSelectAnswer(team.id, cIdx)}
                            className={`h-9 rounded-lg flex items-center justify-center font-black text-sm transition-all ${col.bg} ${
                              isChosen
                                ? 'ring-2 ring-white scale-105 shadow-md'
                                : 'opacity-80 hover:opacity-100 hover:scale-102'
                            }`}
                            title={`Equipe ${team.name} seleciona ${col.symbolName}`}
                          >
                            {col.symbol}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== PHASE 4: REVEAL ===================== */}
      {phase === 'reveal' && currentQuestion && (
        <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1 flex flex-col justify-between gap-6 animate-in fade-in duration-300">
          {/* Question Recap */}
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
              Resultado da Questão {currentQuestionIndex + 1}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white max-w-3xl mx-auto">
              {currentQuestion.question}
            </h2>
          </div>

          {/* 4 Options Highlighted + Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentQuestion.options.map((optionText, optIdx) => {
              const colorConfig = KAHOOT_COLORS[optIdx];
              const isCorrect = currentQuestion.correctIndex === optIdx;
              const count = answerCounts[optIdx];

              return (
                <div
                  key={optIdx}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    isCorrect
                      ? `${colorConfig.bg} border-emerald-400 ring-4 ring-emerald-400/40 shadow-xl scale-[1.01]`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-black/25 flex items-center justify-center font-black text-white text-lg">
                        {colorConfig.symbol}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white">
                        {optionText}
                      </span>
                    </div>

                    {isCorrect && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow">
                        <CheckCircle2 className="w-4 h-4" />
                        CORRETA
                      </span>
                    )}
                  </div>

                  {/* Team choices count pill */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-white">
                    <span>{count} {count === 1 ? 'equipe escolheu' : 'equipes escolheram'}</span>
                    <div className="flex -space-x-1">
                      {activeTeamList
                        .filter((t) => t.currentAnswer === optIdx)
                        .map((t) => (
                          <span
                            key={t.id}
                            className="text-base"
                            title={`${t.name} escolheu esta opção`}
                          >
                            {t.avatar}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pedagogical Explanation Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Explicação Pedagógica para a Turma</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              {currentQuestion.explanation || 'Compreensão fundamental do tópico abordado na aula.'}
            </p>
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleGoToLeaderboard}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base shadow-xl transition-all hover:scale-102 active:scale-98"
            >
              <span>Ver Classificação da Rodada</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================== PHASE 5: LEADERBOARD ===================== */}
      {phase === 'leaderboard' && (
        <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-between gap-6 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">
              Placar Geral da Aula
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Classificação das Equipes
            </h2>
          </div>

          {/* Ranked Teams List */}
          <div className="space-y-3">
            {sortedTeams.map((team, rank) => {
              const isFirst = rank === 0;
              return (
                <div
                  key={team.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md transition-all ${
                    isFirst
                      ? 'bg-slate-800/90 border-amber-500/80 ring-2 ring-amber-500/30'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                        rank === 0
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : rank === 1
                          ? 'bg-slate-300 text-slate-950'
                          : rank === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{rank + 1}
                    </span>

                    <span className="text-3xl">{team.avatar}</span>

                    <div>
                      <div className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                        <span>{team.name}</span>
                        {team.streak >= 2 && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            <Flame className="w-3.5 h-3.5 fill-orange-400" />
                            {team.streak}x combo!
                          </span>
                        )}
                      </div>
                      {team.lastPointsEarned > 0 ? (
                        <span className="text-xs font-semibold text-emerald-400">
                          +{team.lastPointsEarned} pts nesta rodada
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Sem pontos nesta rodada</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg sm:text-2xl font-black font-mono text-amber-300">
                      {team.score.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-400">pontos totais</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base sm:text-lg shadow-xl transition-all hover:scale-102 active:scale-98"
            >
              <span>
                {currentQuestionIndex + 1 < quiz.questions.length
                  ? `Próxima Questão (${currentQuestionIndex + 2}/${quiz.questions.length})`
                  : 'Ver Pódio Final! 🏆'}
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================== PHASE 6: PODIUM ===================== */}
      {phase === 'podium' && (
        <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-between items-center text-center gap-8 animate-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold">
              <Trophy className="w-4 h-4 text-amber-400" />
              Cerimônia de Encerramento da Aula
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white">
              Pódio dos Vencedores!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Parabéns a todas as equipes pela dedicação, raciocínio rápido e colaboração em grupo.
            </p>
          </div>

          {/* Podium 3D Columns */}
          <div className="w-full flex items-end justify-center gap-3 sm:gap-6 pt-10 pb-4">
            {/* 2nd Place */}
            {sortedTeams[1] && (
              <div className="flex-1 max-w-[180px] flex flex-col items-center">
                <div className="text-4xl sm:text-5xl mb-2 animate-bounce">
                  {sortedTeams[1].avatar}
                </div>
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                  {sortedTeams[1].name}
                </span>
                <span className="text-xs font-mono text-slate-300 font-bold mb-2">
                  {sortedTeams[1].score.toLocaleString()} pts
                </span>
                <div className="w-full h-36 sm:h-48 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-xl border-t-2 border-slate-300">
                  <Medal className="w-8 h-8 text-slate-200" />
                  <span className="text-2xl sm:text-3xl font-black text-white mt-1">2º</span>
                </div>
              </div>
            )}

            {/* 1st Place (Champion) */}
            {sortedTeams[0] && (
              <div className="flex-1 max-w-[210px] flex flex-col items-center -mt-6">
                <Crown className="w-9 h-9 text-amber-400 animate-pulse mb-1" />
                <div className="text-5xl sm:text-6xl mb-2 animate-bounce">
                  {sortedTeams[0].avatar}
                </div>
                <span className="text-sm sm:text-base font-black text-amber-300 truncate max-w-full">
                  {sortedTeams[0].name}
                </span>
                <span className="text-xs sm:text-sm font-mono text-amber-200 font-black mb-2">
                  {sortedTeams[0].score.toLocaleString()} pts
                </span>
                <div className="w-full h-48 sm:h-64 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-2xl border-t-4 border-amber-200">
                  <Trophy className="w-10 h-10 text-slate-950" />
                  <span className="text-3xl sm:text-5xl font-black text-slate-950 mt-1">1º</span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-950 mt-1">
                    Campeões!
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {sortedTeams[2] && (
              <div className="flex-1 max-w-[180px] flex flex-col items-center">
                <div className="text-4xl sm:text-5xl mb-2 animate-bounce">
                  {sortedTeams[2].avatar}
                </div>
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                  {sortedTeams[2].name}
                </span>
                <span className="text-xs font-mono text-slate-300 font-bold mb-2">
                  {sortedTeams[2].score.toLocaleString()} pts
                </span>
                <div className="w-full h-28 sm:h-36 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-2xl flex flex-col items-center justify-start pt-4 shadow-xl border-t-2 border-amber-500">
                  <Medal className="w-7 h-7 text-amber-300" />
                  <span className="text-2xl sm:text-3xl font-black text-white mt-1">3º</span>
                </div>
              </div>
            )}
          </div>

          {/* Other Teams Honorable Mentions */}
          {sortedTeams.length > 3 && (
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
              <span className="font-semibold text-slate-400">Demais colocações:</span>
              {sortedTeams.slice(3).map((team, idx) => (
                <div key={team.id} className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">#{idx + 4}</span>
                  <span>{team.avatar}</span>
                  <span className="font-medium text-white">{team.name}</span>
                  <span className="font-mono text-slate-400">({team.score} pts)</span>
                </div>
              ))}
            </div>
          )}

          {/* Finish Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={triggerConfetti}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs sm:text-sm font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Mais Confetes & Fanfarra</span>
            </button>
            <button
              onClick={handleRestartQuiz}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jogar Novamente</span>
            </button>
            <button
              onClick={onExitToCreator}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-colors"
            >
              <span>Editar / Novo Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
