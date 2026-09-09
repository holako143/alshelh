import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { RoomManager } from './server/room-manager';
import { WebSocketClientMessage } from './src/shared/types';
import { runAllEngineTests } from './src/game-engine/engine-tests';

const PORT = 3000;
const roomManager = new RoomManager();

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. API ROUTES FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: roomManager.getActiveRoomCount(),
      totalPlayers: roomManager.getTotalPlayerCount(),
      timestamp: Date.now(),
    });
  });

  // Server time sync endpoint
  app.get('/api/time', (req, res) => {
    res.json({ serverTimestamp: Date.now() });
  });

  // Self-test endpoint to run automated tests
  app.post('/api/self-test', (req, res) => {
    const testResults = runAllEngineTests();
    res.json(testResults);
  });

  // 10-player simultaneous multiplayer test endpoint
  app.post('/api/test-multiplayer', async (req, res) => {
    try {
      const { runMultiplayerAcceptanceTest } = await import('./server/multiplayer-test');
      const testResult = await runMultiplayerAcceptanceTest();
      res.json(testResult);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create room endpoint
  app.post('/api/rooms/create', (req, res) => {
    const { hostId, nickname, sessionToken, settings, roomCode } = req.body;
    if (!hostId || !nickname || !sessionToken) {
      return res.status(400).json({ error: 'البيانات غير مكتملة' });
    }
    const result = roomManager.createRoom(hostId, nickname, sessionToken, settings, roomCode);
    res.json(result);
  });

  // Join room endpoint
  app.post('/api/rooms/:roomCode/join', (req, res) => {
    const { roomCode } = req.params;
    const { playerId, nickname, sessionToken } = req.body;
    if (!playerId || !nickname || !sessionToken) {
      return res.status(400).json({ error: 'البيانات غير مكتملة' });
    }
    const result = roomManager.joinRoom(roomCode, playerId, nickname, sessionToken);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  });

  // Get room state endpoint
  app.get('/api/rooms/:roomCode/state', (req, res) => {
    const { roomCode } = req.params;
    const playerId = req.query.playerId as string | undefined;
    const state = roomManager.getRoomState(roomCode, playerId);
    if (!state) {
      return res.status(404).json({ error: 'الغرفة غير موجودة' });
    }
    res.json({ state });
  });

  // Create HTTP server
  const server = http.createServer(app);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // 2. WEBSOCKET SERVER ATTACHMENT WITH HEARTBEAT KEEPALIVE
  interface ExtWebSocket extends WebSocket {
    isAlive?: boolean;
  }

  const wss = new WebSocketServer({
    server,
    path: '/ws',
    clientTracking: true,
    maxPayload: 64 * 1024,
  });

  // Heartbeat loop every 8s prevents idle timeouts on Cloud Run/NGINX and purges dead sockets
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client: WebSocket) => {
      const extWs = client as ExtWebSocket;
      if (extWs.isAlive === false) {
        return client.terminate();
      }
      extWs.isAlive = false;
      try {
        client.ping();
      } catch {}
    });
  }, 8000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws: WebSocket) => {
    const extWs = ws as ExtWebSocket;
    extWs.isAlive = true;

    ws.on('pong', () => {
      extWs.isAlive = true;
    });

    ws.on('message', (rawData: string) => {
      try {
        extWs.isAlive = true;
        const message: WebSocketClientMessage = JSON.parse(rawData.toString());

        switch (message.type) {
          case 'PING': {
            ws.send(
              JSON.stringify({
                type: 'PONG',
                clientTimestamp: message.timestamp,
                serverTimestamp: Date.now(),
              })
            );
            break;
          }

          case 'JOIN_ROOM': {
            const { roomCode, playerId, nickname, sessionToken } = message;
            const normalizedCode = roomCode.trim().toUpperCase();
            // Register socket first so state sync and notifications reach it immediately
            roomManager.registerClient(ws, playerId, normalizedCode, sessionToken);
            const joinResult = roomManager.joinRoom(normalizedCode, playerId, nickname, sessionToken);
            if (joinResult.success && joinResult.state) {
              ws.send(
                JSON.stringify({
                  type: 'ROOM_STATE_SYNC',
                  state: joinResult.state,
                  serverTimestamp: Date.now(),
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  type: 'ERROR',
                  code: 'JOIN_FAILED',
                  message: joinResult.error || 'تعذر الانضمام للغرفة',
                })
              );
            }
            break;
          }

          case 'RECONNECT': {
            const { roomCode, playerId, sessionToken } = message;
            const normalizedCode = roomCode.trim().toUpperCase();
            roomManager.registerClient(ws, playerId, normalizedCode, sessionToken);
            const reconnectResult = roomManager.handleReconnect(normalizedCode, playerId, sessionToken, ws);
            if (reconnectResult.success && reconnectResult.state) {
              ws.send(
                JSON.stringify({
                  type: 'ROOM_STATE_SYNC',
                  state: reconnectResult.state,
                  serverTimestamp: Date.now(),
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  type: 'ERROR',
                  code: 'RECONNECT_FAILED',
                  message: reconnectResult.error || 'فشلت استعادة الجلسة',
                })
              );
            }
            break;
          }

          case 'TOGGLE_READY': {
            const { roomCode, playerId, isReady } = message;
            roomManager.toggleReady(roomCode, playerId, isReady);
            break;
          }

          case 'UPDATE_SETTINGS': {
            const { roomCode, playerId, settings } = message;
            roomManager.updateSettings(roomCode, playerId, settings);
            break;
          }

          case 'SUBMIT_GUESS': {
            const { roomCode, playerId, roundNumber, guess, clientActionId } = message;
            const guessResult = roomManager.submitGuess(roomCode, playerId, roundNumber, guess, clientActionId);
            if (!guessResult.success) {
              ws.send(
                JSON.stringify({
                  type: 'ERROR',
                  code: 'INVALID_GUESS',
                  message: guessResult.error || 'تخمين غير صالح',
                })
              );
            }
            break;
          }

          case 'USE_JOKER': {
            const { roomCode, playerId, roundNumber } = message;
            roomManager.useJoker(roomCode, playerId, roundNumber);
            break;
          }

          case 'REQUEST_SYNC': {
            const { roomCode, playerId } = message;
            const state = roomManager.getRoomState(roomCode, playerId);
            if (state) {
              ws.send(
                JSON.stringify({
                  type: 'ROOM_STATE_SYNC',
                  state,
                  serverTimestamp: Date.now(),
                })
              );
            }
            break;
          }

          case 'START_MATCH': {
            const { roomCode, playerId } = message;
            roomManager.startMatch(roomCode, playerId);
            break;
          }

          default:
            break;
        }
      } catch (err: any) {
        console.error('Error processing WS message:', err);
      }
    });

    ws.on('close', () => {
      roomManager.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      roomManager.handleDisconnect(ws);
    });
  });

  // 3. VITE MIDDLEWARE SETUP
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Wordle Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
