import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoomState,
  PlayerState,
  WebSocketClientMessage,
  WebSocketServerMessage,
  TileState,
  RoundSummary,
} from '../shared/types';
import { soundManager } from '../lib/audio';
import { ClientSocketAdapter } from '../game-engine/client-socket-adapter';
import { clientRoomEngine } from '../game-engine/client-room-engine';

export interface SolveAnnouncement {
  playerId: string;
  nickname: string;
  attemptsUsed: number;
  timeTakenMs: number;
  roundNumber: number;
  timestamp: number;
  isSelf: boolean;
}

export function useMultiplayerSocket(
  roomCode: string | null,
  onServerTimestamp?: (serverTimestamp: number, rttMs?: number) => void
) {
  const [roomState, setRoomState] = useState<RoomState | null>(() => {
    if (!roomCode) return null;
    return clientRoomEngine.getRoomState(roomCode) || null;
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState<boolean>(false);
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [solveAnnouncement, setSolveAnnouncement] = useState<SolveAnnouncement | null>(null);
  const [eliminatedLetters, setEliminatedLetters] = useState<string[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<{
    guess: string;
    evaluation: TileState[];
    hasSolved: boolean;
    hasExhausted: boolean;
  } | null>(null);

  const socketRef = useRef<WebSocket | ClientSocketAdapter | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const graceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPongReceivedRef = useRef<number>(Date.now());
  const reconnectAttemptsRef = useRef<number>(0);
  const pendingGuessRef = useRef<{ guess: string; roundNumber: number } | null>(null);
  const isExplicitlyClosedRef = useRef<boolean>(false);
  const latestVersionRef = useRef<number>(0);
  const isClientModeRef = useRef<boolean>(
    typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')
  );

  // Persistent Player ID and Session Token (isolated per tab session so 2 tabs can play against each other)
  const getSessionCredentials = useCallback(() => {
    let playerId = sessionStorage.getItem('alwird_player_id');
    let sessionToken = sessionStorage.getItem('alwird_session_token');
    let nickname = localStorage.getItem('alwird_nickname') || 'اللاعب';

    if (!playerId) {
      playerId = 'p_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('alwird_player_id', playerId);
    }
    if (!sessionToken) {
      sessionToken = 'tok_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('alwird_session_token', sessionToken);
    }

    return { playerId, sessionToken, nickname };
  }, []);

  const send = useCallback((message: WebSocketClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    if (!roomCode) return;
    isExplicitlyClosedRef.current = false;

    // Clear previous timers
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);

    // Cleanly close old socket without firing recursive onclose handler
    if (socketRef.current) {
      try {
        socketRef.current.onopen = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    // Use server WebSocket unless repeatedly failed (>= 5 attempts) or explicitly serverless-only host
    const isExplicitServerlessOnly = typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app');
    const useClient = isClientModeRef.current || isExplicitServerlessOnly;

    let ws: WebSocket | ClientSocketAdapter;
    if (useClient) {
      ws = new ClientSocketAdapter(roomCode);
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      ws = new WebSocket(wsUrl);
    }
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setLastError(null);
      reconnectAttemptsRef.current = 0;
      isClientModeRef.current = false;
      lastPongReceivedRef.current = Date.now();

      const { playerId, sessionToken, nickname } = getSessionCredentials();

      // Send JOIN_ROOM
      ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          roomCode: roomCode.trim().toUpperCase(),
          playerId,
          nickname,
          sessionToken,
        } as WebSocketClientMessage)
      );

      // Start active heartbeat every 4.5 seconds to keep proxies alive and track latency
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        }
      }, 4500);

      // Watchdog checks if connection stalled without pongs/messages for >12s
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
      watchdogIntervalRef.current = setInterval(() => {
        if (ws.readyState === 1) {
          if (Date.now() - lastPongReceivedRef.current > 12000) {
            console.warn('Connection stalled (no server ping/pong), reconnecting...');
            try {
              ws.close();
            } catch {}
          }
        }
      }, 3000);
    };

    ws.onmessage = (event) => {
      lastPongReceivedRef.current = Date.now();

      if (!event.data || typeof event.data !== 'string') return;
      const raw = event.data.trim();
      if (!raw.startsWith('{')) {
        // Ignore non-JSON frames (e.g. plain text or HTML error messages from proxy)
        return;
      }

      try {
        const msg: WebSocketServerMessage = JSON.parse(raw);

        if ('serverTimestamp' in msg && typeof msg.serverTimestamp === 'number') {
          if (onServerTimestamp) {
            onServerTimestamp(msg.serverTimestamp, latencyMs ?? 25);
          }
        }

        switch (msg.type) {
          case 'PONG': {
            const rtt = Math.max(1, Date.now() - msg.clientTimestamp);
            setLatencyMs(rtt);
            if (onServerTimestamp) {
              onServerTimestamp(msg.serverTimestamp, rtt);
            }
            break;
          }

          case 'ROOM_STATE_SYNC': {
            if (msg.state.stateVersion >= latestVersionRef.current) {
              latestVersionRef.current = msg.state.stateVersion;
              setRoomState(msg.state);
            }

            // Flush pending guess if one was buffered during reconnection
            if (
              pendingGuessRef.current &&
              msg.state.status === 'PLAYING' &&
              msg.state.currentRound === pendingGuessRef.current.roundNumber
            ) {
              const pending = pendingGuessRef.current;
              pendingGuessRef.current = null;
              const { playerId } = getSessionCredentials();
              send({
                type: 'SUBMIT_GUESS',
                roomCode: roomCode.trim().toUpperCase(),
                playerId,
                roundNumber: pending.roundNumber,
                guess: pending.guess,
                clientActionId: 'act_' + Math.random().toString(36).substring(2, 9),
              });
            }
            break;
          }

          case 'COUNTDOWN_STARTED': {
            soundManager.playCountdownTick();
            setRoomState((prev) => {
              if (!prev) return null;
              return { ...prev, status: 'COUNTDOWN', countdownEndsAt: msg.endsAt };
            });
            break;
          }

          case 'ROUND_STARTED': {
            soundManager.playCountdownTick(true);
            setSolveAnnouncement(null);
            setEliminatedLetters([]);
            setRoomState((prev) => {
              if (!prev) return null;
              if (msg.stateVersion < latestVersionRef.current) return prev;
              latestVersionRef.current = msg.stateVersion;
              return {
                ...prev,
                status: 'PLAYING',
                currentRound: msg.roundNumber,
                roundStartedAt: msg.roundStartedAt,
                roundDurationMs: msg.roundDurationMs,
                currentHint: msg.hint ?? prev.currentHint,
                revealedWord: null,
              };
            });
            break;
          }

          case 'JOKER_ACTIVATED': {
            const { playerId: targetPlayerId, eliminatedLetters: newEliminated, jokersRemaining } = msg;
            const { playerId } = getSessionCredentials();
            if (targetPlayerId === playerId) {
              soundManager.playJokerPowerUp();
              setEliminatedLetters((prev) => Array.from(new Set([...prev, ...newEliminated])));
            }
            setRoomState((prev) => {
              if (!prev) return null;
              const copy = { ...prev };
              if (copy.players[targetPlayerId]) {
                copy.players[targetPlayerId].jokersRemaining = jokersRemaining;
              }
              return copy;
            });
            break;
          }

          case 'PLAYER_SOLVED_ROUND': {
            const { playerId } = getSessionCredentials();
            const isSelf = msg.playerId === playerId;

            // If an opponent solved it, play sound alert so everyone is notified
            if (!isSelf) {
              soundManager.playRoundWin();
            }

            setSolveAnnouncement({
              playerId: msg.playerId,
              nickname: msg.nickname,
              attemptsUsed: msg.attemptsUsed,
              timeTakenMs: msg.timeTakenMs,
              roundNumber: msg.roundNumber,
              timestamp: msg.serverTimestamp,
              isSelf,
            });

            // Auto dismiss after 7 seconds
            setTimeout(() => {
              setSolveAnnouncement((curr) => (curr?.timestamp === msg.serverTimestamp ? null : curr));
            }, 7000);
            break;
          }

          case 'GUESS_EVALUATED': {
            soundManager.playGuessEvaluation(msg.evaluation);
            if (msg.hasSolved) {
              setTimeout(() => {
                soundManager.playRoundWin();
              }, 500);
            } else if (msg.hasExhausted) {
              setTimeout(() => {
                soundManager.playRoundLoss();
              }, 600);
            }

            setLastEvaluation({
              guess: msg.guess,
              evaluation: msg.evaluation,
              hasSolved: msg.hasSolved,
              hasExhausted: msg.hasExhausted,
            });

            // Update local player guesses in state
            setRoomState((prev) => {
              if (!prev) return null;
              const copy = { ...prev };
              const player = copy.players[msg.playerId];
              if (player) {
                player.currentGuesses = [...player.currentGuesses, msg.guess];
                player.currentEvaluations = [...player.currentEvaluations, msg.evaluation];
                player.hasSolved = msg.hasSolved;
                player.hasExhausted = msg.hasExhausted;
              }
              return copy;
            });
            break;
          }

          case 'OPPONENT_PROGRESS_UPDATE': {
            // Update opponent state without revealing letters
            setRoomState((prev) => {
              if (!prev) return null;
              const copy = { ...prev };
              const opp = copy.players[msg.playerId];
              if (opp) {
                opp.hasSolved = msg.hasSolved;
                opp.hasExhausted = msg.hasExhausted;
                if (msg.lastGuessPattern) {
                  opp.currentEvaluations = [...opp.currentEvaluations, msg.lastGuessPattern];
                }
              }
              return copy;
            });
            break;
          }

          case 'ROUND_ENDED': {
            if (msg.summary.winnerPlayerId) {
              const { playerId } = getSessionCredentials();
              if (msg.summary.winnerPlayerId === playerId) {
                soundManager.playRoundWin();
              } else {
                soundManager.playRoundLoss();
              }
            }
            const transitionEndsAt = msg.transitionEndsAt ?? (msg.serverTimestamp ? msg.serverTimestamp + msg.nextRoundInMs : Date.now() + msg.nextRoundInMs);
            setRoomState((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                status: 'ROUND_ENDING',
                revealedWord: msg.revealedWord,
                roundSummaries: [...prev.roundSummaries, msg.summary],
                transitionEndsAt,
              };
            });
            break;
          }

          case 'MATCH_FINISHED': {
            const { playerId } = getSessionCredentials();
            if (msg.finalState.matchWinnerId === playerId) {
              soundManager.playMatchWin();
            } else if (msg.finalState.isDraw) {
              soundManager.playMatchLoss();
            } else {
              soundManager.playMatchLoss();
            }
            setRoomState(msg.finalState);
            break;
          }

          case 'PLAYER_CONNECTION_CHANGED': {
            const { playerId } = getSessionCredentials();
            if (msg.playerId !== playerId) {
              if (!msg.isConnected) {
                setOpponentDisconnected(true);
                if (msg.gracePeriodEndsAt) {
                  const remaining = Math.max(0, Math.round((msg.gracePeriodEndsAt - Date.now()) / 1000));
                  setGracePeriodRemaining(remaining);

                  if (graceIntervalRef.current) clearInterval(graceIntervalRef.current);
                  graceIntervalRef.current = setInterval(() => {
                    setGracePeriodRemaining((prev) => {
                      if (prev === null || prev <= 1) {
                        if (graceIntervalRef.current) clearInterval(graceIntervalRef.current);
                        return 0;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                }
              } else {
                setOpponentDisconnected(false);
                setGracePeriodRemaining(null);
                if (graceIntervalRef.current) clearInterval(graceIntervalRef.current);
              }
            }
            break;
          }

          case 'ERROR': {
            setLastError(msg.message);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to parse server message:', err);
      }
    };

    ws.onclose = () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
      setIsConnected(false);

      // Only switch to in-browser client fallback after 5 consecutive failed connection attempts
      if (!isClientModeRef.current && reconnectAttemptsRef.current >= 5) {
        console.info('WebSocket server unavailable after 5 attempts, switching to client-side fallback...');
        isClientModeRef.current = true;
        reconnectAttemptsRef.current = 0;
        connect();
        return;
      }

      if (!isExplicitlyClosedRef.current) {
        setIsReconnecting(true);
        // Fast exponential backoff: 300ms, 420ms, 580ms... capped at 2500ms
        const delay = Math.min(300 * Math.pow(1.4, reconnectAttemptsRef.current), 2500);
        reconnectAttemptsRef.current += 1;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, [roomCode, getSessionCredentials, send]);

  // Handle active reconnect on network restore and tab focus
  useEffect(() => {
    if (!roomCode) return;

    const handleOnline = () => {
      if (!socketRef.current || socketRef.current.readyState !== 1) {
        reconnectAttemptsRef.current = 0;
        connect();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socketRef.current || socketRef.current.readyState !== 1) {
          reconnectAttemptsRef.current = 0;
          connect();
        } else {
          // Immediately ping to refresh connection
          try {
            socketRef.current.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
          } catch {}
        }
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomCode, connect]);

  useEffect(() => {
    if (roomCode) {
      connect();
    }

    return () => {
      isExplicitlyClosedRef.current = true;
      if (socketRef.current) {
        try {
          socketRef.current.onopen = null;
          socketRef.current.onclose = null;
          socketRef.current.onerror = null;
          socketRef.current.onmessage = null;
          socketRef.current.close();
        } catch {}
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (graceIntervalRef.current) clearInterval(graceIntervalRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
    };
  }, [roomCode, connect]);

  // Actions
  const toggleReady = useCallback(
    (isReady: boolean) => {
      if (!roomCode) return;
      const { playerId } = getSessionCredentials();
      send({
        type: 'TOGGLE_READY',
        roomCode,
        playerId,
        isReady,
      });
    },
    [roomCode, getSessionCredentials, send]
  );

  const submitGuess = useCallback(
    (guess: string, roundNumber: number) => {
      if (!roomCode) return;
      const { playerId } = getSessionCredentials();
      const clientActionId = 'act_' + Math.random().toString(36).substring(2, 9);

      // If socket is open, send immediately
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        send({
          type: 'SUBMIT_GUESS',
          roomCode,
          playerId,
          roundNumber,
          guess,
          clientActionId,
        });
      } else {
        // Buffer guess for automatic dispatch upon reconnect
        pendingGuessRef.current = { guess, roundNumber };
        setIsReconnecting(true);
        connect();
      }
    },
    [roomCode, getSessionCredentials, send, connect]
  );

  const updateSettings = useCallback(
    (settings: any) => {
      if (!roomCode) return;
      const { playerId } = getSessionCredentials();
      send({
        type: 'UPDATE_SETTINGS',
        roomCode,
        playerId,
        settings,
      });
    },
    [roomCode, getSessionCredentials, send]
  );

  const requestSync = useCallback(() => {
    if (!roomCode) return;
    const { playerId } = getSessionCredentials();
    send({
      type: 'REQUEST_SYNC',
      roomCode,
      playerId,
    });
  }, [roomCode, getSessionCredentials, send]);

  const startMatch = useCallback(() => {
    if (!roomCode) return;
    const { playerId } = getSessionCredentials();
    send({
      type: 'START_MATCH',
      roomCode,
      playerId,
    });
  }, [roomCode, getSessionCredentials, send]);

  const useJoker = useCallback(() => {
    if (!roomCode || !roomState) return;
    const { playerId } = getSessionCredentials();
    send({
      type: 'USE_JOKER',
      roomCode,
      playerId,
      roundNumber: roomState.currentRound,
    });
  }, [roomCode, roomState, getSessionCredentials, send]);

  const { playerId } = getSessionCredentials();
  const myPlayerState = roomState?.players[playerId] || null;
  const allPlayers = roomState ? (Object.values(roomState.players) as PlayerState[]) : [];
  const otherPlayers = allPlayers.filter((p) => p.id !== playerId);
  const opponentPlayerState = otherPlayers[0] || null;

  const dismissSolveAnnouncement = useCallback(() => {
    setSolveAnnouncement(null);
  }, []);

  const addBot = useCallback((botName?: string) => {
    if (!roomCode) return false;
    return clientRoomEngine.addBot(roomCode, botName);
  }, [roomCode]);

  const removeBot = useCallback((botId?: string) => {
    if (!roomCode) return false;
    return clientRoomEngine.removeBot(roomCode, botId);
  }, [roomCode]);

  return {
    roomState,
    myPlayerState,
    opponentPlayerState,
    otherPlayers,
    allPlayers,
    myPlayerId: playerId,
    isConnected,
    isReconnecting,
    latencyMs,
    opponentDisconnected,
    gracePeriodRemaining,
    lastError,
    lastEvaluation,
    solveAnnouncement,
    dismissSolveAnnouncement,
    setLastError,
    toggleReady,
    startMatch,
    submitGuess,
    useJoker,
    eliminatedLetters,
    updateSettings,
    requestSync,
    addBot,
    removeBot,
  };
}
