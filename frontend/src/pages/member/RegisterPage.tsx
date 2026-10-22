import { useState, type SubmitEvent } from "react";
import "../../styles/member/register.css";

interface RegisterResponse {
  success: boolean;
  message: string;
  memberId?: number;
  errors?: {
    account?: string;
    password?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
}

export default function RegisterPage() {
  const [account, setAccount] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [nameError, setNameError] = useState("");
  const [telError, setTelError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClear() {
    setAccount("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setResultMessage("");
    setName("");
    setTel("");
    setAccountError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setNameError("");
    setTelError("");
    setEmailError("");
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }
    setResultMessage("");
    //欄位資料驗證
    const trimmedAccount = account.trim();
    const trimmedName = name.trim();
    const trimmedTel = tel.trim();
    const trimmedEmail = email.trim();

    const nextAccountError = trimmedAccount === "" ? "請輸入帳號。" : "";

    const nextPasswordError = password.length < 8 ? "密碼至少需要8字元。" : "";

    const nextConfirmPasswordError =
      confirmPassword === ""
        ? "請再次輸入密碼"
        : confirmPassword !== password
          ? "兩次輸入的密碼不一致"
          : "";

    const nextNameError = trimmedName === "" ? "請輸入姓名" : "";

    //檢查電話號碼格式
    const telCharactersValid = /^\+?[0-9-]+$/.test(trimmedTel);
    const telDigits = trimmedTel.replace(/\D/g, "");

    const nextTelError =
      trimmedTel === ""
        ? "請輸入電話。"
        : !telCharactersValid || telDigits.length < 7 || telDigits.length > 15
          ? "請輸入有效電話。須包含7~15位數字。"
          : "";

    //檢查信箱欄位基本格式
    const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    const nextEmailError =
      trimmedEmail === ""
        ? "請輸入電子郵件。"
        : !emailFormatValid
          ? "請輸入有效的電子郵件格式。"
          : "";
    setAccountError(nextAccountError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setNameError(nextNameError);
    setTelError(nextTelError);
    setEmailError(nextEmailError);

    if (
      nextAccountError ||
      nextPasswordError ||
      nextConfirmPasswordError ||
      nextNameError ||
      nextTelError ||
      nextEmailError
    ) {
      return;
    }

    //使用者註冊資料
    const registerData = {
      account: trimmedAccount,
      password: password,
      name: trimmedName,
      phone: trimmedTel,
      email: trimmedEmail,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/member/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok || data.success !== true) {
        //後端若有提供欄位錯誤，就顯示在對應欄位下方。
        //符號??表示：null 或undefined時 使用右邊值(空字串)
        setAccountError(data.errors?.account ?? "");
        setPasswordError(data.errors?.password ?? "");
        setNameError(data.errors?.name ?? "");
        setTelError(data.errors?.phone ?? "");
        setEmailError(data.errors?.email ?? "");

        setResultMessage(
          data.message ?? `註冊失敗，HTTP狀態碼:${response.status}`,
        );

        return;
      }

      //清空表單後，再顯示成功訊息。
      handleClear();
      setResultMessage(data.message ?? "註冊成功，請登入");
    } catch {
      setResultMessage(
        "無法取得有效回應，請確認網路與後端服務，再確認註冊結果",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#registerForm">
        跳至註冊表單
      </a>
      <header className="site-header">
        <a className="back-link" href="/login">
          <span>←</span> 返回登入
        </a>
      </header>
      <main className="register-layout">
        <section className="register-container">
          <span className="eyebrow">JOIN PHONECASE</span>
          <h1 id="registerHeading">
            建立你的帳號<span>。</span>
          </h1>
          <p className="form-intro">
            歡迎加入！請填寫以下資料，所有欄位皆為必填。
          </p>
          <form id="registerForm" onSubmit={handleSubmit} noValidate>
            <fieldset id="registerFields" disabled={isSubmitting}>
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
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                  />
                  <span
                    className="error-message"
                    id="accountError"
                    hidden={!accountError}
                  >
                    {accountError}
                  </span>
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
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      id="passwordToggle"
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
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      id="confirmPasswordToggle"
                      hidden
                    >
                      顯示
                    </button>
                  </div>
                  <span
                    className="caps-warning"
                    id="confirmPasswordCapsWarning"
                    hidden
                  >
                    大寫鎖定已開啟。
                  </span>
                  <span
                    className="error-message"
                    id="confirmPasswordError"
                    hidden={!confirmPasswordError}
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
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <span
                    className="error-message"
                    id="nameError"
                    hidden={!nameError}
                  >
                    {nameError}
                  </span>
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
                    value={tel}
                    onChange={(event) => setTel(event.target.value)}
                  />
                  <span className="field-hint" id="telHint">
                    7–15 位數字，可包含國碼及連字號。
                  </span>
                  <span
                    className="error-message"
                    id="telError"
                    hidden={!telError}
                  >
                    {telError}
                  </span>
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
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <span
                    className="error-message"
                    id="emailError"
                    hidden={!emailError}
                  >
                    {emailError}
                  </span>
                </div>
              </div>
              <div className="form-actions">
                <button className="submit-button" type="submit" id="submitBtn">
                  <span id="submitLabel">
                    {isSubmitting ? "送出中" : "建立帳號"}
                  </span>
                  <span>→</span>
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
            <p className="form-result" id="result" hidden={!resultMessage}>
              {resultMessage}
            </p>
          </form>
          <p className="login-prompt">
            已經有帳號了？{" "}
            <a href="/login">
              前往登入 <span>↗</span>
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
