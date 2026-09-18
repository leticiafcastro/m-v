import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Flame, 
  HelpCircle, 
  BookOpen, 
  FileText,
  Users,
  BarChart3,
  Sparkles,
  Target,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Quiz, QuizQuestion, UserAnswerRecord } from './types';
import { DEFAULT_HEALTH_QUIZ, KAHOOT_COLORS_MAP } from './data/healthInterventionQuiz';
import { soundEngine } from './utils/audio';
import { QuestionsEditorModal } from './components/QuestionsEditorModal';
import { submitMevResult } from './utils/supabaseClient';
import pharmacyBannerImg from './assets/images/farmacia_municipal_sem_texto_1789760741893.jpg';

export default function App() {
  const [quiz, setQuiz] = useState<Quiz>(DEFAULT_HEALTH_QUIZ);
  const [appState, setAppState] = useState<'intro' | 'quiz' | 'summary'>('intro');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [studentName, setStudentName] = useState<string>('');
  const [nameValidationError, setNameValidationError] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.isMuted());
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Quiz Gameplay State (No timer needed)
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [answerHistory, setAnswerHistory] = useState<UserAnswerRecord[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong'>('all');

  // Supabase automatic submission state
  const [isSubmittingToSupabase, setIsSubmittingToSupabase] = useState<boolean>(false);
  const [supabaseSubmitted, setSupabaseSubmitted] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const currentQuestion: QuizQuestion | undefined = quiz.questions[currentQIndex];

  // Sound toggle
  const toggleMute = () => {
    const next = !isMuted;
    soundEngine.setMuted(next);
    setIsMuted(next);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Start the Quiz from Intro
  const handleStartQuiz = () => {
    if (!studentName || studentName.trim().length === 0) {
      setNameValidationError(true);
      const inputEl = document.getElementById('group-name-input');
      if (inputEl) {
        inputEl.focus();
      }
      return;
    }
    setNameValidationError(false);
    setCurrentQIndex(0);
    setScore(0);
    setStreak(0);
    setHighestStreak(0);
    setAnswerHistory([]);
    setIsAnswerLocked(false);
    setSelectedOption(null);
    setSupabaseSubmitted(false);
    setIsSubmittingToSupabase(false);
    setSupabaseError(null);
    setAppState('quiz');
  };

  // Handle option click (Immediate Feedback, standard scoring)
  const handleSelectOption = (optionIndex: number) => {
    if (isAnswerLocked || !currentQuestion) return;

    setIsAnswerLocked(true);
    setSelectedOption(optionIndex);

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    let pointsEarned = 0;
    if (isCorrect) {
      soundEngine.playCorrect();
      // Scoring: 1000 base points + 100 per streak
      const streakBonus = streak * 100;
      pointsEarned = 1000 + streakBonus;

      const newStreak = streak + 1;
      setScore((prev) => prev + pointsEarned);
      setStreak(newStreak);
      if (newStreak > highestStreak) setHighestStreak(newStreak);
    } else {
      soundEngine.playWrong();
      setStreak(0);
    }

    const record: UserAnswerRecord = {
      questionId: currentQuestion.id,
      questionNumber: currentQuestion.number,
      selectedOptionIndex: optionIndex,
      correctOptionIndex: currentQuestion.correctIndex,
      isCorrect,
      timeSpent: 0,
      pointsEarned,
      category: currentQuestion.category,
    };

    setAnswerHistory((prev) => [...prev, record]);
  };

  // Advance to next question or final summary
  const handleNextQuestion = () => {
    if (currentQIndex + 1 < quiz.questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setIsAnswerLocked(false);
      setSelectedOption(null);
    } else {
      setAppState('summary');
      triggerCelebration();
    }
  };

  // Confetti on final screen
  const triggerCelebration = () => {
    try {
      soundEngine.playFanfare();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
  };

  // Summary Metrics calculations
  const totalCorrect = answerHistory.filter((a) => a.isCorrect).length;
  const accuracyPercent = quiz.questions.length > 0 ? Math.round((totalCorrect / quiz.questions.length) * 100) : 0;
  
  // Automatic submission of results to Supabase table 'm-e-v' when reaching summary screen
  useEffect(() => {
    if (appState === 'summary' && !supabaseSubmitted && !isSubmittingToSupabase) {
      let isMounted = true;
      setIsSubmittingToSupabase(true);
      setSupabaseError(null);

      const groupNameToSave = (studentName && studentName.trim().length > 0)
        ? studentName.trim()
        : 'Grupo Sem Nome';

      const performSubmit = async () => {
        try {
          const res = await submitMevResult({
            nome_grupo: groupNameToSave,
            acertos: totalCorrect,
            total_itens: quiz.questions.length,
          });

          if (isMounted) {
            if (res.success) {
              setSupabaseSubmitted(true);
              setSupabaseError(null);
            } else {
              setSupabaseError(res.error || 'Erro ao enviar pontuação');
            }
          }
        } catch (err) {
          if (isMounted) {
            setSupabaseError(err instanceof Error ? err.message : String(err));
          }
        } finally {
          // Immediately hide/remove the loading indicator as soon as submission finishes
          if (isMounted) {
            setIsSubmittingToSupabase(false);
          }
        }
      };

      performSubmit();

      return () => {
        isMounted = false;
      };
    }
  }, [appState, supabaseSubmitted, isSubmittingToSupabase, studentName, totalCorrect, quiz.questions.length]);
  
  // Categorized breakdown
  const contextoAnswers = answerHistory.filter((a) => a.category === 'contexto');
  const contextoCorrect = contextoAnswers.filter((a) => a.isCorrect).length;

  const monitoramentoAnswers = answerHistory.filter((a) => a.category === 'monitoramento-avaliacao');
  const monitoramentoCorrect = monitoramentoAnswers.filter((a) => a.isCorrect).length;

  const modeloLogicoAnswers = answerHistory.filter((a) => a.category === 'modelo-logico');
  const modeloLogicoCorrect = modeloLogicoAnswers.filter((a) => a.isCorrect).length;

  const progressPercentage = Math.round(((currentQIndex + (isAnswerLocked ? 1 : 0)) / quiz.questions.length) * 100);

  const filteredQuestions = quiz.questions.filter((q) => {
    const userAns = answerHistory.find((a) => a.questionNumber === q.number);
    if (reviewFilter === 'correct') return userAns?.isCorrect === true;
    if (reviewFilter === 'wrong') return userAns?.isCorrect === false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-[#123d70] flex flex-col justify-between font-sans selection:bg-[#ce6200] selection:text-white">
      {/* Top Academic Header */}
      <header className="bg-gradient-to-r from-[#123d70] via-[#103664] to-[#0d2d53] border-b-2 border-[#ffbd59]/40 sticky top-0 z-30 shadow-md text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg md:text-xl tracking-tight text-white leading-tight">
                Quizz Monitoramento e Avaliação
              </span>
              <span className="text-xs sm:text-sm text-[#ffbd59] font-bold leading-tight pt-1">
                Universidade Federal Fluminense
              </span>
              <span className="text-[11px] sm:text-xs text-slate-200 font-medium leading-tight">
                Faculdade de Farmácia
              </span>
              <span className="text-[11px] sm:text-xs text-slate-300 font-normal leading-tight">
                Disciplina de Assistência Farmacêutica
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col bg-white">
        {/* ===================== TELA 1: INTRODUÇÃO VISUALMENTE POLIDA ===================== */}
        {appState === 'intro' && (
              <div className="max-w-5xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
                {/* Top Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#123d70] text-[#ffbd59] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Estudo de Caso & Intervenção
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {quiz.questions.length === 1 ? '1 Questão' : `${quiz.questions.length} Questões`}
              </span>
            </div>

            {/* Case Study Card with Refined Layout */}
            <div className="bg-white border-2 border-[#123d70]/20 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#123d70]/5 space-y-6">
              {/* Top: Figura */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#123d70]/20 shadow-md group">
                <img
                  src={pharmacyBannerImg}
                  alt="Assistência Farmacêutica e Aquisição de Medicamentos no SUS"
                  referrerPolicy="no-referrer"
                  className="w-full h-52 sm:h-64 md:h-72 object-cover transition-transform duration-500 group-hover:scale-102"
                />
              </div>

              {/* 1. Abaixo da figura: Primeiro Parágrafo */}
              <div className="pt-1">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                  O Secretário Municipal de Saúde de um município de cerca de 120.000 habitantes está planejando modificar os procedimentos de aquisição de medicamentos adotados no município.
                </p>
              </div>

              {/* 2. Caixa: Gargalos Identificados */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border-2 border-[#ffbd59] shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#ce6200] uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-[#ce6200] shrink-0" />
                  <span>Gargalos Identificados</span>
                </div>
                <ul className="text-sm sm:text-base text-[#123d70] font-medium space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ce6200] mt-2 shrink-0" />
                    <span>Gastos elevados, especialmente em itens de baixa saída;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ce6200] mt-2 shrink-0" />
                    <span>Medicamentos de qualidade sanitária duvidosa;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ce6200] mt-2 shrink-0" />
                    <span>Entregas fora do prazo contratual exigido.</span>
                  </li>
                </ul>
              </div>

              {/* 3. Transição: Para tanto formulou uma intervenção composta por: */}
              <div className="space-y-3 pt-1">
                <p className="text-sm sm:text-base text-slate-800 font-bold">
                  Para tanto formulou uma intervenção composta por:
                </p>

                {/* The 4 Strategic Actions in a 2x2 grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-[#123d70]/20 hover:border-[#ce6200]/50 transition-colors shadow-xs">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-7 h-7 rounded-lg bg-[#123d70] text-[#ffbd59] text-sm font-black flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#123d70]">
                        Farmacêutico Exclusivo
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed pl-9.5">
                      Contratação de farmacêutico exclusivo para acompanhamento das compras municipais de medicamentos.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-[#123d70]/20 hover:border-[#ce6200]/50 transition-colors shadow-xs">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-7 h-7 rounded-lg bg-[#123d70] text-[#ffbd59] text-sm font-black flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#123d70]">
                        Novo Manual de Normas
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed pl-9.5">
                      Redação de novo manual de procedimentos e normas para aquisição de medicamentos.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-[#123d70]/20 hover:border-[#ce6200]/50 transition-colors shadow-xs">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-7 h-7 rounded-lg bg-[#123d70] text-[#ffbd59] text-sm font-black flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#123d70]">
                        Cadastro de Fornecedores
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed pl-9.5">
                      Elaboração e acompanhamento de cadastro de fornecedores qualificados.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-[#123d70]/20 hover:border-[#ce6200]/50 transition-colors shadow-xs">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-7 h-7 rounded-lg bg-[#123d70] text-[#ffbd59] text-sm font-black flex items-center justify-center shrink-0">
                        4
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#123d70]">
                        Série de Encontros
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed pl-9.5">
                      Realização de encontros com diretores de hospitais e de centros de saúde, farmacêuticos e equipe de compras e finanças.
                    </p>
                  </div>
                </div>
              </div>

              {/* Strategic Goal / Expected Effect */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50/40 border-2 border-[#123d70]/20 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#ce6200] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Target className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-[#123d70] uppercase tracking-wider block">
                    Efeito Esperado
                  </span>
                  <p className="text-sm sm:text-base text-[#123d70] font-semibold leading-relaxed">
                    Espera-se que sejam adquiridos medicamentos de qualidade ao menor custo possível e em condições ótimas de fornecimento e recebimento.
                  </p>
                </div>
              </div>
            </div>

            {/* Student/Group Setup Card */}
            <div className={`bg-white border-2 ${nameValidationError ? 'border-red-400 ring-2 ring-red-200' : 'border-[#123d70]/20'} rounded-3xl p-6 sm:p-7 shadow-xl shadow-[#123d70]/5 space-y-5 transition-all`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <label htmlFor="group-name-input" className="flex items-center gap-2 text-xs font-bold text-[#ce6200] uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    <span>IDENTIFICAÇÃO DO GRUPO <span className="text-red-500 font-black">* (Obrigatório)</span></span>
                  </label>
                  <p className="text-xs text-slate-500 font-normal">
                    Informe o nome da equipe e o período da aula (Manhã ou tarde)
                  </p>
                </div>

                <div className="w-full sm:w-80">
                  <input
                    id="group-name-input"
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (nameValidationError && e.target.value.trim().length > 0) {
                        setNameValidationError(false);
                      }
                    }}
                    placeholder="Ex: Grupo 1, Manhã"
                    className={`w-full px-4 py-3 bg-white border-2 ${nameValidationError ? 'border-red-500 focus:border-red-600 focus:ring-red-300' : 'border-[#123d70]/30 focus:border-[#ce6200] focus:ring-[#ffbd59]'} rounded-2xl text-sm text-[#123d70] font-bold focus:outline-none focus:ring-2 shadow-inner placeholder:text-slate-400 placeholder:font-normal`}
                  />
                  {nameValidationError && (
                    <span className="text-xs text-red-600 font-bold block mt-1.5 animate-in fade-in">
                      ⚠️ Por favor, digite o nome do grupo antes de começar.
                    </span>
                  )}
                </div>
              </div>

              {/* Start Quiz Action */}
              <div className="pt-2 flex justify-end border-t border-slate-200">
                <button
                  onClick={handleStartQuiz}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ce6200] to-[#e06d04] hover:from-[#b55500] hover:to-[#ce6200] text-white font-black text-base sm:text-lg shadow-xl shadow-[#ce6200]/25 border border-[#ffbd59]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Começar Quiz Agora!</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TELA 2: QUIZ ESTILO KAHOOT ===================== */}
        {appState === 'quiz' && currentQuestion && (
          <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1 flex flex-col justify-between gap-5 animate-in zoom-in-95 duration-200">
            {/* Top Bar: Progress & Live Stats */}
            <div className="bg-white border-2 border-[#123d70]/20 p-4 rounded-2xl shadow-md space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-xl bg-[#123d70] text-[#ffbd59] font-black text-xs sm:text-sm shadow-sm">
                    Questão {currentQIndex + 1} de {quiz.questions.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {streak >= 2 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-[#ce6200] border border-[#ffbd59] font-black text-xs sm:text-sm animate-pulse">
                      <Flame className="w-4 h-4 fill-[#ce6200] text-[#ce6200]" />
                      <span>{streak}x Seguidos</span>
                    </div>
                  )}

                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-[#123d70] font-bold">
                      Acertos: <strong className="text-[#ce6200]">{totalCorrect}</strong>/{quiz.questions.length}
                    </span>
                    <span className="text-xs sm:text-sm text-[#123d70] font-bold truncate max-w-[140px] block">
                      {studentName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-[#ce6200] to-[#ffbd59] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Section Transition / Context Text (Ex: Introdução da Seção 2 a partir da questão 5) */}
            {currentQuestion.sectionIntro && (
              <div className="bg-amber-50/90 border border-[#ffbd59]/50 rounded-2xl p-4 sm:p-5 shadow-sm text-[#123d70] animate-in fade-in duration-300">
                <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-800">
                  {currentQuestion.sectionIntro}
                </p>
              </div>
            )}

            {/* Question Text Stage */}
            <div className="bg-gradient-to-br from-[#123d70] via-[#0f345e] to-[#0a2344] border-2 border-[#1b4d88] rounded-3xl p-6 sm:p-9 text-center shadow-xl flex flex-col items-center justify-center min-h-[160px] sm:min-h-[180px] relative overflow-hidden">
              <div className="absolute top-3 left-4 text-[10px] sm:text-xs font-bold text-[#ffbd59] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ffbd59] inline-block animate-ping" />
                <span>{currentQuestion.sectionTitle || (currentQuestion.category === 'monitoramento-avaliacao' ? 'Seção 1: Monitoramento e Avaliação' : 'Seção 2: Modelo Lógico')}</span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-white leading-snug max-w-3xl pt-2">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Prompt Instruction */}
            <div className="text-center sm:text-left px-1">
              <p className="font-bold text-slate-800 text-sm sm:text-base">
                {currentQIndex < 4
                  ? 'Assinale a alternativa correta quanto à classificação da ação descrita no texto:'
                  : 'Assinale a alternativa correta quanto à classificação do elemento no Modelo Lógico:'}
              </p>
            </div>

            {/* Options Grid (Kahoot Cards) */}
            <div
              className={`grid gap-3.5 ${
                currentQuestion.options.length <= 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : currentQuestion.options.length === 4
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
              }`}
            >
              {currentQuestion.options.map((optionText, optIdx) => {
                const colorConfig = KAHOOT_COLORS_MAP[optIdx] || KAHOOT_COLORS_MAP[0];
                const isSelected = selectedOption === optIdx;
                const isCorrect = currentQuestion.correctIndex === optIdx;

                let cardStyle = `${colorConfig.bg} ${colorConfig.text} border-2 ${colorConfig.border} shadow-md`;
                if (isAnswerLocked) {
                  if (isCorrect) {
                    cardStyle = `${colorConfig.bg} ${colorConfig.text} ring-4 ring-[#ffbd59] shadow-2xl scale-[1.02] border-white`;
                  } else if (isSelected && !isCorrect) {
                    cardStyle = 'bg-rose-100 border-2 border-rose-500 text-rose-900 opacity-90';
                  } else {
                    cardStyle = 'bg-slate-100 border-2 border-slate-200 opacity-40 text-slate-400';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isAnswerLocked}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-4 sm:p-5 rounded-2xl text-left flex items-center justify-between gap-3 transition-all ${cardStyle} ${
                      !isAnswerLocked ? 'hover:scale-[1.02] active:scale-98 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1">
                      <span className="w-11 h-11 rounded-xl bg-black/20 flex items-center justify-center text-xl font-black shrink-0 border border-white/20">
                        {colorConfig.symbol}
                      </span>
                      <span className="text-base sm:text-lg font-extrabold leading-snug">
                        {optionText}
                      </span>
                    </div>

                    {/* Feedback Badges */}
                    {isAnswerLocked && isCorrect && (
                      <span className="px-3 py-1 rounded-full bg-[#ffbd59] text-[#0a2344] font-black text-xs flex items-center gap-1 shrink-0 shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                        CORRETO
                      </span>
                    )}

                    {isAnswerLocked && isSelected && !isCorrect && (
                      <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs flex items-center gap-1 shrink-0 shadow-md">
                        <XCircle className="w-4 h-4" />
                        ERRADO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Immediate Feedback Box (Appears after answer) */}
            {isAnswerLocked && (
              <div className="bg-white border-2 border-[#123d70]/20 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    {selectedOption === currentQuestion.correctIndex ? (
                      <div className="flex items-center gap-2 text-emerald-700 font-black text-base sm:text-lg">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <span>Excelente! Resposta Correta</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-600 font-black text-base sm:text-lg">
                        <XCircle className="w-6 h-6 text-rose-600" />
                        <span>Resposta Incorreta</span>
                      </div>
                    )}
                  </div>

                  <span className="text-xs sm:text-sm text-[#123d70] font-medium bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    Gabarito: <strong className="font-black text-[#ce6200]">{currentQuestion.options[currentQuestion.correctIndex]}</strong>
                  </span>
                </div>

                {/* Pedagogical Didactic Explanation */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-[#ce6200] flex items-center gap-1.5 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-[#ce6200]" />
                    Justificativa:
                  </span>
                  <p className="text-xs sm:text-sm text-[#123d70] leading-relaxed font-medium">
                    {currentQuestion.explanation}
                  </p>
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-[#ce6200] to-[#e06d04] hover:from-[#b55500] hover:to-[#ce6200] text-white font-black text-sm sm:text-base shadow-lg shadow-[#ce6200]/25 border border-[#ffbd59]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>
                      {currentQIndex + 1 < quiz.questions.length
                        ? `Avançar para Questão ${currentQIndex + 2}`
                        : 'Ver Desempenho Final 🏆'}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TELA 3: RESUMO DO DESEMPENHO FINAL ===================== */}
        {appState === 'summary' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-6 animate-in zoom-in-95 duration-300">
            {/* Podium Top Header */}
            <div className="text-center space-y-2 bg-gradient-to-br from-[#123d70] to-[#0a2344] text-white rounded-3xl p-8 shadow-xl border-2 border-[#1b4d88] relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#ffbd59] border border-white/20 text-xs sm:text-sm font-bold">
                <Award className="w-4 h-4 text-[#ffbd59]" />
                Atividade Concluída com Sucesso!
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Parabéns, {studentName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto font-normal">
                Você e sua equipe concluíram a atividade de Avaliação e Monitoramento aplicada à Assistência Farmacêutica.
              </p>
            </div>

            {/* Score Metric: Taxa de Acerto */}
            <div className="max-w-md mx-auto w-full">
              <div className="bg-white border-2 border-[#123d70]/20 rounded-3xl p-6 text-center shadow-md">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Taxa de Acerto
                </span>
                <div className={`text-4xl sm:text-5xl font-black ${accuracyPercent >= 70 ? 'text-[#123d70]' : 'text-[#ce6200]'}`}>
                  {accuracyPercent}%
                </div>
                <span className="text-xs text-slate-500 font-bold block mt-1">{totalCorrect} de {quiz.questions.length} questões acertadas</span>
              </div>
            </div>

            {/* Supabase Status Banner */}
            <div className="max-w-xl mx-auto w-full">
              {isSubmittingToSupabase && (
                <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 flex items-center justify-center gap-3 text-[#123d70] font-bold text-sm shadow-sm animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-[#123d70] shrink-0" />
                  <span>Registrando pontuação do grupo no sistema...</span>
                </div>
              )}

              {!isSubmittingToSupabase && supabaseSubmitted && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center gap-2 text-emerald-800 font-black text-sm sm:text-base shadow-md animate-in fade-in zoom-in-95 duration-300 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>✅ Pontuação registrada com sucesso no sistema!</span>
                </div>
              )}

              {!isSubmittingToSupabase && supabaseError && !supabaseSubmitted && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm shadow-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Não foi possível conectar ao banco automaticamente.</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmittingToSupabase(true);
                      setSupabaseError(null);
                      try {
                        const res = await submitMevResult({
                          nome_grupo: studentName?.trim() || 'Grupo Sem Nome',
                          acertos: totalCorrect,
                          total_itens: quiz.questions.length,
                        });
                        if (res.success) {
                          setSupabaseSubmitted(true);
                          setSupabaseError(null);
                        } else {
                          setSupabaseError(res.error || 'Erro ao reenviar');
                        }
                      } catch (e) {
                        setSupabaseError(e instanceof Error ? e.message : String(e));
                      } finally {
                        setIsSubmittingToSupabase(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#123d70] text-white rounded-xl text-xs font-bold hover:bg-[#103664] transition-all cursor-pointer shrink-0"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>

            {/* Pedagogical Mastery Breakdown */}
            <div className="bg-white border-2 border-[#123d70]/20 rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-[#123d70] font-black text-sm border-b border-slate-200 pb-3">
                <BarChart3 className="w-4 h-4 text-[#ce6200]" />
                <span>Desempenho por Eixo Conceitual</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Eixo 2: Avaliação vs Monitoramento */}
                {monitoramentoAnswers.length > 0 && (
                  <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 ${contextoAnswers.length === 0 && modeloLogicoAnswers.length === 0 ? 'md:col-span-3' : ''}`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#123d70]">Avaliação vs. Monitoramento</span>
                      <span className="text-[#ce6200] font-mono">{monitoramentoCorrect} / {monitoramentoAnswers.length}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#ce6200] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(monitoramentoCorrect / monitoramentoAnswers.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Diferenciação conceitual e metodológica entre acompanhamento rotineiro contínuo (monitoramento) e julgamento sistemático de valor/impacto a partir de estudos estruturados (avaliação).
                    </p>
                  </div>
                )}

                {/* Eixo 1: Contexto Geral */}
                {contextoAnswers.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#123d70]">Contexto Geral</span>
                      <span className="text-[#123d70] font-mono">{contextoCorrect} / {contextoAnswers.length}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#123d70] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(contextoCorrect / contextoAnswers.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Compreensão dos nós críticos identificados, despesas municipais e objetivos da reformulação de compras.
                    </p>
                  </div>
                )}

                {/* Eixo 3: Modelo Lógico */}
                {modeloLogicoAnswers.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#123d70]">Modelo Lógico</span>
                      <span className="text-[#123d70] font-mono">{modeloLogicoCorrect} / {modeloLogicoAnswers.length}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#123d70] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(modeloLogicoCorrect / modeloLogicoAnswers.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Domínio dos componentes estruturais: Insumos (recursos), Atividades (processos), Produtos (entregas), Resultados e Impacto.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Question Review Accordion with Filter */}
            <div className="bg-white border-2 border-[#123d70]/20 rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <span className="text-sm font-black text-[#123d70] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#ce6200]" />
                  Gabarito Completo e Análise de Respostas
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === 'all'
                        ? 'bg-[#123d70] text-[#ffbd59]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({quiz.questions.length})
                  </button>
                  <button
                    onClick={() => setReviewFilter('correct')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === 'correct'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Acertos ({totalCorrect})
                  </button>
                  <button
                    onClick={() => setReviewFilter('wrong')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === 'wrong'
                        ? 'bg-rose-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Erros ({quiz.questions.length - totalCorrect})
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredQuestions.map((q) => {
                  const userAns = answerHistory.find((a) => a.questionNumber === q.number);
                  const isCorrect = userAns?.isCorrect;
                  const selectedIdx = userAns?.selectedOptionIndex ?? -1;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                        isCorrect
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : 'bg-rose-50/40 border-rose-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-bold text-[#123d70] leading-snug">
                          <span className="text-[#ce6200] font-mono font-black mr-1.5">#{q.number}</span>
                          {q.question}
                        </div>
                        {isCorrect ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0 border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Acertou
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 shrink-0 border border-rose-300 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Errou
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1">
                        <span className="text-slate-700">
                          Sua resposta:{' '}
                          <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            {selectedIdx >= 0 ? q.options[selectedIdx] : 'Não respondeu'}
                          </strong>
                        </span>
                        {!isCorrect && (
                          <span className="text-[#123d70]">
                            Gabarito correto: <strong className="text-[#123d70]">{q.options[q.correctIndex]}</strong>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#123d70] bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-normal">
                        <strong>Justificativa:</strong> {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={handleStartQuiz}
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#ce6200] to-[#e06d04] hover:from-[#b55500] hover:to-[#ce6200] text-white font-black text-sm sm:text-base shadow-lg shadow-[#ce6200]/25 border border-[#ffbd59]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jogar Novamente</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-3 px-4 text-center text-xs text-slate-500 font-medium">
        Elaborado por: Letícia Castro
      </footer>

      {/* Questions Inspector / Editor Modal */}
      <QuestionsEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        quiz={quiz}
        onSaveQuiz={(updated) => setQuiz(updated)}
      />
    </div>
  );
}

