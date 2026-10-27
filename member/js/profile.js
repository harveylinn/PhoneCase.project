"use strict";

(() => {
    const form = document.getElementById("profileForm");
    const nameInput = document.getElementById("name");
    const phoneNumberInput = document.getElementById("phonenumber");
    const addressInput = document.getElementById("address");
    const result = document.getElementById("saveResult");
    const touched = new Set();

    const setResult = (message, state) => {
        result.textContent = message;
        result.dataset.state = state;
    };
    const validate = (input) => {
        const value = input.value.trim();
        let message = "";
        if (!value) {
            message = input === nameInput ? "請輸入姓名。" : "請輸入電話。";
        } else if (input === phoneNumberInput && (!/^\+?[\d\s()-]+$/.test(value) || !/^\d{7,15}$/.test(value.replace(/\D/g, "")))) {
            message = "請輸入有效的電話（7–15 位數字，可含國碼及連字號）。";
        }
        const error = document.getElementById(`${input.id}Error`);
        error.textContent = message;
        error.hidden = !message;
        input.setAttribute("aria-invalid", String(Boolean(message)));
        return !message;
    };
    [nameInput, phoneNumberInput].forEach((input) => {
        input.addEventListener("blur", () => {
            touched.add(input.id);
            validate(input);
        });
        input.addEventListener("input", (event) => {
            if (event.isComposing) return;
            if (touched.has(input.id)) validate(input);
            setResult("資料已修改，請按儲存資料。", "idle");
        });
    });
    addressInput.addEventListener("input", (event) => {
        if (!event.isComposing) setResult("資料已修改，請按儲存資料。", "idle");
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const invalid = [nameInput, phoneNumberInput].filter((input) => {
            touched.add(input.id);
            return !validate(input);
        });
        if (invalid.length) {
            setResult("請確認標示的欄位後再試。", "error");
            invalid[0].focus();
            return;
        }
        // 版型示範：沒有會員 API，不傳送或持久儲存個人資料。
        setResult("資料格式正確。此頁為版型示範，尚未儲存至會員資料。", "valid");
    });
    document.querySelectorAll("[data-unavailable]").forEach((button) => {
        button.addEventListener("click", () => {
            setResult(`${button.dataset.unavailable}功能尚未開放。`, "idle");
        });
    });
    form.noValidate = true;
    document.getElementById("saveButton").disabled = false;
})();
