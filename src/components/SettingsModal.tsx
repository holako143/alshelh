import React, { useState, useEffect } from 'react';
import { soundManager } from '../lib/audio';
import {
  Settings2,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Play,
  Check,
  Sparkles,
  Trophy,
  XCircle,
  HelpCircle,
  X,
  RotateCcw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colorBlindMode: boolean;
  onToggleColorBlind: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  colorBlindMode,
  onToggleColorBlind,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [volume, setVolume] = useState(Math.round(soundManager.getVolume() * 100));
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Sync state with soundManager subscriptions
  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setIsMuted(soundManager.isMuted());
      setVolume(Math.round(soundManager.getVolume() * 100));
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playKeypress();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    soundManager.setVolume(val / 100);
    if (isMuted && val > 0) {
      soundManager.setMuted(false);
      setIsMuted(false);
    }
  };

  const triggerTestSound = (testKey: string, playFn: () => void) => {
    setActiveTest(testKey);
    playFn();
    setTimeout(() => setActiveTest(null), 800);
  };

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="settings-modal-content"
        className="w-full max-w-lg bg-[#0c1022] border border-white/15 rounded-3xl shadow-2xl p-5 sm:p-7 flex flex-col gap-6 text-right max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            id="btn-close-settings"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">إعدادات اللعبة</h2>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Settings2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Section 1: Audio & Sound Effects */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">التحكم في المؤثرات التفاعلية للأصوات</span>
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              <span>المؤثرات الصوتية</span>
            </span>
          </div>

          {/* Master Sound Toggle Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <button
              id="btn-toggle-sound-master"
              type="button"
              onClick={handleToggleMute}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                !isMuted ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  !isMuted ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>

            <div className="flex items-center gap-3">
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2 justify-end">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      !isMuted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {!isMuted ? 'مفعل' : 'صامت'}
                  </span>
                  <span>تشغيل المؤثرات الصوتية</span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  أصوات نقر الحروف، تقييم التخمين، الفوز والخسارة، وتنبيهات الوقت
                </p>
              </div>

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                  !isMuted
                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-400/30 text-rose-400'
                }`}
              >
                {!isMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-400">{volume}%</span>
              <span className="text-white/80 font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>مستوى الصوت الرئيسي</span>
              </span>
            </div>

            <input
              id="volume-slider"
              type="range"
              min="0"
              max="100"
              value={volume}
              disabled={isMuted}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400 disabled:opacity-40"
            />
          </div>

          {/* Sound Preview / Test Buttons */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="text-xs font-bold text-white/80 flex items-center justify-between">
              <span className="text-[11px] text-white/40">انقر لتجربة كل صوت</span>
              <span>تجربة التأثيرات الصوتية</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Guess Evaluation Test */}
              <button
                type="button"
                onClick={() =>
                  triggerTestSound('guess', () =>
                    soundManager.playGuessEvaluation(['CORRECT', 'CORRECT', 'PRESENT', 'ABSENT', 'CORRECT'])
                  )
                }
                disabled={isMuted}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTest === 'guess'
                    ? 'bg-teal-500/30 border-teal-400 text-teal-200 scale-98 shadow-md'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80 disabled:opacity-30'
                }`}
              >
                <Play className="w-3 h-3 text-teal-400" />
                <span>صوت تخمين الكلمة</span>
              </button>

              {/* Round Win Test */}
              <button
                type="button"
                onClick={() => triggerTestSound('roundWin', () => soundManager.playRoundWin())}
                disabled={isMuted}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTest === 'roundWin'
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 scale-98 shadow-md'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80 disabled:opacity-30'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>صوت حل الكلمة / الفوز</span>
              </button>

              {/* Match Win Fanfare */}
              <button
                type="button"
                onClick={() => triggerTestSound('matchWin', () => soundManager.playMatchWin())}
                disabled={isMuted}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTest === 'matchWin'
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 scale-98 shadow-md'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80 disabled:opacity-30'
                }`}
              >
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>موسيقى بطل المباراة</span>
              </button>

              {/* Loss Sound */}
              <button
                type="button"
                onClick={() => triggerTestSound('loss', () => soundManager.playRoundLoss())}
                disabled={isMuted}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTest === 'loss'
                    ? 'bg-rose-500/30 border-rose-400 text-rose-200 scale-98 shadow-md'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80 disabled:opacity-30'
                }`}
              >
                <XCircle className="w-3 h-3 text-rose-400" />
                <span>صوت الخسارة</span>
              </button>

              {/* Invalid Word Sound */}
              <button
                type="button"
                onClick={() => triggerTestSound('invalid', () => soundManager.playInvalidWord())}
                disabled={isMuted}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTest === 'invalid'
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 scale-98 shadow-md'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80 disabled:opacity-30'
                }`}
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>صوت كلمة غير صالحة</span>
              </button>

              {/* Keypress Sound */}
              <button
                type="button"
                onClick={() => triggerTestSound('key', () => soundManager.playKeypress())}
                disabled={isMuted}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTest === 'key'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 scale-98 shadow-md'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80 disabled:opacity-30'
                }`}
              >
                <span className="text-cyan-400 font-mono text-[10px]">⌨️</span>
                <span>صوت نقر لوحة المفاتيح</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Visual Accessibility */}
        <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">تسهيلات الرؤية وتخصيص المظهر</span>
            <span className="text-sm font-black text-amber-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>إمكانية الوصول</span>
            </span>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <button
              id="btn-toggle-colorblind-settings"
              type="button"
              onClick={onToggleColorBlind}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                colorBlindMode ? 'bg-amber-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  colorBlindMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>

            <div className="flex items-center gap-3">
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2 justify-end">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      colorBlindMode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/10 text-white/50 border border-white/10'
                    }`}
                  >
                    {colorBlindMode ? 'مفعل' : 'معطل'}
                  </span>
                  <span>نمط تمييز الألوان (عمى الألوان)</span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  إظهار رموز مساعدة (علامة صح، دائرة، خطأ) مع الألوان لتسهيل التمييز
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Eye className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer mt-1"
        >
          حفظ وإغلاق
        </button>
      </div>
    </div>
  );
};
