let loadAuthPages = () => {
    let showPassInput = document.getElementById("show-pass");


    showPassInput.addEventListener("click", (e) => {
        let passwordInput = document.getElementById("password");
        let showPassLabel = document.getElementById("show-pass-text-register") || document.getElementById("show-pass-text-login");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            showPassLabel.textContent = "Hide Password";
        } else {
            passwordInput.type = "password";
            showPassLabel.textContent = "Show Password";
        }
    } );
}


window.loadAuthPages = loadAuthPages