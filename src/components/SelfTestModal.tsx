import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Play, Loader2, Users, ShieldCheck, Zap } from 'lucide-react';
import { runAllEngineTests, TestResult } from '../game-engine/engine-tests';

interface SelfTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfTestModal: React.FC<SelfTestModalProps> = ({ isOpen, onClose }) => {
  const [engineResults, setEngineResults] = useState<TestResult[] | null>(null);
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [multiplayerTestResult, setMultiplayerTestResult] = useState<any | null>(null);
  const [isRunningMultiplayer, setIsRunningMultiplayer] = useState(false);

  if (!isOpen) return null;

  const handleRunEngineTests = () => {
    setIsRunningEngine(true);
    setTimeout(() => {
      const tests = runAllEngineTests();
      setEngineResults(tests.results);
      setIsRunningEngine(false);
    }, 150);
  };

  const handleRunMultiplayerTest = async () => {
    setIsRunningMultiplayer(true);
    setMultiplayerTestResult(null);
    try {
      const res = await fetch('/api/test-multiplayer', { method: 'POST' });
      const data = await res.json();
      setMultiplayerTestResult(data);
    } catch (err: any) {
      setMultiplayerTestResult({ success: false, message: err.message });
    } finally {
      setIsRunningMultiplayer(false);
    }
  };

  return (
    <div id="self-test-modal" className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl text-right flex flex-col gap-5 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg sm:text-xl font-black text-white">
              الاختبارات الآلية المباشرة (Live Self-Tests)
            </h3>
          </div>
          <button
            id="btn-close-tests"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Engine Tests */}
        <div className="flex flex-col gap-3.5 bg-white/[0.04] backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>اختبارات محرك الكلمات العربي وخوارزمية التكرار</span>
              </h4>
              <p className="text-xs text-white/60 mt-0.5">
                التحقق من التشكيل، التطويل، توحيد الألف، خوارزمية Wordle لحروف التكرار، والنقاط.
              </p>
            </div>

            <button
              id="btn-run-engine-tests"
              type="button"
              disabled={isRunningEngine}
              onClick={handleRunEngineTests}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/25 border border-white/20 shrink-0"
            >
              {isRunningEngine ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>تشغيل الفحص</span>
            </button>
          </div>

          {engineResults && (
            <div className="flex flex-col gap-1.5 pt-2.5 border-t border-white/10 max-h-48 overflow-y-auto">
              {engineResults.map((r, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-2.5 rounded-xl flex items-center justify-between border backdrop-blur-xs ${
                    r.passed
                      ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                      : 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                  }`}
                >
                  <span className="font-medium">{r.name}</span>
                  {r.passed ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ناجح</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <XCircle className="w-4 h-4" />
                      <span>فاشل</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: 10-Player Multiplayer Acceptance Test */}
        <div className="flex flex-col gap-3.5 bg-white/[0.04] backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-400" />
                <span>اختبار 10 لاعبين متزامنين عبر 5 غرف منعزلة</span>
              </h4>
              <p className="text-xs text-white/60 mt-0.5">
                إنشاء 5 غرف فورية و10 اتصالات WebSocket متزامنة وإرسال تخمينات متوازية.
              </p>
            </div>

            <button
              id="btn-run-multiplayer-test"
              type="button"
              disabled={isRunningMultiplayer}
              onClick={handleRunMultiplayerTest}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-white font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-teal-500/25 border border-white/20 shrink-0"
            >
              {isRunningMultiplayer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>اختبار 10 لاعبين</span>
            </button>
          </div>

          {multiplayerTestResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex flex-col gap-1.5 backdrop-blur-xs ${
                multiplayerTestResult.success
                  ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-400/30 text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {multiplayerTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                <span>{multiplayerTestResult.message}</span>
              </div>
              {multiplayerTestResult.details?.stats && (
                <div className="text-[11px] text-white/70 flex flex-wrap gap-x-4 gap-y-1 pt-1.5 border-t border-white/10">
                  <span>الغرف المنشأة: {multiplayerTestResult.details.stats.roomsCreated}</span>
                  <span>اللاعبون المتصلون: {multiplayerTestResult.details.stats.playersConnected}</span>
                  <span>التخمينات المتزامنة: {multiplayerTestResult.details.stats.guessesSubmitted}</span>
                  <span>رموز الغرف: {multiplayerTestResult.details.roomCodes.join(' ، ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
