import confetti from 'canvas-confetti';

/**
 * High-impact festive confetti effect for winning matches and championships
 */
export function fireWinConfetti() {
  try {
    // 1. Initial center explosion
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#06b6d4', '#ec4899', '#8b5cf6'],
      disableForReducedMotion: true,
    });

    // 2. Left and Right synchronized cannons
    const end = Date.now() + 2500;
    const interval: any = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#10b981', '#f59e0b', '#06b6d4', '#ec4899'],
        disableForReducedMotion: true,
      });

      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#34d399', '#fbbf24', '#38bdf8', '#a855f7'],
        disableForReducedMotion: true,
      });
    }, 250);
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}

/**
 * Snappy celebratory burst for solving a word or winning a round
 */
export function fireSolveConfetti() {
  try {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24', '#38bdf8'],
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}
