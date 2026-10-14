import { useState,type SubmitEvent} from "react";
import "../../styles/member/register.css";

export default function RegisterPage() {
  const [account, setAccount] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [name,setName] = useState("");
  const [tel, setTel] = useState("");

  function handleClear() {
    setAccount("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setPasswordError("");
    setConfirmPasswordError("");
    setResultMessage("");
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setResultMessage("");

    const nextPasswordError = 
      password.length < 8 ? "密碼至少需要8字元。" : "";

    const nextConfirmPasswordError =
      confirmPassword === "" 
        ? "請再次輸入密碼"
        :confirmPassword !== password
          ? "兩次輸入的密碼不一致"
          : "";
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);

    if(nextPasswordError || nextConfirmPasswordError) {
      return;
    }

    setResultMessage("密碼驗證通過，目前尚未送出註冊。")

    

  }

  return (
    <>
      <a className="skip-link" href="#registerForm">
        跳至註冊表單
      </a>
      <header className="site-header">
        <a className="brand" href="../index.html" aria-label="PhoneCase 首頁">
          <span className="brand-mark" aria-hidden="true">
            P<span>·</span>
          </span>
          PhoneCase<span className="brand-dot">.</span>
        </a>
        <a className="back-link" href="./login.html">
          <span aria-hidden="true">←</span> 返回登入
        </a>
      </header>
      <main className="register-layout">
        <section
          className="register-container"
          aria-labelledby="registerHeading"
        >
          <span className="eyebrow">JOIN PHONECASE</span>
          <h1 id="registerHeading">
            建立你的帳號<span>。</span>
          </h1>
          <p className="form-intro">
            歡迎加入！請填寫以下資料，所有欄位皆為必填。
          </p>
          <form id="registerForm" onSubmit={handleSubmit} noValidate>
            <fieldset id="registerFields">
              <legend className="sr-only">會員註冊資料</legend>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="account">帳號</label>
                  <input
                    type="text"
                    id="account"
                    name="account"
                    placeholder="請輸入會員帳號"
                    autoComplete="username"
                    required
                    aria-describedby="accountError"
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                  />
                  <span
                    className="error-message"
                    id="accountError"
                    hidden
                  ></span>
                </div>
                <div className="form-group">
                  <label htmlFor="password">密碼</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="請設定密碼"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      aria-describedby="passwordHint passwordError passwordCapsWarning"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      id="passwordToggle"
                      // aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                      aria-controls="password"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? "隱藏密碼" : "顯示密碼"}
                    </button>
                  </div>
                  <span className="field-hint" id="passwordHint">
                    至少 8 個字元。
                  </span>
                  <span
                    className="caps-warning"
                    id="passwordCapsWarning"
                    role="status"
                    hidden
                  >
                    大寫鎖定已開啟。
                  </span>
                  <span
                    className="error-message"
                    id="passwordError"
                    hidden={!passwordError}
                  >
                    {passwordError}
                  </span>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">確認密碼</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="請再次輸入密碼"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      aria-describedby="confirmPasswordError confirmPasswordCapsWarning"
                      aria-invalid={Boolean(confirmPasswordError)}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      id="confirmPasswordToggle"
                      aria-label="顯示確認密碼"
                      aria-controls="confirmPassword"
                      aria-pressed="false"
                      hidden
                    >
                      顯示
                    </button>
                  </div>
                  <span
                    className="caps-warning"
                    id="confirmPasswordCapsWarning"
                    role="status"
                    hidden
                  >
                    大寫鎖定已開啟。
                  </span>
                  <span
                    className="error-message"
                    id="confirmPasswordError"
                    hidden={!confirmPasswordError}
                    aria-live="polite"
                  >
                    {confirmPasswordError}
                  </span>
                </div>
                <div className="form-group">
                  <label htmlFor="name">姓名</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="請輸入姓名"
                    autoComplete="name"
                    required
                    aria-describedby="nameError"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <span className="error-message" id="nameError" hidden></span>
                </div>
                <div className="form-group">
                  <label htmlFor="tel">電話</label>
                  <input
                    type="tel"
                    id="tel"
                    name="tel"
                    placeholder="例：0912345678"
                    autoComplete="tel"
                    required
                    aria-describedby="telHint telError"
                    value={tel}
                    onChange={(event) =>setTel(event.target.value)}
                  />
                  <span className="field-hint" id="telHint">
                    7–15 位數字，可包含國碼及連字號。
                  </span>
                  <span className="error-message" id="telError" hidden></span>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="email">電子郵件</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@email.com"
                    autoComplete="email"
                    required
                    aria-describedby="emailError"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <span className="error-message" id="emailError" hidden></span>
                </div>
              </div>
              <div className="form-actions">
                <button
                  className="submit-button"
                  type="submit"
                  id="submitBtn"
                >
                  <span id="submitLabel">建立帳號</span>
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  className="reset-button"
                  type="button"
                  onClick={handleClear}
                >
                  清除
                </button>
              </div>
            </fieldset>
            <p
              className="form-result"
              id="result"
              role="status"
              aria-live="polite"
              hidden={!resultMessage}
            >
              {resultMessage}
            </p>
          </form>
          <p className="login-prompt">
            已經有帳號了？{" "}
            <a href="./login.html">
              前往登入 <span aria-hidden="true">↗</span>
            </a>
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <p>&copy; 2026 PhoneCase. 保留所有權利。</p>
        <span>MADE FOR YOUR EVERYDAY</span>
      </footer>
    </>
  );
}
