export interface WordPair {
  id: string;
  word: string;
  definition: string;
}

export type PuzzleType = 'wordsearch' | 'crossword' | 'anagram' | 'matching' | 'fillin' | 'flashcards' | 'all';

export interface AppState {
  vocabList: WordPair[];
  puzzleType: PuzzleType;
  locale: 'en' | 'es';
  title: string;
  institution: string;
  logoUrl?: string; // New field for logo
  course: string;
  trimester: string;
  groups: string;
  seed: number;
  showWordBank: boolean;
  showAnswerKey: boolean;
  settings: {
    gridSize: number; // For word search
    scramble: boolean; // For flashcards/matching
    includeDistractors: boolean;
  };
}

export interface GridCell {
  char: string | null;
  x: number;
  y: number;
  isWordStart?: boolean;
  wordNum?: number;
  across?: boolean;
}

export interface CrosswordLayout {
  grid: GridCell[][];
  placedWords: {
    word: string;
    clue: string;
    x: number;
    y: number;
    direction: 'across' | 'down';
    number: number;
  }[];
  width: number;
  height: number;
}
