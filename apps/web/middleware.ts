import { NextResponse, type NextRequest } from 'next/server';

/**
 * توجيه UX فقط بناءً على كوكي `edham_role` (غير حسّاس).
 * الأمان الحقيقي يعتمد على JWT في الـ API — هذا فقط لتحسين تجربة التنقّل.
 */

type Role = 'CUSTOMER' | 'DRIVER' | 'SUPERVISOR' | 'ACCOUNTANT' | 'WORKSHOP';

const ROLES: readonly Role[] = ['CUSTOMER', 'DRIVER', 'SUPERVISOR', 'ACCOUNTANT', 'WORKSHOP'];

/** المسارات المحمية حسب الدور: prefix المسار → الدور المطلوب. */
const PROTECTED_PREFIXES: Record<string, Role> = {
  '/customer': 'CUSTOMER',
  '/driver': 'DRIVER',
  '/supervisor': 'SUPERVISOR',
  '/accountant': 'ACCOUNTANT',
  '/workshop': 'WORKSHOP',
};

/** صفحات المصادقة العامة التي يجب إبعاد المستخدم المسجّل عنها. */
const AUTH_PAGES: readonly string[] = ['/login', '/signup'];

function isRole(value: string | undefined): value is Role {
  return value !== undefined && (ROLES as readonly string[]).includes(value);
}

/** يرجع الدور المطلوب للمسار المحمي، أو null إذا كان المسار عاماً. */
function requiredRoleFor(pathname: string): Role | null {
  for (const [prefix, prefixRole] of Object.entries(PROTECTED_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return prefixRole;
    }
  }
  return null;
}

function homeFor(role: Role): string {
  return `/${role.toLowerCase()}`;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const roleCookie = request.cookies.get('edham_role')?.value;
  const role: Role | null = isRole(roleCookie) ? roleCookie : null;

  const requiredRole = requiredRoleFor(pathname);

  // مسار محمي
  if (requiredRole) {
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== requiredRole) {
      return NextResponse.redirect(new URL(homeFor(role), request.url));
    }
    return NextResponse.next();
  }

  // صفحات المصادقة — أبعِد المستخدم المسجّل إلى لوحته
  if (role && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * طابِق كل المسارات ما عدا:
     * - _next (ملفات Next الثابتة والصور المُحسّنة)
     * - الأصول الثابتة الشائعة والملفات ذات الامتداد
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml|.*\\.[^/]+$).*)',
  ],
};
