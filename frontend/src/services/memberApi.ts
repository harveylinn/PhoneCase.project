import type { MemberInfo, ProfileUpdate } from '../types/member';

export class MemberApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isMember(value: unknown): value is MemberInfo {
  return isObject(value) && typeof value.id === 'number'
    && typeof value.account === 'string' && typeof value.name === 'string'
    && typeof value.email === 'string'
    && (typeof value.phone === 'string' || value.phone === null)
    && (typeof value.defaultAddress === 'string' || value.defaultAddress === null)
    && (typeof value.createdAt === 'string' || value.createdAt === null)
    && (typeof value.updatedAt === 'string' || value.updatedAt === null);
}
// 網路錯誤不等於 token 失效。保留 HTTP 狀態供 Provider 判斷 401 / 403。
async function readResponse(response: Response) {
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new MemberApiError('後端回應格式不正確，請稍後重試。', response.status); }
  if (!response.ok || !isObject(data) || data.success !== true) {
    let message = '無法完成會員操作，請稍後重試。';
    if (response.status === 401) message = '登入已失效，請重新登入。';
    if (response.status === 403) message = '權限不足，無法執行此操作。';
    if (isObject(data) && typeof data.message === 'string') message = data.message;
    if (response.status === 403) message = '權限不足：' + message;
    throw new MemberApiError(message, response.status);
  }
  return data;
}
export async function loginMember(account: string, password: string) {
  const data = await readResponse(await fetch('/api/member/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, password }),
  }));
  if (typeof data.token !== 'string' || !data.token.trim() || !isMember(data.member)) {
    throw new Error('登入回應缺少有效 token 或會員資料。');
  }
  return { token: data.token, member: data.member };
}
export async function getCurrentMember(token: string, signal?: AbortSignal) {
  const data = await readResponse(await fetch('/api/member/me', {
    headers: { Authorization: `Bearer ${token}` }, signal,
  }));
  if (!isMember(data.member)) throw new Error('會員資料格式不正確。');
  return data.member;
}
export async function updateCurrentMember(token: string, input: ProfileUpdate) {
  const data = await readResponse(await fetch('/api/member/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  }));
  if (!isMember(data.member)) throw new Error('會員資料格式不正確。');
  return data.member;
}
