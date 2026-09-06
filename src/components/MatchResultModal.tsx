import React, { useEffect, useState } from 'react';
import { RoomState, PlayerState } from '../shared/types';
import { fireWinConfetti } from '../lib/confetti';
import { Trophy, Share2, Home, Check, Crown } from 'lucide-react';

interface MatchResultModalProps {
  roomState: RoomState;
  myPlayerId: string;
  onRematch?: () => void;
  onHome: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  roomState,
  myPlayerId,
  onRematch,
  onHome,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      fireWinConfetti();
    } catch {}
  }, []);

  const players = Object.values(roomState.players) as PlayerState[];

  const rankedPlayers = [...players].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.roundsWon !== a.roundsWon) return b.roundsWon - a.roundsWon;
    if (b.wordsSolved !== a.wordsSolved) return b.wordsSolved - a.wordsSolved;
    return a.totalAttempts - b.totalAttempts;
  });

  const winner = roomState.matchWinnerId
    ? roomState.players[roomState.matchWinnerId]
    : rankedPlayers[0] || null;

  const isMeWinner = winner?.id === myPlayerId;

  // Generate Wordle-like Emoji Matrix grid for sharing
  const generateEmojiGrid = () => {
    let gridText = `الوِرد — نتيجة مباراة ووردل العربية 🧠🔥\n`;
    gridText += `النتيجة النهائية: ${winner?.nickname || 'المنافس'} بطلاً بـ ${winner?.totalScore || 0} نقطة!\n\n`;

    roomState.roundSummaries.forEach((round) => {
      gridText += `جولة ${round.roundNumber} (${round.secretWord}):\n`;
      const myResult = round.playerResults[myPlayerId];
      if (myResult) {
        if (myResult.solved) {
          gridText += `🟩 حلها من المحاولة ${myResult.attemptsUsed}\n`;
        } else {
          gridText += `⬛ لم يحلها (${myResult.attemptsUsed} محاولات)\n`;
        }
      }
    });

    gridText += `\nالعب الآن وحاد أصدقائك عبر الوِرد!`;
    return gridText;
  };

  const handleShare = () => {
    const text = generateEmojiGrid();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="match-result-modal" className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl text-center flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300 my-auto text-white">
        {/* Header Badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shadow-xl border border-amber-400/30 backdrop-blur-md animate-bounce">
            <Trophy className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {roomState.isDraw
                ? 'تعادل مشرّف!'
                : isMeWinner
                ? '🎉 مبارك! أنت بطل المباراة!'
                : `فاز ${winner?.nickname || 'المنافس'} باللقب!`}
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              انتهت جميع الجولات الـ {roomState.settings.totalRounds} بنجاح بمشاركة ({rankedPlayers.length}) لاعبين
            </p>
          </div>
        </div>

        {/* Podium for top players or full ranked leaderboard */}
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          <div className="text-xs font-bold text-white/70 text-right px-1">
            جدول الترتيب النهائي للبطولة:
          </div>

          <div className="flex flex-col gap-2">
            {rankedPlayers.map((player, idx) => {
              const isWinner = player.id === winner?.id && !roomState.isDraw;
              const isMe = player.id === myPlayerId;

              const medalColor =
                idx === 0
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : idx === 1
                  ? 'bg-slate-300/20 text-slate-200 border-slate-300/30'
                  : idx === 2
                  ? 'bg-amber-600/20 text-amber-500 border-amber-600/30'
                  : 'bg-white/10 text-white/50 border-white/10';

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-right transition-all backdrop-blur-md ${
                    isWinner
                      ? 'bg-amber-500/15 border-amber-400/40 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : isMe
                      ? 'bg-emerald-500/15 border-emerald-400/30'
                      : 'bg-white/[0.04] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 ${medalColor}`}
                    >
                      {idx === 0 ? <Crown className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-white truncate flex items-center gap-1.5">
                        <span>{player.nickname}</span>
                        {isMe && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/20 px-1.5 py-0.2 rounded-md">
                            أنت
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/50">
                        فاز بـ {player.roundsWon} جولات • حلّ {player.wordsSolved} كلمات
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="text-lg sm:text-xl font-black text-emerald-300">
                      {player.totalScore}{' '}
                      <span className="text-[10px] font-normal text-white/50">نقطة</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Round words recap */}
        <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl p-3 border border-white/10 text-right">
          <div className="text-xs font-bold text-white/60 mb-1.5">الكلمات السرية للجولات:</div>
          <div className="flex flex-wrap gap-1.5">
            {roomState.roundSummaries.map((r) => (
              <span
                key={r.roundNumber}
                className="text-xs font-bold bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/15 text-white shadow-xs backdrop-blur-sm"
              >
                ج{r.roundNumber}: {r.secretWord}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            id="btn-share-result"
            type="button"
            onClick={handleShare}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shadow-emerald-500/25 border border-white/20 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ النتيجة Emoji Grid!' : 'نسخ نتيجة المباراة 🟩🟨'}</span>
          </button>

          <button
            id="btn-return-home"
            type="button"
            onClick={onHome}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 backdrop-blur-md cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
