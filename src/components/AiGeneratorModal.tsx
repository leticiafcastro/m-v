import React, { useState } from 'react';
import { Sparkles, X, Loader2, BookOpen, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { Quiz } from '../types';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizGenerated: (quiz: Quiz) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onQuizGenerated,
}) => {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Ensino Médio');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('médio');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickThemes = [
    'Ciências & Ecologia',
    'História do Brasil',
    'Geografia & Geopolítica',
    'Matemática & Raciocínio',
    'Língua Portuguesa & Interpretação',
    'Física no Cotidiano',
    'Química dos Alimentos',
    'Atualidades & Tecnologia',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !notes.trim()) {
      setErrorMsg('Por favor, informe ao menos o tema principal ou anotações da aula.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          gradeLevel,
          questionCount,
          difficulty,
          notes: notes.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar quiz.');
      }

      const data = await response.json();
      if (data.quiz && Array.isArray(data.quiz.questions)) {
        const newQuiz: Quiz = {
          id: `quiz-ai-${Date.now()}`,
          title: data.quiz.title || `Quiz: ${topic}`,
          topic: data.quiz.topic || topic,
          description: data.quiz.description || 'Atividade interativa gerada para encerramento de aula.',
          questions: data.quiz.questions,
          createdAt: new Date().toISOString(),
        };
        onQuizGenerated(newQuiz);
        onClose();
      } else {
        throw new Error('Formato retornado inesperado.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha na conexão com o assistente pedagógico.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 border-b border-slate-800 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Confeccionar Quiz com Inteligência Artificial
              </h2>
              <p className="text-xs text-slate-300">
                Gere perguntas dinâmicas estilo Kahoot sob medida para a sua aula
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Tema ou Assunto da Aula <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Revolução Industrial, Termodinâmica, Orações Subordinadas, Genética..."
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              disabled={isLoading}
            />
            {/* Quick theme suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 self-center mr-1">Sugestões rápidas:</span>
              {quickThemes.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setTopic(item)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-md text-[11px] text-slate-300 transition-colors"
                  disabled={isLoading}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Nível da Turma
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isLoading}
              >
                <option value="Ensino Fundamental I">Ensino Fundamental I (Anos Iniciais)</option>
                <option value="Ensino Fundamental II">Ensino Fundamental II (6º ao 9º ano)</option>
                <option value="Ensino Médio">Ensino Médio</option>
                <option value="Pré-Vestibular / ENEM">Pré-Vestibular / ENEM</option>
                <option value="Ensino Superior / Graduação">Ensino Superior / Graduação</option>
                <option value="Curso Técnico / Profissionalizante">Curso Técnico / Profissionalizante</option>
                <option value="Treinamento Corporativo">Treinamento / Workshop Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantidade de Perguntas
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isLoading}
              >
                <option value={3}>3 Questões (Quiz relâmpago - ~5 min)</option>
                <option value={5}>5 Questões (Recomendado - ~10 min)</option>
                <option value={8}>8 Questões (Revisão aprofundada - ~15 min)</option>
                <option value={10}>10 Questões (Bateria completa - ~20 min)</option>
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tom e Dificuldade
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'fácil', label: 'Iniciante / Leve', desc: 'Fixação direta' },
                { id: 'médio', label: 'Médio / Equilibrado', desc: 'Ideal para equipes' },
                { id: 'desafiador', label: 'Desafiador / Avançado', desc: 'Debate e pegadinhas didáticas' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setDifficulty(item.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    difficulty === item.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                  disabled={isLoading}
                >
                  <div className="font-semibold text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Lecture Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Anotações ou Conteúdo dos Slides (Opcional)</span>
              <span className="text-[10px] text-slate-400">Cole trechos ou tópicos da sua aula</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cole aqui conceitos-chave, nomes de autores ou pontos abordados na aula que você quer que apareçam nas perguntas..."
              className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              disabled={isLoading}
            />
          </div>

          {/* Pedagogical Kahoot Features Highlight */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              O que a IA criará automaticamente:
            </div>
            <p className="text-slate-400">
              • 4 alternativas com símbolos clássicos Kahoot (▲ Triângulo, ◆ Losango, ● Círculo, ■ Quadrado)
              <br />
              • Justificativa e explicação didática em cada questão para feedback instantâneo aos alunos
              <br />
              • Tempo ajustado por questão e pontuação para dinâmicas em grupo
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg transition-all disabled:opacity-50 active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Elaborando perguntas com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Gerar Quiz Completo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
