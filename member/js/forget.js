"use strict";

(() => {
    const form = document.getElementById("forgetForm");
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    const status = document.getElementById("resetStatus");
    let touched = false;

    const validateEmail = () => {
        let message = "";
        if (!emailInput.value.trim()) {
            message = "請輸入註冊電子郵件。";
        } else if (emailInput.validity.typeMismatch) {
            message = "請輸入有效的電子郵件地址。";
        }
        emailError.textContent = message;
        emailError.hidden = !message;
        emailInput.setAttribute("aria-invalid", String(Boolean(message)));
        return !message;
    };
    emailInput.addEventListener("blur", () => {
        touched = true;
        validateEmail();
    });
    emailInput.addEventListener("input", (event) => {
        if (event.isComposing) return;
        status.hidden = true;
        if (touched) validateEmail();
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        touched = true;
        if (!validateEmail()) {
            status.hidden = true;
            emailInput.focus();
            return;
        }
        // 尚未提供密碼重設 API；不送出郵件、不儲存電子郵件。
        status.textContent = "密碼重設服務尚未開放，目前不會寄送郵件，請稍後再試。";
        status.hidden = false;
    });
    form.noValidate = true;
    document.getElementById("resetButton").disabled = false;
})();
