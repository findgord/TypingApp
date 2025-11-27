export enum TypingState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED'
}

export enum GameMode {
  STANDARD = 'Standard',
  DRILL = 'Error Drill',
  STORY = 'Story Mode'
}

export enum InputMode {
  KEYBOARD = 'Keyboard',
  VOICE = 'Voice'
}

export enum Difficulty {
  EASY = 'Easy',
  NORMAL = 'Normal',
  HARD = 'Hard',
  CODE = 'Code'
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  elapsedTime: number; // in seconds
  errors: Record<string, number>; // character -> count
}

export interface LetterState {
  char: string;
  status: 'correct' | 'incorrect' | 'pending' | 'extra';
}