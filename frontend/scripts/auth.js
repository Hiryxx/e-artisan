let loadAuthPages = () => {
    let showPassInput = document.getElementById("show-pass");

    showPassInput.addEventListener("click", (e) => {
        let passwordInput = document.getElementById("password");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            showPassInput.textContent = "Hide Password";
        } else {
            passwordInput.type = "password";
            showPassInput.textContent = "Show Password";
        }
    } );
}


window.loadAuthPages = loadAuthPages