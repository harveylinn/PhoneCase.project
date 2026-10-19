const registerForm = document.getElementById("registerForm");
const account = document.getElementById("account");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const name = document.getElementById("name");
const email = document.getElementById("email");
const tel = document.getElementById("tel");
let accountError = document.getElementById("accountError");
let confirmPasswordError = document.getElementById("confirmPasswordError");
let passwordError = document.getElementById("passwordError");
registerForm.addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("register!");
    console.log(`${account.value}.${password.value}
        .${confirmPassword.value}.${name.value}.${email.value}.${tel.value}`);
        
})

