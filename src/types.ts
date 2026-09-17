export type QuestionCategory = 'contexto' | 'monitoramento-avaliacao' | 'modelo-logico';

export interface QuizQuestion {
  id: string;
  number?: number;
  question: string;
  options: string[];
  correctIndex: number;
  category?: QuestionCategory;
  sectionTitle?: string;
  sectionIntro?: string;
  explanation: string;
  timeLimit?: number;
  points?: number;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  description?: string;
  contextText?: string;
  questions: QuizQuestion[];
  createdAt?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  streak: number;
  lastPointsEarned: number;
  currentAnswer: number | null;
  answerTimeLeft: number | null;
}

export type GamePhase = 
  | 'lobby'
  | 'get-ready'
  | 'question'
  | 'reveal'
  | 'leaderboard'
  | 'podium';

export type AppView = 'creator' | 'play' | 'print';

export interface UserAnswerRecord {
  questionId: string;
  questionNumber: number;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  timeSpent: number;
  pointsEarned: number;
  category?: QuestionCategory;
}

export interface KahootColorOption {
  bg: string;
  hoverBg: string;
  activeBg: string;
  border: string;
  text: string;
  symbol: string;
  symbolName: string;
  colorName: string;
}
