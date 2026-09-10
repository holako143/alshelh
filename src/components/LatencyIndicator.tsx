import React, { useState } from 'react';
import { Wifi, WifiOff, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface LatencyIndicatorProps {
  latencyMs?: number | null;
  isReconnecting?: boolean;
  className?: string;
  showDetailsOnClick?: boolean;
}

export const LatencyIndicator: React.FC<LatencyIndicatorProps> = ({
  latencyMs,
  isReconnecting = false,
  className = '',
  showDetailsOnClick = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Status tiers:
  // Excellent: < 100ms
  // Fair: 100ms - 250ms
  // High latency / Warning: > 250ms
  const isHighLatency = latencyMs !== null && latencyMs !== undefined && latencyMs > 250;
  const isModerateLatency = latencyMs !== null && latencyMs !== undefined && latencyMs >= 100 && latencyMs <= 250;
  const isGoodLatency = latencyMs !== null && latencyMs !== undefined && latencyMs < 100;

  const getStatusColor = () => {
    if (isReconnecting) return 'border-rose-500/50 bg-rose-500/15 text-rose-300';
    if (isHighLatency) return 'border-amber-500/50 bg-amber-500/15 text-amber-300 animate-pulse';
    if (isModerateLatency) return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300';
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  };

  const getDotColor = () => {
    if (isReconnecting) return 'bg-rose-400 animate-ping';
    if (isHighLatency) return 'bg-rose-400 animate-pulse';
    if (isModerateLatency) return 'bg-yellow-400';
    return 'bg-emerald-400 shadow-sm shadow-emerald-400/50';
  };

  const getLatencyLabel = () => {
    if (isReconnecting) return 'إعادة اتصال...';
    if (latencyMs === null || latencyMs === undefined) return 'متصل';
    return `${latencyMs}ms`;
  };

  const getFullStatusDescription = () => {
    if (isReconnecting) return 'انقطع الاتصال مؤقتاً، جاري إعادة المزامنة تلقائياً مع الخادم';
    if (isHighLatency) return 'يوجد تأخير ملحوظ في المزامنة (>250ms)، قد تتأثر دقة الثواني';
    if (isModerateLatency) return 'تأخير طفيف مقبول في الاستجابة (100-250ms)، اللعب مستمر';
    return 'مزامنة فائقة السرعة واستجابة ممتازة مع خادم اللعبة (<100ms)';
  };

  return (
    <div className={`relative inline-block ${className}`} id="latency-indicator-wrapper">
      <button
        id="btn-latency-indicator"
        type="button"
        onClick={() => showDetailsOnClick && setShowTooltip((prev) => !prev)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer backdrop-blur-md select-none ${getStatusColor()}`}
        title="انقر لعرض تفاصيل مزامنة الاتصال مع الخادم"
        aria-label="مؤشر حالة الاتصال والتأخير"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColor()}`} />
        {isReconnecting ? (
          <WifiOff className="w-3 h-3 text-rose-400 shrink-0" />
        ) : (
          <Wifi className="w-3 h-3 opacity-80 shrink-0" />
        )}
        <span className="leading-none">{getLatencyLabel()}</span>
        {isHighLatency && <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />}
      </button>

      {/* Popover Card */}
      {showTooltip && (
        <div
          id="latency-details-tooltip"
          className="absolute left-0 top-full mt-2 w-64 p-3 rounded-2xl bg-[#0e1326]/95 border border-white/20 shadow-2xl backdrop-blur-2xl z-50 text-right flex flex-col gap-2 text-white animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>مؤشر مزامنة الخادم</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                isGoodLatency
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : isModerateLatency
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {isReconnecting ? 'جارِ الاتصال' : isGoodLatency ? 'ممتاز' : isModerateLatency ? 'مقبول' : 'تأخير مزامنة'}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-[11px] text-white/80">
            <div className="flex items-center justify-between">
              <span className="text-white/50">زمن الاستجابة (Ping):</span>
              <span className="font-mono font-bold text-white">{latencyMs !== null && latencyMs !== undefined ? `${latencyMs} مللي ثانية` : 'لحظي'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">دقة التوقيت:</span>
              <span className="text-white flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-400" />
                <span>ساعة خادم متزامنة</span>
              </span>
            </div>
          </div>

          <p className="text-[10px] leading-relaxed text-white/60 bg-white/[0.04] p-2 rounded-xl border border-white/5">
            {getFullStatusDescription()}
          </p>
        </div>
      )}
    </div>
  );
};
