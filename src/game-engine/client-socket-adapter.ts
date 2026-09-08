/**
 * Client Socket Adapter
 * Emulates a WebSocket connection in the browser to interact directly with ClientRoomEngine.
 * Requires ZERO external servers, zero subscriptions, zero APIs.
 * Perfect for Vercel static hosting and local multi-tab play.
 */

import { clientRoomEngine, LocalSocketListener } from './client-room-engine';
import { WebSocketClientMessage, WebSocketServerMessage } from '../shared/types';

export class ClientSocketAdapter {
  public static readonly CONNECTING = 0;
  public static readonly OPEN = 1;
  public static readonly CLOSING = 2;
  public static readonly CLOSED = 3;

  public readyState: number = ClientSocketAdapter.CONNECTING;
  public onopen: ((ev: any) => void) | null = null;
  public onmessage: ((ev: { data: string }) => void) | null = null;
  public onerror: ((ev: any) => void) | null = null;
  public onclose: ((ev: any) => void) | null = null;

  private roomCode: string;
  private unsubscribe: (() => void) | null = null;
  private isClosed: boolean = false;

  constructor(roomCode: string) {
    this.roomCode = roomCode.trim().toUpperCase();

    // Subscribe to client room engine broadcasts
    const listener: LocalSocketListener = {
      onMessage: (msg: WebSocketServerMessage) => {
        if (this.isClosed || this.readyState !== ClientSocketAdapter.OPEN) return;
        if (this.onmessage) {
          try {
            this.onmessage({ data: JSON.stringify(msg) });
          } catch (err) {
            console.error('Error in ClientSocketAdapter onmessage:', err);
          }
        }
      },
      onClose: () => {
        this.close();
      },
    };

    this.unsubscribe = clientRoomEngine.subscribe(this.roomCode, listener);

    // Simulate near-instant local connection
    setTimeout(() => {
      if (!this.isClosed) {
        this.readyState = ClientSocketAdapter.OPEN;
        if (this.onopen) {
          try {
            this.onopen({ type: 'open' });
          } catch (err) {
            console.error('Error in ClientSocketAdapter onopen:', err);
          }
        }
      }
    }, 20);
  }

  public send(data: string) {
    if (this.readyState !== ClientSocketAdapter.OPEN || this.isClosed) {
      console.warn('Cannot send on closed ClientSocketAdapter');
      return;
    }

    try {
      const message: WebSocketClientMessage = JSON.parse(data);

      switch (message.type) {
        case 'PING': {
          if (this.onmessage) {
            this.onmessage({
              data: JSON.stringify({
                type: 'PONG',
                clientTimestamp: message.timestamp,
                serverTimestamp: Date.now(),
              }),
            });
          }
          break;
        }

        case 'JOIN_ROOM': {
          const { roomCode, playerId, nickname, sessionToken } = message;
          const result = clientRoomEngine.joinRoom(roomCode, playerId, nickname, sessionToken);
          if (result.success && result.state) {
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({
                  type: 'ROOM_STATE_SYNC',
                  state: result.state,
                  serverTimestamp: Date.now(),
                }),
              });
            }
          } else {
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({
                  type: 'ERROR',
                  code: 'JOIN_FAILED',
                  message: result.error || 'تعذر الانضمام للغرفة',
                }),
              });
            }
          }
          break;
        }

        case 'RECONNECT': {
          const { roomCode, playerId, sessionToken } = message;
          const result = clientRoomEngine.joinRoom(roomCode, playerId, '', sessionToken);
          if (result.success && result.state) {
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({
                  type: 'ROOM_STATE_SYNC',
                  state: result.state,
                  serverTimestamp: Date.now(),
                }),
              });
            }
          }
          break;
        }

        case 'TOGGLE_READY': {
          const { roomCode, playerId, isReady } = message;
          clientRoomEngine.toggleReady(roomCode, playerId, isReady);
          break;
        }

        case 'START_MATCH': {
          const { roomCode, playerId } = message;
          clientRoomEngine.startMatch(roomCode, playerId);
          break;
        }

        case 'UPDATE_SETTINGS': {
          const { roomCode, playerId, settings } = message;
          clientRoomEngine.updateSettings(roomCode, playerId, settings);
          break;
        }

        case 'SUBMIT_GUESS': {
          const { roomCode, playerId, roundNumber, guess, clientActionId } = message;
          const result = clientRoomEngine.submitGuess(roomCode, playerId, roundNumber, guess, clientActionId);
          if (!result.success && this.onmessage) {
            this.onmessage({
              data: JSON.stringify({
                type: 'ERROR',
                code: 'INVALID_GUESS',
                message: result.error || 'تخمين غير صالح',
              }),
            });
          }
          break;
        }

        case 'USE_JOKER': {
          const { roomCode, playerId, roundNumber } = message;
          clientRoomEngine.useJoker(roomCode, playerId, roundNumber);
          break;
        }

        case 'REQUEST_SYNC': {
          const { roomCode, playerId } = message;
          const state = clientRoomEngine.getRoomState(roomCode, playerId);
          if (state && this.onmessage) {
            this.onmessage({
              data: JSON.stringify({
                type: 'ROOM_STATE_SYNC',
                state,
                serverTimestamp: Date.now(),
              }),
            });
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error handling message in ClientSocketAdapter:', err);
    }
  }

  public close() {
    if (this.isClosed) return;
    this.isClosed = true;
    this.readyState = ClientSocketAdapter.CLOSED;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.onclose) {
      try {
        this.onclose({ type: 'close', wasClean: true, code: 1000, reason: 'Normal Closure' });
      } catch {}
    }
  }
}
