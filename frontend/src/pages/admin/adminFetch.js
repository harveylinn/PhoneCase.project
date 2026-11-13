// 後台 API 請求：自動帶入會員登入 token（localStorage 'token'，與商城會員登入共用）
// 回應 401（未登入 / 登入失效）或 403（不是管理員）時發出事件，由 AdminLayout 顯示登入提示
export const ADMIN_AUTH_EVENT = 'admin-auth-failed';

export async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EVENT, { detail: response.status }));
  }
  return response;
}
