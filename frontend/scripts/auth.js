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


const register = () => {
    // Get form values
    const fname = document.getElementById("fname").value;
    const lname = document.getElementById("lname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const user_role = document.getElementById("user-role").checked; // Assuming it's a checkbox
    const artisan_role = document.getElementById("artisan-role").checked; // Assuming it's a checkbox

    // Basic validation
    if (!fname || !lname || !email || !password || (!user_role && !artisan_role)) {
        spawnToast("Please fill all required fields", "error");
        return;
    }


    const user = {
        name: fname,
        lastname: lname,
        email: email,
        password: password,
        role_id: user_role ? 2 : 3
    };


    fetch("http://localhost:900/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"

        },
        body: JSON.stringify(user)
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errorData => {
                    throw new Error(errorData.message);
                });

            }
            return res.json();
        })
        .then(data => {
            console.log("Registration successful:", data);
            const token = data.token;

            if (token) {
                localStorage.setItem("token", token);
                UserState.seUserInfo(data.user)
                document.dispatchEvent(createPageChangeEvent("home"));
            } else {
                spawnToast("Registration failed", "error");
            }
        })
        .catch(err => {
            spawnToast(`Registration failed: ${err}`, "error");
        });
};

const login = () => {
    // Get form values
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Basic validation
    if (!email || !password) {
        spawnToast("Please fill all required fields", "error");
        return;
    }

    fetch(`http://localhost:900/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errorData => {
                    let message = errorData.message
                    throw new Error(message);
                });
            }
            return res.json();
        })
        .then(data => {
            const token = data.token;
            const user = data.user;

            if (token) {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                UserState.seUserInfo(data.user)
                document.dispatchEvent(createPageChangeEvent("home"));
            } else {
                spawnToast("Login failed: Missing token", "error");
            }
        })
        .catch(err => {
            spawnToast(`Login failed: ${err}`, "error");
        });
}


const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    UserState.removeUserInfo()
    document.dispatchEvent(createPageChangeEvent("home"));
}


window.loadAuthPages = loadAuthPages
window.register = register;
window.login = login;
window.logout = logout;