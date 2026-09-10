import { WebSocket } from 'ws';
import {
  RoomState,
  RoomStatus,
  PlayerState,
  GameSettings,
  RoundSummary,
  WebSocketServerMessage,
} from '../src/shared/types';
import { DEFAULT_GAME_SETTINGS, GAME_CONFIG, ARABIC_LETTERS_SET } from '../src/shared/constants';
import { selectSecretWord, validateGuessWord } from '../src/game-engine/word-validator';
import { evaluateGuess, isWordSolved } from '../src/game-engine/guess-evaluator';
import { calculateRoundScore, determineRoundWinner, determineMatchWinner } from '../src/game-engine/scoring';

interface ConnectedClient {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
  sessionToken: string;
}

export class RoomManager {
  // roomCode -> RoomState
  private rooms: Map<string, RoomState> = new Map();
  // ws -> ConnectedClient
  private clients: Map<WebSocket, ConnectedClient> = new Map();
  // playerId -> WebSocket
  private playerSockets: Map<string, WebSocket> = new Map();
  // Idempotency cache: roomCode:roundNumber:clientActionId -> boolean
  private idempotencyCache: Map<string, any> = new Map();
  // Interval timer for server game loop (authoritative timer)
  private tickInterval: NodeJS.Timeout | null = null;
  // Debounce timers for momentary disconnects to avoid flashing alert banners on minor network jitter
  private disconnectDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.startServerGameLoop();
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }

  public getTotalPlayerCount(): number {
    return this.playerSockets.size;
  }

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

  /**
   * Creates a new room with host player
   */
  public createRoom(
    hostId: string,
    nickname: string,
    sessionToken: string,
    customSettings?: Partial<GameSettings>,
    fixedRoomCode?: string
  ): { roomCode: string; state: RoomState } {
    let roomCode = fixedRoomCode ? fixedRoomCode.trim().toUpperCase() : this.generateRoomCode();
    const settings: GameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      ...customSettings,
    };

    // If room already exists in WAITING state, cleanly attach host
    if (this.rooms.has(roomCode)) {
      const existing = this.rooms.get(roomCode)!;
      if (existing.status === 'WAITING' || existing.status === 'READY_CHECK') {
        existing.hostPlayerId = hostId;
        existing.settings = { ...existing.settings, ...settings };
        existing.players[hostId] = {
          id: hostId,
          nickname: nickname.trim() || 'المستضيف',
          role: 'host',
          isReady: true, // Auto ready!
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
          jokersRemaining: settings.jokerCount !== undefined ? settings.jokerCount : 1,
        };
        existing.updatedAt = Date.now();
        existing.stateVersion++;
        return { roomCode, state: this.sanitizeStateForPlayer(existing, hostId) };
      }
    }

    const hostPlayer: PlayerState = {
      id: hostId,
      nickname: nickname.trim() || 'المستضيف',
      role: 'host',
      isReady: true, // Auto ready upon creation!
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
      jokersRemaining: settings.jokerCount !== undefined ? settings.jokerCount : 1,
    };

    const roomState: RoomState = {
      roomCode,
      status: 'WAITING',
      settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stateVersion: 1,
      hostPlayerId: hostId,
      guestPlayerId: null,
      players: {
        [hostId]: hostPlayer,
      },
      currentRound: 0,
      roundStartedAt: null,
      roundDurationMs: settings.roundDurationSeconds * 1000,
      countdownEndsAt: null,
      transitionEndsAt: null,
      currentSecretWord: undefined,
      revealedWord: null,
      roundSummaries: [],
      matchWinnerId: null,
      isDraw: false,
    };

    this.rooms.set(roomCode, roomState);
    return { roomCode, state: this.sanitizeStateForPlayer(roomState, hostId) };
  }

  /**
   * Joins an existing room
   */
  public joinRoom(
    roomCode: string,
    playerId: string,
    nickname: string,
    sessionToken: string
  ): { success: boolean; state?: RoomState; error?: string } {
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    let room = this.rooms.get(normalizedRoomCode);
    if (!room) {
      // Auto-heal: If joining a valid 5-character code, initialize room with this player as host!
      if (normalizedRoomCode.length === 5) {
        this.createRoom(playerId, nickname || 'المستضيف', sessionToken, undefined, normalizedRoomCode);
        room = this.rooms.get(normalizedRoomCode);
      }
      if (!room) {
        return { success: false, error: 'رمز الغرفة غير موجود' };
      }
    }

    // If room has an unattached placeholder host, transfer host role to this real player
    if (room.hostPlayerId.startsWith('host_') && !room.players[room.hostPlayerId]?.isConnected) {
      delete room.players[room.hostPlayerId];
      room.hostPlayerId = playerId;
      room.players[playerId] = {
        id: playerId,
        nickname: nickname.trim() || 'المستضيف',
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
      room.stateVersion++;
      room.updatedAt = Date.now();
      return { success: true, state: this.sanitizeStateForPlayer(room, playerId) };
    }

    // Check if player is already in this room (reconnection or socket re-join)
    if (room.players[playerId]) {
      room.players[playerId].isConnected = true;
      room.players[playerId].isReady = true; // Auto-ready
      room.players[playerId].disconnectedAt = null;
      if (nickname && nickname.trim()) {
        room.players[playerId].nickname = nickname.trim();
      }
      room.stateVersion++;
      room.updatedAt = Date.now();

      // Check if all ready upon reconnect
      const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
      const allReady = connectedPlayers.length >= 2 && connectedPlayers.every((p) => p.isReady);
      if (allReady && (room.status === 'READY_CHECK' || room.status === 'WAITING')) {
        this.startCountdown(room);
      } else {
        this.broadcastStateSync(room);
      }

      return { success: true, state: this.sanitizeStateForPlayer(room, playerId) };
    }

    // Check capacity (up to 10 players or configured room capacity)
    const maxCapacity = room.settings.maxPlayers || GAME_CONFIG.maxPlayersPerRoom;
    const existingPlayerCount = Object.keys(room.players).length;
    if (existingPlayerCount >= maxCapacity) {
      return { success: false, error: `الغرفة مكتملة (الحد الأقصى ${maxCapacity} لاعبين)` };
    }

    if (room.status !== 'WAITING' && room.status !== 'READY_CHECK') {
      return { success: false, error: 'بدأت المباراة بالفعل في هذه الغرفة' };
    }

    const guestPlayer: PlayerState = {
      id: playerId,
      nickname: nickname.trim() || `اللاعب ${existingPlayerCount + 1}`,
      role: 'guest',
      isReady: true, // Auto ready upon entering code and joining!
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

    if (!room.guestPlayerId) {
      room.guestPlayerId = playerId;
    }
    room.players[playerId] = guestPlayer;
    if (Object.keys(room.players).length >= 2) {
      room.status = 'READY_CHECK';
    }
    room.stateVersion++;
    room.updatedAt = Date.now();

    // Auto-start match quickly when players enter and are ready!
    const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
    const allReady = connectedPlayers.length >= 2 && connectedPlayers.every((p) => p.isReady);

    if (allReady && (room.status === 'READY_CHECK' || room.status === 'WAITING')) {
      this.startCountdown(room);
    } else {
      this.broadcastStateSync(room);
    }

    return { success: true, state: this.sanitizeStateForPlayer(room, playerId) };
  }

  /**
   * Toggle player ready status
   */
  public toggleReady(roomCode: string, playerId: string, isReady: boolean): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || !room.players[playerId]) return false;

    room.players[playerId].isReady = isReady;
    room.stateVersion++;
    room.updatedAt = Date.now();

    // Check if all connected players in the room (minimum 2) are ready
    const players = Object.values(room.players);
    const connectedPlayers = players.filter((p) => p.isConnected);
    const allReady = connectedPlayers.length >= 2 && connectedPlayers.every((p) => p.isReady);

    if (allReady && (room.status === 'READY_CHECK' || room.status === 'WAITING')) {
      this.startCountdown(room);
    } else {
      this.broadcastStateSync(room);
    }

    return true;
  }

  /**
   * Host starts the match manually if at least 2 players are ready
   */
  public startMatch(roomCode: string, hostPlayerId: string): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.hostPlayerId !== hostPlayerId) return false;
    if (room.status !== 'WAITING' && room.status !== 'READY_CHECK') return false;

    const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
    if (connectedPlayers.length < 2) return false;

    // Immediately start round with zero delay when host starts match!
    this.startNextRound(room);
    return true;
  }

  /**
   * Host updates game settings
   */
  public updateSettings(roomCode: string, playerId: string, newSettings: Partial<GameSettings>): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.hostPlayerId !== playerId || room.status !== 'WAITING' && room.status !== 'READY_CHECK') {
      return false;
    }

    room.settings = {
      ...room.settings,
      ...newSettings,
    };
    room.roundDurationMs = room.settings.roundDurationSeconds * 1000;
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.broadcastToRoom(room.roomCode, {
      type: 'ROOM_STATE_SYNC',
      state: this.sanitizeStateForRoom(room),
      serverTimestamp: Date.now(),
    });

    return true;
  }

  /**
   * Starts a fast 1.2-second countdown before round 1 or match start
   */
  private startCountdown(room: RoomState) {
    room.status = 'COUNTDOWN';
    const countdownDurationMs = 1200;
    room.countdownEndsAt = Date.now() + countdownDurationMs;
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.broadcastToRoom(room.roomCode, {
      type: 'COUNTDOWN_STARTED',
      endsAt: room.countdownEndsAt,
      serverTimestamp: Date.now(),
    });

    setTimeout(() => {
      // Ensure room is still in countdown
      if (room.status === 'COUNTDOWN') {
        this.startNextRound(room);
      }
    }, countdownDurationMs);
  }

  /**
   * Starts next round with server-authoritative secret word and timer
   */
  private startNextRound(room: RoomState) {
    room.currentRound++;
    room.status = 'PLAYING';
    room.countdownEndsAt = null;
    room.transitionEndsAt = null;
    room.revealedWord = null;

    // Reset player round states
    for (const p of Object.values(room.players)) {
      p.currentGuesses = [];
      p.currentEvaluations = [];
      p.hasSolved = false;
      p.hasExhausted = false;
      p.finishedAt = null;
      p.jokersRemaining = room.settings.jokerCount !== undefined ? room.settings.jokerCount : 1;
    }

    // Determine duration for this round (custom or standard)
    const customDurations = room.settings.customRoundDurations;
    let durationSec = room.settings.roundDurationSeconds;
    if (customDurations && customDurations[room.currentRound - 1]) {
      durationSec = customDurations[room.currentRound - 1];
    }
    room.roundDurationMs = durationSec * 1000;
    room.roundStartedAt = Date.now();

    // Select secret word on the server ONCE for both players with optional theme
    const { word, hint } = selectSecretWord(room.currentRound, undefined, room.settings.themeCategory);
    room.currentSecretWord = word;
    room.currentHint = hint;
    room.stateVersion++;
    room.updatedAt = Date.now();

    // Broadcast ROUND_STARTED (without the secret word, but with the clue!)
    this.broadcastToRoom(room.roomCode, {
      type: 'ROUND_STARTED',
      roundNumber: room.currentRound,
      roundStartedAt: room.roundStartedAt,
      roundDurationMs: room.roundDurationMs,
      hint: room.currentHint,
      stateVersion: room.stateVersion,
      serverTimestamp: Date.now(),
    });

    // Also send fresh state sync
    this.broadcastStateSync(room);
  }

  /**
   * Submit and evaluate a player's guess
   */
  public submitGuess(
    roomCode: string,
    playerId: string,
    roundNumber: number,
    guess: string,
    clientActionId: string
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return { success: false, error: 'الغرفة غير موجودة' };

    const player = room.players[playerId];
    if (!player) return { success: false, error: 'اللاعب غير مسجل في هذه الغرفة' };

    // Idempotency check
    const idempotencyKey = `${roomCode}:${roundNumber}:${clientActionId}`;
    if (this.idempotencyCache.has(idempotencyKey)) {
      return { success: true };
    }

    if (room.status !== 'PLAYING') {
      return { success: false, error: 'الجولة ليست نشطة حالياً' };
    }

    if (room.currentRound !== roundNumber) {
      return { success: false, error: 'رقم الجولة غير مطابق للواقع الخادم' };
    }

    if (player.hasSolved || player.hasExhausted) {
      return { success: false, error: 'لقد أنهيت محاولاتك في هذه الجولة بالفعل' };
    }

    if (player.currentGuesses.length >= room.settings.maxAttempts) {
      return { success: false, error: 'تم استنفاد الحد الأقصى للمحاولات' };
    }

    // Validate guess using Arabic Word Engine
    const validation = validateGuessWord(guess, true);
    if (!validation.isValid) {
      return { success: false, error: validation.errorMessage || 'الكلمة غير صالحة' };
    }

    const secretWord = room.currentSecretWord;
    if (!secretWord) {
      return { success: false, error: 'خطأ داخلي في كلمة الجولة' };
    }

    // Evaluate guess using two-pass algorithm
    const evaluation = evaluateGuess(secretWord, validation.normalizedWord);
    const solved = isWordSolved(evaluation);

    player.currentGuesses.push(validation.normalizedWord);
    player.currentEvaluations.push(evaluation);
    player.totalAttempts++;

    const attemptsUsed = player.currentGuesses.length;
    const remainingAttempts = room.settings.maxAttempts - attemptsUsed;

    if (solved) {
      player.hasSolved = true;
      player.wordsSolved++;
      player.finishedAt = Date.now();
      const timeTakenMs = player.finishedAt - (room.roundStartedAt || player.finishedAt);
      player.totalTimeMs += timeTakenMs;

      const scoreBreakdown = calculateRoundScore(
        true,
        attemptsUsed,
        timeTakenMs,
        room.roundDurationMs
      );
      player.totalScore += scoreBreakdown.totalScore;

      // Broadcast victory event immediately to ALL players in the room!
      this.broadcastToRoom(room.roomCode, {
        type: 'PLAYER_SOLVED_ROUND',
        playerId,
        nickname: player.nickname,
        attemptsUsed,
        timeTakenMs,
        roundNumber: room.currentRound,
        serverTimestamp: Date.now(),
      });
    } else if (remainingAttempts <= 0) {
      player.hasExhausted = true;
      player.finishedAt = Date.now();
      const timeTakenMs = player.finishedAt - (room.roundStartedAt || player.finishedAt);
      player.totalTimeMs += timeTakenMs;
    }

    // Record idempotency
    this.idempotencyCache.set(idempotencyKey, true);
    room.stateVersion++;
    room.updatedAt = Date.now();

    // Send GUESS_EVALUATED to the guessing player
    this.sendToPlayer(playerId, {
      type: 'GUESS_EVALUATED',
      playerId,
      guess: validation.normalizedWord,
      evaluation,
      attemptsUsed,
      remainingAttempts,
      hasSolved: player.hasSolved,
      hasExhausted: player.hasExhausted,
      scoreGained: solved ? player.totalScore : 0,
      clientActionId,
      stateVersion: room.stateVersion,
    });

    // Notify all other players in the room of progress (without revealing the guess letters!)
    if (room.settings.showOpponentProgress) {
      for (const otherPlayerId of Object.keys(room.players)) {
        if (otherPlayerId !== playerId) {
          this.sendToPlayer(otherPlayerId, {
            type: 'OPPONENT_PROGRESS_UPDATE',
            playerId,
            attemptsCount: attemptsUsed,
            hasSolved: player.hasSolved,
            hasExhausted: player.hasExhausted,
            lastGuessPattern: evaluation, // reveals tile colors, NOT letters
            stateVersion: room.stateVersion,
          });
        }
      }
    }

    // Check if round should end now (all active players finished)
    const allPlayersFinished = Object.values(room.players).every(
      (p) => p.hasSolved || p.hasExhausted
    );

    if (allPlayersFinished) {
      this.endRound(room);
    }

    return { success: true };
  }

  /**
   * Activates Joker power-up for a player, eliminating up to 3 incorrect Arabic letters
   */
  public useJoker(roomCode: string, playerId: string, roundNumber: number): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.status !== 'PLAYING' || room.currentRound !== roundNumber) return false;
    const player = room.players[playerId];
    if (!player || (player.jokersRemaining !== undefined && player.jokersRemaining <= 0)) return false;

    const secretWord = room.currentSecretWord || '';
    if (!secretWord) return false;

    // Collect letters present in the secret word
    const secretLetters = new Set(secretWord.split(''));

    // Collect letters already guessed by this player
    const guessedLetters = new Set(player.currentGuesses.join('').split(''));

    // Arabic alphabet letters that are NOT in secret word and NOT yet guessed
    const candidateLetters = Array.from(ARABIC_LETTERS_SET).filter(
      (ch) => !secretLetters.has(ch) && !guessedLetters.has(ch)
    );

    // Shuffle and pick eliminated letters
    const shuffled = candidateLetters.sort(() => Math.random() - 0.5);
    const eliminateCount = room.settings.jokerEliminateCount ?? 3;
    const eliminatedLetters = shuffled.slice(0, eliminateCount);

    player.jokersRemaining = Math.max(0, (player.jokersRemaining ?? 1) - 1);
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.sendToPlayer(playerId, {
      type: 'JOKER_ACTIVATED',
      playerId,
      eliminatedLetters,
      jokersRemaining: player.jokersRemaining,
      serverTimestamp: Date.now(),
    });

    return true;
  }

  /**
   * End current round and transition to round result, then next round or match completion
   */
  private endRound(room: RoomState) {
    if (room.status !== 'PLAYING') return;

    room.status = 'ROUND_ENDING';
    const now = Date.now();
    const revealedWord = room.currentSecretWord || '';
    room.revealedWord = revealedWord;

    // Build round summary
    const playersList = Object.values(room.players);
    const roundCandidates = playersList.map((p) => {
      const pTime = p.finishedAt ? p.finishedAt - (room.roundStartedAt || now) : room.roundDurationMs;
      return {
        id: p.id,
        solved: p.hasSolved,
        attempts: p.currentGuesses.length,
        timeMs: pTime,
      };
    });

    const winnerId = determineRoundWinner(roundCandidates);
    if (winnerId && room.players[winnerId]) {
      room.players[winnerId].roundsWon++;
    }

    const playerResults: Record<string, any> = {};
    for (const p of playersList) {
      const timeMs = p.finishedAt ? p.finishedAt - (room.roundStartedAt || now) : room.roundDurationMs;
      const scoreGained = p.hasSolved
        ? calculateRoundScore(true, p.currentGuesses.length, timeMs, room.roundDurationMs).totalScore
        : 0;

      playerResults[p.id] = {
        solved: p.hasSolved,
        attemptsUsed: p.currentGuesses.length,
        completionTimeMs: timeMs,
        scoreGained,
      };
    }

    const summary: RoundSummary = {
      roundNumber: room.currentRound,
      secretWord: revealedWord,
      startedAt: room.roundStartedAt || now,
      endedAt: now,
      winnerPlayerId: winnerId,
      playerResults,
    };

    room.roundSummaries.push(summary);
    const transitionDurationMs = room.settings.transitionDurationSeconds * 1000;
    room.transitionEndsAt = now + transitionDurationMs;
    room.stateVersion++;
    room.updatedAt = now;

    // Broadcast ROUND_ENDED with revealed secret word
    this.broadcastToRoom(room.roomCode, {
      type: 'ROUND_ENDED',
      roundNumber: room.currentRound,
      revealedWord,
      summary,
      nextRoundInMs: transitionDurationMs,
      transitionEndsAt: room.transitionEndsAt,
      stateVersion: room.stateVersion,
      serverTimestamp: now,
    });

    // Check if match is finished
    const isFinalRound = room.currentRound >= room.settings.totalRounds;

    setTimeout(() => {
      if (room.status !== 'ROUND_ENDING') return;

      if (isFinalRound) {
        this.finishMatch(room);
      } else {
        this.startNextRound(room);
      }
    }, transitionDurationMs);
  }

  /**
   * Finalizes the match and determines overall winner
   */
  private finishMatch(room: RoomState) {
    room.status = 'MATCH_ENDED';
    const playersList = Object.values(room.players);

    const matchCandidates = playersList.map((p) => ({
      id: p.id,
      score: p.totalScore,
      roundsWon: p.roundsWon,
      wordsSolved: p.wordsSolved,
      totalTimeMs: p.totalTimeMs,
    }));

    const result = determineMatchWinner(matchCandidates);
    room.matchWinnerId = result.winnerId;
    room.isDraw = result.isDraw;

    room.stateVersion++;
    room.updatedAt = Date.now();

    this.broadcastToRoom(room.roomCode, {
      type: 'MATCH_FINISHED',
      winnerId: room.matchWinnerId,
      isDraw: room.isDraw,
      finalState: this.sanitizeStateForRoom(room),
      stateVersion: room.stateVersion,
    });
  }

  /**
   * Reconnection handling
   */
  public handleReconnect(
    roomCode: string,
    playerId: string,
    sessionToken: string,
    ws: WebSocket
  ): { success: boolean; state?: RoomState; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { success: false, error: 'الغرفة غير موجودة' };

    const player = room.players[playerId];
    if (!player) return { success: false, error: 'اللاعب غير مسجل في هذه الغرفة' };

    player.isConnected = true;
    player.disconnectedAt = null;
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.registerClient(ws, playerId, roomCode, sessionToken);

    // Notify opponent of reconnection
    this.broadcastToRoom(roomCode, {
      type: 'PLAYER_CONNECTION_CHANGED',
      playerId,
      isConnected: true,
      stateVersion: room.stateVersion,
    });

    return { success: true, state: this.sanitizeStateForPlayer(room, playerId) };
  }

  /**
   * Disconnect handling with debounce and 30-second grace period
   */
  public handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomCode, playerId } = client;
    this.clients.delete(ws);

    // CRITICAL: Only proceed if this closed socket was still the active registered socket for the player!
    // If the player already reconnected on a new socket, playerSockets.get(playerId) !== ws.
    if (this.playerSockets.get(playerId) !== ws) {
      return;
    }
    this.playerSockets.delete(playerId);

    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return;

    const player = room.players[playerId];
    if (!player) return;

    // Clear any previous debounce timer for this player
    if (this.disconnectDebounceTimers.has(playerId)) {
      clearTimeout(this.disconnectDebounceTimers.get(playerId)!);
      this.disconnectDebounceTimers.delete(playerId);
    }

    // Debounce by 1500ms so transient network blips/reconnects don't alarm other players
    const debounceTimer = setTimeout(() => {
      this.disconnectDebounceTimers.delete(playerId);

      // Verify player is STILL disconnected after debounce
      if (!this.playerSockets.has(playerId) && player && player.isConnected) {
        player.isConnected = false;
        player.disconnectedAt = Date.now();
        room.stateVersion++;
        room.updatedAt = Date.now();

        const gracePeriodEndsAt = Date.now() + GAME_CONFIG.reconnectGracePeriodMs;

        this.broadcastToRoom(roomCode, {
          type: 'PLAYER_CONNECTION_CHANGED',
          playerId,
          isConnected: false,
          gracePeriodEndsAt,
          stateVersion: room.stateVersion,
        });

        // After grace period, if still disconnected and in match, handle forfeit or dissolution
        setTimeout(() => {
          if (player && !player.isConnected && room.status !== 'MATCH_ENDED') {
            // If room was in WAITING, remove player
            if (room.status === 'WAITING' || room.status === 'READY_CHECK') {
              delete room.players[playerId];
              if (room.guestPlayerId === playerId) room.guestPlayerId = null;
              if (Object.keys(room.players).length === 0) {
                this.rooms.delete(roomCode);
              } else {
                room.status = 'WAITING';
                this.broadcastStateSync(room);
              }
            }
          }
        }, GAME_CONFIG.reconnectGracePeriodMs);
      }
    }, 1500);

    this.disconnectDebounceTimers.set(playerId, debounceTimer);
  }

  /**
   * Server Game Loop for authoritative expiration checks
   */
  private startServerGameLoop() {
    this.tickInterval = setInterval(() => {
      const now = Date.now();
      for (const room of this.rooms.values()) {
        if (room.status === 'PLAYING' && room.roundStartedAt && room.roundDurationMs > 0) {
          const expiresAt = room.roundStartedAt + room.roundDurationMs;
          if (now >= expiresAt) {
            // Round expired by server clock!
            for (const p of Object.values(room.players)) {
              if (!p.hasSolved && !p.hasExhausted) {
                p.hasExhausted = true;
                p.finishedAt = now;
                p.totalTimeMs += room.roundDurationMs;
              }
            }
            this.endRound(room);
          }
        }
      }
    }, 250); // Check 4 times per second
  }

  public registerClient(ws: WebSocket, playerId: string, roomCode: string, sessionToken: string) {
    const normalizedCode = roomCode.trim().toUpperCase();

    // Cancel any pending disconnect debounce timer for this player immediately
    if (this.disconnectDebounceTimers.has(playerId)) {
      clearTimeout(this.disconnectDebounceTimers.get(playerId)!);
      this.disconnectDebounceTimers.delete(playerId);
    }

    this.clients.set(ws, { ws, playerId, roomCode: normalizedCode, sessionToken });
    this.playerSockets.set(playerId, ws);

    const room = this.rooms.get(normalizedCode);
    if (room && room.players[playerId]) {
      const player = room.players[playerId];
      const wasDisconnected = !player.isConnected;
      player.isConnected = true;
      player.disconnectedAt = null;
      room.stateVersion++;
      room.updatedAt = Date.now();

      if (wasDisconnected) {
        this.broadcastToRoom(normalizedCode, {
          type: 'PLAYER_CONNECTION_CHANGED',
          playerId,
          isConnected: true,
          stateVersion: room.stateVersion,
        });
      }

      this.broadcastStateSync(room);
    }
  }

  public getRoomState(roomCode: string, playerId?: string): RoomState | null {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return null;
    return playerId ? this.sanitizeStateForPlayer(room, playerId) : this.sanitizeStateForRoom(room);
  }

  public broadcastToRoom(roomCode: string, message: WebSocketServerMessage) {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return;

    const json = JSON.stringify(message);
    for (const playerId of Object.keys(room.players)) {
      const socket = this.playerSockets.get(playerId);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(json);
      }
    }
  }

  public sendToPlayer(playerId: string, message: WebSocketServerMessage) {
    const socket = this.playerSockets.get(playerId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  public broadcastStateSync(room: RoomState) {
    for (const playerId of Object.keys(room.players)) {
      this.sendToPlayer(playerId, {
        type: 'ROOM_STATE_SYNC',
        state: this.sanitizeStateForPlayer(room, playerId),
        serverTimestamp: Date.now(),
      });
    }
  }

  /**
   * Sanitizes state so secret word is NEVER exposed before round completion!
   */
  private sanitizeStateForPlayer(room: RoomState, playerId: string): RoomState {
    const copy: RoomState = JSON.parse(JSON.stringify(room));
    // If playing, strip the secret word unless round is ending or ended
    if (copy.status === 'PLAYING') {
      delete copy.currentSecretWord;
      copy.revealedWord = null;
    }
    return copy;
  }

  private sanitizeStateForRoom(room: RoomState): RoomState {
    const copy: RoomState = JSON.parse(JSON.stringify(room));
    if (copy.status === 'PLAYING') {
      delete copy.currentSecretWord;
      copy.revealedWord = null;
    }
    return copy;
  }
}
