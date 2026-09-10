import React, { useState, useEffect } from 'react';
import { RoomState, PlayerState, GameSettings } from '../shared/types';
import {
  Copy,
  Check,
  Crown,
  User,
  CheckCircle2,
  Sparkles,
  LogOut,
  Play,
  Share2,
  Bot,
  UserMinus,
  Wand2,
  Gamepad2,
  Settings2,
  Clock,
  Hash,
  ChevronDown,
  ChevronUp,
  Infinity as InfinityIcon,
} from 'lucide-react';
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
  onUpdateSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdownSecs, setCountdownSecs] = useState<number>(2);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(false);

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
  const isHost = myPlayer?.role === 'host' || roomState.hostPlayerId === myPlayerId;
  const players = Object.values(roomState.players) as PlayerState[];
  const connectedPlayers = players.filter((p) => p.isConnected);
  const allReady = connectedPlayers.length >= 2;

  // Auto-start timer only if host doesn't click start manually (gives host time to adjust Joker/settings)
  useEffect(() => {
    if (allReady && (roomState.status === 'WAITING' || roomState.status === 'READY_CHECK')) {
      if (isHost && onStartMatch) {
        const timer = setTimeout(() => {
          onStartMatch();
        }, 12000); // 12 seconds relaxed auto-start or instant start via button
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

      {/* Match Settings & Host Quick Controls (Collapsible for better space & aesthetics) */}
      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-xl text-right flex flex-col gap-2.5 transition-all">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>إعدادات المباراة {isHost ? '(تحكم فوري للمستضيف)' : ''}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              {roomState.settings.totalRounds} {roomState.settings.totalRounds === 1 ? 'جولة' : 'جولات'} •{' '}
              {roomState.settings.roundDurationSeconds === 0 ? 'بدون وقت ∞' : `${roomState.settings.roundDurationSeconds}ث`}
            </span>

            {isHost && onUpdateSettings && (
              <button
                id="btn-toggle-host-settings-accordion"
                type="button"
                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 rounded-xl border border-emerald-400/30 transition-all cursor-pointer select-none"
              >
                <span>{isSettingsExpanded ? 'طي الإعدادات' : 'تعديل الإعدادات'}</span>
                {isSettingsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Collapsed Summary Row */}
        {!isSettingsExpanded && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px] text-white/70">
            <span className="bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Hash className="w-3 h-3 text-emerald-400" />
              {roomState.settings.totalRounds} {roomState.settings.totalRounds === 1 ? 'جولة واحدة' : 'جولات'}
            </span>
            <span className="bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              {roomState.settings.roundDurationSeconds === 0 ? (
                <span className="flex items-center gap-1 text-cyan-300 font-bold">
                  <InfinityIcon className="w-3 h-3" />
                  <span>بدون وقت (لا نهائي)</span>
                </span>
              ) : (
                <span>{roomState.settings.roundDurationSeconds} ثانية لكل جولة</span>
              )}
            </span>
            <span className="bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Wand2 className="w-3 h-3 text-purple-400" />
              {(roomState.settings.jokerCount ?? 1) === 0
                ? 'الجوكر معطل'
                : `${roomState.settings.jokerCount ?? 1} جوكر (حذف ${roomState.settings.jokerEliminateCount ?? 3} أحرف)`}
            </span>
            <span className="bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-lg">
              {roomState.settings.maxAttempts} محاولات
            </span>
          </div>
        )}

        {/* Expanded Controls for Host */}
        {isSettingsExpanded && isHost && onUpdateSettings && (
          <div className="flex flex-col gap-3 pt-1 animate-in fade-in duration-150">
            {/* Joker Control for Host */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white/90 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>بطاقات الجوكر (المساعدة):</span>
                </span>
                <span className="text-[11px] font-black text-purple-300">
                  {(roomState.settings.jokerCount ?? 1) === 0 ? 'معطل ✕' : `${roomState.settings.jokerCount ?? 1} جوكر لكل جولة`}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onUpdateSettings({ jokerCount: count })}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        (roomState.settings.jokerCount ?? 1) === count
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-white/30 shadow-md shadow-purple-500/20'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border-white/10'
                      }`}
                    >
                      {count === 0 ? 'معطل (0)' : `${count} جوكر`}
                    </button>
                  ))}
                </div>
                {(roomState.settings.jokerCount ?? 1) > 0 && (
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-white/60">الأحرف المحذوفة بالجوكر:</span>
                    <div className="flex gap-1">
                      {[2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => onUpdateSettings({ jokerEliminateCount: num })}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            (roomState.settings.jokerEliminateCount ?? 3) === num
                              ? 'bg-purple-500/40 text-purple-200 border-purple-400/50'
                              : 'bg-white/[0.03] text-white/50 border-white/10 hover:text-white'
                          }`}
                        >
                          حذف {num} أحرف
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rounds and Duration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-white/70 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  مدة الجولة:
                </span>
                <div className="flex gap-1 flex-wrap">
                  {[180, 0, 60, 90, 120].map((secs) => (
                    <button
                      key={secs}
                      type="button"
                      onClick={() => onUpdateSettings({ roundDurationSeconds: secs })}
                      className={`flex-1 min-w-[48px] py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        roomState.settings.roundDurationSeconds === secs
                          ? 'bg-emerald-500/40 text-emerald-200 border-emerald-400/50 shadow-xs'
                          : 'bg-white/[0.03] text-white/50 border-white/10 hover:text-white'
                      }`}
                    >
                      {secs === 0 ? 'بدون وقت ∞' : `${secs}ث`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-white/70 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-400" />
                  عدد الجولات:
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onUpdateSettings({ totalRounds: num })}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        roomState.settings.totalRounds === num
                          ? 'bg-emerald-500/40 text-emerald-200 border-emerald-400/50 shadow-xs'
                          : 'bg-white/[0.03] text-white/50 border-white/10 hover:text-white'
                      }`}
                    >
                      {num} {num === 1 ? 'جولة' : 'جولات'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Close / Fold Button */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsExpanded(false)}
                className="text-[11px] text-white/60 hover:text-white flex items-center gap-1 py-0.5 px-2 rounded-lg bg-white/[0.03] border border-white/5 cursor-pointer"
              >
                <span>طي وحفظ الإعدادات</span>
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connected Players List (Only actual players, no empty clutter) */}
      <div className="flex flex-col gap-2 text-right">
        <div className="text-xs font-bold text-white/70 px-1">
          المتسابقون ({connectedPlayers.length}/2):
        </div>

        <div className="flex flex-col gap-2">
          {connectedPlayers.map((player) => {
            const isMe = player.id === myPlayerId;
            const isPlayerHost = player.role === 'host' || player.id === roomState.hostPlayerId;
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
                    <div className="text-[10px] text-white/60 flex items-center gap-1">
                      {isPlayerHost ? (
                        <span className="text-amber-300 font-medium">
                          {isMe ? 'المستضيف (أنت • تشارك باللعب 🎮)' : 'مستضيف الغرفة (متسابق 🎮)'}
                        </span>
                      ) : (
                        <span>المنافس (متسابق)</span>
                      )}
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
