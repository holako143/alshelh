import { roomManager } from '../../_roomStore';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
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

  const roomCode = (req.query.roomCode || req.url?.split('/')?.[3])?.toString().toUpperCase();

  if (!roomCode) {
    return res.status(400).json({ error: 'كود الغرفة غير محدد' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { playerId, nickname, sessionToken, fallbackSettings, fallbackHostName } = body || {};

  if (!playerId || !nickname || !sessionToken) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }

  const result = roomManager.joinRoom(roomCode, playerId, nickname, sessionToken, fallbackSettings, fallbackHostName);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json(result);
}
