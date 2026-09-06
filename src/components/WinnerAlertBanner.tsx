import React from 'react';
import { Trophy, Zap, X, Award, CheckCircle2 } from 'lucide-react';
import { SolveAnnouncement } from '../hooks/useMultiplayerSocket';

interface WinnerAlertBannerProps {
  announcement: SolveAnnouncement | null;
  onDismiss: () => void;
}

export const WinnerAlertBanner: React.FC<WinnerAlertBannerProps> = ({
  announcement,
  onDismiss,
}) => {
  if (!announcement) return null;

  const { nickname, attemptsUsed, timeTakenMs, isSelf } = announcement;
  const seconds = (timeTakenMs / 1000).toFixed(1);

  return (
    <div
      id="winner-solve-announcement"
      className="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-lg items-center justify-between gap-3 px-4 transition-all duration-500 animate-in fade-in slide-in-from-top-6"
    >
      <div
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md ${
          isSelf
            ? 'border-emerald-400/80 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-900/20'
            : 'border-amber-400/80 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-amber-900/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
            {isSelf ? (
              <Trophy className="h-6 w-6 text-yellow-300 animate-bounce" />
            ) : (
              <Zap className="h-6 w-6 text-yellow-200 animate-pulse" />
            )}
          </div>

          <div className="flex flex-col text-right">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide">
                {isSelf ? '🎉 أحسنت! قمت بحل الكلمة بنجاح!' : `⚡ فاز ${nickname} بحل الكلمة!`}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                جولة مكتملة
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/90">
              تم التخمين خلال{' '}
              <strong className="font-bold underline decoration-white/50">{attemptsUsed} محاولات</strong>{' '}
              في <strong className="font-bold">{seconds} ثانية</strong>
              {!isSelf && ' — استمر في المحاولة لجمع نقاطك!'}
            </p>
          </div>
        </div>

        <button
          id="dismiss-solve-announcement-btn"
          onClick={onDismiss}
          type="button"
          className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
          title="إغلاق التنبيه"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
