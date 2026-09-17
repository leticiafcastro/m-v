import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Play, 
  Download, 
  Upload, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { Quiz, QuizQuestion } from '../types';
import { KAHOOT_COLORS, PRESET_QUIZZES } from '../data/defaultQuizzes';

interface QuizCreatorProps {
  quiz: Quiz;
  onUpdateQuiz: (quiz: Quiz) => void;
  onStartGame: () => void;
  onOpenAiModal: () => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  quiz,
  onUpdateQuiz,
  onStartGame,
  onOpenAiModal,
}) => {
  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    quiz.questions[0]?.id || ''
  );

  const handleTitleChange = (title: string) => {
    onUpdateQuiz({ ...quiz, title });
  };

  const handleTopicChange = (topic: string) => {
    onUpdateQuiz({ ...quiz, topic });
  };

  const handleDescriptionChange = (description: string) => {
    onUpdateQuiz({ ...quiz, description });
  };

  const handleQuestionTextChange = (id: string, text: string) => {
    onUpdateQuiz({
      ...quiz,
      questions: quiz.questions.map((q) => (q.id === id ? { ...q, question: text } : q)),
    });
  };

  const handleOptionChange = (qId: string, optIndex: number, text: string) => {
    onUpdateQuiz({
      ...quiz,
      questions: quiz.questions.map((q) => {
        if (q.id !== qId) return q;
        const newOptions = [...q.options] as [string, string, string, string];
        newOptions[optIndex] = text;
        return { ...q, options: newOptions };
      }),
    });
  };

  const handleCorrectIndexChange = (qId: string, correctIndex: number) => {
    onUpdateQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === qId ? { ...q, correctIndex } : q
      ),
    });
  };

  const handleTimeLimitChange = (qId: string, timeLimit: number) => {
    onUpdateQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === qId ? { ...q, timeLimit } : q
      ),
    });
  };

  const handleExplanationChange = (qId: string, explanation: string) => {
    onUpdateQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === qId ? { ...q, explanation } : q
      ),
    });
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: 'Nova pergunta sobre o conteúdo estudado...',
      options: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
      correctIndex: 0,
      timeLimit: 25,
      points: 1000,
      explanation: 'Explicação pedagógica do porquê esta alternativa é a correta.',
    };
    onUpdateQuiz({
      ...quiz,
      questions: [...quiz.questions, newQ],
    });
    setActiveQuestionId(newQ.id);
  };

  const handleDuplicateQuestion = (id: string) => {
    const target = quiz.questions.find((q) => q.id === id);
    if (!target) return;
    const duplicated: QuizQuestion = {
      ...target,
      id: `q-${Date.now()}`,
      question: `${target.question} (Cópia)`,
    };
    const targetIndex = quiz.questions.findIndex((q) => q.id === id);
    const updated = [...quiz.questions];
    updated.splice(targetIndex + 1, 0, duplicated);
    onUpdateQuiz({ ...quiz, questions: updated });
    setActiveQuestionId(duplicated.id);
  };

  const handleDeleteQuestion = (id: string) => {
    if (quiz.questions.length <= 1) {
      alert('O quiz precisa ter pelo menos 1 pergunta.');
      return;
    }
    const remaining = quiz.questions.filter((q) => q.id !== id);
    onUpdateQuiz({ ...quiz, questions: remaining });
    if (activeQuestionId === id) {
      setActiveQuestionId(remaining[0].id);
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= quiz.questions.length) return;
    const newQuestions = [...quiz.questions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIndex, 0, moved);
    onUpdateQuiz({ ...quiz, questions: newQuestions });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quiz, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${quiz.title.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && imported.title && Array.isArray(imported.questions)) {
          onUpdateQuiz(imported);
          if (imported.questions[0]) {
            setActiveQuestionId(imported.questions[0].id);
          }
        } else {
          alert('Arquivo JSON com estrutura de quiz inválida.');
        }
      } catch {
        alert('Erro ao carregar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const activeQuestion = quiz.questions.find((q) => q.id === activeQuestionId) || quiz.questions[0];
  const activeIndex = quiz.questions.findIndex((q) => q.id === activeQuestion?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner: Quiz Metadata & Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {quiz.questions.length} Questões no Total
            </span>
            <span className="text-xs text-slate-400">
              Duração estimada: ~{Math.round(quiz.questions.reduce((acc, q) => acc + (q.timeLimit || 25), 0) / 60) + 2} minutos
            </span>
          </div>

          <input
            type="text"
            value={quiz.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-xl sm:text-2xl font-black text-white bg-transparent border-b border-slate-700/60 focus:border-indigo-500 pb-1 focus:outline-none"
            placeholder="Título da Atividade da Aula..."
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <input
              type="text"
              value={quiz.topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
              placeholder="Tema / Conteúdo disciplinar..."
            />
            <input
              type="text"
              value={quiz.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/60 focus:outline-none flex-1"
              placeholder="Orientação ou descrição para os alunos..."
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:self-center">
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-bold shadow-md transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Gerar com IA</span>
          </button>

          <button
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
            title="Exportar Quiz como JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <label className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer" title="Importar Quiz JSON">
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={onStartGame}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-102 active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Apresentar em Sala</span>
          </button>
        </div>
      </div>

      {/* Preset Quizzes Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 shrink-0 flex items-center gap-1 font-medium">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Modelos Prontos:
        </span>
        {PRESET_QUIZZES.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              if (confirm(`Deseja carregar o quiz modelo "${preset.title}"?`)) {
                onUpdateQuiz(preset);
                setActiveQuestionId(preset.questions[0].id);
              }
            }}
            className="px-3 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 whitespace-nowrap transition-colors"
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Questions List / Right Active Question Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Questions Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Perguntas da Aula ({quiz.questions.length})
            </h3>
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Questão</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {quiz.questions.map((q, idx) => {
              const isActive = q.id === activeQuestion?.id;
              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-700/60 text-indigo-300 font-mono">
                      Questão {idx + 1}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {q.timeLimit}s
                    </span>
                  </div>

                  <p className="text-xs text-white line-clamp-2 font-medium">
                    {q.question || 'Sem enunciado preenchido...'}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-medium">
                      Correta: {KAHOOT_COLORS[q.correctIndex]?.symbol} ({KAHOOT_COLORS[q.correctIndex]?.colorName})
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-1 hover:text-white disabled:opacity-20"
                        title="Subir posição"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, 'down');
                        }}
                        disabled={idx === quiz.questions.length - 1}
                        className="p-1 hover:text-white disabled:opacity-20"
                        title="Descer posição"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Question Editor (8 cols) */}
        {activeQuestion && (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-6">
            {/* Header of the Active Question */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-sm rounded-lg border border-indigo-500/30">
                  Questão {activeIndex + 1} de {quiz.questions.length}
                </span>
                <span className="text-xs text-slate-400">Configure as 4 opções de resposta</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Time selector */}
                <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300">Tempo:</span>
                  <select
                    value={activeQuestion.timeLimit}
                    onChange={(e) => handleTimeLimitChange(activeQuestion.id, Number(e.target.value))}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={15} className="bg-slate-900">15 seg</option>
                    <option value={20} className="bg-slate-900">20 seg</option>
                    <option value={25} className="bg-slate-900">25 seg</option>
                    <option value={30} className="bg-slate-900">30 seg</option>
                    <option value={45} className="bg-slate-900">45 seg</option>
                    <option value={60} className="bg-slate-900">60 seg</option>
                  </select>
                </div>

                {/* Duplicate */}
                <button
                  onClick={() => handleDuplicateQuestion(activeQuestion.id)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs transition-colors"
                  title="Duplicar esta questão"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteQuestion(activeQuestion.id)}
                  disabled={quiz.questions.length <= 1}
                  className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs disabled:opacity-30 transition-colors"
                  title="Excluir questão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Text Prompt */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Enunciado da Pergunta
              </label>
              <textarea
                rows={3}
                value={activeQuestion.question}
                onChange={(e) => handleQuestionTextChange(activeQuestion.id, e.target.value)}
                placeholder="Escreva a pergunta que os alunos verão no projetor..."
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 4 Kahoot Options Grid */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-slate-300">
                  Alternativas (Clique no círculo verde da opção correta)
                </label>
                <span className="text-[11px] text-amber-400 font-medium">
                  Opção Selecionada: {KAHOOT_COLORS[activeQuestion.correctIndex]?.symbol} ({KAHOOT_COLORS[activeQuestion.correctIndex]?.colorName})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeQuestion.options.map((opt, optIdx) => {
                  const colorConfig = KAHOOT_COLORS[optIdx];
                  const isCorrect = activeQuestion.correctIndex === optIdx;

                  return (
                    <div
                      key={optIdx}
                      className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        isCorrect
                          ? 'border-emerald-500 bg-slate-800/90 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      {/* Color badge & Correct marker button */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-white shadow ${colorConfig.bg}`}
                          >
                            {colorConfig.symbol}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            {colorConfig.colorName}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCorrectIndexChange(activeQuestion.id, optIdx)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'bg-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCorrect ? 'Resposta Correta' : 'Marcar como Correta'}</span>
                        </button>
                      </div>

                      {/* Option text input */}
                      <textarea
                        rows={2}
                        value={opt}
                        onChange={(e) => handleOptionChange(activeQuestion.id, optIdx, e.target.value)}
                        placeholder={`Alternativa ${colorConfig.symbol}...`}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pedagogical Explanation Box */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2">
              <label className="block text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Explicação Pedagógica & Justificativa (Exibida para os alunos após o tempo)
              </label>
              <textarea
                rows={2}
                value={activeQuestion.explanation}
                onChange={(e) => handleExplanationChange(activeQuestion.id, e.target.value)}
                placeholder="Explique resumidamente por que a alternativa está correta e o que aprender com a questão..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-400">
                Dica de aula: Este momento de feedback imediato consolida o aprendizado dos alunos e fecha lacunas conceituais.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
