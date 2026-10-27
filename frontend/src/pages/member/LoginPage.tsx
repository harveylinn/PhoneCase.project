import "../../styles/member/login.css";
import { useState, type SubmitEvent } from "react";

interface MemberInfo {
  id: number;
  account: string;
  name: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  member?: MemberInfo;
}

interface MeResponse {
  success: boolean;
  message?: string;
  member?: MemberInfo;
}

export default function LoginPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [currentMember, setCurrentMember] = useState<MemberInfo | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setResultMessage("");

    const trimmedAccount = account.trim();

    if (trimmedAccount === "" || password === "") {
      setResultMessage("請輸入帳號與密碼。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/member/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: trimmedAccount,
          password: password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || data.success !== true) {
        setResultMessage(data.message ?? "登入失敗，請稍後重試。");
        return;
      }

      if (typeof data.token !== "string" || data.token.trim() === "") {
        setResultMessage("登入回應缺少有效 Token，請稍後再試。");
        return;
      }

      localStorage.setItem("token", data.token);

      setResultMessage(data.message ?? "登入成功。");
    } catch {
      setResultMessage("無法完成登入，請確認網路與後端服務。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function checkCurrentMember() {
    if (isChecking) {
      return;
    }

    setResultMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      setCurrentMember(null);
      setResultMessage("尚未登入，請先登入。");
      return;
    }

    setIsChecking(true);

    try {
      const response = await fetch("/api/member/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        setCurrentMember(null);
        setResultMessage("登入已失效，請重新登入。");
        return;
      }

      const data: MeResponse = await response.json();

      if (!response.ok || data.success !== true) {
        setResultMessage(data.message ?? "無法確認會員身分。");
        return;
      }

      if (!data.member) {
        setResultMessage("會員資料回應不完整。");
        return;
      }

      setCurrentMember(data.member);

      setResultMessage(
        `身分確認成功:${data.member.name} (${data.member.account})`,
      );
    } catch {
      setResultMessage("無法確認會員身分，請確認網路與後端服務。");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#loginForm">
        跳至登入表單
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="PhoneCase 首頁">
          <span className="brand-mark" aria-hidden="true">
            P<span>·</span>
          </span>
          PhoneCase<span className="brand-dot">.</span>
        </a>
        <a className="home-link" href="/">
          <span aria-hidden="true">←</span> 返回首頁
        </a>
      </header>
      <main className="login-layout">
        <section className="form-panel" aria-labelledby="loginHeading">
          <div className="form-content">
            <span className="eyebrow">YOUR PERSONAL SPACE</span>
            <h1 id="loginHeading">
              會員登入<span className="welcome-dot">。</span>
            </h1>
            <form id="loginForm" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="account">帳號</label>
                <input
                  type="text"
                  id="account"
                  name="account"
                  autoComplete="username"
                  placeholder="請輸入會員帳號"
                  required
                  value={account}
                  onChange={(event) => setAccount(event.target.value)}
                />
              </div>
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">密碼</label>
                  <a href="./forget.html">忘記密碼？</a>
                </div>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="請輸入密碼"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    id="passwordToggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "隱藏" : "顯示"}
                  </button>
                </div>
                <p className="caps-warning" id="capsWarning" hidden>
                  大寫鎖定已開啟，請確認密碼大小寫。
                </p>
              </div>
              <button
                className="login-button"
                id="loginButton"
                type="submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? "登入中..." : "登入"}</span>
                <span>→</span>
              </button>
              <p
                className="form-status"
                id="loginStatus"
                hidden={!resultMessage}
              >
                {resultMessage}
              </p>
            </form>
            {/* 測試按鈕區 */}
            <button
              type="button"
              onClick={checkCurrentMember}
              disabled={isChecking || isSubmitting}
            >
              {isChecking ? "確認中..." : "確認登入身分"}
            </button>
            <p>
                {currentMember
                    ? `目前會員：${currentMember.name} (${currentMember.account})`
                    : "目前尚未確認會員身分"}
            </p>

            <div className="register-prompt">
              <span>還沒有帳號？</span>
              <a href="/register">
                註冊會員 <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <p>&copy; 2026 PhoneCase. 保留所有權利。</p>
        <span>YOUR CASE. YOUR STYLE.</span>
      </footer>
    </>
  );
}
