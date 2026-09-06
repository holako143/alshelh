export type TileState = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY' | 'ACTIVE';

export type RoomStatus =
  | 'WAITING'       // Waiting for opponent to join
  | 'READY_CHECK'   // Both players in room, waiting for ready toggles
  | 'COUNTDOWN'     // 3-2-1 countdown before match/round
  | 'PLAYING'       // Active round in progress
  | 'ROUND_ENDING'  // Round just finished, showing round results
  | 'MATCH_ENDED'   // All rounds finished, showing final results
  | 'CANCELLED';    // Room dissolved or abandoned

export type PlayerRole = 'host' | 'guest' | 'spectator';

export interface GameSettings {
  wordLength: number;
  maxAttempts: number;
  totalRounds: number;
  roundDurationSeconds: number; // e.g. 60
  customRoundDurations?: number[]; // optional custom duration per round
  transitionDurationSeconds: number; // e.g. 3
  showOpponentProgress: boolean;
  hardMode: boolean;
  maxPlayers?: number; // up to 10 players
  themeCategory?: string; // ALL, NATURE, SCIENCE, ANIMALS, ARTS, VALUES
}

export interface PlayerRoundStats {
  roundNumber: number;
  solved: boolean;
  attemptsUsed: number;
  completionTimeMs: number;
  score: number;
}

export interface PlayerState {
  id: string;
  nickname: string;
  role: PlayerRole;
  isReady: boolean;
  isConnected: boolean;
  connectedAt: number;
  disconnectedAt: number | null;
  totalScore: number;
  roundsWon: number;
  wordsSolved: number;
  totalAttempts: number;
  totalTimeMs: number;
  
  // Current active round state
  currentGuesses: string[];
  currentEvaluations: TileState[][];
  hasSolved: boolean;
  hasExhausted: boolean;
  finishedAt: number | null; // server timestamp when this player finished current round
  jokersRemaining?: number;
}

export interface RoundSummary {
  roundNumber: number;
  secretWord: string; // Only populated after round ends
  startedAt: number;
  endedAt: number;
  winnerPlayerId: string | null; // null if draw
  playerResults: Record<string, {
    solved: boolean;
    attemptsUsed: number;
    completionTimeMs: number;
    scoreGained: number;
  }>;
}

export interface WordHint {
  category: string;
  hint: string;
  icon: string;
  firstLetter?: string;
  lastLetter?: string;
  level2Hint?: string;
  level3Hint?: string;
}

export interface RoomState {
  roomCode: string;
  status: RoomStatus;
  settings: GameSettings;
  createdAt: number;
  updatedAt: number;
  stateVersion: number; // monotonically increasing
  
  hostPlayerId: string;
  guestPlayerId: string | null;
  players: Record<string, PlayerState>;
  
  currentRound: number;
  roundStartedAt: number | null;
  roundDurationMs: number;
  countdownEndsAt: number | null;
  transitionEndsAt: number | null;
  
  // Current round secret word is NOT sent to clients while PLAYING
  currentSecretWord?: string; 
  revealedWord: string | null;
  currentHint?: WordHint | null;
  
  roundSummaries: RoundSummary[];
  matchWinnerId: string | null;
  isDraw: boolean;
}

export type WebSocketClientMessage =
  | { type: 'PING'; timestamp: number }
  | { type: 'JOIN_ROOM'; roomCode: string; playerId: string; nickname: string; sessionToken: string }
  | { type: 'LEAVE_ROOM'; roomCode: string; playerId: string }
  | { type: 'TOGGLE_READY'; roomCode: string; playerId: string; isReady: boolean }
  | { type: 'UPDATE_SETTINGS'; roomCode: string; playerId: string; settings: Partial<GameSettings> }
  | { type: 'START_MATCH'; roomCode: string; playerId: string }
  | { type: 'SUBMIT_GUESS'; roomCode: string; playerId: string; roundNumber: number; guess: string; clientActionId: string }
  | { type: 'USE_JOKER'; roomCode: string; playerId: string; roundNumber: number }
  | { type: 'RECONNECT'; roomCode: string; playerId: string; sessionToken: string }
  | { type: 'REQUEST_SYNC'; roomCode: string; playerId: string };

export type WebSocketServerMessage =
  | { type: 'PONG'; clientTimestamp: number; serverTimestamp: number }
  | { type: 'ROOM_STATE_SYNC'; state: RoomState; serverTimestamp: number }
  | { type: 'COUNTDOWN_STARTED'; endsAt: number; serverTimestamp: number }
  | { type: 'ROUND_STARTED'; roundNumber: number; roundStartedAt: number; roundDurationMs: number; hint?: WordHint | null; stateVersion: number; serverTimestamp: number }
  | { type: 'GUESS_EVALUATED'; playerId: string; guess: string; evaluation: TileState[]; attemptsUsed: number; remainingAttempts: number; hasSolved: boolean; hasExhausted: boolean; scoreGained: number; clientActionId?: string; stateVersion: number }
  | { type: 'JOKER_ACTIVATED'; playerId: string; eliminatedLetters: string[]; jokersRemaining: number; serverTimestamp: number }
  | { type: 'OPPONENT_PROGRESS_UPDATE'; playerId: string; attemptsCount: number; hasSolved: boolean; hasExhausted: boolean; lastGuessPattern?: TileState[]; stateVersion: number }
  | { type: 'PLAYER_SOLVED_ROUND'; playerId: string; nickname: string; attemptsUsed: number; timeTakenMs: number; roundNumber: number; serverTimestamp: number }
  | { type: 'ROUND_ENDED'; roundNumber: number; revealedWord: string; summary: RoundSummary; nextRoundInMs: number; stateVersion: number }
  | { type: 'MATCH_FINISHED'; winnerId: string | null; isDraw: boolean; finalState: RoomState; stateVersion: number }
  | { type: 'PLAYER_CONNECTION_CHANGED'; playerId: string; isConnected: boolean; gracePeriodEndsAt?: number; stateVersion: number }
  | { type: 'ERROR'; code: string; message: string; fatal?: boolean };
