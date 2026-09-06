import React, { useState } from 'react';
import { RoomState, PlayerState } from '../shared/types';
import { GAME_CONFIG } from '../shared/constants';
import { Copy, Check, Crown, User, CheckCircle2, CircleDashed, Users, Sparkles, LogOut, Play, Share2 } from 'lucide-react';
import { soundManager } from '../lib/audio';

interface WaitingRoomProps {
  roomState: RoomState;
  myPlayerId: string;
  onToggleReady: (ready: boolean) => void;
  onStartMatch?: () => void;
  onLeave: () => void;
  countdownEndsAt?: number | null;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomState,
  myPlayerId,
  onToggleReady,
  onStartMatch,
  onLeave,
  countdownEndsAt,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const myPlayer = roomState.players[myPlayerId];
  const isHost = myPlayer?.role === 'host';
  const players = Object.values(roomState.players) as PlayerState[];
  const maxCapacity = roomState.settings.maxPlayers || GAME_CONFIG.maxPlayersPerRoom;
  const isMyReady = myPlayer?.isReady || false;

  const connectedPlayers = players.filter((p) => p.isConnected);
  const readyCount = connectedPlayers.filter((p) => p.isReady).length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    soundManager.playKeypress();
    setTimeout(() => setCopied(false), 2000);
  };

  const getInviteUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?room=${roomState.roomCode}`;
  };

  const handleCopyInviteLink = () => {
    const url = getInviteUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    soundManager.playKeypress();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = getInviteUrl();
    const text = encodeURIComponent(`انضم إلي الآن في تحدي "الوِرد" لكلمات اللغة العربية! 🧠🔥\nرمز الغرفة: ${roomState.roomCode}\nرابط الدخول المباشر:\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleToggle = () => {
    soundManager.playKeypress();
    onToggleReady(!isMyReady);
  };

  // Generate slot list up to maxCapacity
  const slots: Array<{ player: PlayerState | null; index: number }> = [];
  for (let i = 0; i < maxCapacity; i++) {
    slots.push({
      player: players[i] || null,
      index: i + 1,
    });
  }

  return (
    <div id="waiting-room" className="w-full max-w-2xl mx-auto px-3 py-3 sm:py-5 flex flex-col gap-4 text-center">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] backdrop-blur-xl text-emerald-400 border border-white/10 text-xs font-bold shadow-inner">
          <Users className="w-3.5 h-3.5" />
          <span>تحدي جماعي (حتى {maxCapacity} لاعبين)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          غرفة الانتظار والمبارزة
        </h2>
        <div className="text-xs text-white/60">
          المتصلون حالياً: <span className="text-emerald-400 font-extrabold">{connectedPlayers.length}</span> من أصل <span className="font-bold text-white">{maxCapacity}</span> لاعبين • الجاهزون: <span className="text-teal-300 font-bold">{readyCount}</span>
        </div>
      </div>

      {/* Room Code & Direct Invite Link Box */}
      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center gap-3">
        <div className="text-xs text-white/70 font-bold">شارك رمز الغرفة أو الرابط المباشر مع أصدقائك:</div>

        <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-400 bg-white/[0.06] px-6 py-2.5 rounded-2xl border border-white/15 shadow-inner select-all backdrop-blur-md">
          {roomState.roomCode}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          <button
            id="btn-copy-code-large"
            type="button"
            onClick={handleCopyCode}
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 px-3 py-2 rounded-xl text-white transition-all cursor-pointer backdrop-blur-md shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
            <span>{copied ? 'تم نسخ الرمز!' : 'نسخ الكود'}</span>
          </button>

          <button
            id="btn-copy-invite-link"
            type="button"
            onClick={handleCopyInviteLink}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-3 py-2 rounded-xl transition-all cursor-pointer backdrop-blur-md shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط الدعوة'}</span>
          </button>

          <button
            id="btn-share-whatsapp"
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl border border-emerald-400/40 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة واتساب</span>
          </button>
        </div>
      </div>

      {/* Players Multi-Player Grid */}
      <div className="flex flex-col gap-2 text-right">
        <div className="text-xs font-bold text-white/70 flex items-center justify-between px-1">
          <span>قائمة اللاعبين في الغرفة:</span>
          <span className="text-[10px] text-white/50">تبدأ المباراة تلقائياً عند جاهزية الجميع</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {slots.map((slot) => {
            const player = slot.player;
            if (player) {
              const isMe = player.id === myPlayerId;
              const isPlayerHost = player.role === 'host';
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-sm backdrop-blur-md ${
                    isMe
                      ? 'bg-emerald-500/10 border-emerald-400/40 ring-1 ring-emerald-500/20'
                      : 'bg-white/[0.04] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isPlayerHost
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-teal-400/20 text-teal-300 border border-teal-400/30'
                      }`}
                    >
                      {isPlayerHost ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0 text-right">
                      <div className="font-extrabold text-xs sm:text-sm text-white truncate flex items-center gap-1">
                        <span>{player.nickname}</span>
                        {isMe && (
                          <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                            أنت
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/50">
                        {isPlayerHost ? 'مستضيف الغرفة' : 'لاعب منافس'}
                      </div>
                    </div>
                  </div>

                  <div>
                    {player.isReady ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-xl flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>جاهز</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-white/40 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-xl flex items-center gap-1 shrink-0">
                        <CircleDashed className="w-3 h-3 animate-spin" />
                        <span>ينتظر</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // Empty Slot
            return (
              <div
                key={`empty-${slot.index}`}
                className="p-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex items-center justify-between gap-2 text-white/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-[10px] font-mono">
                    {slot.index}
                  </div>
                  <span className="text-xs">شاغر (في انتظار لاعب)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">متاح</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Countdown overlay */}
      {roomState.status === 'COUNTDOWN' && (
        <div className="bg-emerald-500/90 border border-emerald-300/40 text-white rounded-2xl p-3 shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 animate-pulse backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="font-black text-base sm:text-lg">الجميع مستعدون! تبدأ المباراة الآن...</span>
        </div>
      )}

      {/* Action Controls */}
      {roomState.status !== 'COUNTDOWN' && (
        <div className="flex flex-col gap-2 pt-1">
          {/* Ready Button */}
          <button
            id="btn-toggle-ready"
            type="button"
            onClick={handleToggle}
            className={`w-full py-3 sm:py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 border ${
              isMyReady
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white border-white/30 shadow-xl shadow-emerald-500/25'
                : 'bg-white/[0.08] hover:bg-white/[0.15] text-white border-white/20 shadow-lg backdrop-blur-md'
            }`}
          >
            {isMyReady ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>أنا جاهز للمباراة! (انقر لإلغاء الجاهزية)</span>
              </>
            ) : (
              <>
                <CircleDashed className="w-4 h-4 text-emerald-400" />
                <span>اضغط هنا لتأكيد جاهزيتك للمباراة ✓</span>
              </>
            )}
          </button>

          {/* Host Start Match Override */}
          {isHost && connectedPlayers.length >= 2 && onStartMatch && (
            <button
              id="btn-host-start-match"
              type="button"
              onClick={onStartMatch}
              className="w-full py-2.5 rounded-2xl font-black text-xs sm:text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Play className="w-4 h-4 fill-amber-300" />
              <span>بدء المباراة الآن بمشاركة ({connectedPlayers.length}) لاعبين</span>
            </button>
          )}

          <button
            id="btn-leave-waiting-room"
            type="button"
            onClick={onLeave}
            className="w-full py-2 rounded-xl text-xs font-bold text-white/50 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>مغادرة الغرفة والعودة للرئيسية</span>
          </button>
        </div>
      )}
    </div>
  );
};
