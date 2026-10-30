type ReturnLocation = { pathname: string; search: string; hash: string };
const DEFAULT_RETURN_TO = '/';
const BASE_URL = 'https://return.invalid';

// 目的地來自網址，須驗證後才交給 Router，避免外站跳轉及驗證頁循環。
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes('\\') || [...decoded].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return null;
    const url = new URL(value, BASE_URL);
    if (url.origin !== BASE_URL) return null;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith('//')) return null;
    const normalizedPath = pathname.replace(/\/+$/, '').toLowerCase();
    if (normalizedPath === '/login' || normalizedPath === '/register') return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function getReturnTo(search: string): string {
  return safeReturnTo(new URLSearchParams(search).get('returnTo')) ?? DEFAULT_RETURN_TO;
}

export function getAuthUrl(page: '/login' | '/register', destination?: string | null): string {
  const safe = safeReturnTo(destination);
  return safe ? page + '?' + new URLSearchParams({ returnTo: safe }).toString() : page;
}

export function getLoginUrl(location: ReturnLocation): string {
  // 驗證頁沿用既有目的地，不將登入或註冊頁記為原頁。
  const path = location.pathname.replace(/\/+$/, '').toLowerCase();
  const destination = path === '/login' || path === '/register'
    ? new URLSearchParams(location.search).get('returnTo')
    : location.pathname + location.search + location.hash;
  return getAuthUrl('/login', destination);
}
