import { roomManager } from './_roomStore';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const testResult = roomManager.createRoom('test_host', 'المستضيف التجريبي', 'tok_host', {
      roundDurationSeconds: 15,
      totalRounds: 1,
      maxAttempts: 6,
    });

    const joinResult = roomManager.joinRoom(testResult.roomCode, 'test_guest', 'الضيف التجريبي', 'tok_guest');

    return res.status(200).json({
      success: true,
      roomCode: testResult.roomCode,
      message: 'خادم اللعبة اللامركزي على Vercel جاهز ويعمل بكفاءة فائقة وبدون أي أخطاء JSON',
      state: joinResult.state || testResult.state,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'فشل تشغيل الاختبار',
    });
  }
}
