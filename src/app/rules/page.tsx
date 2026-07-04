export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold text-brand-700">قوانين توقعات كأس العالم مع مفيد</h1>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">التسجيل</h2>
        <p className="text-brand-900/80">
          يتم التسجيل بالاسم والبريد الإلكتروني دون كلمة مرور. البريد الإلكتروني إلزامي ويُستخدم
          لربط بيانات الحساب والنقاط واستعادة حسابك إذا غيّرت الجهاز أو مسحت بيانات المتصفح.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">نظام النقاط (٥ نقاط كحد أقصى لكل مباراة)</h2>
        <ul className="list-inside list-disc space-y-2 text-brand-900/80">
          <li>توقع النتيجة مطابقاً تماماً: ٣ نقاط.</li>
          <li>في حال انتهت المباراة بتعادل وتوقعت تعادلاً بنتيجة مختلفة: نقطتان.</li>
          <li>في حال توقعت الفائز بشكل صحيح وكانت نتيجة أحد الفريقين مطابقة تماماً ونتيجة الفريق الآخر أقل أو أكثر بهدف واحد فقط: نقطتان.</li>
          <li>توقعت الفريق الفائز بشكل صحيح فقط دون مطابقة فرق الأهداف: نقطة واحدة.</li>
          <li>توقعت الفريق الخاسر للفوز: صفر نقاط.</li>
          <li>
            في الأدوار الإقصائية، إذا احتاجت المباراة لركلات الترجيح لتحديد الفائز (تعادل بعد ١٢٠
            دقيقة): من توقع الفريق الفائز فعلياً يحصل على نقطتين، من توقع تعادلاً يحصل على نقطة
            واحدة، ومن توقع الفريق الخاسر لا يحصل على شيء.
          </li>
          <li>توقعت أفضل لاعب في المباراة بشكل صحيح: نقطة إضافية.</li>
          <li>توقعت صاحب أول هدف في المباراة بشكل صحيح: نقطة إضافية.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">إغلاق التوقعات</h2>
        <p className="text-brand-900/80">
          يُغلق التسجيل والتعديل على توقعك قبل ٩٠ ثانية من بداية المباراة، ولا يمكن تقديم توقع
          جديد أو تعديل توقع موجود بعد ذلك.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">المباريات المنتهية مسبقاً</h2>
        <p className="text-brand-900/80">
          المباريات التي انتهت قبل تسجيلك تُحتسب بصفر نقاط للجميع، وتظهر نتائجها للعلم فقط.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">شروط المشاركة</h2>
        <ul className="list-inside list-disc space-y-2 text-brand-900/80">
          <li>صاحب أقل نقاط يحضر القهوة لصاحب أعلى نقاط.</li>
          <li>بمجرد مشاركتك في توقع واحد، لا يمكنك الانسحاب.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">الخصوصية وكشف الغش</h2>
        <p className="text-brand-900/80">
          نظراً لعدم وجود كلمات مرور، يتم حفظ سجل بعنوان IP والمتصفح والوقت عند التسجيل وعند كل
          توقع أو تعديل، وذلك فقط للكشف عن أي محاولة غش أو انتحال شخصية.
        </p>
      </section>

      <p className="mt-10 text-sm text-brand-900/60">
        هذه الفعالية للترفيه فقط بين الأصدقاء والزملاء، ولا تُدار كأداة مالية أو رهان.
      </p>
    </div>
  );
}
