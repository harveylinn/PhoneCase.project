import "../../styles/member/login.css";
import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { getAuthUrl, getReturnTo } from "../../utils/authRedirect";
import { useAuth } from "../../auth/useAuth";

export default function LoginPage() {
  const { login, status, error, retry } = useAuth();
  const location = useLocation();
  const destination = getReturnTo(location.search);
  const navigationState: unknown = location.state;
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resultMessage, setResultMessage] = useState(() => {
    if (typeof navigationState === "object" && navigationState !== null
      && "registrationSuccess" in navigationState && navigationState.registrationSuccess === true) {
      return "註冊成功，請使用帳號與密碼登入。";
    }
    return "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isChecking = status === 'checking';
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || isChecking) return;
    setResultMessage("");
    if (!account.trim() || !password) { setResultMessage("請輸入帳號與密碼。"); return; }
    setIsSubmitting(true);
    try {
      await login(account.trim(), password);
      setPassword("");
    } catch (failure) {
      setResultMessage(failure instanceof Error && !(failure instanceof TypeError) ? failure.message : "無法完成登入，請確認網路與後端服務。");
    } finally { setIsSubmitting(false); }
  }
  if (status === 'authenticated') return <Navigate to={destination} replace />;
  return (
    <div className="member-login">
      <a className="skip-link" href="#loginForm">
        跳至登入表單
      </a>
      <main className="login-layout">
        <section className="form-panel">
          <div className="form-content">
            <span className="eyebrow">YOUR PERSONAL SPACE</span>
            <h1 id="loginHeading">
              會員登入<span className="welcome-dot">。</span>
            </h1>
            {isChecking && <p>正在確認會員身分…</p>}
            {error && <p>{error}</p>}
            {status === 'error' && <button type="button" onClick={retry}>重新確認身分</button>}
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
                disabled={isSubmitting || isChecking}
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
            <div className="register-prompt">
              <span>還沒有帳號？</span>
              <Link to={getAuthUrl("/register", destination)}>
                註冊會員 <span>↗</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <p>&copy; 2026 PhoneCase. 保留所有權利。</p>
        <span>YOUR CASE. YOUR STYLE.</span>
      </footer>
    </div>
  );
}
