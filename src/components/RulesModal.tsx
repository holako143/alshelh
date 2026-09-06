import React from 'react';
import { X, Check, Waves, X as XIcon, Clock, Users, ShieldAlert, Sparkles } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="rules-modal" className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-right flex flex-col gap-5 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-black text-white">
              قواعد لعبة الوِرد التنافسية
            </h3>
          </div>
          <button
            id="btn-close-rules"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. الهدف */}
        <div className="flex flex-col gap-1.5">
          <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
            <span>🎯 الهدف من اللعبة</span>
          </h4>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            تخمين الكلمة العربية السرية المكونة من <strong>5 أحرف</strong> في أقل عدد ممكن من المحاولات (بحد أقصى 8 محاولات). في نمط اللاعبين، يحصل كلا اللاعبين على <strong>نفس الكلمة تماماً</strong> في كل جولة بشكل متزامن!
          </p>
        </div>

        {/* 2. دلالات الألوان */}
        <div className="flex flex-col gap-2">
          <h4 className="font-bold text-sm text-white">
            🎨 دلالات الألوان
          </h4>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center gap-3 bg-emerald-500/15 backdrop-blur-sm p-3 rounded-2xl border border-emerald-400/30 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-base shadow-sm">
                س
              </div>
              <div className="text-white/90">
                <strong className="text-emerald-300">اللون الأخضر:</strong> الحرف صحيح وموجود في نفس المكان تماماً.
              </div>
            </div>

            <div className="flex items-center gap-3 bg-amber-500/15 backdrop-blur-sm p-3 rounded-2xl border border-amber-400/30 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-base shadow-sm">
                ح
              </div>
              <div className="text-white/90">
                <strong className="text-amber-300">اللون الأصفر:</strong> الحرف موجود في الكلمة السرية ولكن في موقع آخر.
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/[0.04] backdrop-blur-sm p-3 rounded-2xl border border-white/10 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white font-black flex items-center justify-center text-base border border-white/20">
                د
              </div>
              <div className="text-white/80">
                <strong className="text-white/60">اللون الرمادي:</strong> الحرف غير موجود في الكلمة السرية على الإطلاق.
              </div>
            </div>
          </div>
        </div>

        {/* 3. التوقيت المعتمد من الخادم */}
        <div className="flex flex-col gap-1.5 bg-white/[0.04] backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
          <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>التوقيت المعتمد من الخادم</span>
          </h4>
          <p className="text-xs text-white/60 leading-relaxed">
            التوقيت متزامن ومعتمد من الخادم المركزي لحماية المنافسة العادلة، حتى إذا كان اتصال أحد اللاعبين بطيئاً أو ساعته مختلفة.
          </p>
        </div>

        {/* 4. نظام التلميحات التدريجي والجوكر */}
        <div className="flex flex-col gap-2 bg-white/[0.04] backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
          <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
            <span>💡 التلميحات الذكية وقوة الجوكر 🃏</span>
          </h4>
          <ul className="text-xs text-white/70 space-y-1.5 leading-relaxed list-disc list-inside">
            <li>
              <strong>3 مستويات للتلميح:</strong> يبدأ بالتصنيف والمجال مع أيقونة معبّرة، ثم الحرف الأول بعد المحاولة الثالثة، ثم الحرف الأخير مع وصف أدق بعد المحاولة الخامسة.
            </li>
            <li>
              <strong>قوة الجوكر 🃏:</strong> زر في لوحة المفاتيح يستبعد لك 3 أحرف خاطئة من اللوحة لمساعدتك في المواقف الصعبة (مرة واحدة لكل جولة).
            </li>
          </ul>
        </div>

        {/* 5. حساب النقاط */}
        <div className="flex flex-col gap-1.5 bg-white/[0.04] backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
          <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-teal-400" />
            <span>حساب النقاط والفائز</span>
          </h4>
          <p className="text-xs text-white/60 leading-relaxed">
            الحل الصحيح يمنح 1000 نقطة أساسية، مع مكافأة سرعة إضافية (حتى 300 نقطة)، وخصم 75 نقطة عن كل محاولة إضافية. عند فوز أي لاعب، يظهر إشعار فوري لجميع المتنافسين!
          </p>
        </div>

        <button
          id="btn-confirm-rules"
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 border border-white/20 transition-transform active:scale-98 cursor-pointer mt-2"
        >
          فهمت القواعد، فلنبدأ!
        </button>
      </div>
    </div>
  );
};
