import React, { useState, useEffect } from 'react';
import { GameSettings } from '../shared/types';
import { DEFAULT_GAME_SETTINGS, GAME_CONFIG } from '../shared/constants';
import { THEME_DEFINITIONS } from '../game-engine/words-data';
import { Users, UserPlus, Gamepad2, Settings2, Copy, Check, Sparkles, Clock, Hash, Eye, Flame, Layers } from 'lucide-react';

interface LobbyProps {
  nickname: string;
  onUpdateNickname: (name: string) => void;
  onCreateRoom: (settings: Partial<GameSettings>) => void;
  onJoinRoom: (roomCode: string) => void;
  onStartSinglePlayer: () => void;
  onOpenSettings?: () => void;
  onOpenDailyChallenge?: () => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  initialRoomCode?: string;
}

export const Lobby: React.FC<LobbyProps> = ({
  nickname,
  onUpdateNickname,
  onCreateRoom,
  onJoinRoom,
  onStartSinglePlayer,
  onOpenSettings,
  onOpenDailyChallenge,
  isLoading = false,
  errorMessage = null,
  initialRoomCode = '',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'solo'>('create');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  useEffect(() => {
    if (initialRoomCode) {
      setActiveTab('join');
      setRoomCodeInput(initialRoomCode.trim().toUpperCase());
    }
  }, [initialRoomCode]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    onCreateRoom(settings);
  };

  const sanitizeRoomCode = (raw: string) => {
    let clean = raw.trim().toUpperCase();
    if (clean.includes('ROOM=')) {
      const match = clean.match(/ROOM=([A-Z0-9]{5})/i);
      if (match) clean = match[1].toUpperCase();
    } else {
      clean = clean.replace(/[^A-Z0-9]/gi, '').slice(0, 5).toUpperCase();
    }
    return clean;
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeRoomCode(roomCodeInput);
    if (!clean || !nickname.trim()) return;
    onJoinRoom(clean);
  };

  return (
    <div id="lobby-container" className="w-full max-w-xl mx-auto px-4 py-4 sm:py-8 flex flex-col gap-6">
      {/* Brand Hero */}
      <div className="text-center flex flex-col items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-xl text-emerald-400 border border-white/10 text-xs font-bold shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ووردل العربية التنافسية متعددة اللاعبين</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-l from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent tracking-tight drop-shadow-md">
          الوِرد
        </h1>
        <p className="text-xs sm:text-sm text-white/60 max-w-md">
          تحدَّ أصدقاءك في مبارزة كلمات عربية متزامنة في الوقت الحقيقي بنفس الكلمة والتوقيت المعتمد من الخادم!
        </p>
      </div>

      {/* Nickname Input Card */}
      <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col gap-2.5 text-right">
        <label htmlFor="input-nickname" className="text-xs font-bold text-white/80">
          اسم اللاعب أو اللقب
        </label>
        <input
          id="input-nickname"
          type="text"
          maxLength={20}
          value={nickname}
          onChange={(e) => onUpdateNickname(e.target.value)}
          placeholder="أدخل اسمك أو لقبك المستعار..."
          className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md text-white placeholder-white/30 font-bold text-sm focus:outline-none focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 backdrop-blur-md border border-rose-500/30 text-rose-300 text-xs font-bold text-right">
          {errorMessage}
        </div>
      )}

      {/* Daily Challenge Spotlight Banner */}
      {onOpenDailyChallenge && (
        <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-l from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 backdrop-blur-xl shadow-xl flex items-center justify-between text-right">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-inner">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-amber-300">لغز اليوم الحصري</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  متجدد يومياً
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                كلمة سرية موحدة لجميع اللاعبين يومياً مع تتبع سلسلة الانتصارات (Streaks)
              </p>
            </div>
          </div>
          <button
            id="btn-lobby-daily-challenge"
            type="button"
            onClick={onOpenDailyChallenge}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            خوض لغز اليوم 🔥
          </button>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="bg-white/[0.04] backdrop-blur-xl p-1 rounded-2xl border border-white/10 flex gap-1 shadow-inner">
        <button
          id="tab-create-room"
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-white/[0.12] text-emerald-400 border border-white/20 shadow-md backdrop-blur-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.06] border border-transparent'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>إنشاء غرفة</span>
        </button>

        <button
          id="tab-join-room"
          type="button"
          onClick={() => setActiveTab('join')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'join'
              ? 'bg-white/[0.12] text-emerald-400 border border-white/20 shadow-md backdrop-blur-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.06] border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>الانضمام بكود</span>
        </button>

        <button
          id="tab-solo-game"
          type="button"
          onClick={() => setActiveTab('solo')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'solo'
              ? 'bg-white/[0.12] text-emerald-400 border border-white/20 shadow-md backdrop-blur-md'
              : 'text-white/60 hover:text-white hover:bg-white/[0.06] border border-transparent'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>تدريب فردي</span>
        </button>
      </div>

      {/* Tab 1: Create Room */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreate} className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col gap-5 text-right">
          <div className="flex items-center gap-2 text-white font-bold text-sm pb-3 border-b border-white/10">
            <Settings2 className="w-4 h-4 text-emerald-400" />
            <span>إعدادات المباراة (للمستضيف)</span>
          </div>

          {/* Number of Rounds */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              <span>عدد الجولات: {settings.totalRounds}</span>
            </label>
            <div className="flex gap-2">
              {GAME_CONFIG.allowedRounds.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSettings({ ...settings, totalRounds: num })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.totalRounds === num
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-white/30 shadow-lg shadow-emerald-500/25'
                      : 'bg-white/[0.05] hover:bg-white/[0.10] text-white/70 border-white/10 backdrop-blur-md'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Round Duration */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>مدة كل جولة: {settings.roundDurationSeconds} ثانية</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GAME_CONFIG.allowedDurations.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSettings({ ...settings, roundDurationSeconds: sec })}
                  className={`flex-1 min-w-[3.5rem] py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.roundDurationSeconds === sec
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-white/30 shadow-lg shadow-emerald-500/25'
                      : 'bg-white/[0.05] hover:bg-white/[0.10] text-white/70 border-white/10 backdrop-blur-md'
                  }`}
                >
                  {sec}ث
                </button>
              ))}
            </div>
          </div>

          {/* Max Attempts */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/70">
              عدد المحاولات لكل لاعب: {settings.maxAttempts}
            </label>
            <div className="flex gap-2">
              {[6, 8, 10].map((att) => (
                <button
                  key={att}
                  type="button"
                  onClick={() => setSettings({ ...settings, maxAttempts: att })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.maxAttempts === att
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-white/30 shadow-lg shadow-emerald-500/25'
                      : 'bg-white/[0.05] hover:bg-white/[0.10] text-white/70 border-white/10 backdrop-blur-md'
                  }`}
                >
                  {att} محاولات
                </button>
              ))}
            </div>
          </div>

          {/* Max Players in Room */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>الحد الأقصى للاعبين: {settings.maxPlayers || 10} لاعبين</span>
            </label>
            <div className="flex gap-2">
              {GAME_CONFIG.allowedMaxPlayers.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSettings({ ...settings, maxPlayers: count })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    (settings.maxPlayers || 10) === count
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white border-white/30 shadow-lg shadow-emerald-500/25'
                      : 'bg-white/[0.05] hover:bg-white/[0.10] text-white/70 border-white/10 backdrop-blur-md'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Word Category Theme */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>مجال وموضوع الكلمات: {THEME_DEFINITIONS.find((t) => t.id === settings.themeCategory)?.name || 'جميع المجالات'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_DEFINITIONS.map((theme) => {
                const isSelected = (settings.themeCategory || 'ALL') === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, themeCategory: theme.id })}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-white/30 shadow-md shadow-emerald-500/20'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/75 border-white/10'
                    }`}
                  >
                    <span className="text-base">{theme.icon}</span>
                    <span className="truncate">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Show Opponent Progress Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>إظهار تقدم الخصم المباشر</span>
              </div>
              <div className="text-white/50 mt-0.5">يعرض نمط التخمينات للخصم دون كشف الأحرف السرية</div>
            </div>
            <input
              type="checkbox"
              checked={settings.showOpponentProgress}
              onChange={(e) => setSettings({ ...settings, showOpponentProgress: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 cursor-pointer rounded"
            />
          </div>

          <button
            id="btn-submit-create-room"
            type="submit"
            disabled={isLoading || !nickname.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-black text-sm shadow-xl shadow-emerald-500/25 border border-white/20 transition-all active:scale-98 disabled:opacity-40 cursor-pointer mt-2"
          >
            {isLoading ? 'جارٍ إنشاء الغرفة...' : 'إنشاء الغرفة وبدء التحدي'}
          </button>
        </form>
      )}

      {/* Tab 2: Join Room */}
      {activeTab === 'join' && (
        <form onSubmit={handleJoin} className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col gap-4 text-right">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="input-room-code" className="text-xs font-bold text-white/80">
                أدخل رمز الغرفة المكون من 5 أحرف
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator.clipboard) {
                      const text = await navigator.clipboard.readText();
                      const code = sanitizeRoomCode(text);
                      if (code) setRoomCodeInput(code);
                    }
                  } catch {}
                }}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
              >
                لصق الرمز
              </button>
            </div>

            <div className="relative">
              <input
                id="input-room-code"
                type="text"
                maxLength={60}
                value={roomCodeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length > 5) {
                    setRoomCodeInput(sanitizeRoomCode(val));
                  } else {
                    setRoomCodeInput(val.toUpperCase());
                  }
                }}
                placeholder="مثال: AB7KQ"
                className="w-full text-center tracking-widest text-2xl font-mono font-black py-3 px-4 rounded-xl sm:rounded-2xl border border-white/20 bg-white/[0.05] text-emerald-400 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase backdrop-blur-md"
              />
            </div>
            <p className="text-[11px] text-white/60 text-center flex items-center justify-center gap-1">
              <span className="text-emerald-400">⚡</span>
              <span>عند إدخال الرمز تصبح حالتك «جاهز» تلقائياً وتبدأ المباراة فور اكتمال اللاعبين</span>
            </p>
          </div>

          <button
            id="btn-submit-join-room"
            type="submit"
            disabled={isLoading || sanitizeRoomCode(roomCodeInput).length !== 5 || !nickname.trim()}
            className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-white font-black text-sm shadow-xl shadow-emerald-500/30 border border-white/20 transition-all active:scale-98 disabled:opacity-40 cursor-pointer mt-1 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>جارٍ الانضمام والتحضير...</span>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>انضمام فوري للمباراة ⚡</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab 3: Solo Game */}
      {activeTab === 'solo' && (
        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col gap-4 text-right">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-base text-white">
              نمط التدريب الفردي (Solo Practice)
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              تدرّب على حل كلمات عربية عشوائية بمفردك بدون توقيت أو منافس لتطوير مهاراتك اللغوية وسرعة اكتشاف الكلمات.
            </p>
          </div>

          <button
            id="btn-start-solo"
            type="button"
            onClick={onStartSinglePlayer}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-teal-500/25 border border-white/20 transition-all active:scale-98 cursor-pointer mt-2"
          >
            بدء جولة التدريب الفردي
          </button>
        </div>
      )}

      {/* Quick Settings Bar */}
      {onOpenSettings && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-xs text-white/70 shadow-sm">
          <button
            id="btn-lobby-open-settings"
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 hover:text-emerald-300 transition-colors cursor-pointer font-bold"
          >
            <Settings2 className="w-4 h-4 text-emerald-400" />
            <span>إعدادات الصوت واللعبة</span>
          </button>
          <span className="text-[11px] text-white/50">التحكم في المؤثرات الصوتية وتمييز الألوان</span>
        </div>
      )}
    </div>
  );
};
