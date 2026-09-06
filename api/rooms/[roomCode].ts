import { roomManager } from '../_roomStore';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract roomCode
  const roomCode = (req.query.roomCode || req.query.code || req.url?.split('/')?.[3])?.toString().toUpperCase();

  if (!roomCode) {
    return res.status(400).json({ error: 'كود الغرفة غير محدد' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

  if (req.method === 'POST') {
    const { action, playerId, nickname, sessionToken, message } = body;

    if (action === 'join' || req.url.includes('/join')) {
      if (!playerId || !nickname || !sessionToken) {
        return res.status(400).json({ error: 'البيانات غير مكتملة' });
      }
      const result = roomManager.joinRoom(roomCode, playerId, nickname, sessionToken);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.status(200).json(result);
    }

    if (action === 'action' || message) {
      const msg = message || body;
      const pId = playerId || msg?.playerId;

      if (!msg || !msg.type) {
        return res.status(400).json({ error: 'نوع الإجراء غير محدد' });
      }

      switch (msg.type) {
        case 'TOGGLE_READY':
          roomManager.toggleReady(roomCode, pId, msg.isReady);
          break;
        case 'START_MATCH':
          roomManager.startMatch(roomCode, pId);
          break;
        case 'UPDATE_SETTINGS':
          roomManager.updateSettings(roomCode, pId, msg.settings);
          break;
        case 'SUBMIT_GUESS':
          const guessRes = roomManager.submitGuess(
            roomCode,
            pId,
            msg.roundNumber,
            msg.guess,
            msg.clientActionId || 'act_' + Math.random().toString(36).substring(2, 9)
          );
          if (!guessRes.success) {
            return res.status(400).json({ error: guessRes.error });
          }
          break;
        case 'USE_JOKER':
          roomManager.useJoker(roomCode, pId, msg.roundNumber);
          break;
        default:
          break;
      }

      const updatedState = roomManager.getRoomState(roomCode, pId);
      return res.status(200).json({ success: true, state: updatedState });
    }

    if (playerId && nickname && sessionToken) {
      const result = roomManager.joinRoom(roomCode, playerId, nickname, sessionToken);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.status(200).json(result);
    }
  }

  if (req.method === 'GET') {
    const playerId = req.query.playerId as string | undefined;
    const state = roomManager.getRoomState(roomCode, playerId);
    if (!state) {
      return res.status(404).json({ error: 'الغرفة غير موجودة' });
    }
    return res.status(200).json({ state });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
