export enum CardStatus {
  NEW = 'NEW',
  LEARNING = 'LEARNING',
  REVIEWING = 'REVIEWING',
  MASTERED = 'MASTERED'
}

export enum StudyMode {
  FLASHCARD = 'FLASHCARD',
  QUIZ = 'QUIZ',
  INPUT = 'INPUT',
  DASHBOARD = 'DASHBOARD',
  LIST = 'LIST'
}

export type ReviewGrade = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface StudyItem {
  id: string;
  english: string;
  chinese: string;
  group: string; // Added field for categorization (e.g., 8AU5, 8AU6)
  type: 'word' | 'phrase' | 'sentence';
  example?: string;
  
  // Ebbinghaus properties
  stage: number; // 0 to 5
  nextReviewDate: number; // Timestamp
  lastReviewedDate?: number; // Timestamp
  easeFactor: number; // Standard spaced repetition factor (default 2.5)
}

export interface QuizResult {
  correct: boolean;
  userAnswer: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  error?: string;
}