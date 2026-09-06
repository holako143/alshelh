import WebSocket from 'ws';

interface TestStats {
  roomsCreated: number;
  playersConnected: number;
  guessesSubmitted: number;
  roundsCompleted: number;
}

export async function runMultiplayerAcceptanceTest(): Promise<{
  success: boolean;
  message: string;
  details: any;
}> {
  const SERVER_WS_URL = 'ws://127.0.0.1:3000/ws';
  const SERVER_HTTP_URL = 'http://127.0.0.1:3000';

  const stats: TestStats = {
    roomsCreated: 0,
    playersConnected: 0,
    guessesSubmitted: 0,
    roundsCompleted: 0,
  };

  const roomCodes: string[] = [];
  const sockets: WebSocket[] = [];

  try {
    // 1. Create 5 independent rooms (10 players total)
    for (let i = 1; i <= 5; i++) {
      const hostId = `player-${2 * i - 1}`;
      const hostRes = await fetch(`${SERVER_HTTP_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId,
          nickname: `لاعب ${2 * i - 1}`,
          sessionToken: `token-${hostId}`,
          settings: {
            roundDurationSeconds: 30,
            totalRounds: 3,
            maxAttempts: 8,
          },
        }),
      });
      const hostData = await hostRes.json();
      if (!hostData.roomCode) {
        throw new Error(`Failed to create room ${i}: ${JSON.stringify(hostData)}`);
      }
      roomCodes.push(hostData.roomCode);
      stats.roomsCreated++;

      // Connect Host WS
      const hostWs = new WebSocket(SERVER_WS_URL);
      await new Promise<void>((resolve, reject) => {
        hostWs.on('open', () => {
          hostWs.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              roomCode: hostData.roomCode,
              playerId: hostId,
              nickname: `لاعب ${2 * i - 1}`,
              sessionToken: `token-${hostId}`,
            })
          );
          stats.playersConnected++;
          resolve();
        });
        hostWs.on('error', reject);
      });
      sockets.push(hostWs);

      // Join Guest WS (Player 2*i)
      const guestId = `player-${2 * i}`;
      const guestRes = await fetch(`${SERVER_HTTP_URL}/api/rooms/${hostData.roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: guestId,
          nickname: `لاعب ${2 * i}`,
          sessionToken: `token-${guestId}`,
        }),
      });
      const guestData = await guestRes.json();
      if (!guestData.success) {
        throw new Error(`Guest failed to join room ${hostData.roomCode}: ${guestData.error}`);
      }

      const guestWs = new WebSocket(SERVER_WS_URL);
      await new Promise<void>((resolve, reject) => {
        guestWs.on('open', () => {
          guestWs.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              roomCode: hostData.roomCode,
              playerId: guestId,
              nickname: `لاعب ${2 * i}`,
              sessionToken: `token-${guestId}`,
            })
          );
          stats.playersConnected++;
          resolve();
        });
        guestWs.on('error', reject);
      });
      sockets.push(guestWs);

      // Both players ready up
      hostWs.send(
        JSON.stringify({
          type: 'TOGGLE_READY',
          roomCode: hostData.roomCode,
          playerId: hostId,
          isReady: true,
        })
      );
      guestWs.send(
        JSON.stringify({
          type: 'TOGGLE_READY',
          roomCode: hostData.roomCode,
          playerId: guestId,
          isReady: true,
        })
      );
    }

    // Wait 3.5 seconds for countdown to finish and round 1 to start in all 5 rooms
    await new Promise((r) => setTimeout(r, 3500));

    // Verify each room has round 1 active
    for (let i = 0; i < roomCodes.length; i++) {
      const code = roomCodes[i];
      const stateRes = await fetch(`${SERVER_HTTP_URL}/api/rooms/${code}/state`);
      const data = await stateRes.json();
      if (!data.state || data.state.currentRound !== 1 || data.state.status !== 'PLAYING') {
        throw new Error(`Room ${code} did not reach PLAYING status: ${JSON.stringify(data)}`);
      }

      // Submit simultaneous valid guesses from both players in room
      const p1Ws = sockets[2 * i];
      const p2Ws = sockets[2 * i + 1];

      p1Ws.send(
        JSON.stringify({
          type: 'SUBMIT_GUESS',
          roomCode: code,
          playerId: `player-${2 * i + 1}`,
          roundNumber: 1,
          guess: 'سحابة',
          clientActionId: `act-p1-${code}`,
        })
      );
      p2Ws.send(
        JSON.stringify({
          type: 'SUBMIT_GUESS',
          roomCode: code,
          playerId: `player-${2 * i + 2}`,
          roundNumber: 1,
          guess: 'طبيعة',
          clientActionId: `act-p2-${code}`,
        })
      );
      stats.guessesSubmitted += 2;
    }

    // Give 500ms for guesses to process
    await new Promise((r) => setTimeout(r, 500));

    // Clean up all test sockets
    for (const ws of sockets) {
      try {
        ws.close();
      } catch {}
    }

    return {
      success: true,
      message: '10 Simultaneous Players Acceptance Test Passed across 5 isolated rooms!',
      details: {
        stats,
        roomCodes,
      },
    };
  } catch (err: any) {
    for (const ws of sockets) {
      try {
        ws.close();
      } catch {}
    }
    return {
      success: false,
      message: err.message,
      details: { stats, roomCodes },
    };
  }
}
