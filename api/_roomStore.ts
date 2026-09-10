import {
  RoomState,
  RoomStatus,
  PlayerState,
  GameSettings,
  RoundSummary,
  TileState,
} from '../src/shared/types';
import { DEFAULT_GAME_SETTINGS, GAME_CONFIG } from '../src/shared/constants';
import { selectSecretWord, validateGuessWord } from '../src/game-engine/word-validator';
import { evaluateGuess, isWordSolved } from '../src/game-engine/guess-evaluator';
import {
  calculateRoundScore,
  determineRoundWinner,
  determineMatchWinner,
  PlayerRoundCandidate,
  PlayerMatchCandidate,
} from '../src/game-engine/scoring';

export class ServerlessRoomManager {
  private rooms: Map<string, RoomState> = new Map();

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(
    hostId: string,
    nickname: string,
    _sessionToken: string,
    customSettings?: Partial<GameSettings>,
    fixedRoomCode?: string
  ): { success: boolean; roomCode: string; state: RoomState } {
    const roomCode = fixedRoomCode ? fixedRoomCode.trim().toUpperCase() : this.generateRoomCode();
    const settings: GameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      ...customSettings,
    };

    const now = Date.now();
    const hostPlayer: PlayerState = {
      id: hostId,
      nickname: nickname.trim().substring(0, 20),
      role: 'host',
      isReady: true,
      isConnected: true,
      connectedAt: now,
      disconnectedAt: null,
      totalScore: 0,
      roundsWon: 0,
      wordsSolved: 0,
      totalAttempts: 0,
      totalTimeMs: 0,
      currentGuesses: [],
      currentEvaluations: [],
      hasSolved: false,
      hasExhausted: false,
      finishedAt: null,
      jokersRemaining: settings.jokerCount !== undefined ? settings.jokerCount : 1,
    };

    const room: RoomState = {
      roomCode,
      status: 'WAITING',
      settings,
      createdAt: now,
      updatedAt: now,
      stateVersion: 1,
      hostPlayerId: hostId,
      guestPlayerId: null,
      players: { [hostId]: hostPlayer },
      currentRound: 0,
      roundStartedAt: null,
      roundDurationMs: settings.roundDurationSeconds * 1000,
      countdownEndsAt: null,
      transitionEndsAt: null,
      revealedWord: null,
      roundSummaries: [],
      matchWinnerId: null,
      isDraw: false,
    };

    this.rooms.set(roomCode, room);
    return {
      success: true,
      roomCode,
      state: this.sanitizeStateForPlayer(room, hostId),
    };
  }

  public joinRoom(
    roomCode: string,
    playerId: string,
    nickname: string,
    _sessionToken: string,
    fallbackSettings?: Partial<GameSettings>,
    fallbackHostName?: string
  ): { success: boolean; state?: RoomState; error?: string } {
    const code = roomCode.trim().toUpperCase();
    let room = this.rooms.get(code);

    if (!room) {
      // Auto-heal / restore room from invite context if lambda was restarted
      const hostName = fallbackHostName || nickname || 'المستضيف';
      const created = this.createRoom(playerId, hostName, 'tok_' + playerId, fallbackSettings, code);
      room = this.rooms.get(code);
    }

    if (!room) {
      return { success: false, error: 'رمز الغرفة غير موجود أو انتهت صلاحيتها' };
    }

    // Transfer placeholder host to real joining player
    if (room.hostPlayerId.startsWith('host_') && !room.players[room.hostPlayerId]?.isConnected) {
      delete room.players[room.hostPlayerId];
      room.hostPlayerId = playerId;
      room.players[playerId] = {
        id: playerId,
        nickname: nickname.trim().substring(0, 20) || 'المستضيف',
        role: 'host',
        isReady: true,
        isConnected: true,
        connectedAt: Date.now(),
        disconnectedAt: null,
        totalScore: 0,
        roundsWon: 0,
        wordsSolved: 0,
        totalAttempts: 0,
        totalTimeMs: 0,
        currentGuesses: [],
        currentEvaluations: [],
        hasSolved: false,
        hasExhausted: false,
        finishedAt: null,
        jokersRemaining: room.settings.jokerCount !== undefined ? room.settings.jokerCount : 1,
      };
      room.updatedAt = Date.now();
      room.stateVersion++;
      return {
        success: true,
        state: this.sanitizeStateForPlayer(room, playerId),
      };
    }

    this.checkRoundTimeout(room);

    // Reconnection of existing player
    if (room.players[playerId]) {
      const existing = room.players[playerId];
      existing.isConnected = true;
      existing.isReady = true;
      existing.nickname = nickname.trim().substring(0, 20);
      room.updatedAt = Date.now();
      room.stateVersion++;
      return {
        success: true,
        state: this.sanitizeStateForPlayer(room, playerId),
      };
    }

    // New player joining
    if (room.status !== 'WAITING' && room.status !== 'READY_CHECK') {
      return { success: false, error: 'المباراة جارية بالفعل، لا يمكن الانضمام الآن' };
    }

    const playerCount = Object.keys(room.players).length;
    if (playerCount >= (room.settings.maxPlayers || 2)) {
      return { success: false, error: 'الغرفة ممتلئة بالفعل' };
    }

    const now = Date.now();
    const newPlayer: PlayerState = {
      id: playerId,
      nickname: nickname.trim().substring(0, 20),
      role: 'guest',
      isReady: true, // Auto ready upon joining!
      isConnected: true,
      connectedAt: now,
      disconnectedAt: null,
      totalScore: 0,
      roundsWon: 0,
      wordsSolved: 0,
      totalAttempts: 0,
      totalTimeMs: 0,
      currentGuesses: [],
      currentEvaluations: [],
      hasSolved: false,
      hasExhausted: false,
      finishedAt: null,
      jokersRemaining: room.settings.jokerCount !== undefined ? room.settings.jokerCount : 1,
    };

    room.players[playerId] = newPlayer;
    if (!room.guestPlayerId) {
      room.guestPlayerId = playerId;
    }
    room.status = 'READY_CHECK';
    room.stateVersion++;
    room.updatedAt = now;

    const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
    const allReady = connectedPlayers.length >= 2 && connectedPlayers.every((p) => p.isReady);
    if (allReady) {
      this.startNextRound(room);
    }

    return {
      success: true,
      state: this.sanitizeStateForPlayer(room, playerId),
    };
  }

  public toggleReady(roomCode: string, playerId: string, isReady: boolean): void {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || !room.players[playerId]) return;
    room.players[playerId].isReady = isReady;
    room.stateVersion++;
    room.updatedAt = Date.now();
  }

  public updateSettings(roomCode: string, hostId: string, newSettings: Partial<GameSettings>): void {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.hostPlayerId !== hostId || (room.status !== 'WAITING' && room.status !== 'READY_CHECK')) return;
    room.settings = { ...room.settings, ...newSettings };
    room.roundDurationMs = room.settings.roundDurationSeconds * 1000;
    room.stateVersion++;
    room.updatedAt = Date.now();
  }

  public startMatch(roomCode: string, hostId: string): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.hostPlayerId !== hostId || (room.status !== 'WAITING' && room.status !== 'READY_CHECK')) {
      return false;
    }

    room.currentRound = 0;
    room.roundSummaries = [];
    room.matchWinnerId = null;
    room.isDraw = false;

    this.startNextRound(room);
    return true;
  }

  private startNextRound(room: RoomState): void {
    room.currentRound++;
    room.status = 'PLAYING';
    const secretObj = selectSecretWord(room.currentRound, undefined, room.settings.themeCategory);
    room.currentSecretWord = secretObj.word;
    room.currentHint = secretObj.hint;
    room.revealedWord = null;
    room.roundStartedAt = Date.now();
    room.transitionEndsAt = null;

    Object.values(room.players).forEach((p) => {
      p.currentGuesses = [];
      p.currentEvaluations = [];
      p.hasSolved = false;
      p.hasExhausted = false;
      p.finishedAt = null;
      p.jokersRemaining = room.settings.jokerCount !== undefined ? room.settings.jokerCount : 1;
    });

    room.stateVersion++;
    room.updatedAt = Date.now();
  }

  public submitGuess(
    roomCode: string,
    playerId: string,
    roundNumber: number,
    guess: string,
    _clientActionId: string
  ): { success: boolean; evaluation?: TileState[]; hasSolved?: boolean; error?: string } {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return { success: false, error: 'الغرفة غير موجودة' };

    this.checkRoundTimeout(room);

    if (room.status !== 'PLAYING') {
      return { success: false, error: 'الجولة غير جارية حالياً' };
    }

    if (room.currentRound !== roundNumber) {
      return { success: false, error: 'رقم الجولة غير متطابق' };
    }

    const player = room.players[playerId];
    if (!player) return { success: false, error: 'اللاعب غير موجود' };

    if (player.hasSolved || player.hasExhausted) {
      return { success: false, error: 'لقد انتهت محاولاتك في هذه الجولة' };
    }

    if (player.currentGuesses.length >= room.settings.maxAttempts) {
      player.hasExhausted = true;
      return { success: false, error: 'استنفدت جميع المحاولات' };
    }

    const validation = validateGuessWord(guess, false);
    if (!validation.isValid) {
      return { success: false, error: validation.errorMessage || 'كلمة غير مقبولة' };
    }

    const normalizedGuess = validation.normalizedWord;
    const secretWord = room.currentSecretWord || '';
    const evaluation = evaluateGuess(secretWord, normalizedGuess);
    const solved = isWordSolved(evaluation);

    player.currentGuesses.push(normalizedGuess);
    player.currentEvaluations.push(evaluation);
    player.totalAttempts++;

    const now = Date.now();
    if (solved) {
      player.hasSolved = true;
      player.finishedAt = now;
      player.wordsSolved++;
    } else if (player.currentGuesses.length >= room.settings.maxAttempts) {
      player.hasExhausted = true;
      player.finishedAt = now;
    }

    room.stateVersion++;
    room.updatedAt = now;

    const allFinished = Object.values(room.players).every((p) => p.hasSolved || p.hasExhausted);
    if (allFinished) {
      this.endRound(room);
    }

    return {
      success: true,
      evaluation,
      hasSolved: solved,
    };
  }

  public useJoker(roomCode: string, playerId: string, roundNumber: number): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.status !== 'PLAYING' || room.currentRound !== roundNumber) return false;

    const player = room.players[playerId];
    if (!player || (player.jokersRemaining ?? 0) <= 0 || player.hasSolved || player.hasExhausted) return false;

    player.jokersRemaining = (player.jokersRemaining ?? 1) - 1;
    room.stateVersion++;
    room.updatedAt = Date.now();
    return true;
  }

  private checkRoundTimeout(room: RoomState): void {
    if (room.status === 'PLAYING' && room.roundStartedAt && room.roundDurationMs > 0) {
      const now = Date.now();
      if (now >= room.roundStartedAt + room.roundDurationMs) {
        this.endRound(room);
      }
    }
  }

  private endRound(room: RoomState): void {
    room.status = 'ROUND_ENDING';
    room.revealedWord = room.currentSecretWord || null;
    const now = Date.now();
    const transitionMs = (room.settings.transitionDurationSeconds || 3) * 1000;
    room.transitionEndsAt = now + transitionMs;

    const roundStartedAt = room.roundStartedAt || now;
    const roundDurationMs = room.roundDurationMs;

    const candidates: PlayerRoundCandidate[] = Object.values(room.players).map((p) => {
      const timeMs = p.finishedAt ? p.finishedAt - roundStartedAt : roundDurationMs;
      return {
        id: p.id,
        solved: p.hasSolved,
        attempts: p.currentGuesses.length,
        timeMs,
      };
    });

    const winnerPlayerId = determineRoundWinner(candidates);

    const playerResults: RoundSummary['playerResults'] = {};
    Object.values(room.players).forEach((p) => {
      const timeMs = p.finishedAt ? p.finishedAt - roundStartedAt : roundDurationMs;
      const scoreRes = calculateRoundScore(p.hasSolved, p.currentGuesses.length, timeMs, roundDurationMs);
      const scoreGained = scoreRes.totalScore;

      p.totalScore += scoreGained;
      p.totalTimeMs += timeMs;
      if (p.id === winnerPlayerId) {
        p.roundsWon++;
      }

      playerResults[p.id] = {
        solved: p.hasSolved,
        attemptsUsed: p.currentGuesses.length,
        completionTimeMs: timeMs,
        scoreGained,
      };
    });

    const summary: RoundSummary = {
      roundNumber: room.currentRound,
      secretWord: room.revealedWord || '',
      startedAt: roundStartedAt,
      endedAt: now,
      winnerPlayerId,
      playerResults,
    };

    room.roundSummaries.push(summary);

    if (room.currentRound >= room.settings.totalRounds) {
      const matchCandidates: PlayerMatchCandidate[] = Object.values(room.players).map((p) => ({
        id: p.id,
        score: p.totalScore,
        roundsWon: p.roundsWon,
        wordsSolved: p.wordsSolved,
        totalTimeMs: p.totalTimeMs,
      }));

      const matchRes = determineMatchWinner(matchCandidates);
      room.status = 'MATCH_ENDED';
      room.matchWinnerId = matchRes.winnerId || null;
      room.isDraw = matchRes.isDraw;
    }

    room.stateVersion++;
    room.updatedAt = now;
  }

  public getRoomState(roomCode: string, playerId?: string): RoomState | null {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return null;

    this.checkRoundTimeout(room);
    return playerId ? this.sanitizeStateForPlayer(room, playerId) : this.sanitizeStateForRoom(room);
  }

  private sanitizeStateForPlayer(room: RoomState, forPlayerId: string): RoomState {
    const copy: RoomState = JSON.parse(JSON.stringify(room));
    if (copy.status === 'PLAYING') {
      delete copy.currentSecretWord;
      copy.revealedWord = null;
      for (const [pId, p] of Object.entries(copy.players)) {
        if (pId !== forPlayerId) {
          p.currentGuesses = p.currentGuesses.map(() => '*****');
        }
      }
    }
    return copy;
  }

  private sanitizeStateForRoom(room: RoomState): RoomState {
    const copy: RoomState = JSON.parse(JSON.stringify(room));
    if (copy.status === 'PLAYING') {
      delete copy.currentSecretWord;
      copy.revealedWord = null;
      for (const p of Object.values(copy.players)) {
        p.currentGuesses = p.currentGuesses.map(() => '*****');
      }
    }
    return copy;
  }
}

// Global in-memory singleton for serverless container reuse
const globalForRooms = globalThis as unknown as {
  serverlessRoomManager?: ServerlessRoomManager;
};

export const roomManager = globalForRooms.serverlessRoomManager ?? new ServerlessRoomManager();
globalForRooms.serverlessRoomManager = roomManager;
