import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoomState,
  PlayerState,
  WebSocketClientMessage,
  WebSocketServerMessage,
  TileState,
} from '../shared/types';
import { soundManager } from '../lib/audio';

export interface SolveAnnouncement {
  playerId: string;
  nickname: string;
  attemptsUsed: number;
  timeTakenMs: number;
  roundNumber: number;
  timestamp: number;
  isSelf: boolean;
}

export function useMultiplayerSocket(roomCode: string | null) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
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

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const graceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestVersionRef = useRef<number>(0);
  const isWsSupportedRef = useRef<boolean>(true);

  // Persistent Player ID and Session Token
  const getSessionCredentials = useCallback(() => {
    let playerId = localStorage.getItem('alwird_player_id');
    let sessionToken = localStorage.getItem('alwird_session_token');
    let nickname = localStorage.getItem('alwird_nickname') || 'اللاعب';

    if (!playerId) {
      playerId = 'p_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('alwird_player_id', playerId);
    }
    if (!sessionToken) {
      sessionToken = 'tok_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('alwird_session_token', sessionToken);
    }

    return { playerId, sessionToken, nickname };
  }, []);

  // Safe fetch helper for polling and action posts
  const safeFetchJson = useCallback(async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { error: 'تعذر التواصل مع الخادم' };
      }
      return data;
    } catch (e) {
      return { error: 'حدث خطأ في شبكة الاتصال' };
    }
  }, []);

  // HTTP Fallback API sender for Vercel
  const sendViaHttp = useCallback(
    async (message: WebSocketClientMessage) => {
      if (!roomCode) return;
      const { playerId } = getSessionCredentials();
      const data = await safeFetchJson(`/api/rooms/${roomCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, message }),
      });
      if (data.state && data.state.stateVersion >= latestVersionRef.current) {
        latestVersionRef.current = data.state.stateVersion;
        setRoomState(data.state);
      }
      if (data.error) {
        setLastError(data.error);
      }
    },
    [roomCode, getSessionCredentials, safeFetchJson]
  );

  const send = useCallback(
    (message: WebSocketClientMessage) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(message));
      } else {
        // Fallback to HTTP API safely
        sendViaHttp(message);
      }
    },
    [sendViaHttp]
  );

  // Poll room state via HTTP (crucial for Vercel Serverless environment)
  const pollRoomState = useCallback(async () => {
    if (!roomCode) return;
    const { playerId } = getSessionCredentials();
    const data = await safeFetchJson(`/api/rooms/${roomCode}/state?playerId=${playerId}`);
    if (data && data.state) {
      if (data.state.stateVersion > latestVersionRef.current) {
        latestVersionRef.current = data.state.stateVersion;
        setRoomState(data.state);
      } else if (!roomState) {
        setRoomState(data.state);
      }
      setIsConnected(true);
      setIsReconnecting(false);
    }
  }, [roomCode, getSessionCredentials, roomState, safeFetchJson]);

  const connect = useCallback(() => {
    if (!roomCode) return;

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsReconnecting(false);
        setLastError(null);

        const { playerId, sessionToken, nickname } = getSessionCredentials();

        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode,
            playerId,
            nickname,
            sessionToken,
          } as WebSocketClientMessage)
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg: WebSocketServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'ROOM_STATE_SYNC': {
              if (msg.state.stateVersion >= latestVersionRef.current) {
                latestVersionRef.current = msg.state.stateVersion;
                setRoomState(msg.state);
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

              setTimeout(() => {
                setSolveAnnouncement((curr) => (curr?.timestamp === msg.serverTimestamp ? null : curr));
              }, 7000);
              break;
            }

            case 'GUESS_EVALUATED': {
              soundManager.playGuessEvaluation(msg.evaluation);
              if (msg.hasSolved) {
                setTimeout(() => soundManager.playRoundWin(), 500);
              } else if (msg.hasExhausted) {
                setTimeout(() => soundManager.playRoundLoss(), 600);
              }

              setLastEvaluation({
                guess: msg.guess,
                evaluation: msg.evaluation,
                hasSolved: msg.hasSolved,
                hasExhausted: msg.hasExhausted,
              });

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
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  status: 'ROUND_ENDING',
                  revealedWord: msg.revealedWord,
                  roundSummaries: [...prev.roundSummaries, msg.summary],
                  transitionEndsAt: Date.now() + msg.nextRoundInMs,
                };
              });
              break;
            }

            case 'MATCH_FINISHED': {
              const { playerId } = getSessionCredentials();
              if (msg.finalState.matchWinnerId === playerId) {
                soundManager.playMatchWin();
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
        setIsConnected(false);
        setIsReconnecting(true);
        pollRoomState();
      };

      ws.onerror = () => {
        setIsConnected(false);
        pollRoomState();
      };
    } catch {
      isWsSupportedRef.current = false;
    }

    pollRoomState();
  }, [roomCode, getSessionCredentials, pollRoomState]);

  useEffect(() => {
    if (roomCode) {
      connect();
      pollingIntervalRef.current = setInterval(() => {
        pollRoomState();
      }, 1500);
    }

    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (graceIntervalRef.current) clearInterval(graceIntervalRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [roomCode, connect, pollRoomState]);

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
      send({
        type: 'SUBMIT_GUESS',
        roomCode,
        playerId,
        roundNumber,
        guess,
        clientActionId,
      });
    },
    [roomCode, getSessionCredentials, send]
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
    pollRoomState();
  }, [roomCode, getSessionCredentials, send, pollRoomState]);

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

  return {
    roomState,
    myPlayerState,
    opponentPlayerState,
    otherPlayers,
    allPlayers,
    myPlayerId: playerId,
    isConnected,
    isReconnecting,
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
  };
}
