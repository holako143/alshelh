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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hostId, nickname, sessionToken, settings } = req.body || {};
  if (!hostId || !nickname || !sessionToken) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }

  const result = roomManager.createRoom(hostId, nickname, sessionToken, settings);
  return res.status(200).json(result);
}
