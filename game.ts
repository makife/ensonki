export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'facebook' | 'email';
  lives: number;
  lastLifeRegeneration: number;
  totalScore: number;
  gamesWon: number;
  tournamentsWon: number;
  badges: Badge[];
  premiumUntil?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
}

export interface GameRoom {
  id: string;
  code?: string;
  mode: 'points' | 'timed';
  maxPoints?: number;
  timeLimit?: number;
  players: Player[];
  currentRound: number;
  status: 'waiting' | 'playing' | 'finished';
  winner?: string;
  letters: string[][];
  createdAt: number;
}

export interface Player {
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  isReady: boolean;
  currentWord: string;
  wordsSubmitted: string[];
}

export interface Tournament {
  id: string;
  participants: TournamentPlayer[];
  rounds: TournamentRound[];
  status: 'waiting' | 'in-progress' | 'completed';
  winner?: string;
  createdAt: number;
}

export interface TournamentPlayer {
  userId: string;
  displayName: string;
  photoURL?: string;
  isBot: boolean;
  currentRound: number;
  eliminated: boolean;
}

export interface TournamentRound {
  roundNumber: number;
  matches: Match[];
}

export interface Match {
  player1: string;
  player2: string;
  winner?: string;
  score1: number;
  score2: number;
  status: 'pending' | 'playing' | 'completed';
}

export interface WordValidation {
  word: string;
  isValid: boolean;
  points: number;
  definition?: string;
}