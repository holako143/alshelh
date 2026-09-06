import { roomManager } from '../_roomStore';
import { runAllEngineTests } from '../src/game-engine/engine-tests';

export default function handler(req: any, res: any) {
  // CORS headers
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

  const url = req.url || '';

  if (url.includes('/api/health')) {
    return res.status(200).json({
      status: 'ok',
      activeRooms: roomManager.getActiveRoomCount(),
      totalPlayers: roomManager.getTotalPlayerCount(),
      timestamp: Date.now(),
    });
  }

  if (url.includes('/api/time')) {
    return res.status(200).json({ serverTimestamp: Date.now() });
  }

  if (url.includes('/api/self-test')) {
    const testResults = runAllEngineTests();
    return res.status(200).json(testResults);
  }

  return res.status(200).json({ status: 'ok', serverTimestamp: Date.now() });
}
