"use strict";

const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");
const capsWarning = document.getElementById("capsWarning");
const loginStatus = document.getElementById("loginStatus");
const loginButton = document.getElementById("loginButton");

passwordToggle.hidden = false;
passwordToggle.addEventListener("click", () => {
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    passwordToggle.textContent = showPassword ? "隱藏" : "顯示";
    passwordToggle.setAttribute("aria-pressed", String(showPassword));
});
const updateCapsWarning = (event) => {
    capsWarning.hidden = !event.getModifierState("CapsLock");
};
passwordInput.addEventListener("keydown", updateCapsWarning);
passwordInput.addEventListener("keyup", updateCapsWarning);
passwordInput.addEventListener("blur", () => { capsWarning.hidden = true; });
loginForm.addEventListener("input", () => { loginStatus.hidden = true; });
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    // 尚未提供登入 API；不傳送或儲存帳密，也不模擬登入成功。
    loginStatus.textContent = "目前暫未開放線上登入，請稍後再試。";
    loginStatus.hidden = false;
});
loginButton.disabled = false;
