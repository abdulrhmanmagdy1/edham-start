import Link from 'next/link';

interface RoleLink {
  readonly href: string;
  readonly label: string;
}

const roles: readonly RoleLink[] = [
  { href: '/customer', label: 'العميل' },
  { href: '/driver', label: 'السائق' },
  { href: '/supervisor', label: 'المشرف' },
  { href: '/accountant', label: 'المحاسب' },
  { href: '/workshop', label: 'الورشة' },
];

export default function HomePage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-white px-6 py-16 text-center">
      <header className="flex flex-col items-center gap-3">
        <h1 className="text-4xl font-bold text-edham-black sm:text-5xl">
          إدهام للوجستيات
        </h1>
        <p className="max-w-xl text-base text-edham-black/70">
          نظام لوجستي متكامل لسلسلة التبريد والنقل — اختر دورك للمتابعة
        </p>
        <span className="h-1 w-20 rounded-full bg-edham-red" aria-hidden="true" />
      </header>

      <nav aria-label="الأدوار" className="w-full max-w-2xl">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {roles.map((role) => (
            <li key={role.href}>
              <Link
                href={role.href}
                className="flex items-center justify-center rounded-xl border border-edham-black/10 bg-white px-6 py-5 text-lg font-medium text-edham-black shadow-sm transition-colors hover:border-edham-red hover:text-edham-red"
              >
                {role.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              className="flex items-center justify-center rounded-xl bg-edham-black px-6 py-5 text-lg font-medium text-white shadow-sm transition-colors hover:bg-edham-red"
            >
              تسجيل الدخول
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
