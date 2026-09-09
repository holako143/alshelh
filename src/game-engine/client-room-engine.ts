/**
 * In-Browser Serverless Room & Multiplayer Engine
 * Zero external servers, zero external APIs, zero paid subscriptions.
 * Supports:
 * 1. Fully authoritative game rules in-browser (scoring, validation, timers)
 * 2. Cross-tab real-time sync via native HTML5 BroadcastChannel & localStorage
 * 3. Autonomous AI Bot competitors with realistic human-like typing and evaluations
 * 4. Seamless plug-and-play adapter matching standard WebSocket interface
 */

import {
  RoomState,
  PlayerState,
  GameSettings,
  RoundSummary,
  WebSocketServerMessage,
  WebSocketClientMessage,
  TileState,
} from '../shared/types';
import { DEFAULT_GAME_SETTINGS, GAME_CONFIG, ARABIC_LETTERS_SET } from '../shared/constants';
import { selectSecretWord, validateGuessWord } from './word-validator';
import { evaluateGuess, isWordSolved } from './guess-evaluator';
import { calculateRoundScore, determineRoundWinner, determineMatchWinner } from './scoring';
import { CURATED_WORDS_WITH_HINTS } from './words-data';

export interface LocalSocketListener {
  onMessage: (msg: WebSocketServerMessage) => void;
  onClose?: () => void;
}

export class ClientRoomEngine {
  private static instance: ClientRoomEngine;
  private rooms: Map<string, RoomState> = new Map();
  private subscribers: Map<string, Set<LocalSocketListener>> = new Map(); // roomCode -> listeners
  private broadcastChannel: BroadcastChannel | null = null;
  private botTimers: Map<string, NodeJS.Timeout[]> = new Map();
  private roundTimers: Map<string, NodeJS.Timeout> = new Map();
  private gameLoopInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Initialize BroadcastChannel if supported
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('alwird_multiplayer_channel');
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization failed, using in-memory only', err);
      }
    }

    // Load any existing room from localStorage for persistence across reloads
    this.restoreFromStorage();
    this.startGameLoop();
  }

  public static getInstance(): ClientRoomEngine {
    if (!ClientRoomEngine.instance) {
      ClientRoomEngine.instance = new ClientRoomEngine();
    }
    return ClientRoomEngine.instance;
  }

  private restoreFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('alwird_room_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const state: RoomState = JSON.parse(raw);
            // Only restore recent rooms (< 2 hours old)
            if (Date.now() - state.updatedAt < 2 * 60 * 60 * 1000) {
              this.rooms.set(state.roomCode, state);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {}
  }

  private saveRoomToStorage(room: RoomState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`alwird_room_${room.roomCode}`, JSON.stringify(room));
    } catch {}
  }

  private startGameLoop() {
    if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
    this.gameLoopInterval = setInterval(() => {
      const now = Date.now();
      this.rooms.forEach((room) => {
        if (room.status === 'PLAYING' && room.roundStartedAt) {
          const roundEnd = room.roundStartedAt + room.roundDurationMs;
          if (now >= roundEnd) {
            this.endRound(room);
          }
        }
      });
    }, 500);
  }

  public generateRoomCode(): string {
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
    sessionToken: string,
    customSettings?: Partial<GameSettings>,
    fixedRoomCode?: string
  ): { roomCode: string; state: RoomState } {
    const roomCode = fixedRoomCode ? fixedRoomCode.trim().toUpperCase() : this.generateRoomCode();
    const settings: GameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      ...customSettings,
    };

    const hostPlayer: PlayerState = {
      id: hostId,
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
      jokersRemaining: 1,
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
    this.saveRoomToStorage(roomState);
    this.broadcastToTabs({ type: 'SYNC_ROOM', room: roomState });

    return { roomCode, state: this.sanitizeStateForPlayer(roomState, hostId) };
  }

  public registerRoomFromInvite(
    roomCode: string,
    hostNickname: string = 'المستضيف',
    customSettings?: Partial<GameSettings>
  ): RoomState {
    const normalized = roomCode.trim().toUpperCase();
    let room = this.rooms.get(normalized);
    if (!room) {
      try {
        const raw = localStorage.getItem(`alwird_room_${normalized}`);
        if (raw) {
          room = JSON.parse(raw);
          if (room) this.rooms.set(normalized, room);
        }
      } catch {}
    }

    if (!room) {
      const settings: GameSettings = {
        ...DEFAULT_GAME_SETTINGS,
        ...customSettings,
      };
      const hostId = 'host_' + normalized;
      const hostPlayer: PlayerState = {
        id: hostId,
        nickname: hostNickname || 'المستضيف',
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
        jokersRemaining: settings.jokerCount !== undefined ? settings.jokerCount : 1,
      };
      room = {
        roomCode: normalized,
        status: 'WAITING',
        settings,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stateVersion: 1,
        hostPlayerId: hostId,
        guestPlayerId: null,
        players: { [hostId]: hostPlayer },
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
      this.rooms.set(normalized, room);
      this.saveRoomToStorage(room);
    }
    return room;
  }

  public joinRoom(
    roomCode: string,
    playerId: string,
    nickname: string,
    sessionToken: string
  ): { success: boolean; state?: RoomState; error?: string } {
    const normalized = roomCode.trim().toUpperCase();
    let room = this.rooms.get(normalized);

    // If room not in memory, check localStorage
    if (!room) {
      try {
        const raw = localStorage.getItem(`alwird_room_${normalized}`);
        if (raw) {
          room = JSON.parse(raw);
          if (room) this.rooms.set(normalized, room);
        }
      } catch {}
    }

    if (!room) {
      return { success: false, error: 'رمز الغرفة غير موجود' };
    }

    // Already in room
    if (room.players[playerId]) {
      room.players[playerId].isConnected = true;
      room.players[playerId].isReady = true;
      room.players[playerId].disconnectedAt = null;
      if (nickname && nickname.trim()) {
        room.players[playerId].nickname = nickname.trim();
      }
      room.stateVersion++;
      room.updatedAt = Date.now();
      this.saveRoomToStorage(room);
      this.broadcastStateSync(room);
      return { success: true, state: this.sanitizeStateForPlayer(room, playerId) };
    }

    const maxCapacity = room.settings.maxPlayers || GAME_CONFIG.maxPlayersPerRoom;
    const existingCount = Object.keys(room.players).length;
    if (existingCount >= maxCapacity) {
      return { success: false, error: `الغرفة مكتملة (الحد الأقصى ${maxCapacity} لاعبين)` };
    }

    if (room.status !== 'WAITING' && room.status !== 'READY_CHECK') {
      return { success: false, error: 'بدأت المباراة بالفعل في هذه الغرفة' };
    }

    const guestPlayer: PlayerState = {
      id: playerId,
      nickname: nickname.trim() || `اللاعب ${existingCount + 1}`,
      role: 'guest',
      isReady: true, // Automatically ready upon joining as requested
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
      this.saveRoomToStorage(room);
      this.broadcastStateSync(room);
    }

    return { success: true, state: this.sanitizeStateForPlayer(room, playerId) };
  }

  public addBot(roomCode: string, botName: string = 'الروبوت الذكي 🤖'): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.status !== 'WAITING' && room.status !== 'READY_CHECK') return false;

    const botId = 'bot_' + Math.random().toString(36).substring(2, 8);
    const botPlayer: PlayerState = {
      id: botId,
      nickname: botName,
      role: 'guest',
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
      jokersRemaining: 1,
    };

    if (!room.guestPlayerId) {
      room.guestPlayerId = botId;
    }
    room.players[botId] = botPlayer;
    if (Object.keys(room.players).length >= 2) {
      room.status = 'READY_CHECK';
    }
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.saveRoomToStorage(room);
    this.broadcastStateSync(room);
    return true;
  }

  public removeBot(roomCode: string, botId?: string): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.status !== 'WAITING' && room.status !== 'READY_CHECK') return false;

    const targetBotId = botId || Object.keys(room.players).find((id) => id.startsWith('bot_'));
    if (!targetBotId) return false;

    delete room.players[targetBotId];
    if (room.guestPlayerId === targetBotId) {
      const remainingGuests = Object.keys(room.players).filter((id) => id !== room.hostPlayerId);
      room.guestPlayerId = remainingGuests.length > 0 ? remainingGuests[0] : null;
    }

    if (Object.keys(room.players).length < 2) {
      room.status = 'WAITING';
    }
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.saveRoomToStorage(room);
    this.broadcastStateSync(room);
    return true;
  }

  public toggleReady(roomCode: string, playerId: string, isReady: boolean): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || !room.players[playerId]) return false;

    room.players[playerId].isReady = isReady;
    room.stateVersion++;
    room.updatedAt = Date.now();

    const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
    const allReady = connectedPlayers.length >= 2 && connectedPlayers.every((p) => p.isReady);

    if (allReady && (room.status === 'READY_CHECK' || room.status === 'WAITING')) {
      this.startCountdown(room);
    } else {
      this.saveRoomToStorage(room);
      this.broadcastStateSync(room);
    }

    return true;
  }

  public startMatch(roomCode: string, hostPlayerId: string): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.hostPlayerId !== hostPlayerId) return false;
    if (room.status !== 'WAITING' && room.status !== 'READY_CHECK' && room.status !== 'COUNTDOWN') return false;

    const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
    if (connectedPlayers.length < 2) return false;

    // Direct immediate start! No delay!
    this.startNextRound(room);
    return true;
  }

  public updateSettings(roomCode: string, playerId: string, newSettings: Partial<GameSettings>): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.hostPlayerId !== playerId) return false;

    room.settings = { ...room.settings, ...newSettings };
    room.roundDurationMs = room.settings.roundDurationSeconds * 1000;
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.saveRoomToStorage(room);
    this.broadcastStateSync(room);
    return true;
  }

  private startCountdown(room: RoomState) {
    room.status = 'COUNTDOWN';
    const countdownDurationMs = 1200;
    room.countdownEndsAt = Date.now() + countdownDurationMs;
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.saveRoomToStorage(room);
    this.broadcastToRoom(room.roomCode, {
      type: 'COUNTDOWN_STARTED',
      endsAt: room.countdownEndsAt,
      serverTimestamp: Date.now(),
    });

    setTimeout(() => {
      if (room.status === 'COUNTDOWN') {
        this.startNextRound(room);
      }
    }, countdownDurationMs);
  }

  private startNextRound(room: RoomState) {
    room.currentRound++;
    room.status = 'PLAYING';
    room.countdownEndsAt = null;
    room.transitionEndsAt = null;
    room.revealedWord = null;

    for (const p of Object.values(room.players)) {
      p.currentGuesses = [];
      p.currentEvaluations = [];
      p.hasSolved = false;
      p.hasExhausted = false;
      p.finishedAt = null;
      p.jokersRemaining = room.settings.jokerCount !== undefined ? room.settings.jokerCount : 1;
    }

    const customDurations = room.settings.customRoundDurations;
    let durationSec = room.settings.roundDurationSeconds;
    if (customDurations && customDurations[room.currentRound - 1]) {
      durationSec = customDurations[room.currentRound - 1];
    }
    room.roundDurationMs = durationSec * 1000;
    room.roundStartedAt = Date.now();

    const { word, hint } = selectSecretWord(room.currentRound, undefined, room.settings.themeCategory);
    room.currentSecretWord = word;
    room.currentHint = hint;
    room.stateVersion++;
    room.updatedAt = Date.now();

    this.saveRoomToStorage(room);

    this.broadcastToRoom(room.roomCode, {
      type: 'ROUND_STARTED',
      roundNumber: room.currentRound,
      roundStartedAt: room.roundStartedAt,
      roundDurationMs: room.roundDurationMs,
      hint: room.currentHint,
      stateVersion: room.stateVersion,
      serverTimestamp: Date.now(),
    });

    this.broadcastStateSync(room);

    // Schedule AI Bot actions for this round
    this.scheduleBotsForRound(room);
  }

  private scheduleBotsForRound(room: RoomState) {
    const roomCode = room.roomCode;
    // Clear any previous bot timers
    const existing = this.botTimers.get(roomCode);
    if (existing) {
      existing.forEach((t) => clearTimeout(t));
    }
    this.botTimers.set(roomCode, []);

    const bots = Object.values(room.players).filter((p) => p.id.startsWith('bot_'));
    if (bots.length === 0) return;

    const secretWord = room.currentSecretWord || '';
    const wordList = CURATED_WORDS_WITH_HINTS.map((c) => c.word);

    bots.forEach((bot) => {
      // Plan bot attempts: 2 to 4 guesses with realistic intervals
      const willSolve = Math.random() > 0.15; // 85% chance to solve
      const solveAttempt = willSolve ? Math.floor(Math.random() * 3) + 2 : 99; // attempt 2, 3, or 4

      let accumulatedDelay = Math.floor(Math.random() * 2500) + 3500; // 3.5s - 6s for first guess

      for (let attempt = 1; attempt <= room.settings.maxAttempts; attempt++) {
        const isSolvingAttempt = attempt === solveAttempt;
        const delay = accumulatedDelay;

        const timer = setTimeout(() => {
          if (room.status !== 'PLAYING' || room.currentRound !== room.currentRound) return;
          if (bot.hasSolved || bot.hasExhausted) return;

          let guessWord = '';
          if (isSolvingAttempt) {
            guessWord = secretWord;
          } else {
            // Pick random word different from secret
            const candidates = wordList.filter((w) => w !== secretWord && !bot.currentGuesses.includes(w));
            guessWord = candidates[Math.floor(Math.random() * candidates.length)] || 'مدينة';
          }

          this.submitGuess(roomCode, bot.id, room.currentRound, guessWord, 'bot_act_' + Date.now());
        }, delay);

        this.botTimers.get(roomCode)?.push(timer);

        if (isSolvingAttempt) break;
        accumulatedDelay += Math.floor(Math.random() * 3000) + 4000; // 4-7s per subsequent guess
      }
    });
  }

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

    if (room.status !== 'PLAYING') {
      return { success: false, error: 'الجولة ليست نشطة حالياً' };
    }

    if (room.currentRound !== roundNumber) {
      return { success: false, error: 'رقم الجولة غير مطابق' };
    }

    if (player.hasSolved || player.hasExhausted) {
      return { success: false, error: 'لقد أنهيت محاولاتك في هذه الجولة بالفعل' };
    }

    if (player.currentGuesses.length >= room.settings.maxAttempts) {
      return { success: false, error: 'تم استنفاد الحد الأقصى للمحاولات' };
    }

    const validation = validateGuessWord(guess, false);
    if (!validation.isValid) {
      return { success: false, error: validation.errorMessage || 'الكلمة غير صالحة' };
    }

    const secretWord = room.currentSecretWord;
    if (!secretWord) {
      return { success: false, error: 'خطأ داخلي في كلمة الجولة' };
    }

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

      const scoreBreakdown = calculateRoundScore(true, attemptsUsed, timeTakenMs, room.roundDurationMs);
      player.totalScore += scoreBreakdown.totalScore;

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

    room.stateVersion++;
    room.updatedAt = Date.now();
    this.saveRoomToStorage(room);

    // Send GUESS_EVALUATED to guessing player
    this.sendToPlayer(room.roomCode, playerId, {
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

    // Notify opponents of progress
    if (room.settings.showOpponentProgress) {
      for (const otherId of Object.keys(room.players)) {
        if (otherId !== playerId) {
          this.sendToPlayer(room.roomCode, otherId, {
            type: 'OPPONENT_PROGRESS_UPDATE',
            playerId,
            attemptsCount: attemptsUsed,
            hasSolved: player.hasSolved,
            hasExhausted: player.hasExhausted,
            lastGuessPattern: evaluation,
            stateVersion: room.stateVersion,
          });
        }
      }
    }

    // Check if all players finished
    const allFinished = Object.values(room.players).every((p) => p.hasSolved || p.hasExhausted);
    if (allFinished) {
      this.endRound(room);
    }

    return { success: true };
  }

  public useJoker(roomCode: string, playerId: string, roundNumber: number): boolean {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room || room.status !== 'PLAYING' || room.currentRound !== roundNumber) return false;
    const player = room.players[playerId];
    if (!player || (player.jokersRemaining !== undefined && player.jokersRemaining <= 0)) return false;

    const secretWord = room.currentSecretWord || '';
    if (!secretWord) return false;

    const secretLetters = new Set(secretWord.split(''));
    const guessedLetters = new Set(player.currentGuesses.join('').split(''));
    const candidateLetters = Array.from(ARABIC_LETTERS_SET).filter(
      (ch) => !secretLetters.has(ch) && !guessedLetters.has(ch)
    );

    const shuffled = candidateLetters.sort(() => Math.random() - 0.5);
    const eliminateCount = room.settings.jokerEliminateCount ?? 3;
    const eliminatedLetters = shuffled.slice(0, eliminateCount);

    player.jokersRemaining = Math.max(0, (player.jokersRemaining ?? 1) - 1);
    room.stateVersion++;
    room.updatedAt = Date.now();
    this.saveRoomToStorage(room);

    this.sendToPlayer(room.roomCode, playerId, {
      type: 'JOKER_ACTIVATED',
      playerId,
      eliminatedLetters,
      jokersRemaining: player.jokersRemaining,
      serverTimestamp: Date.now(),
    });

    return true;
  }

  private endRound(room: RoomState) {
    if (room.status !== 'PLAYING') return;

    room.status = 'ROUND_ENDING';
    const now = Date.now();
    const revealedWord = room.currentSecretWord || '';
    room.revealedWord = revealedWord;

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

    this.saveRoomToStorage(room);

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

    const isFinalRound = room.currentRound >= room.settings.totalRounds;

    setTimeout(() => {
      if (room.status === 'ROUND_ENDING') {
        if (isFinalRound) {
          this.finishMatch(room);
        } else {
          this.startNextRound(room);
        }
      }
    }, transitionDurationMs);
  }

  private finishMatch(room: RoomState) {
    room.status = 'MATCH_ENDED';
    room.revealedWord = null;

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

    this.saveRoomToStorage(room);

    this.broadcastToRoom(room.roomCode, {
      type: 'MATCH_FINISHED',
      winnerId: result.winnerId,
      isDraw: result.isDraw,
      finalState: this.sanitizeStateForRoom(room),
      stateVersion: room.stateVersion,
    });
  }

  public getRoomState(roomCode: string, forPlayerId?: string): RoomState | null {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) return null;
    return forPlayerId ? this.sanitizeStateForPlayer(room, forPlayerId) : this.sanitizeStateForRoom(room);
  }

  private sanitizeStateForPlayer(room: RoomState, playerId: string): RoomState {
    const sanitized: RoomState = JSON.parse(JSON.stringify(room));
    if (room.status === 'PLAYING') {
      delete sanitized.currentSecretWord;
      sanitized.revealedWord = null;
      for (const [id, player] of Object.entries(sanitized.players)) {
        if (id !== playerId) {
          player.currentGuesses = player.currentGuesses.map(() => '*****');
        }
      }
    }
    return sanitized;
  }

  private sanitizeStateForRoom(room: RoomState): RoomState {
    const sanitized: RoomState = JSON.parse(JSON.stringify(room));
    if (room.status === 'PLAYING') {
      delete sanitized.currentSecretWord;
      sanitized.revealedWord = null;
      for (const player of Object.values(sanitized.players)) {
        player.currentGuesses = player.currentGuesses.map(() => '*****');
      }
    }
    return sanitized;
  }

  // Socket subscription adapter
  public subscribe(roomCode: string, listener: LocalSocketListener): () => void {
    const code = roomCode.trim().toUpperCase();
    if (!this.subscribers.has(code)) {
      this.subscribers.set(code, new Set());
    }
    this.subscribers.get(code)!.add(listener);

    return () => {
      this.subscribers.get(code)?.delete(listener);
    };
  }

  private broadcastToRoom(roomCode: string, msg: WebSocketServerMessage) {
    const code = roomCode.trim().toUpperCase();
    const listeners = this.subscribers.get(code);
    if (listeners) {
      listeners.forEach((l) => {
        try {
          l.onMessage(msg);
        } catch {}
      });
    }
    this.broadcastToTabs({ type: 'ROOM_MSG', roomCode: code, msg });
  }

  private sendToPlayer(roomCode: string, playerId: string, msg: WebSocketServerMessage) {
    // In local engine, broadcast message tagged with target player
    this.broadcastToRoom(roomCode, msg);
  }

  private broadcastStateSync(room: RoomState) {
    const listeners = this.subscribers.get(room.roomCode);
    if (listeners) {
      listeners.forEach((l) => {
        try {
          l.onMessage({
            type: 'ROOM_STATE_SYNC',
            state: this.sanitizeStateForRoom(room),
            serverTimestamp: Date.now(),
          });
        } catch {}
      });
    }
    this.broadcastToTabs({ type: 'SYNC_ROOM', room });
  }

  private broadcastToTabs(data: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch {}
    }
  }

  private handleBroadcastMessage(data: any) {
    if (!data) return;
    if (data.type === 'SYNC_ROOM' && data.room) {
      const incoming: RoomState = data.room;
      const current = this.rooms.get(incoming.roomCode);
      if (!current || incoming.stateVersion >= current.stateVersion) {
        this.rooms.set(incoming.roomCode, incoming);
        const listeners = this.subscribers.get(incoming.roomCode);
        if (listeners) {
          listeners.forEach((l) => {
            try {
              l.onMessage({
                type: 'ROOM_STATE_SYNC',
                state: this.sanitizeStateForRoom(incoming),
                serverTimestamp: Date.now(),
              });
            } catch {}
          });
        }
      }
    } else if (data.type === 'ROOM_MSG' && data.roomCode && data.msg) {
      const listeners = this.subscribers.get(data.roomCode);
      if (listeners) {
        listeners.forEach((l) => {
          try {
            l.onMessage(data.msg);
          } catch {}
        });
      }
    }
  }
}

export const clientRoomEngine = ClientRoomEngine.getInstance();
