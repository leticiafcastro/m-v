import React, { useState } from 'react';
import { X, Check, Save, RotateCcw, HelpCircle } from 'lucide-react';
import { Quiz, QuizQuestion } from '../types';
import { DEFAULT_HEALTH_QUIZ } from '../data/healthInterventionQuiz';

interface QuestionsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onSaveQuiz: (quiz: Quiz) => void;
}

export const QuestionsEditorModal: React.FC<QuestionsEditorModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onSaveQuiz,
}) => {
  const [editingQuestions, setEditingQuestions] = useState<QuizQuestion[]>(quiz.questions);
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!isOpen) return null;

  const currentQ = editingQuestions[activeTab];

  const handleUpdateCurrent = (field: keyof QuizQuestion, value: any) => {
    setEditingQuestions((prev) =>
      prev.map((q, idx) => (idx === activeTab ? { ...q, [field]: value } : q))
    );
  };

  const handleResetToDefault = () => {
    if (confirm('Deseja restaurar todas as questões originais da atividade?')) {
      setEditingQuestions(DEFAULT_HEALTH_QUIZ.questions);
    }
  };

  const handleSave = () => {
    onSaveQuiz({
      ...quiz,
      questions: editingQuestions,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#123d70] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden text-[#123d70] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#123d70] border-b border-[#1b4d88] flex items-center justify-between text-white">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Visualizar e Editar Questões da Atividade
            </h2>
            <p className="text-xs text-[#ffbd59]">
              Personalize enunciados, gabaritos e explicações pedagógicas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white hover:text-[#ffbd59] rounded-lg hover:bg-[#185296] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Left Tabs & Right Editor */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Tabs */}
          <div className="w-full md:w-56 bg-slate-50 border-r border-slate-200 overflow-y-auto p-2 space-y-1 max-h-48 md:max-h-none">
            <div className="text-[11px] font-bold text-[#ce6200] uppercase tracking-wider px-2 py-1">
              Questões ({editingQuestions.length})
            </div>
            {editingQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveTab(idx)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                  activeTab === idx
                    ? 'bg-[#123d70] text-white shadow'
                    : 'text-[#123d70] hover:bg-slate-200'
                }`}
              >
                <span className="truncate">Q{idx + 1}: {q.category === 'contexto' ? 'Contexto' : q.category === 'monitoramento-avaliacao' ? 'M & A' : 'Modelo Lógico'}</span>
                <span className="text-[10px] opacity-75 font-mono">#{idx + 1}</span>
              </button>
            ))}
          </div>

          {/* Editor Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white">
            {currentQ && (
              <>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#123d70] text-[#ffbd59]">
                    Questão {activeTab + 1} de {editingQuestions.length} • {currentQ.category === 'modelo-logico' ? 'MODELO LÓGICO' : currentQ.category === 'monitoramento-avaliacao' ? 'AVALIAÇÃO VS MONITORAMENTO' : 'CONTEXTO'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {currentQ.options.length} alternativas disponíveis
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123d70] mb-1.5">
                    Enunciado da Questão
                  </label>
                  <textarea
                    rows={3}
                    value={currentQ.question}
                    onChange={(e) => handleUpdateCurrent('question', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#123d70] rounded-xl text-xs sm:text-sm text-[#123d70] font-medium focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#123d70]">
                    Alternativas (Marque a correta com o botão indicador):
                  </label>
                  {currentQ.options.map((opt, optIdx) => {
                    const isCorrect = currentQ.correctIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-colors ${
                          isCorrect
                            ? 'bg-amber-50 border-[#ffbd59]'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateCurrent('correctIndex', optIdx)}
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-colors ${
                            isCorrect
                              ? 'bg-[#123d70] text-[#ffbd59]'
                              : 'bg-slate-200 text-slate-700 hover:bg-[#ce6200] hover:text-white'
                          }`}
                          title="Clique para definir como resposta correta"
                        >
                          {isCorrect ? '✓' : optIdx + 1}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...currentQ.options];
                            newOpts[optIdx] = e.target.value;
                            handleUpdateCurrent('options', newOpts);
                          }}
                          className="flex-1 bg-transparent text-xs text-[#123d70] font-semibold focus:outline-none"
                        />
                        {isCorrect && (
                          <span className="text-[10px] font-black text-[#ce6200] uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100">
                            Gabarito
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-bold text-[#123d70] mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#ce6200]" />
                    Explicação Pedagógica
                  </label>
                  <textarea
                    rows={2}
                    value={currentQ.explanation}
                    onChange={(e) => handleUpdateCurrent('explanation', e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-[#123d70] rounded-xl text-xs text-[#123d70] focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:text-[#123d70] hover:bg-slate-200 transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Originais</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-200 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#ce6200] hover:bg-[#b55500] text-white font-bold text-xs shadow-md border border-[#ffbd59]/30 transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
