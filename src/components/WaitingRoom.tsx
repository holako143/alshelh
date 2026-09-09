import React, { useState, useEffect } from 'react';
import { RoomState, PlayerState, GameSettings } from '../shared/types';
import { Copy, Check, Crown, User, CheckCircle2, Sparkles, LogOut, Play, Share2, Bot, UserMinus } from 'lucide-react';
import { soundManager } from '../lib/audio';

interface WaitingRoomProps {
  roomState: RoomState;
  myPlayerId: string;
  onToggleReady: (ready: boolean) => void;
  onStartMatch?: () => void;
  onLeave: () => void;
  countdownEndsAt?: number | null;
  getServerNow?: () => number;
  onAddBot?: () => void;
  onRemoveBot?: () => void;
  onUpdateSettings?: (settings: Partial<GameSettings>) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomState,
  myPlayerId,
  onStartMatch,
  onLeave,
  countdownEndsAt,
  getServerNow,
  onAddBot,
  onRemoveBot,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdownSecs, setCountdownSecs] = useState<number>(2);

  useEffect(() => {
    if (roomState.status !== 'COUNTDOWN' || !countdownEndsAt) return;

    const updateCountdown = () => {
      const now = getServerNow ? getServerNow() : Date.now();
      const diff = Math.max(1, Math.ceil((countdownEndsAt - now) / 1000));
      setCountdownSecs(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);
    return () => clearInterval(interval);
  }, [roomState.status, countdownEndsAt, getServerNow]);

  const myPlayer = roomState.players[myPlayerId];
  const isHost = myPlayer?.role === 'host';
  const players = Object.values(roomState.players) as PlayerState[];
  const connectedPlayers = players.filter((p) => p.isConnected);
  const allReady = connectedPlayers.length >= 2;

  // Auto-start match quickly when players join and are ready
  useEffect(() => {
    if (allReady && (roomState.status === 'WAITING' || roomState.status === 'READY_CHECK')) {
      if (isHost && onStartMatch) {
        const timer = setTimeout(() => {
          onStartMatch();
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [allReady, isHost, onStartMatch, roomState.status]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    soundManager.playKeypress();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareOrCopyLink = async () => {
    soundManager.playKeypress();
    const hostPlayer = roomState.players[roomState.hostPlayerId];
    const hostName = hostPlayer ? hostPlayer.nickname : 'المستضيف';
    const inviteUrl = `${window.location.origin}/?room=${roomState.roomCode}&host=${encodeURIComponent(hostName)}&r=${roomState.settings.totalRounds}&t=${roomState.settings.roundDurationSeconds}&th=${encodeURIComponent(roomState.settings.themeCategory || 'ALL')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تحدي الوِرد - ووردل العربية',
          text: `انضم معي في مبارزة كلمات الوِرد! رمز الغرفة: ${roomState.roomCode}`,
          url: inviteUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const hasBot = Object.keys(roomState.players).some((id) => id.startsWith('bot_'));

  return (
    <div id="waiting-room" className="w-full max-w-lg mx-auto px-4 py-4 sm:py-6 flex flex-col gap-4 text-center">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          غرفة الانتظار والمبارزة
        </h2>
        <div className="text-xs text-emerald-400/90 font-medium">
          مبارزة سريعة • {roomState.settings.totalRounds} جولات • {roomState.settings.roundDurationSeconds} ثانية للجولة
        </div>
      </div>

      {/* Room Code Showcase */}
      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center gap-2.5">
        <div className="text-xs text-white/70 font-semibold">رمز الغرفة للمنافس:</div>

        <div className="text-3xl sm:text-5xl font-mono font-black tracking-widest text-emerald-400 bg-white/[0.06] px-6 py-2 rounded-2xl border border-white/15 shadow-inner select-all">
          {roomState.roomCode}
        </div>

        <div className="flex items-center justify-center gap-2 w-full max-w-xs mt-0.5">
          <button
            id="btn-copy-code-large"
            type="button"
            onClick={handleCopyCode}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 px-3 py-2 rounded-xl text-white transition-all cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ الرمز'}</span>
          </button>

          <button
            id="btn-share-room-link"
            type="button"
            onClick={handleShareOrCopyLink}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 px-3 py-2 rounded-xl text-emerald-300 transition-all cursor-pointer active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة الرابط'}</span>
          </button>
        </div>
      </div>

      {/* Connected Players List (Only actual players, no empty clutter) */}
      <div className="flex flex-col gap-2 text-right">
        <div className="text-xs font-bold text-white/70 px-1">
          المتسابقون ({connectedPlayers.length}/2):
        </div>

        <div className="flex flex-col gap-2">
          {connectedPlayers.map((player) => {
            const isMe = player.id === myPlayerId;
            const isPlayerHost = player.role === 'host';
            return (
              <div
                key={player.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 backdrop-blur-md ${
                  isMe
                    ? 'bg-emerald-500/10 border-emerald-400/40 ring-1 ring-emerald-500/20'
                    : 'bg-white/[0.04] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isPlayerHost
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-teal-400/20 text-teal-300 border border-teal-400/30'
                    }`}
                  >
                    {isPlayerHost ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 text-right">
                    <div className="font-extrabold text-sm text-white truncate flex items-center gap-1.5">
                      <span>{player.nickname}</span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                          أنت
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/50">
                      {isPlayerHost ? 'مستضيف الغرفة' : 'المنافس'}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>جاهز ✓</span>
                  </span>
                </div>
              </div>
            );
          })}

          {/* If waiting for opponent */}
          {connectedPlayers.length < 2 && (
            <div className="p-3.5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-between gap-2 text-white/50 text-xs animate-pulse">
              <span>بانتظار انضمام المنافس برمز الغرفة...</span>
              {isHost && onAddBot && !hasBot && (
                <button
                  type="button"
                  onClick={onAddBot}
                  className="text-[11px] font-bold text-teal-300 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>بدء مع روبوت آلي 🤖</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Countdown overlay if starting */}
      {roomState.status === 'COUNTDOWN' && (
        <div className="bg-emerald-500/90 border border-emerald-300/40 text-white rounded-xl p-3 shadow-xl flex items-center justify-center gap-2.5 animate-pulse backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          <span className="font-black text-base">
            تبدأ المباراة خلال {countdownSecs} ثانية...
          </span>
        </div>
      )}

      {/* Host / Guest Action Button */}
      {roomState.status !== 'COUNTDOWN' && (
        <div className="flex flex-col gap-2 pt-1">
          {isHost && connectedPlayers.length >= 2 && onStartMatch && (
            <button
              id="btn-host-start-match"
              type="button"
              onClick={onStartMatch}
              className="w-full py-3.5 sm:py-4 rounded-xl font-black text-base bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-white shadow-xl shadow-emerald-500/30 border border-white/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>بدء المباراة الآن ⚡</span>
            </button>
          )}

          {!isHost && connectedPlayers.length >= 2 && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>أنت جاهز للمباراة ✓ — بانتظار بدء المستضيف...</span>
            </div>
          )}

          {hasBot && isHost && onRemoveBot && (
            <button
              type="button"
              onClick={onRemoveBot}
              className="w-full py-1.5 text-xs text-rose-300/80 hover:text-rose-300 flex items-center justify-center gap-1 cursor-pointer"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>إزالة الروبوت الآلي ✕</span>
            </button>
          )}

          <button
            id="btn-leave-waiting-room"
            type="button"
            onClick={onLeave}
            className="w-full py-2 text-xs font-semibold text-white/40 hover:text-white/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>مغادرة الغرفة</span>
          </button>
        </div>
      )}
    </div>
  );
};
