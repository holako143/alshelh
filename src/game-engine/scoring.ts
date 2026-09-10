import { GAME_CONFIG } from '../shared/constants';

export interface ScoreBreakdown {
  baseScore: number;
  attemptPenalty: number;
  timeBonus: number;
  totalScore: number;
}

/**
 * Deterministic scoring calculation
 *
 * Solved word:
 * - Base points: 1000
 * - Attempt penalty: (attemptsUsed - 1) * 75
 * - Time bonus: up to 300 points based on speed
 *
 * Unsolved word:
 * - 0 points
 */
export function calculateRoundScore(
  solved: boolean,
  attemptsUsed: number,
  timeTakenMs: number,
  roundDurationMs: number
): ScoreBreakdown {
  if (!solved) {
    return {
      baseScore: 0,
      attemptPenalty: 0,
      timeBonus: 0,
      totalScore: 0,
    };
  }

  const baseScore = GAME_CONFIG.baseScorePerRound;
  // Penalty grows with each additional attempt after the 1st
  const attemptPenalty = Math.max(0, (attemptsUsed - 1) * GAME_CONFIG.penaltyPerAttempt);

  // Time bonus: percentage of time saved * maxTimeBonus (or standard bonus if infinite duration)
  const timeFractionRemaining =
    roundDurationMs > 0
      ? Math.max(0, Math.min(1, (roundDurationMs - timeTakenMs) / roundDurationMs))
      : 0.5;
  const timeBonus = Math.round(timeFractionRemaining * GAME_CONFIG.maxTimeBonus);

  const totalScore = Math.max(100, baseScore - attemptPenalty + timeBonus);

  return {
    baseScore,
    attemptPenalty,
    timeBonus,
    totalScore,
  };
}

export interface PlayerRoundCandidate {
  id: string;
  solved: boolean;
  attempts: number;
  timeMs: number;
}

export interface PlayerMatchCandidate {
  id: string;
  score: number;
  roundsWon: number;
  wordsSolved: number;
  totalTimeMs: number;
}

/**
 * Determines the round winner among players (supports 2 to 10 players or array of players)
 *
 * 1. Solved beats Unsolved
 * 2. If both/multiple solved: fewer attempts wins
 * 3. If tied attempts: faster time wins
 * 4. If exact tie or neither solved: Draw (null)
 */
export function determineRoundWinner(
  first: PlayerRoundCandidate | PlayerRoundCandidate[],
  second?: PlayerRoundCandidate
): string | null {
  const players: PlayerRoundCandidate[] = Array.isArray(first)
    ? first
    : second
    ? [first, second]
    : [first];

  const solvedPlayers = players.filter((p) => p.solved);
  if (solvedPlayers.length === 0) return null;

  // Sort by attempts (ascending), then timeMs (ascending)
  solvedPlayers.sort((a, b) => {
    if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    return a.timeMs - b.timeMs;
  });

  if (solvedPlayers.length === 1) return solvedPlayers[0].id;

  // Check if first place is strictly ahead of second place
  const p1 = solvedPlayers[0];
  const p2 = solvedPlayers[1];
  if (p1.attempts === p2.attempts && p1.timeMs === p2.timeMs) {
    return null; // absolute tie
  }

  return p1.id;
}

/**
 * Determines overall match winner from final scores and stats (supports 2 to 10 players)
 */
export function determineMatchWinner(
  first: PlayerMatchCandidate | PlayerMatchCandidate[],
  second?: PlayerMatchCandidate
): {
  winnerId: string | null;
  isDraw: boolean;
  reason: string;
  rankedPlayerIds?: string[];
} {
  const players: PlayerMatchCandidate[] = Array.isArray(first)
    ? [...first]
    : second
    ? [first, second]
    : [first];

  if (players.length === 0) {
    return { winnerId: null, isDraw: true, reason: 'لا يوجد لاعبون' };
  }

  // Sort all players:
  // 1. Highest total score
  // 2. Most rounds won
  // 3. Most words solved
  // 4. Lowest total time
  players.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.roundsWon !== a.roundsWon) return b.roundsWon - a.roundsWon;
    if (b.wordsSolved !== a.wordsSolved) return b.wordsSolved - a.wordsSolved;
    return a.totalTimeMs - b.totalTimeMs;
  });

  const rankedPlayerIds = players.map((p) => p.id);

  if (players.length === 1) {
    return { winnerId: players[0].id, isDraw: false, reason: 'الفائز الوحيد', rankedPlayerIds };
  }

  const p1 = players[0];
  const p2 = players[1];

  let reason = 'أعلى مجموع نقاط';
  if (p1.score > p2.score) {
    reason = 'أعلى مجموع نقاط';
  } else if (p1.roundsWon > p2.roundsWon) {
    reason = 'أكثر عدد جولات فائزة';
  } else if (p1.wordsSolved > p2.wordsSolved) {
    reason = 'أكثر عدد كلمات محلولة';
  } else if (p1.totalTimeMs < p2.totalTimeMs) {
    reason = 'زمن إجمالي أسرع';
  } else {
    return { winnerId: null, isDraw: true, reason: 'تعادل تام', rankedPlayerIds };
  }

  return { winnerId: p1.id, isDraw: false, reason, rankedPlayerIds };
}
