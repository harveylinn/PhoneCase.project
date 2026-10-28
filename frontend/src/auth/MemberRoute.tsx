import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
export default function MemberRoute({ children }: { children: ReactNode }) {
  const { status, error, retry, logout } = useAuth();
  if (status === 'checking') return <main className="container"><p>正在確認會員身分…</p></main>;
  if (status === 'error') return <main className="container"><p>{error}</p><button onClick={retry}>重新確認</button> <button onClick={logout}>清除登入並返回登入頁</button></main>;
  if (status === 'guest') return <Navigate to="/login" replace />;
  return children;
}
