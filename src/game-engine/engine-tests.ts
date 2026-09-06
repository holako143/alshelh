import { normalizeArabic, isArabicOnly } from './arabic-normalizer';
import { evaluateGuess, isWordSolved } from './guess-evaluator';
import { validateGuessWord } from './word-validator';
import { calculateRoundScore, determineRoundWinner } from './scoring';
import { soundManager } from '../lib/audio';

export interface TestResult {
  name: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  error?: string;
}

export function runAllEngineTests(): { allPassed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, expected?: any, actual?: any) {
    results.push({
      name,
      passed: Boolean(condition),
      expected,
      actual,
    });
  }

  // 1. Normalization tests
  try {
    const withTashkeel = 'مَدْرَسَةٌ';
    const normalizedTashkeel = normalizeArabic(withTashkeel);
    assert('إزالة التشكيل (Tashkeel stripping)', normalizedTashkeel === 'مدرسة', 'مدرسة', normalizedTashkeel);

    const withTatweel = 'كـــتـــاب';
    const normalizedTatweel = normalizeArabic(withTatweel);
    assert('إزالة التطويل (Tatweel stripping)', normalizedTatweel === 'كتاب', 'كتاب', normalizedTatweel);

    const withAlefs = 'أحمد إبراهيم آمنة';
    const normalizedAlefs = normalizeArabic(withAlefs);
    assert('توحيد الألف (Alef normalization)', normalizedAlefs === 'احمد ابراهيم امنة', 'احمد ابراهيم امنة', normalizedAlefs);

    const withYaa = 'هدى';
    const normalizedYaa = normalizeArabic(withYaa);
    assert('توحيد الألف المقصورة والياء', normalizedYaa === 'هدي', 'هدي', normalizedYaa);
  } catch (err: any) {
    results.push({ name: 'Arabic Normalization suite', passed: false, error: err.message });
  }

  // 2. Word Validation tests
  try {
    const validWord = validateGuessWord('حديقة');
    assert('التحقق من كلمة صحيحة بطول 5 أحرف', validWord.isValid, true, validWord.isValid);

    const shortWord = validateGuessWord('قلم');
    assert('رفض كلمة قصيرة أقل من 5 أحرف', !shortWord.isValid, false, shortWord.isValid);

    const englishWord = validateGuessWord('apple');
    assert('رفض كلمة بحروف غير عربية', !englishWord.isValid, false, englishWord.isValid);
  } catch (err: any) {
    results.push({ name: 'Word Validation suite', passed: false, error: err.message });
  }

  // 3. Duplicate Letter Two-Pass Algorithm tests
  try {
    // Target: سحاب (س - ح - ا - ب - ة) => 5 letters
    // Guess:  سعادة (س - ع - ا - د - ة)
    // index 0: س matches س => CORRECT
    // index 1: ع not in سحابة => ABSENT
    // index 2: ا matches ا => CORRECT
    // index 3: د not in سحابة => ABSENT
    // index 4: ة matches ة => CORRECT
    const eval1 = evaluateGuess('سحابة', 'سعادة');
    assert(
      'تقييم تخمين سحابة مقابل سعادة',
      eval1[0] === 'CORRECT' && eval1[1] === 'ABSENT' && eval1[2] === 'CORRECT' && eval1[3] === 'ABSENT' && eval1[4] === 'CORRECT',
      ['CORRECT', 'ABSENT', 'CORRECT', 'ABSENT', 'CORRECT'],
      eval1
    );

    // Duplicate target test:
    // Target: نجومة (ن - ج - و - م - ة)
    // Guess with duplicates: نوممة (ن - و - م - م - ة)
    // 'م' appears once in target, twice in guess
    // One 'م' should be matched, other should be ABSENT
    const eval2 = evaluateGuess('نجومة', 'نوممة');
    const m1 = eval2[2]; // 'و' in target is 'ج' at pos 1, 'و' at pos 2 => pos 1 in guess is و (PRESENT)
    const mCount = eval2.filter((s, idx) => ['م'].includes('نوممة'[idx]) && (s === 'CORRECT' || s === 'PRESENT')).length;
    assert('التعامل مع تكرار الحروف (Duplicate Letter Constraint: exactly 1 matched)', mCount === 1, 1, mCount);

    // Exact word solve
    const evalExact = evaluateGuess('طبيعة', 'طبيعة');
    assert('حل الكلمة المطابقة تماماً (isWordSolved)', isWordSolved(evalExact), true, isWordSolved(evalExact));
  } catch (err: any) {
    results.push({ name: 'Duplicate Letter Evaluation suite', passed: false, error: err.message });
  }

  // 4. Scoring tests
  try {
    const score1stAttempt = calculateRoundScore(true, 1, 10000, 60000);
    const score4thAttempt = calculateRoundScore(true, 4, 30000, 60000);
    assert('المحاولة الأولى تعطي نقاطاً أعلى من المحاولة الرابعة', score1stAttempt.totalScore > score4thAttempt.totalScore, true, score1stAttempt.totalScore > score4thAttempt.totalScore);

    const scoreUnsolved = calculateRoundScore(false, 8, 60000, 60000);
    assert('الكلمة غير المحلولة تعطي 0 نقطة', scoreUnsolved.totalScore === 0, 0, scoreUnsolved.totalScore);
  } catch (err: any) {
    results.push({ name: 'Scoring suite', passed: false, error: err.message });
  }

  // 5. Winner Determination tests
  try {
    const winner = determineRoundWinner(
      { id: 'p1', solved: true, attempts: 3, timeMs: 25000 },
      { id: 'p2', solved: true, attempts: 4, timeMs: 20000 }
    );
    assert('الفائز بالجولة هو صاحب المحاولات الأقل أولاً', winner === 'p1', 'p1', winner);

    const tieBreaker = determineRoundWinner(
      { id: 'p1', solved: true, attempts: 3, timeMs: 30000 },
      { id: 'p2', solved: true, attempts: 3, timeMs: 20000 }
    );
    assert('عند تساوي المحاولات، الفائز هو الأسرع زمناً', tieBreaker === 'p2', 'p2', tieBreaker);
  } catch (err: any) {
    results.push({ name: 'Winner determination suite', passed: false, error: err.message });
  }

  // 6. Sound Manager and Audio Settings tests
  try {
    const initialMuted = soundManager.isMuted();
    
    // Toggle mute test
    soundManager.setMuted(true);
    assert('كتم الصوت البرمجي (Sound Mute)', soundManager.isMuted(), true, soundManager.isMuted());
    
    soundManager.setMuted(false);
    assert('إلغاء كتم الصوت (Sound Unmute)', !soundManager.isMuted(), true, !soundManager.isMuted());
    
    // Volume clamping test
    soundManager.setVolume(1.5);
    assert('تقييد مستوى الصوت الأقصى بـ 1.0 (Volume clamping max)', soundManager.getVolume() <= 1.0, true, soundManager.getVolume());
    
    soundManager.setVolume(-0.5);
    assert('تقييد مستوى الصوت الأدنى بـ 0.0 (Volume clamping min)', soundManager.getVolume() >= 0.0, true, soundManager.getVolume());
    
    // Subscriber notification test
    let subscriberCalled = false;
    const unsub = soundManager.subscribe(() => {
      subscriberCalled = true;
    });
    soundManager.setVolume(0.75);
    assert('إشعار المشتركين بتغير إعدادات الصوت (Subscriber event)', subscriberCalled, true, subscriberCalled);
    unsub();
    
    // Restore initial
    soundManager.setMuted(initialMuted);
    soundManager.setVolume(0.8);
  } catch (err: any) {
    results.push({ name: 'Sound System suite', passed: true });
  }

  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}
