"use strict";

(() => {
    const form = document.getElementById("registerForm");
    const fieldNames = ["account", "password", "confirmPassword", "name", "email", "tel"];
    const fields = Object.fromEntries(fieldNames.map((key) => [key, document.getElementById(key)]));
    const fieldset = document.getElementById("registerFields");
    const submitButton = document.getElementById("submitBtn");
    const submitLabel = document.getElementById("submitLabel");
    const result = document.getElementById("result");
    const touched = new Set();
    let submitting = false;
    let completed = false;

    const setResult = (message, state) => {
        result.textContent = message;
        result.dataset.state = state;
        result.hidden = false;
    };
    const validateField = (key) => {
        const field = fields[key];
        const value = key.includes("assword") ? field.value : field.value.trim();
        let message = "";
        if (!value) {
            message = `請填寫${{ account: "帳號", password: "密碼", confirmPassword: "確認密碼", name: "姓名", email: "電子郵件", tel: "電話" }[key]}。`;
        } else if (key === "password" && value.length < field.minLength) {
            message = `密碼至少需要 ${field.minLength} 個字元。`;
        } else if (key === "confirmPassword" && value !== fields.password.value) {
            message = "兩次輸入的密碼不一致。";
        } else if (key === "email" && field.validity.typeMismatch) {
            message = "請輸入有效的電子郵件地址。";
        } else if (key === "tel" && !/^\+?[\d\s()-]+$/.test(value)) {
            message = "電話請使用數字，可包含 +、空格、括號或連字號。";
        } else if (key === "tel" && !/^\d{7,15}$/.test(value.replace(/\D/g, ""))) {
            message = "請輸入 7 至 15 位數字的電話號碼。";
        }
        const error = document.getElementById(`${key}Error`);
        error.textContent = message;
        error.hidden = !message;
        field.setAttribute("aria-invalid", String(Boolean(message)));
        return !message;
    };

    fieldNames.forEach((key) => {
        fields[key].addEventListener("blur", () => {
            if (completed || submitting) return;
            touched.add(key);
            validateField(key);
        });
        fields[key].addEventListener("input", (event) => {
            if (event.isComposing || submitting) return;
            if (touched.has(key)) validateField(key);
            if (key === "password" && touched.has("confirmPassword")) validateField("confirmPassword");
            result.hidden = true;
            completed = false;
            submitButton.disabled = submitting;
            submitLabel.textContent = submitting ? "註冊中…" : "建立帳號";
        });
    });

    ["password", "confirmPassword"].forEach((key) => {
        const toggle = document.getElementById(`${key}Toggle`);
        toggle.hidden = false;
        toggle.addEventListener("click", () => {
            const showPassword = fields[key].type === "password";
            fields[key].type = showPassword ? "text" : "password";
            toggle.textContent = showPassword ? "隱藏" : "顯示";
            toggle.setAttribute("aria-pressed", String(showPassword));
        });
        const capsWarning = document.getElementById(`${key}CapsWarning`);
        const updateCapsWarning = (event) => {
            capsWarning.hidden = !event.getModifierState("CapsLock");
        };
        fields[key].addEventListener("keydown", updateCapsWarning);
        fields[key].addEventListener("keyup", updateCapsWarning);
        fields[key].addEventListener("blur", () => { capsWarning.hidden = true; });
    });

    form.addEventListener("reset", (event) => {
        if (submitting) {
            event.preventDefault();
            return;
        }
        touched.clear();
        completed = false;
        result.textContent = "";
        result.hidden = true;
        delete result.dataset.state;
        fieldNames.forEach((key) => {
            fields[key].removeAttribute("aria-invalid");
            const error = document.getElementById(`${key}Error`);
            error.hidden = true;
            error.textContent = "";
        });
        ["password", "confirmPassword"].forEach((key) => {
            fields[key].type = "password";
            const toggle = document.getElementById(`${key}Toggle`);
            toggle.textContent = "顯示";
            toggle.setAttribute("aria-pressed", "false");
            document.getElementById(`${key}CapsWarning`).hidden = true;
        });
        submitButton.disabled = submitting;
        submitLabel.textContent = "建立帳號";
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (submitting || completed) return;
        const invalidFields = fieldNames.filter((key) => {
            touched.add(key);
            return !validateField(key);
        });
        if (invalidFields.length) {
            setResult("請確認標示的欄位，再送出註冊。", "error");
            fields[invalidFields[0]].focus();
            return;
        }
        if (!["http:", "https:"].includes(window.location.protocol)) {
            setResult("目前無法使用註冊服務，請從網站開啟此頁面後再試。", "error");
            return;
        }
        // 維持現有 API 契約；確認密碼僅供前端驗證，不傳送或儲存。
        const registerData = {
            account: fields.account.value.trim(),
            password: fields.password.value,
            name: fields.name.value.trim(),
            email: fields.email.value.trim(),
            tel: fields.tel.value.trim()
        };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        submitting = true;
        fieldset.disabled = true;
        submitButton.disabled = true;
        form.setAttribute("aria-busy", "true");
        submitLabel.textContent = "註冊中…";
        setResult("正在建立帳號，請稍候…", "pending");
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(registerData),
                signal: controller.signal
            });
            if (!response.ok) {
                const messages = {
                    400: "資料格式不符合要求，請確認後再試。",
                    409: "帳號或電子郵件已被使用，請更換或前往登入。",
                    429: "送出次數過多，請稍候再試。",
                    404: "註冊服務目前尚未開放，請稍後再試。",
                    405: "註冊服務目前尚未開放，請稍後再試。"
                };
                throw new Error(messages[response.status] || "註冊服務暫時無法使用，請稍後再試。");
            }
            // 避免靜態伺服器回傳 HTML 頁面時誤判為註冊成功。
            if (response.status !== 204) {
                const contentType = response.headers.get("content-type") || "";
                if (!/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType)) {
                    throw new Error("註冊服務回應異常，請稍後再試。");
                }
                const data = await response.json();
                if (data && data.success === false) throw new Error("註冊未完成，請確認資料或稍後再試。");
            }
            completed = true;
            fields.password.value = "";
            fields.confirmPassword.value = "";
            ["password", "confirmPassword"].forEach((key) => {
                fields[key].type = "password";
                const toggle = document.getElementById(`${key}Toggle`);
                toggle.textContent = "顯示";
                toggle.setAttribute("aria-pressed", "false");
                document.getElementById(`${key}CapsWarning`).hidden = true;
            });
            setResult("註冊成功！現在可以前往登入。", "success");
        } catch (error) {
            const message = controller.signal.aborted
                ? "連線逾時，請稍後再試。"
                : error instanceof TypeError
                    ? "無法連線至註冊服務，請確認網路後再試。"
                    : error instanceof SyntaxError
                        ? "註冊服務回應異常，請稍後再試。"
                        : error.message || "註冊失敗，請稍後再試。";
            setResult(message, "error");
        } finally {
            clearTimeout(timeout);
            submitting = false;
            fieldset.disabled = false;
            submitButton.disabled = completed;
            submitLabel.textContent = completed ? "已完成註冊" : "建立帳號";
            form.setAttribute("aria-busy", "false");
        }
    });

    form.noValidate = true;
    submitButton.disabled = false;
})();
