import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'إدهام - نظام إدارة النقل المبرد',
  description:
    'إدهام للوجستيات — نظام متكامل لإدارة عمليات النقل المبرد والمجمد مع تتبع مباشر ومراقبة سلسلة التبريد وفواتير إلكترونية متوافقة مع ZATCA.',
  openGraph: {
    title: 'إدهام - نظام إدارة النقل المبرد',
    description:
      'نظام إدهام اللوجستي المتكامل لإدارة النقل المبرد والمجمد مع تتبع مباشر ومراقبة سلسلة التبريد.',
    type: 'website',
  },
};

const services: ReadonlyArray<{ icon: string; title: string; lines: readonly [string, string] }> = [
  {
    icon: '❄️',
    title: 'نقل مبرد',
    lines: ['نقل البضائع الحساسة ضمن نطاق حراري من 2° إلى 8°.', 'حفاظ تام على جودة المنتجات الطازجة طوال الرحلة.'],
  },
  {
    icon: '🧊',
    title: 'نقل مجمد',
    lines: ['شحنات مجمدة عند درجات حرارة أقل من -18°.', 'أسطول مجهز للحفاظ على التجميد العميق دون انقطاع.'],
  },
  {
    icon: '📍',
    title: 'تتبع مباشر',
    lines: ['متابعة موقع الشحنة لحظة بلحظة عبر GPS.', 'تنبيهات فورية عند أي انحراف في سلسلة التبريد.'],
  },
];

const features: ReadonlyArray<{ icon: string; title: string }> = [
  { icon: '🚛', title: 'أسطول حديث' },
  { icon: '🛰️', title: 'تتبع GPS مباشر' },
  { icon: '🧾', title: 'فواتير إلكترونية ZATCA' },
  { icon: '📊', title: 'تقارير Cold Chain' },
];

const footerLinks: ReadonlyArray<string> = ['من نحن', 'شروط الاستخدام', 'سياسة الخصوصية', 'تواصل معنا'];

const socialIcons: ReadonlyArray<{ label: string; glyph: string }> = [
  { label: 'تويتر', glyph: '𝕏' },
  { label: 'لينكدإن', glyph: 'in' },
  { label: 'إنستغرام', glyph: '◎' },
];

export default function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-white text-edham-black">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="إدهام للوجستيات" width={40} height={40} className="h-10 w-10 object-contain" />
            <span className="text-lg font-bold text-edham-black sm:text-xl">إدهام</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
            <a href="#" className="transition hover:text-edham-red">الرئيسية</a>
            <a href="#services" className="transition hover:text-edham-red">خدماتنا</a>
            <a href="#contact" className="transition hover:text-edham-red">تواصل</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-edham-black transition hover:bg-neutral-100 sm:px-4"
            >
              تسجيل دخول
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-edham-red px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 sm:px-4"
            >
              طلب خدمة
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-edham-black text-white">
        {/* Geometric shapes */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-edham-red/20 blur-3xl" />
          <div className="absolute top-1/3 -right-16 h-72 w-72 rotate-45 bg-edham-red/10" />
          <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full border border-white/10" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-32">
          <span className="mb-6 inline-block rounded-full border border-edham-red/40 bg-edham-red/10 px-4 py-1.5 text-xs font-semibold text-white sm:text-sm">
            سلسلة تبريد موثوقة · نقل احترافي
          </span>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            نظام إدهام اللوجستي المتكامل
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg">
            منصة واحدة لإدارة عمليات النقل المبرد والمجمد من الطلب حتى التسليم — تتبع مباشر، مراقبة دقيقة لدرجات الحرارة،
            وفواتير إلكترونية متوافقة مع ZATCA.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-lg bg-edham-red px-8 py-3.5 text-base font-semibold text-white transition hover:bg-red-700 sm:w-auto"
            >
              ابدأ الآن
            </Link>
            <Link
              href="/login"
              className="w-full rounded-lg border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              تسجيل دخول
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-edham-black sm:text-4xl">خدماتنا</h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-500">
            حلول نقل مبرد ومجمد مصممة للحفاظ على جودة شحنتك في كل مرحلة.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-edham-red/40 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-2xl">
                <span aria-hidden="true">{s.icon}</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-edham-black">{s.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-500">{s.lines[0]}</p>
              <p className="text-sm leading-relaxed text-neutral-500">{s.lines[1]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="bg-neutral-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-edham-red/10 text-2xl">
                  <span aria-hidden="true">{f.icon}</span>
                </div>
                <p className="text-sm font-semibold text-edham-black sm:text-base">{f.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="bg-edham-black py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-4xl">هل تحتاج لخدمة نقل مبرد؟</h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-300">
            انضم إلى إدهام للوجستيات وابدأ إدارة شحناتك المبردة والمجمدة باحترافية.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-edham-red px-10 py-4 text-lg font-semibold text-white transition hover:bg-red-700"
          >
            سجل الآن
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer id="contact" className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Image src="/logo.png" alt="إدهام للوجستيات" width={36} height={36} className="h-9 w-9 object-contain" />
                <span className="text-lg font-bold text-edham-black">إدهام للوجستيات</span>
              </div>
              <p className="text-sm text-neutral-500">السجل التجاري: 7003941213</p>
            </div>

            <nav className="md:justify-self-center">
              <ul className="space-y-2 text-sm text-neutral-600">
                {footerLinks.map((label) => (
                  <li key={label}>
                    <a href="#" className="transition hover:text-edham-red">{label}</a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="md:justify-self-end">
              <p className="mb-3 text-sm font-semibold text-edham-black">تابعنا</p>
              <div className="flex gap-3">
                {socialIcons.map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-sm font-semibold text-neutral-600 transition hover:border-edham-red hover:text-edham-red"
                  >
                    <span aria-hidden="true">{s.glyph}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-neutral-200 pt-6 text-center text-sm text-neutral-400">
            © 2026 إدهام للوجستيات. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
