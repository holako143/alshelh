/**
 * Rich Arabic Solo Training Vocabulary & Questions Dataset
 * Features multi-level difficulties (easy, medium, hard, expert)
 * and strictly validated variable word lengths (3, 4, 5, 6, 7 letters).
 */

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface TrainingWordItem {
  word: string;
  length: number;
  difficulty: DifficultyLevel;
  category: string;
  hint: string;
  icon: string;
  themeId: string;
  dictionaryMeaning?: string;
  notes?: string;
}

export const DIFFICULTY_LABELS: Record<DifficultyLevel, { label: string; badge: string; color: string; desc: string }> = {
  easy: {
    label: 'سهل',
    badge: '🟢 سهل',
    color: 'emerald',
    desc: 'كلمات مألوفة وشائعة وسهلة الاستنتاج',
  },
  medium: {
    label: 'متوسط',
    badge: '🟡 متوسط',
    color: 'amber',
    desc: 'كلمات ثقافية وعلمية تحتاج تركيزاً وتفكيراً',
  },
  hard: {
    label: 'صعب',
    badge: '🔴 صعب',
    color: 'rose',
    desc: 'كلمات بلاغية ومعجمية راقية تتحدى المحترفين',
  },
  expert: {
    label: 'تحدي فائق (خبير)',
    badge: '🟣 خبير',
    color: 'purple',
    desc: 'من أمهات المعاجم العربية وغريب اللغة وألفاظ الفصحى النادرة',
  },
};

export const TRAINING_WORDS: TrainingWordItem[] = [
  // ==========================================
  // 3-LETTER WORDS (3 أحرف)
  // ==========================================
  // --- 3 Letters: Easy ---
  {
    word: 'شمس',
    length: 3,
    difficulty: 'easy',
    category: 'فلك وطبيعة',
    hint: 'النجم المركزي المضيء في مجموعتنا ومصدر الدفء والضياء لكوكب الأرض',
    icon: '☀️',
    themeId: 'NATURE',
    dictionaryMeaning: 'الشمس: جرم سماوي ملتهب منير تجري حوله الكواكب في أفلاكها.',
  },
  {
    word: 'قمر',
    length: 3,
    difficulty: 'easy',
    category: 'فلك وطبيعة',
    hint: 'الجرم السماوي التابع للأرض الذي يضيء ليلاً بعكس أشعة الشمس',
    icon: '🌙',
    themeId: 'NATURE',
    dictionaryMeaning: 'القمر: كوكب غير مضيء بذاته يكتسب نوره من الشمس ويدور حول الأرض.',
  },
  {
    word: 'بحر',
    length: 3,
    difficulty: 'easy',
    category: 'طبيعة وجغرافيا',
    hint: 'مسطح مائي مالح واسع يغطي أكثر من ثلثي سطح الكرة الأرضية',
    icon: '🌊',
    themeId: 'NATURE',
    dictionaryMeaning: 'البحر: الماء الكثير المالح الواسع يقال بحر لجي وعميق.',
  },
  {
    word: 'نهر',
    length: 3,
    difficulty: 'easy',
    category: 'طبيعة وجغرافيا',
    hint: 'مجرى مائي طبيعي عذب جارٍ ينبع من المرتفعات ويصب في بحر أو بحيرة',
    icon: '🏞️',
    themeId: 'NATURE',
    dictionaryMeaning: 'النهر: المجرى الطبيعي المتدفق للمياه العذبة على اليابسة.',
  },
  {
    word: 'قلم',
    length: 3,
    difficulty: 'easy',
    category: 'أدب ولغة',
    hint: 'أداة التدوين والكتابة ونقل العلم والمعرفة بين الأجيال',
    icon: '✏️',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'القلم: كل ما يكتب ويخط به من قصب أو حديد أو حبر.',
  },
  {
    word: 'سيف',
    length: 3,
    difficulty: 'easy',
    category: 'تاريخ وتراث',
    hint: 'سلاح أبيض قاطع ذو نصل حاد كان رمزاً للفروسية والشجاعة والكرامة',
    icon: '⚔️',
    themeId: 'HISTORY',
    dictionaryMeaning: 'السيف: سلاح ذو شفرة حديدية قاطعة ومقبض يُضرب به في الحرب.',
  },
  {
    word: 'ورد',
    length: 3,
    difficulty: 'easy',
    category: 'نباتات وطبيعة',
    hint: 'زهر جميل فواح الرائحة ذو ألوان زاهية وبتلات ناعمة عطرة',
    icon: '🌹',
    themeId: 'NATURE',
    dictionaryMeaning: 'الورد: نَوْر الشجر ذو الرائحة الذكية المنعشة وألوانه شتى.',
  },
  {
    word: 'نجم',
    length: 3,
    difficulty: 'easy',
    category: 'فلك وفضاء',
    hint: 'جرم سماوي ملتهب يسبح في الفضاء ويلمع بضوئه الذاتي في سماء الليل',
    icon: '⭐',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'النجم: كوكب مضيء بذاته يرى في الليل كشعلة ساطعة في السماء.',
  },
  {
    word: 'صقر',
    length: 3,
    difficulty: 'easy',
    category: 'كائنات وطيور',
    hint: 'طائر جارح حاد البصر قوي المخالب مشهور في الصيد ورمز للأنفة والشموخ',
    icon: '🦅',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الصقر: كل طائر يصيد وله مخلب قوي ومنقار معقوف.',
  },
  {
    word: 'تمر',
    length: 3,
    difficulty: 'easy',
    category: 'أطعمة وثمار',
    hint: 'ثمرة شجرة النخيل الطيبة المباركة الغنية بالطاقة والغذاء',
    icon: '🌴',
    themeId: 'FOOD',
    dictionaryMeaning: 'التمر: يابس البلح بعد ارطابه وهو قوت رئيسي عريق.',
  },

  // --- 3 Letters: Medium ---
  {
    word: 'غيث',
    length: 3,
    difficulty: 'medium',
    category: 'طقس وطبيعة',
    hint: 'المطر النافع المغيث الذي ينزل بعد طول قحط وجفاف فيحيي الأرض',
    icon: '🌧️',
    themeId: 'NATURE',
    dictionaryMeaning: 'الغيث: المطر الذي يغيث الناس من الجدب وينبت الكلأ.',
  },
  {
    word: 'خيل',
    length: 3,
    difficulty: 'medium',
    category: 'كائنات وتراث',
    hint: 'الجياد والفرسان الأصيلة رمز الفروسية والجمال والسرعة والكرامة',
    icon: '🐎',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الخيل: اسم جمع للأفراس والجياد، وسميت خيلاً لاختيالها في المشي.',
  },
  {
    word: 'صرح',
    length: 3,
    difficulty: 'medium',
    category: 'عمارة وتاريخ',
    hint: 'بناء عظيم شامخ ومرتفع يُضرب به المثل في الإتقان والعلو',
    icon: '🏛️',
    themeId: 'HISTORY',
    dictionaryMeaning: 'الصرح: القصر الشامخ العالي المشيد والمبنى الباذخ المرتفع.',
  },
  {
    word: 'درع',
    length: 3,
    difficulty: 'medium',
    category: 'تراث وفروسية',
    hint: 'صفحة معدنية أو ترس من الزرد يرتديه المقاتل ليقيه الضربات والسهام',
    icon: '🛡️',
    themeId: 'HISTORY',
    dictionaryMeaning: 'الدرع: قميص من زرد الحديد يلبس للوقاية من السلاح في الحرب.',
  },
  {
    word: 'أفق',
    length: 3,
    difficulty: 'medium',
    category: 'طبيعة وفلك',
    hint: 'الخط الفاصل الدائري البعيد الذي يبدو عنده التقاء السماء بالأرض',
    icon: '🌅',
    themeId: 'NATURE',
    dictionaryMeaning: 'الأفق: ما ظهر من نواحي الفلك وأطراف الأرض والسماء.',
  },
  {
    word: 'وتد',
    length: 3,
    difficulty: 'medium',
    category: 'تراث وحياة',
    hint: 'قطعة خشبية أو حديدية تغرس في الأرض لتثبيت أطناب الخيام والبناء',
    icon: '🏕️',
    themeId: 'GENERAL',
    dictionaryMeaning: 'الوتد: ما يدق في الأرض أو الحائط من خشب ونحوه ليُشد به.',
  },
  {
    word: 'شهد',
    length: 3,
    difficulty: 'medium',
    category: 'أطعمة وثمار',
    hint: 'عسل النحل الصافي النقي في خلاياه وشمع عيونه قبل تصفيته',
    icon: '🍯',
    themeId: 'FOOD',
    dictionaryMeaning: 'الشهد: عسل النحل ما دام في عيون شَمْعه لم يُعصر.',
  },
  {
    word: 'رعد',
    length: 3,
    difficulty: 'medium',
    category: 'طقس وظواهر',
    hint: 'الصوت المجلجل القوي الناجم عن تمدد الهواء المفاجئ بفعل وميض البرق',
    icon: '⚡',
    themeId: 'NATURE',
    dictionaryMeaning: 'الرعد: الصوت المدوّي الذي يُسمع في السحاب عند البرق.',
  },
  {
    word: 'برق',
    length: 3,
    difficulty: 'medium',
    category: 'طقس وفلك',
    hint: 'شرارة كهربائية ضوئية هائلة تومض في السماء وتخطف الأبصار بين السحب',
    icon: '🌩️',
    themeId: 'NATURE',
    dictionaryMeaning: 'البرق: وميض ونور يسطع في الغيم بفعل تفريغ الشحنات الكهربائية.',
  },
  {
    word: 'غار',
    length: 3,
    difficulty: 'medium',
    category: 'إسلاميات وتاريخ',
    hint: 'تجويف صلب في صخر الجبل استظل به الأنبياء والصالحون كغار حراء وثور',
    icon: '⛰️',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'الغار: الكهف أو النقب الواسع في بطن الجبل الشامخ.',
  },

  // --- 3 Letters: Hard ---
  {
    word: 'غمد',
    length: 3,
    difficulty: 'hard',
    category: 'لغة وتراث',
    hint: 'قراب السيف ووعاؤه الواقي المصنوع من الخشب أو الجلد المرصع بالفضة',
    icon: '🗡️',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الغِمْد: جَفْن السيف وغطاؤه الذي يُغمَد فيه صيانَةً له.',
  },
  {
    word: 'طود',
    length: 3,
    difficulty: 'hard',
    category: 'لغة وبلاغة',
    hint: 'الجبل الضخم الشاهق العظيم الراسي الذي يقارع السحاب في السماء',
    icon: '🏔️',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الطود: الجبل العظيم الراسخ المنيف في ارتفاعه.',
  },
  {
    word: 'وهد',
    length: 3,
    difficulty: 'hard',
    category: 'معاجم وجغرافيا',
    hint: 'الأرض المنخفضة الهابطة بين المرتفعات والروابي والتلال',
    icon: '🏜️',
    themeId: 'NATURE',
    dictionaryMeaning: 'الوَهْد: المنخفض من الأرض، والجمع وِهاد وأَوْهُد.',
  },
  {
    word: 'ريم',
    length: 3,
    difficulty: 'hard',
    category: 'شعر ولغة',
    hint: 'الظبي الأبيض الخالص الجميل الرشيق الذي تغنى به شعراء الفصحى',
    icon: '🦌',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الرِّيم: الظبي الخالص البياض ذو العيون الحوراء الحسان.',
  },
  {
    word: 'سحت',
    length: 3,
    difficulty: 'hard',
    category: 'قيم وإسلاميات',
    hint: 'المال الحرام الخبيث كالميسر والرشوة الذي يمحق البركة ويوبق صاحبه',
    icon: '⚖️',
    themeId: 'VALUES',
    dictionaryMeaning: 'السُّحْت: المال المكتسب بالحرام لا بركة فيه ولا خير.',
  },
  {
    word: 'قبس',
    length: 3,
    difficulty: 'hard',
    category: 'قرآن ولغة',
    hint: 'شعلة نار مقتبسة من نار كبرى يُستضاء بها ويُهتدى في ظلمات الليل',
    icon: '🔥',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'القَبَس: الشعلة من النار تؤخذ على طرف عود أو جمرة للاستضاءة.',
  },
  {
    word: 'ضنك',
    length: 3,
    difficulty: 'hard',
    category: 'معاجم وقرآن',
    hint: 'الشدة والضيق الشديد وعسر العيش ونكد المعيشة والشقاء',
    icon: '🥀',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الضَّنْك: الضيق من كل شيء، يقال معيشة ضنك أي صعبة نكدة.',
  },

  // --- 3 Letters: Expert ---
  {
    word: 'أثل',
    length: 3,
    difficulty: 'expert',
    category: 'غريب اللغة',
    hint: 'شجر صحراوي عتيق صلب الخشب لا شوك له ذُكر في القرآن (خمط وأثل)',
    icon: '🌳',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الأَثْل: شجر عظيم خضراء طويلة العمر تصنع منها أواني العرب وأعمدتهم.',
  },
  {
    word: 'عنن',
    length: 3,
    difficulty: 'expert',
    category: 'معاجم قديمة',
    hint: 'ما يعترض في كبد السماء من السحاب أو حبل لجام الخيل إذا طال',
    icon: '📜',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العَنَن: ما اعترض في الأفق من غمام وسحاب رقيق.',
  },
  {
    word: 'سدف',
    length: 3,
    difficulty: 'expert',
    category: 'أدب قديم',
    hint: 'ظلمة الليل عند إقباله أو اختلاط النور بالظلمة بين طلوع الفجر والشروق',
    icon: '🌌',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'السَّدَف: اختلاط الضوء بالظلام، أو الظلمة ذاتها عند السدفة.',
  },
  {
    word: 'وجف',
    length: 3,
    difficulty: 'expert',
    category: 'معاجم وبلاغة',
    hint: 'اضطراب القلب الشديد وخفقانه هيبة ووجلاً وخوفاً من هول الأمر',
    icon: '💓',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الوَجْف: شدة الاضطراب والسرعة في ضربات الفؤاد.',
  },
  {
    word: 'صلد',
    length: 3,
    difficulty: 'expert',
    category: 'معاجم وتراث',
    hint: 'الحجر الأملس القاسي الشديد الذي لا ينبت نباتاً ولا يمسك ماءً',
    icon: '🪨',
    themeId: 'NATURE',
    dictionaryMeaning: 'الصَّلْد: الأملس الصلب من الحجارة والصخور التي لا تقبل الخدش.',
  },
  {
    word: 'حرد',
    length: 3,
    difficulty: 'expert',
    category: 'لسان العرب',
    hint: 'القصد إلى الأمر بعزيمة جازمة مع الغضب واعتزال الناس في المقصد',
    icon: '🧭',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الحَرْد: القصد بعزم، كما في قوله تعالى: (وغدوا على حرد قادرين).',
  },

  // ==========================================
  // 4-LETTER WORDS (4 أحرف)
  // ==========================================
  // --- 4 Letters: Easy ---
  {
    word: 'كتاب',
    length: 4,
    difficulty: 'easy',
    category: 'معارف وأدب',
    hint: 'صحائف مجموعة بين دفتين تحتوي على علوم أو أدب أو حكمة وفكر',
    icon: '📖',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الكتاب: الصحف المكتوبة المجمعة بين دفتين تحفظ العلم.',
  },
  {
    word: 'شروق',
    length: 4,
    difficulty: 'easy',
    category: 'طبيعة وفلك',
    hint: 'بزوغ قرص الشمس صباحاً من الأفق معلناً ميلاد يوم جديد',
    icon: '🌅',
    themeId: 'NATURE',
    dictionaryMeaning: 'الشروق: طلوع الشمس وبزوغ ضوئها في أول النهار.',
  },
  {
    word: 'غروب',
    length: 4,
    difficulty: 'easy',
    category: 'طبيعة وفلك',
    hint: 'غياب قرص الشمس في الأفق الغربي إيذاناً بحلول الغسق والمساء',
    icon: '🌇',
    themeId: 'NATURE',
    dictionaryMeaning: 'الغروب: مغيب الشمس وتواريها خلف الأفق الغربي.',
  },
  {
    word: 'هلال',
    length: 4,
    difficulty: 'easy',
    category: 'فلك وإسلاميات',
    hint: 'القمر في أول الشهر الهجري حين يظهر كقوس فضي رفيع منير',
    icon: '🌙',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'الهلال: غرة القمر أول ليلتين من الشهر القمري.',
  },
  {
    word: 'غزال',
    length: 4,
    difficulty: 'easy',
    category: 'كائنات وحيوانات',
    hint: 'حيوان رشيق وجميل سريع العدو يسكن الصحاري والسهول المفتوحة',
    icon: '🦌',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الغزال: الظبي الرشيق المشهور بحسن عينيه وسرعته.',
  },
  {
    word: 'عقاب',
    length: 4,
    difficulty: 'easy',
    category: 'كائنات وطيور',
    hint: 'طائر كاسر قوي الجناحين يتصدر سماء الجبال ويعد ملك الجوارح',
    icon: '🦅',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'العقاب: طائر جارح ضخم من أشد الجوارح بطشاً وقوة.',
  },
  {
    word: 'هدهد',
    length: 4,
    difficulty: 'easy',
    category: 'كائنات وقرآن',
    hint: 'طائر حكيم ذو قنزعة ملونة وريش بديع ذُكر في قصة سليمان عليه السلام',
    icon: '🪶',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'الهدهد: طائر ذو خطوط وألوان على ظهره وله عرف على رأسه.',
  },
  {
    word: 'واحة',
    length: 4,
    difficulty: 'easy',
    category: 'طبيعة وجغرافيا',
    hint: 'بقعة خضراء غناء وسط الصحراء الجافة تحوي نخيلاً وينابيع عذبة',
    icon: '🌴',
    themeId: 'NATURE',
    dictionaryMeaning: 'الواحة: الموضع الخصيب في قلب البيداء القاحلة فيه ماء وشجر.',
  },
  {
    word: 'خليج',
    length: 4,
    difficulty: 'easy',
    category: 'جغرافيا وبحار',
    hint: 'ذراع مائي من البحر يتوغل في اليابسة وتلجأ إليه السفن والموانئ',
    icon: '⛵',
    themeId: 'NATURE',
    dictionaryMeaning: 'الخليج: لسان من البحر يمتد داخل البر.',
  },
  {
    word: 'مسرح',
    length: 4,
    difficulty: 'easy',
    category: 'فنون وآداب',
    hint: 'خشبة مخصصة لعرض الفنون المسرحية والتمثيل والحوارات أمام الجمهور',
    icon: '🎭',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'المسرح: مكان مجهز تمثل عليه الروايات والمسرحيات.',
  },
  {
    word: 'جامع',
    length: 4,
    difficulty: 'easy',
    category: 'إسلاميات وعمارة',
    hint: 'مكان العبادة الإسلامي الذي تقام فيه الصلوات الخمس والجمعة بمئذنة وقبة',
    icon: '🕌',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'الجامع: المسجد الكبير الذي تُقام فيه الجمعة ويجتمع فيه المسلمون.',
  },

  // --- 4 Letters: Medium ---
  {
    word: 'كوكب',
    length: 4,
    difficulty: 'medium',
    category: 'فلك وعلوم',
    hint: 'جرم فضائي ضخم يدور في مدار ثابت حول نجم مضيء في المنظومة',
    icon: '🪐',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'الكوكب: الجرم السماوي المعتم الذي يستمد نوره من شمسه.',
  },
  {
    word: 'بلبل',
    length: 4,
    difficulty: 'medium',
    category: 'كائنات وطيور',
    hint: 'طائر مغرد عذب الصوت يطرب الأسماع بتغريده الشجي بين الأغصان',
    icon: '🐦',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'البلبل: طائر حسن الصوت معروف بنغماته العذبة.',
  },
  {
    word: 'صهيل',
    length: 4,
    difficulty: 'medium',
    category: 'تراث ولغة',
    hint: 'صوت الخيل والجياد الأصيلة عند انطلاقها وركضها في الميدان',
    icon: '🐎',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الصهيل: صوت الفرس والفرسان إذا طربت أو استحثت للعدو.',
  },
  {
    word: 'فضاء',
    length: 4,
    difficulty: 'medium',
    category: 'فلك وعلوم',
    hint: 'الفراغ اللانهائي الشاسع الذي يضم المجرات والنجوم والأجرام الكونية',
    icon: '🌌',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'الفضاء: ما بين الأجرام السماوية من فراغ شاسع لا متناهٍ.',
  },
  {
    word: 'ساحل',
    length: 4,
    difficulty: 'medium',
    category: 'جغرافيا وطبيعة',
    hint: 'الشريط الأرضي الممتد بمحاذاة مياه البحر أو المحيط',
    icon: '🏖️',
    themeId: 'NATURE',
    dictionaryMeaning: 'الساحل: شاطئ البحر وحافته الممتدة.',
  },
  {
    word: 'جبال',
    length: 4,
    difficulty: 'medium',
    category: 'طبيعة وتضاريس',
    hint: 'مرتفعات صخرية شاهقة تضرب جذورها كأوتاد في القشرة الأرضية',
    icon: '⛰️',
    themeId: 'NATURE',
    dictionaryMeaning: 'الجبال: جمع جبل، وهي التضاريس الصخرية العالية الشامخة.',
  },
  {
    word: 'شلال',
    length: 4,
    difficulty: 'medium',
    category: 'طبيعة ومياه',
    hint: 'هبوط مائي متدفق بانحدار شديد من صخور المرتفعات نحو الوديان',
    icon: '🌊',
    themeId: 'NATURE',
    dictionaryMeaning: 'الشلال: مسقط الماء الشديد الانحدار من علو إلى هبوط.',
  },
  {
    word: 'مضيق',
    length: 4,
    difficulty: 'medium',
    category: 'جغرافيا وبحار',
    hint: 'ممر مائي ضيق يصل بين بحرين واسعين وتمر به حركة الملاحة الدولية',
    icon: '🚢',
    themeId: 'NATURE',
    dictionaryMeaning: 'المضيق: المجرى البحري الضيق بين يابستين يربط حوضين مائيين.',
  },
  {
    word: 'أريج',
    length: 4,
    difficulty: 'medium',
    category: 'أدب وطبيعة',
    hint: 'الرائحة الزكية الطيبة الفواحة التي تعبق بها الأزهار والرياض الغناء',
    icon: '🌸',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الأريج: توهج الطيب وانتشار ريحه العطرة في المكان.',
  },
  {
    word: 'عنبر',
    length: 4,
    difficulty: 'medium',
    category: 'معارف وتراث',
    hint: 'مادة عطرية نادرة وثمينة تستخرج من جوف حوت العنبر في المحيطات',
    icon: '✨',
    themeId: 'GENERAL',
    dictionaryMeaning: 'العنبر: مادة طيبة الرائحة شحمية المنشأ يؤخذ من البحر.',
  },

  // --- 4 Letters: Hard ---
  {
    word: 'عسجد',
    length: 4,
    difficulty: 'hard',
    category: 'معاجم وبلاغة',
    hint: 'الذهب الخالص الصافي اللامع البراق في لسان العرب وأشعار القدماء',
    icon: '🪙',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العَسْجَد: اسم للذهب والجواهر والدر والياقوت.',
  },
  {
    word: 'ضرام',
    length: 4,
    difficulty: 'hard',
    category: 'أدب وشعر',
    hint: 'لهيب النار المشتعلة حين تستعر وتتطاير شظاياها وشررها في الهشيم',
    icon: '🔥',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الضِّرام: اشتعال النار وتوقد حطبها وسرعة سريان لهيبها.',
  },
  {
    word: 'قشيب',
    length: 4,
    difficulty: 'hard',
    category: 'معاجم ولغة',
    hint: 'الثوب الجديد النقي النظيف والشيء الباهر الحسن والجمال والنقاء',
    icon: '👘',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'القَشِيب: الجديد النظيف من الثياب، أو الأبيض الصقيل.',
  },
  {
    word: 'حبور',
    length: 4,
    difficulty: 'hard',
    category: 'مشاعر وبلاغة',
    hint: 'السرور والفرح والابتهاج الخالص الذي يملأ القلب راحة وانشراحاً',
    icon: '😊',
    themeId: 'VALUES',
    dictionaryMeaning: 'الحُبُور: النعمة والسرور والابتهاج الذي يظهر أثره على الوجه.',
  },
  {
    word: 'وثاب',
    length: 4,
    difficulty: 'hard',
    category: 'لغة وشجاعة',
    hint: 'الكثير الوثب والقفز السريع المقدام الذي لا يهاب العقبات والصعاب',
    icon: '🤾',
    themeId: 'SPORTS',
    dictionaryMeaning: 'الوَثَّاب: صيغة مبالغة لمن يثب قفزاً وإقداماً في ميادين التحدي.',
  },
  {
    word: 'لجين',
    length: 4,
    difficulty: 'hard',
    category: 'أدب وتراث',
    hint: 'الفضة البيضاء النقية اللامعة التي تغنى بها شعراء الوصف والبلاغة',
    icon: '🥈',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'اللُّجَيْن: الفضة المصفاة الناصعة البياض والبريق.',
  },
  {
    word: 'سؤدد',
    length: 4,
    difficulty: 'hard',
    category: 'قيم وأخلاق',
    hint: 'المجد والشرف والسيادة ورفعة المنزلة والرياسة في القوم',
    icon: '👑',
    themeId: 'VALUES',
    dictionaryMeaning: 'السُّؤْدُد: السيادة والرفعة وعلو الشأن والشرف المتوارث.',
  },
  {
    word: 'دهاق',
    length: 4,
    difficulty: 'hard',
    category: 'قرآن ومعاجم',
    hint: 'الكأس الممتلئة المترعة بالشراب الصافي حتى حافتها ذُكرت في القرآن',
    icon: '🍷',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'دِهاق: ممتلئة متتابعة، كما في قوله تعالى: (وكأساً دهاقاً).',
  },
  {
    word: 'غساق',
    length: 4,
    difficulty: 'hard',
    category: 'قرآن ومعاجم',
    hint: 'الشراب البالغ البرودة أو الصديد المنتن السائل من أهل النار',
    icon: '❄️',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'الغَسَّاق: ما يقطر ويسيل بارداً أو منتناً، ذُكر في سورة النبأ وص.',
  },

  // --- 4 Letters: Expert ---
  {
    word: 'شنير',
    length: 4,
    difficulty: 'expert',
    category: 'لسان العرب',
    hint: 'الرجل السيئ الخلق الشرير أو العيب الفاضح المنكر في أعراف العرب',
    icon: '📜',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الشَّنِير: القبيح الذكر الفاحش العيب المشهور بالسوء.',
  },
  {
    word: 'خفرع',
    length: 4,
    difficulty: 'expert',
    category: 'تاريخ قديم',
    hint: 'من أشهر ملوك الأسرة الرابعة وباني الهرم الأوسط في الجيزة ومثال أبي الهول',
    icon: '🏛️',
    themeId: 'HISTORY',
    dictionaryMeaning: 'خفرع: فرعون مصري قديم صاحب الهرم والتمثال العظيم بالجيزة.',
  },
  {
    word: 'ضبار',
    length: 4,
    difficulty: 'expert',
    category: 'غريب اللغة',
    hint: 'الأسد الوثيق الخلق الشديد العضلات الضخم الجثة المكتنز القوة',
    icon: '🦁',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الضُّبَارِم والضُّبَار: الشديد العضل المجتمع اللحم كالقسور.',
  },
  {
    word: 'عرزم',
    length: 4,
    difficulty: 'expert',
    category: 'أمهات المعاجم',
    hint: 'الأسد الشديد البطش أو الداهية العظمى والمصيبة الصعبة المراس',
    icon: '⚡',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العَرْزَم: الصلب الشديد العضلي، وتطلق على الداهية المطبقة.',
  },
  {
    word: 'عصلب',
    length: 4,
    difficulty: 'expert',
    category: 'فصيح اللغة',
    hint: 'الشديد الصلب القوي العظام والأوتار من الرجال أو الجياد الشداد',
    icon: '💪',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العُصْلُب: الشديد الخلق العبل الأوتار لا ينكسر.',
  },
  {
    word: 'قسيب',
    length: 4,
    difficulty: 'expert',
    category: 'معاجم وبلاغة',
    hint: 'صوت جريان الماء العذب المترقرق أو صوت حفيف القصب إذا عصفت به الريح',
    icon: '🌊',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'القَسِيب: صوت جرية الماء في الوادي أو نداء الراعي لقصبته.',
  },
  {
    word: 'هجرس',
    length: 4,
    difficulty: 'expert',
    category: 'كائنات ولغة',
    hint: 'ولد الثعلب أو القرد الصغير في فصيح كلام العرب القدامى',
    icon: '🦊',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الهِجْرِس: ولد الثعلب الصغير الدقيق الرشيق.',
  },
  {
    word: 'وعال',
    length: 4,
    difficulty: 'expert',
    category: 'كائنات ولغة',
    hint: 'ذكور الوعول الجبلية الشديدة الحوافر المقيمة في قنن الصخور الشاهقة',
    icon: '🐐',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الوُعال: جمع وَعِل، وهو تيس الجبل ذو القرنين المعقوفين.',
  },

  // ==========================================
  // 5-LETTER WORDS (5 أحرف)
  // ==========================================
  // --- 5 Letters: Easy ---
  {
    word: 'بحيرة',
    length: 5,
    difficulty: 'easy',
    category: 'طبيعة وجغرافيا',
    hint: 'مسطح مائي عذب أو مالح تحيط به اليابسة من جميع الجهات',
    icon: '🏞️',
    themeId: 'NATURE',
    dictionaryMeaning: 'البحيرة: حوض مائي واسع محاط بالبر من كل صوب.',
  },
  {
    word: 'جزيرة',
    length: 5,
    difficulty: 'easy',
    category: 'طبيعة وجغرافيا',
    hint: 'قطعة من الأرض تحيط بها مياه البحر أو النهر من كل جانب',
    icon: '🏝️',
    themeId: 'NATURE',
    dictionaryMeaning: 'الجزيرة: قطعة من اليابسة انقطعت في البحر وأحاط الماء بأرجائها.',
  },
  {
    word: 'بركان',
    length: 5,
    difficulty: 'easy',
    category: 'طبيعة وجغرافيا',
    hint: 'فوهة في القشرة الأرضية تخرج منها الحمم والصهارة والغازات الملتهبة',
    icon: '🌋',
    themeId: 'NATURE',
    dictionaryMeaning: 'البركان: اندفاع صخور منصهرة وحمم من باطن الأرض نحو السطح.',
  },
  {
    word: 'صحراء',
    length: 5,
    difficulty: 'easy',
    category: 'طبيعة وجغرافيا',
    hint: 'مساحة رملية شاسعة وقاحلة تتسم بندرة الأمطار وشدة الجفاف والحرارة',
    icon: '🏜️',
    themeId: 'NATURE',
    dictionaryMeaning: 'الصحراء: البيداء الجرداء الشاسعة المترامية الأطراف.',
  },
  {
    word: 'سحابة',
    length: 5,
    difficulty: 'easy',
    category: 'طقس وفلك',
    hint: 'تجمع أبيض ناصع أو رمادي من قطرات بخار الماء يسبح في طبقات السماء',
    icon: '☁️',
    themeId: 'NATURE',
    dictionaryMeaning: 'السحابة: الغيمة السابحة في كبد السماء الحاملة لقطر الندى والمطر.',
  },
  {
    word: 'طائرة',
    length: 5,
    difficulty: 'easy',
    category: 'تكنولوجيا ونقل',
    hint: 'مركبة جوية ذات أجنحة ومحركات نفاثة تنقل الركاب عبر السحاب والبلدان',
    icon: '✈️',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'الطائرة: آلة تحلق في الجو بقوة محركاتها وتدفق الهواء.',
  },
  {
    word: 'حديقة',
    length: 5,
    difficulty: 'easy',
    category: 'طبيعة وبيئة',
    hint: 'مساحة مزروعة بالأشجار والأزهار والرياحين للتنزه والاستجمام والبهجة',
    icon: '🏡',
    themeId: 'NATURE',
    dictionaryMeaning: 'الحديقة: كل بستان عليه سور ومحاط بالشجر العطر المثمر.',
  },
  {
    word: 'سيارة',
    length: 5,
    difficulty: 'easy',
    category: 'تكنولوجيا وحياة',
    hint: 'مركبة برية تسير على أربع عجلات بمحرك احتراق أو بطاريات كهربائية',
    icon: '🚗',
    themeId: 'GENERAL',
    dictionaryMeaning: 'السيارة: المركبة الآلية المستعملة للتنقل على الطرق.',
  },
  {
    word: 'حمامة',
    length: 5,
    difficulty: 'easy',
    category: 'كائنات وطيور',
    hint: 'طائر أليف لطيف يرمز عالمياً للأمن والسلام والوداعة والهديل العذب',
    icon: '🕊️',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الحمامة: طائر معروف بالهديل والوفاء والألفة للإنسان.',
  },
  {
    word: 'مكتبة',
    length: 5,
    difficulty: 'easy',
    category: 'معارف وأدب',
    hint: 'دار فسيحة تضم ألوف الكتب والمراجع والوثائق والمخطوطات القيمة',
    icon: '📚',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'المكتبة: موضع جمع الكتب وفهارس العلم للبحث والاطلاع.',
  },

  // --- 5 Letters: Medium ---
  {
    word: 'كواكب',
    length: 5,
    difficulty: 'medium',
    category: 'فلك وفضاء',
    hint: 'أجرام سماوية ضخمة تدور في مدارات محددة حول النجوم كالشمس',
    icon: '🪐',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'الكواكب: الأجرام الكونية المدارية التابعة للنجم في مداره.',
  },
  {
    word: 'مجرات',
    length: 5,
    difficulty: 'medium',
    category: 'فلك وفضاء',
    hint: 'أنظمة كونية عملاقة تحتوي على مليارات النجوم والأنظمة الشمسية والغبار',
    icon: '🌌',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'المجرات: تجمعات هائلة لمليارات النجوم تدور حول مركز مشترك.',
  },
  {
    word: 'صاروخ',
    length: 5,
    difficulty: 'medium',
    category: 'فضاء وتكنولوجيا',
    hint: 'مركبة أسطوانية نفاثة تندفع بسرعة خارقة لحمل الأقمار والمسبار للفضاء',
    icon: '🚀',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'الصاروخ: مركبة تعتمد قوة الدفع النفاث لاختراق الغلاف الجوي.',
  },
  {
    word: 'ياقوت',
    length: 5,
    difficulty: 'medium',
    category: 'معادن وأحجار',
    hint: 'حجر كريم نفيس صلب يتميز بلونه الأحمر القاني وبريقه الأخاذ ونقائه',
    icon: '💎',
    themeId: 'GENERAL',
    dictionaryMeaning: 'الياقوت: حجر كريم صلب جداً من أثمن الجواهر بعد الماس.',
  },
  {
    word: 'فيروز',
    length: 5,
    difficulty: 'medium',
    category: 'معادن وتراث',
    hint: 'حجر كريم ذو زرقة سماوية مائلة للخضرة يزين الحلي الفاخرة والتيجان',
    icon: '💠',
    themeId: 'GENERAL',
    dictionaryMeaning: 'الفيروز: معدن ثمين أزرق سماوي يستخرج من سيناء وإيران.',
  },
  {
    word: 'ريحان',
    length: 5,
    difficulty: 'medium',
    category: 'نباتات وثمار',
    hint: 'نبات عطري طيب الرائحة تفرش به البساتين ذُكر في محكم التنزيل',
    icon: '🌿',
    themeId: 'NATURE',
    dictionaryMeaning: 'الريحان: كل نبت طيب الريح، وخص به الحوك العطر.',
  },
  {
    word: 'شهامة',
    length: 5,
    difficulty: 'medium',
    category: 'قيم وأخلاق',
    hint: 'عزة النفس والنجدة والشجاعة في نصرة الملهوف والوقوف مع الحق برجولة',
    icon: '⚔️',
    themeId: 'VALUES',
    dictionaryMeaning: 'الشهامة: عزة النفس وحرصها على نصرة المظلوم والمروءة.',
  },
  {
    word: 'مروءة',
    length: 5,
    difficulty: 'medium',
    category: 'قيم وأخلاق',
    hint: 'كمال الرجولة وحسن الخلق وعفة النفس وبذل المعروف لمن يحتاجه بصدق',
    icon: '🛡️',
    themeId: 'VALUES',
    dictionaryMeaning: 'المروءة: كمال الإنسانية والأخلاق الرفيعة وصيانة العرض.',
  },
  {
    word: 'عدالة',
    length: 5,
    difficulty: 'medium',
    category: 'قيم وأخلاق',
    hint: 'إعطاء كل ذي حق حقه وميزان الحكم بالقسطاس المستقيم دون تحيز أو جور',
    icon: '⚖️',
    themeId: 'VALUES',
    dictionaryMeaning: 'العدالة: الاستقامة وملازمة الحق في كل تصرف وحكم.',
  },
  {
    word: 'تسامح',
    length: 5,
    difficulty: 'medium',
    category: 'قيم وأخلاق',
    hint: 'العفو والصفح الجميل ومقابلة الإساءة بالإحسان ونقاء القلب من الضغينة',
    icon: '🕊️',
    themeId: 'VALUES',
    dictionaryMeaning: 'التسامح: الجود والصفح والتجاوز عن هفوات الآخرين بود.',
  },

  // --- 5 Letters: Hard ---
  {
    word: 'زبرجد',
    length: 5,
    difficulty: 'hard',
    category: 'أحجار ومعاجم',
    hint: 'حجر كريم شفاف لونه أخضر نضر ضارب إلى الصفرة ذكر في وصف نعيم الجنان',
    icon: '💎',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الزبرجد: نوع من الجواهر والبلور الأخضر النقي الثمين.',
  },
  {
    word: 'قسورة',
    length: 5,
    difficulty: 'hard',
    category: 'قرآن وبلاغة',
    hint: 'الأسد الشديد القوي الشجاع أو الرماة من الصيادين ذُكرت في سورة المدثر',
    icon: '🦁',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'القَسْوَرَة: الأسد الضاري، أو عصبة الرماة، كحمر فرت من قسورة.',
  },
  {
    word: 'صلصال',
    length: 5,
    difficulty: 'hard',
    category: 'قرآن ولغة',
    hint: 'طين يابس مصوت له صلصلة إذا نقر خُلق منه الإنسان الأول كالفخار',
    icon: '🏺',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'الصلصال: الطين اليابس الذي يسمع له صوت صلصلة من جفافه.',
  },
  {
    word: 'يحموم',
    length: 5,
    difficulty: 'hard',
    category: 'قرآن ومعاجم',
    hint: 'دخان أسود شديد السواد والحرارة والكثافة ذُكر في سورة الواقعة',
    icon: '💨',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'اليَحْمُوم: الدخان الكثيف الأسود الخانق الشديد الكدر.',
  },
  {
    word: 'سرادق',
    length: 5,
    difficulty: 'hard',
    category: 'قرآن ولغة',
    hint: 'ما يحيط بالبناء أو الخيمة من سياج أو لهب ونار تحيط بالمجرمين',
    icon: '⛺',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'السُّرادِق: كل ما أحاط بالشيء من مضرب وخيمة وسور حريق.',
  },
  {
    word: 'غيداء',
    length: 5,
    difficulty: 'hard',
    category: 'شعر وبلاغة',
    hint: 'المرأة الحسناء الناعمة المتثنية ليناً ورقة ودلالاً في مشيتها الرزينة',
    icon: '👸',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الغَيْداء: الناعمة البضة من النساء ذات العنق الأملس اللين.',
  },
  {
    word: 'جمانة',
    length: 5,
    difficulty: 'hard',
    category: 'أدب ومعاجم',
    hint: 'حبة اللؤلؤ المصنوعة من الفضة المضيئة ورمز الدرة المصونة النقية',
    icon: '🦪',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الجُمانة: حبة من فضة صيغت كاللؤلؤ، وتطلق على اللؤلؤة نفسها.',
  },
  {
    word: 'شمراخ',
    length: 5,
    difficulty: 'hard',
    category: 'نباتات ولغة',
    hint: 'الغصن الدقيق المتشعب الحامل لعناقيد النخل والبلح والعنب في الكرمة',
    icon: '🍇',
    themeId: 'NATURE',
    dictionaryMeaning: 'الشِّمْراخ: العذق الصغير المتفرع في عرجون النخلة أو عنقود العنب.',
  },
  {
    word: 'صنديد',
    length: 5,
    difficulty: 'hard',
    category: 'شجاعة ولغة',
    hint: 'الشجاع البطل العظيم السيد الشريف في قومه الثابت في وطيس النزال',
    icon: '🗡️',
    themeId: 'VALUES',
    dictionaryMeaning: 'الصِّنْديد: السيد الشجاع المقدام والجبل العظيم الشامخ.',
  },
  {
    word: 'جلمود',
    length: 5,
    difficulty: 'hard',
    category: 'شعر وبلاغة',
    hint: 'الصخرة الصماء العظيمة الصلبة الشديدة (كجلمود صخر حطه السيل من عل)',
    icon: '🪨',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الجَلْمُود: الحجر العظيم الصوان الصلب المكتنز.',
  },

  // --- 5 Letters: Expert ---
  {
    word: 'عرندس',
    length: 5,
    difficulty: 'expert',
    category: 'أمهات المعاجم',
    hint: 'الأسد الجريء العظيم الشديد أو السيل الجارف القوي الذي يقتلع الصخور',
    icon: '🦁',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العَرَنْدَس: العظيم الشديد من كل شيء، يقال أسد عرندس وسيل عرندس.',
  },
  {
    word: 'غيداق',
    length: 5,
    difficulty: 'expert',
    category: 'لسان العرب',
    hint: 'الكريم الواسع العطاء أو المطر الغزير المتدفق أو النهر الفياض بمياهه',
    icon: '🌊',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الغَيْداق: الكثير الخير والندى، والماء الوفير المتدفق.',
  },
  {
    word: 'صهصلق',
    length: 5,
    difficulty: 'expert',
    category: 'غريب اللغة',
    hint: 'الشديد الصوت العالي الصيحة من الرجال الصناديد أو الخيل الصاهلة',
    icon: '📢',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الصَّهْصَلِق: الجهير الصوت الحاد الصيحة الشديد النبرة.',
  },
  {
    word: 'قنداف',
    length: 5,
    difficulty: 'expert',
    category: 'القاموس المحيط',
    hint: 'العظيم الجثة الضخم الرأس والمنكبين الشديد البطش والإقدام',
    icon: '🥋',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'القِنْداف: الجسيم الصلب القصير القامة المكتنز القوة.',
  },
  {
    word: 'كنهبل',
    length: 5,
    difficulty: 'expert',
    category: 'معاجم نباتية',
    hint: 'شجر عظيم من شجر البادية العتيق ضخم الجذع تعشش فيه الطيور الجارحة',
    icon: '🌳',
    themeId: 'NATURE',
    dictionaryMeaning: 'الكَنَهْبَل: ضرب من الشجر الضخم في البراري يشبه الدلب.',
  },
  {
    word: 'عصلوز',
    length: 5,
    difficulty: 'expert',
    category: 'ألفاظ المعاجم',
    hint: 'الغصن الغض الرطب إذا كان دقيقاً ناعماً في أول نباته واخضراره',
    icon: '🌱',
    themeId: 'NATURE',
    dictionaryMeaning: 'العُصْلُوز: القضيب الدقيق الغض الرطب من الشجر أول بروزه.',
  },
  {
    word: 'فرزدق',
    length: 5,
    difficulty: 'expert',
    category: 'أدب وتاريخ',
    hint: 'قطع العجين المستديرة الخبزية أو لقب الشاعر الأموي الشهير همام بن غالب',
    icon: '📜',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الفَرَزْدَق: الرغيف المتفتت المستدير، به لُقب الشاعر الفحل لجهامة وجهه.',
  },
  {
    word: 'شنظير',
    length: 5,
    difficulty: 'expert',
    category: 'لسان العرب',
    hint: 'السيئ الخلق الفاحش الغضب أو الرجل الغيور الشديد الأنفة والحمية',
    icon: '⚔️',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الشِّنْظِير: الشديد الغيرة السيئ الخلق في غضبه وأنفته.',
  },

  // ==========================================
  // 6-LETTER WORDS (6 أحرف)
  // ==========================================
  // --- 6 Letters: Easy ---
  {
    word: 'براكين',
    length: 6,
    difficulty: 'easy',
    category: 'طبيعة وتضاريس',
    hint: 'فوهات بركانية نشطة تقذف الحمم البركانية والرماد الملتهب والصخور',
    icon: '🌋',
    themeId: 'NATURE',
    dictionaryMeaning: 'البراكين: جمع بركان، الشقوق الجوفية القاذفة للصهارة والغازات.',
  },
  {
    word: 'طواحين',
    length: 6,
    difficulty: 'easy',
    category: 'تراث وعمارة',
    hint: 'منشآت قديمة ذات أذرع تدور بالرياح أو مساقط الماء لطحن الحبوب والقمح',
    icon: '💨',
    themeId: 'GENERAL',
    dictionaryMeaning: 'الطواحين: آلات مدارية تطحن الحبوب بواسطة أحجار صلبة.',
  },
  {
    word: 'أساطير',
    length: 6,
    difficulty: 'easy',
    category: 'أدب وتراث',
    hint: 'حكايات وقصص خيالية قديمة متوارثة تحكي مآثر الأبطال والآلهة المزعومة',
    icon: '📜',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الأساطير: الأحاديث والقصص الخرافية التي لا أصل لها.',
  },
  {
    word: 'عباقرة',
    length: 6,
    difficulty: 'easy',
    category: 'علوم ومعارف',
    hint: 'أشخاص يتميزون بذكاء استثنائي خارق وقدرات إبداعية فذة غير مسبوقة',
    icon: '🧠',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'العباقرة: أصحاب الذكاء النادر والنبوغ الفائق في الفكر والعلم.',
  },
  {
    word: 'فراديس',
    length: 6,
    difficulty: 'easy',
    category: 'طبيعة وقرآن',
    hint: 'بساتين وجنات خضراء غناء ملأى بالأشجار والثمار والأنهار والظلال',
    icon: '🌺',
    themeId: 'ISLAMIC',
    dictionaryMeaning: 'الفراديس: جمع فردوس، أعلى الجنات وأوسعها وأجملها روضاً.',
  },
  {
    word: 'ياسمين',
    length: 6,
    difficulty: 'easy',
    category: 'نباتات وعطور',
    hint: 'نبات زينة شهير ذو أزهار بيضاء فواحة العطر والشذى يزين الشرفات',
    icon: '🌼',
    themeId: 'NATURE',
    dictionaryMeaning: 'الياسمين: جنس شجيرات عطرية الزهر بيضاء أو صفراء زكية.',
  },
  {
    word: 'قياصرة',
    length: 6,
    difficulty: 'easy',
    category: 'تاريخ وحضارات',
    hint: 'أباطرة وملوك الروم والبيزنطيين القدماء أصحاب التيجان والسلطان',
    icon: '👑',
    themeId: 'HISTORY',
    dictionaryMeaning: 'القياصرة: جمع قيصر، لقب حكام إمبراطورية روما القديمة.',
  },

  // --- 6 Letters: Medium ---
  {
    word: 'سنديان',
    length: 6,
    difficulty: 'medium',
    category: 'نباتات وغابات',
    hint: 'شجر البلوط المعمر الضخم ذو الخشب المتين الصلب وثمار البلوط العتيقة',
    icon: '🌳',
    themeId: 'NATURE',
    dictionaryMeaning: 'السنديان: شجر حرجي معمر ضخم صلب الخشب واللحاء.',
  },
  {
    word: 'شلالات',
    length: 6,
    difficulty: 'medium',
    category: 'طبيعة ومياه',
    hint: 'مساقط مياه صخرية عظيمة تتدفق بهدير مدوٍ من المرتفعات نحو البحيرات',
    icon: '🌊',
    themeId: 'NATURE',
    dictionaryMeaning: 'الشلالات: تدفقات مائية عملاقة تهوي من حواف الجبال.',
  },
  {
    word: 'كهرمان',
    length: 6,
    difficulty: 'medium',
    category: 'معادن وتراث',
    hint: 'راتنج صمغي عضوي متحجر ذهبي اللون يصنع منه الخرز والمسابح الثمينة',
    icon: '📿',
    themeId: 'GENERAL',
    dictionaryMeaning: 'الكهرمان: صمغ شجري متحجر عسلي اللون يولد الكهرباء بالدلك.',
  },
  {
    word: 'قناديل',
    length: 6,
    difficulty: 'medium',
    category: 'تراث وعمارة',
    hint: 'مصابيح مضيئة معلقة تضاء بالزيت والفتيل أو الشموع في المساجد والقصور',
    icon: '🏮',
    themeId: 'HISTORY',
    dictionaryMeaning: 'القناديل: جمع قنديل، المصباح الزجاجي المعلق للاستصباح.',
  },
  {
    word: 'أراجيز',
    length: 6,
    difficulty: 'medium',
    category: 'شعر وأدب',
    hint: 'قصائد وأشعار من بحر الرجز العربي خفيفة الإيقاع والوزن يتغنى بها الحداة',
    icon: '🎼',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الأراجيز: مقطوعات شعرية منظومة على بحر الرجز المنشط للإبل.',
  },
  {
    word: 'طواويس',
    length: 6,
    difficulty: 'medium',
    category: 'كائنات وطيور',
    hint: 'طيور بديعة الجمال تنشر ريشها الملون الزاهي كالمروحة وتختال في مشيتها',
    icon: '🦚',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'الطواويس: جمع طاووس، الطائر ذو الريش الفاتن الموشى بالألوان.',
  },

  // --- 6 Letters: Hard ---
  {
    word: 'حيزبون',
    length: 6,
    difficulty: 'hard',
    category: 'معاجم قديمة',
    hint: 'العجوز المسنة أو الداهية الشديدة الحيلة والشكيمة في فصيح اللغة',
    icon: '👵',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الحَيْزَبُون: المرأة المسنة الشديدة، أو العجوز ذات الحيلة.',
  },
  {
    word: 'ديدبان',
    length: 6,
    difficulty: 'hard',
    category: 'تاريخ وفروسية',
    hint: 'الحارس والرقيب الساهر في برج المراقبة لحماية الحصن واستطلاع الأعداء',
    icon: '🏰',
    themeId: 'HISTORY',
    dictionaryMeaning: 'الدَّيْدَبَان: الطليعة والرقيب الحارس المشرف على مراقبة الطرق.',
  },
  {
    word: 'خندريس',
    length: 6,
    difficulty: 'hard',
    category: 'أدب ولغة',
    hint: 'اسم من أقدم أسماء الخمر العتيقة المعتقة في جرار الخزف في أشعار العرب',
    icon: '🏺',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الخَنْدَرِيس: القديمة العتيقة من الخمر والحنطة في المعاجم.',
  },
  {
    word: 'قراطيس',
    length: 6,
    difficulty: 'hard',
    category: 'قرآن وتراث',
    hint: 'الصحائف والكتب والأوراق التي يُكتب ويدوّن فيها العلم ذُكرت في القرآن',
    icon: '📜',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'القراطيس: جمع قرطاس، وهو ما يكتب فيه من ورق وجلد نقي.',
  },
  {
    word: 'سراديب',
    length: 6,
    difficulty: 'hard',
    category: 'عمارة وتاريخ',
    hint: 'ممرات وأنفاق أرضية مظلمة محفورة تحت القلاع والمباني القديمة',
    icon: '🗝️',
    themeId: 'HISTORY',
    dictionaryMeaning: 'السراديب: جمع سرداب، وهو البناء المحفور تحت وجه الأرض صيفاً.',
  },
  {
    word: 'سلاهبة',
    length: 6,
    difficulty: 'hard',
    category: 'تراث ولغة',
    hint: 'الخيل العتاق الطويلة الأعناق السريعة الجري كالسهم في الميدان',
    icon: '🐎',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'السلاهبة: الخيل الطوال المفرطة السرعة والرقة في اللحم.',
  },

  // --- 6 Letters: Expert ---
  {
    word: 'خنشليل',
    length: 6,
    difficulty: 'expert',
    category: 'لسان العرب',
    hint: 'الرجل الشجاع الخفيف الحركة الجريء أو السيف الحاد القاطع العتيد',
    icon: '⚔️',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الخَنْشَلِيل: الماضي في الأمور الشجاع الخفيف، والسيف الصارم.',
  },
  {
    word: 'عرندسة',
    length: 6,
    difficulty: 'expert',
    category: 'أمهات المعاجم',
    hint: 'الناقة الضخمة العظيمة الشديدة القوة والجلد أو الصخرة الراسية المنيفة',
    icon: '🐪',
    themeId: 'ANIMALS',
    dictionaryMeaning: 'العَرَنْدَسَة: الناقة الوثيقة الخلق الجريئة في سيرها.',
  },
  {
    word: 'عطودية',
    length: 6,
    difficulty: 'expert',
    category: 'غريب اللغة',
    hint: 'الداهية الشديدة أو العقبة الكؤود الوعرة في الجبل التي يصعب صعودها',
    icon: '⛰️',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العَطَوَّد والعطودية: الشاقة الصعبة الممتنعة من الأمور والدروب.',
  },
  {
    word: 'عفنججة',
    length: 6,
    difficulty: 'expert',
    category: 'القاموس المحيط',
    hint: 'الأخرق الجافي الضخم قليل الفطنة والتمييز في لسان العرب القديم',
    icon: '🗿',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العَفَنْجَج: الضخم اللئيم الجافي الأحمق العاجز عن التدبير.',
  },
  {
    word: 'قرقفان',
    length: 6,
    difficulty: 'expert',
    category: 'معاجم قديمة',
    hint: 'اسم للخمر الباردة المرعشة للبدن أو النمل الأحمر الطيار الصغير',
    icon: '🐜',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'القَرْقَفان: الخمر التي تُقَرْقِفُ شاربها بالرعدة لنشوتها.',
  },

  // ==========================================
  // 7-LETTER WORDS (7 أحرف)
  // ==========================================
  // --- 7 Letters: Easy ---
  {
    word: 'جغرافيا',
    length: 7,
    difficulty: 'easy',
    category: 'علوم ومعارف',
    hint: 'علم دراسة تضاريس الأرض وظواهرها الطبيعية وتوزيع السكان والبيئات',
    icon: '🗺️',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'الجغرافيا: علم وصف الأرض وتضاريسها ومناخاتها وسكانها.',
  },
  {
    word: 'إلكترون',
    length: 7,
    difficulty: 'easy',
    category: 'فيزياء وعلوم',
    hint: 'جسيم دون ذري سالب الشحنة يدور في مدارات حول نواة الذرة بسرعة هائلة',
    icon: '⚛️',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'الإلكترون: جسيم أولي يحمل الوحدة الأساسية للشحنة الكهربية السالبة.',
  },
  {
    word: 'خوارزمي',
    length: 7,
    difficulty: 'easy',
    category: 'علماء وتاريخ',
    hint: 'نسبة للعالم المسلم العبقري مؤسس علم الجبر ومصطلح الخوارزميات عالمياً',
    icon: '🧮',
    themeId: 'HISTORY',
    dictionaryMeaning: 'الخوارزمي: محمد بن موسى، صاحب كتاب الجبر والمقابلة ومبتكر الخوارزمية.',
  },
  {
    word: 'فسيفساء',
    length: 7,
    difficulty: 'easy',
    category: 'فنون وتراث',
    hint: 'فن زخرفي يجمع قطعاً حجرية صغيرة ملونة لتشكيل لوحات بديعة في المساجد',
    icon: '🎨',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الفسيفساء: فن ترصيع الحجارة والزجاج الملون في جدران وأرضيات الصروح.',
  },
  {
    word: 'ميكانيك',
    length: 7,
    difficulty: 'easy',
    category: 'علوم وتكنولوجيا',
    hint: 'فرع من فروع الفيزياء والهندسة يدرس القوى والحركة وعمل الآلات والمحركات',
    icon: '⚙️',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'الميكانيك: علم الآلات والقوى وحركة الأجسام المادية تحت التأثير.',
  },

  // --- 7 Letters: Medium ---
  {
    word: 'أندلسية',
    length: 7,
    difficulty: 'medium',
    category: 'تاريخ وحضارة',
    hint: 'نسبة إلى الحضارة الإسلامية الزاهرة في شبه جزيرة إيبيريا وقرطبة',
    icon: '🏰',
    themeId: 'HISTORY',
    dictionaryMeaning: 'الأندلسية: النسبة إلى بلاد الأندلس وحضارتها وثقافتها العريقة.',
  },
  {
    word: 'قسنطينة',
    length: 7,
    difficulty: 'medium',
    category: 'مدن وتاريخ',
    hint: 'مدينة الجسور المعلقة العريقة المشيدة فوق وادي الرمال في الشرق الجزائري',
    icon: '🌉',
    themeId: 'HISTORY',
    dictionaryMeaning: 'قسنطينة: مدينة جزائرية أثرية تشتهر بجسورها الشاهقة فوق الصخور.',
  },
  {
    word: 'تليسكوب',
    length: 7,
    difficulty: 'medium',
    category: 'فلك وأجهزة',
    hint: 'مرصد ومنظار فلكي بصري مكبر لرصد النجوم والمجرات السحيقة في الفضاء',
    icon: '🔭',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'التليسكوب: المقراب الفلكي الذي يجمع الضوء لرؤية الأجرام البعيدة.',
  },
  {
    word: 'مغناطيس',
    length: 7,
    difficulty: 'medium',
    category: 'فيزياء وطبيعة',
    hint: 'معدن أو حجر طبيعي يولد مجالاً قادراً على جذب الحديد وتوليد التيارات',
    icon: '🧲',
    themeId: 'SCIENCE',
    dictionaryMeaning: 'المغناطيس: حجر يجذب برادة الحديد وله قطبان شمالي وجنوبي.',
  },

  // --- 7 Letters: Hard ---
  {
    word: 'قسطنطين',
    length: 7,
    difficulty: 'hard',
    category: 'تاريخ وأباطرة',
    hint: 'الإمبراطور الروماني مؤسس القسطنطينية عاصمة الإمبراطورية البيزنطية',
    icon: '👑',
    themeId: 'HISTORY',
    dictionaryMeaning: 'قسطنطين: قيصر روماني حوّل العاصمة إلى بيزنطة وسماها باسمه.',
  },
  {
    word: 'قراميده',
    length: 7,
    difficulty: 'hard',
    category: 'عمارة وبناء',
    hint: 'قطع الطين المحروق المصففة بإحكام على أسطح المنازل لحمايتها من الأمطار',
    icon: '🏠',
    themeId: 'GENERAL',
    dictionaryMeaning: 'قراميده: الآجر المحروق لفرش الأسقف وصرف مياه الشتاء.',
  },
  {
    word: 'عنادلها',
    length: 7,
    difficulty: 'hard',
    category: 'طيور وشعر',
    hint: 'العنادل المغردة ذات الأصوات الشجية العذبة الصداحة بين رياض الأندلس',
    icon: '🐦',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العنادل: جمع عندليب، الطائر حسن التغريد والترجيع في الغناء.',
  },
  {
    word: 'منظومات',
    length: 7,
    difficulty: 'hard',
    category: 'شعر وبلاغة',
    hint: 'قصائد وأراجيز شعرية منظومة على بحور الشعر الفصيحة ذات قوافٍ محكمة',
    icon: '📜',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'المنظومات: جمع منظومة، وهي القصيدة أو المتن الشعري المنظوم.',
  },
  {
    word: 'صياهدها',
    length: 7,
    difficulty: 'hard',
    category: 'معاجم وبادية',
    hint: 'الصحاري والرمال الشديدة الحرارة والوهج وقت الظهيرة في قلب الهجير',
    icon: '🏜️',
    themeId: 'NATURE',
    dictionaryMeaning: 'الصياهد: جمع صيهد، وهو الموضع الشديد الحر الذي لا ظل فيه.',
  },

  // --- 7 Letters: Expert ---
  {
    word: 'عفنججية',
    length: 7,
    difficulty: 'expert',
    category: 'لسان العرب',
    hint: 'صفة الجفاء والغلظة وثقل الطبع وقلة الكياسة في فصيح كلام العرب الأوائل',
    icon: '📜',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العَفَنْجَجِيَّة: صفة الخرق والجهل والجفاء والبلادة في الخلق.',
  },
  {
    word: 'عرندسية',
    length: 7,
    difficulty: 'expert',
    category: 'أمهات المعاجم',
    hint: 'الشجاعة والبسالة والبطش البالغ الذي يقتلع الخصوم كالسيل الهادر',
    icon: '⚔️',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'العَرَنْدَسِيَّة: الشدة والصلابة البالغة المشتقة من الأسد العرندس.',
  },
  {
    word: 'خنادريس',
    length: 7,
    difficulty: 'expert',
    category: 'أدب وبلاغة',
    hint: 'الخمور القديمة جداً المعتقة لسنوات طوال في جرار الخزف العتيقة',
    icon: '🏺',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الخَنادرِيس: جمع خندريس، عتيق المشروب الذي طال مكثه في الدنان.',
  },
  {
    word: 'حيزبونة',
    length: 7,
    difficulty: 'expert',
    category: 'القاموس المحيط',
    hint: 'العجوز المسنة ذات الحيلة الشديدة والشكيمة الصعبة في فصيح اللغة',
    icon: '👵',
    themeId: 'LITERATURE',
    dictionaryMeaning: 'الحَيْزَبُونَة: تأنيث الحيزبون، العجوز الداهية الشديدة البأس.',
  },
];

// Compile quick lookup maps
export const TRAINING_BY_LENGTH_MAP: Map<number, TrainingWordItem[]> = new Map();
export const TRAINING_BY_DIFFICULTY_MAP: Map<DifficultyLevel, TrainingWordItem[]> = new Map();

// Group for fast querying
TRAINING_WORDS.forEach((item) => {
  // Enforce runtime verification that word.length is exactly item.length
  if (item.word.length !== item.length) {
    console.warn(`Word length mismatch for "${item.word}": expected ${item.length}, got ${item.word.length}`);
  }

  // Group by length
  const lenList = TRAINING_BY_LENGTH_MAP.get(item.length) || [];
  lenList.push(item);
  TRAINING_BY_LENGTH_MAP.set(item.length, lenList);

  // Group by difficulty
  const diffList = TRAINING_BY_DIFFICULTY_MAP.get(item.difficulty) || [];
  diffList.push(item);
  TRAINING_BY_DIFFICULTY_MAP.set(item.difficulty, diffList);
});

/**
 * Filter training questions with strict multi-criteria matching
 */
export function getFilteredTrainingWords(options: {
  length?: number; // 0 or undefined for any length
  difficulty?: DifficultyLevel | 'ALL';
  themeId?: string;
}): TrainingWordItem[] {
  const { length, difficulty, themeId } = options;

  let pool = TRAINING_WORDS;

  // 1. Filter by exact word length if specified and > 0
  if (length && length > 0) {
    pool = pool.filter((item) => item.length === length);
  }

  // 2. Filter by difficulty
  if (difficulty && difficulty !== 'ALL') {
    pool = pool.filter((item) => item.difficulty === difficulty);
  }

  // 3. Filter by theme
  if (themeId && themeId !== 'ALL') {
    const themeFiltered = pool.filter((item) => item.themeId === themeId);
    if (themeFiltered.length > 0) {
      pool = themeFiltered;
    }
  }

  // Fallback if filters yielded no words: soften theme first, then difficulty, but STRICTLY keep chosen length
  if (pool.length === 0) {
    if (length && length > 0) {
      pool = TRAINING_WORDS.filter((item) => item.length === length);
    } else {
      pool = TRAINING_WORDS;
    }
  }

  return pool;
}

/**
 * Get random training word matching exact length and difficulty
 */
export function getRandomTrainingWord(options: {
  length?: number;
  difficulty?: DifficultyLevel | 'ALL';
  themeId?: string;
}): TrainingWordItem {
  const pool = getFilteredTrainingWords(options);
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Clipboard formatters for training clues
 */
export function formatCopyHintOnly(item: TrainingWordItem): string {
  const diffInfo = DIFFICULTY_LABELS[item.difficulty]?.label || item.difficulty;
  return `💡 تلميح: ${item.hint}
🏷️ المجال: ${item.category}
🔤 عدد الحروف: ${item.length} أحرف
🎯 مستوى الصعوبة: ${diffInfo}
🎮 تدريب لعبة الورد العربي`;
}

export function formatCopyHintWithHelperLetters(item: TrainingWordItem): string {
  const diffInfo = DIFFICULTY_LABELS[item.difficulty]?.label || item.difficulty;
  const firstChar = item.word[0];
  const lastChar = item.word[item.word.length - 1];

  return `💡 تلميح: ${item.hint}
🏷️ المجال: ${item.category}
🔤 عدد الحروف: ${item.length} أحرف
🎯 مستوى الصعوبة: ${diffInfo}
✨ الحرف الأول: "${firstChar}"
🏁 الحرف الأخير: "${lastChar}"
🎮 تدريب لعبة الورد العربي`;
}

export function formatCopyHintWithAnswer(item: TrainingWordItem): string {
  const diffInfo = DIFFICULTY_LABELS[item.difficulty]?.label || item.difficulty;
  const meaning = item.dictionaryMeaning || item.hint;

  return `💡 تلميح: ${item.hint}
🏷️ المجال: ${item.category}
🔤 عدد الحروف: ${item.length} أحرف
🎯 مستوى الصعوبة: ${diffInfo}
✅ الإجابة الصحيحة: ${item.word}
📖 الشرح والمعجم: ${meaning}
🎮 تدريب لعبة الورد العربي`;
}
