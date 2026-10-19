import "../../styles/member/login.css";



export default function LoginPage(){
    return (<>
         <a className="skip-link" href="#loginForm">跳至登入表單</a>
    <header className="site-header">
        <a className="brand" href="../index.html" aria-label="PhoneCase 首頁"><span className="brand-mark"
                aria-hidden="true">P<span>·</span></span>PhoneCase<span className="brand-dot">.</span></a>
        <a className="home-link" href="../index.html"><span aria-hidden="true">←</span> 返回首頁</a>
    </header>
    <main className="login-layout">
        <section className="form-panel" aria-labelledby="loginHeading">
            <div className="form-content">
                <span className="eyebrow">YOUR PERSONAL SPACE</span>
                <h1 id="loginHeading">會員登入<span className="welcome-dot">。</span></h1>
                <form id="loginForm" action="#" method="post">
                    <div className="form-group">
                        <label htmlFor="account">帳號</label>
                        <input type="text" id="account" name="account" autoComplete="username" placeholder="請輸入會員帳號"
                            required />
                    </div>
                    <div className="form-group">
                        <div className="label-row"><label htmlFor="password">密碼</label><a href="./forget.html">忘記密碼？</a></div>
                        <div className="password-field">
                            <input type="password" id="password" name="password" autoComplete="current-password"
                                placeholder="請輸入密碼" required />
                            <button className="password-toggle" type="button" id="passwordToggle" aria-controls="password"
                                aria-pressed="false" hidden>顯示</button>
                        </div>
                        <p className="caps-warning" id="capsWarning" hidden>大寫鎖定已開啟，請確認密碼大小寫。</p>
                    </div>
                    <button className="login-button" id="loginButton" type="submit" disabled><span>登入</span><span
                            aria-hidden="true">→</span></button>
                    <p className="form-status" id="loginStatus" role="status" aria-live="polite" hidden></p>
                </form>
                <div className="register-prompt"><span>還沒有帳號？</span><a href="./register.html">註冊會員 <span
                            aria-hidden="true">↗</span></a></div>
            </div>
        </section>
    </main>
    <footer className="site-footer">
        <p>&copy; 2026 PhoneCase. 保留所有權利。</p><span>YOUR CASE. YOUR STYLE.</span>
    </footer>
    </>)
}
