import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { MemberInfo, ProfileUpdate } from "../types/member";
import {
  getCurrentMember,
  loginGoogleMember,
  loginMember,
  MemberApiError,
  updateCurrentMember,
} from "../services/memberApi";

import { AuthContext, type AuthStatus } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentMember, setCurrentMember] = useState<MemberInfo | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem("token") ? "checking" : "guest",
  );
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  // ref 不觸發重畫，用版本號辨認舊請求，避免登出後被晚到回應登入。
  const version = useRef(0);
  function logout() {
    version.current += 1;
    localStorage.removeItem("token");
    setCurrentMember(null);
    setStatus("guest");
    setError("");
  }
  useEffect(() => {
    const requestVersion = ++version.current;
    const token = localStorage.getItem("token");
    const controller = new AbortController();
    if (!token) {
      return () => {
        version.current += 1;
      };
    }
    async function restore(token: string) {
      try {
        const member = await getCurrentMember(token, controller.signal);
        if (requestVersion !== version.current) return;
        setCurrentMember(member);
        setStatus("authenticated");
      } catch (failure) {
        if (controller.signal.aborted || requestVersion !== version.current)
          return;
        if (failure instanceof MemberApiError && failure.status === 401) {
          version.current += 1;
          localStorage.removeItem("token");
          setCurrentMember(null);
          setStatus("guest");
          setError(failure.message);
          return;
        }
        setCurrentMember(null);
        setStatus("error");
        setError(
          failure instanceof MemberApiError
            ? failure.message
            : "無法確認會員身分，請確認網路與後端服務後重試。",
        );
      }
    }
    void restore(token);
    return () => {
      controller.abort();
      version.current += 1;
    };
  }, [retryCount]);
  async function login(account: string, password: string) {
    const requestVersion = ++version.current;
    const result = await loginMember(account, password);
    if (requestVersion !== version.current)
      throw new Error("操作已取消，請重新登入。");
    localStorage.setItem("token", result.token);
    setCurrentMember(result.member);
    setStatus("authenticated");
    setError("");
  }
  async function updateProfile(input: ProfileUpdate) {
    const token = localStorage.getItem("token");
    if (!token) {
      logout();
      throw new Error("請重新登入。");
    }
    const requestVersion = version.current;
    try {
      const member = await updateCurrentMember(token, input);
      if (requestVersion !== version.current)
        throw new Error("登入狀態已變更，請重新確認資料。");
      setCurrentMember(member);
    } catch (failure) {
      if (
        requestVersion === version.current &&
        failure instanceof MemberApiError &&
        failure.status === 401
      ) {
        logout();
        setError(failure.message);
      }
      throw failure;
    }
  }
  function retry() {
    if (!localStorage.getItem("token")) {
      logout();
      return;
    }
    version.current += 1;
    setStatus("checking");
    setCurrentMember(null);
    setError("");
    setRetryCount((count) => count + 1);
  }

  async function loginWithGoogle(credential: string) {
    const requestVersion = ++version.current;
    const result = await loginGoogleMember(credential);
    if (requestVersion !== version.current) {
      throw new Error("操作已取消，請重新登入。");
    }
    localStorage.setItem("token", result.token);
    setCurrentMember(result.member);
    setStatus("authenticated");
    setError("");
  }
  return (
    <AuthContext.Provider
      value={{
        currentMember,
        status,
        error,
        login,
        loginWithGoogle,
        logout,
        retry,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
