
//todo find a way move this to router.js
class Router {
    currentPage = null
    pagesPath = null

    constructor(page, pagesPath){
        this.currentPage = page
        this.pagesPath = pagesPath
    }

    changePage(newPage){
        this.currentPage = newPage
    }

    getCurrentPagePath() {
        return this.currentPage ? this.pagesPath + this.currentPage + ".html": null
    }

}

/**
 * Get the function to call after loading the page
 * @param page
 * @returns {(function(): void)|*|loadComponents}
 */
const getPageFunction = (page) => {
    switch (page) {
        case "home":
            return loadComponents
        case "about":
            return () => {
                console.log("About page loaded")
            }
    }
}

const pageId = "current-page"
const router = new Router("home", "pages/") // todo ok here or in the event listener?

// todo remove event listener
document.addEventListener('DOMContentLoaded', function () {
    extractHtml(router.getCurrentPagePath(), pageId, getPageFunction('home'))
});

// TODO CHANGE NAME
const extractHtml = (htmlUrl, elementId, callAfter) => {
    fetch(htmlUrl)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            if (callAfter)
                callAfter()
        })
        .catch(error => {
            console.error('Error loading navbar:', error);
        });
}

const loadComponents = () => {
    const productsDiv = document.getElementById("products")
    if (!productsDiv) {
        console.error("No products div found")
    }
    // todo this is fetch
    const products = [
        {
            id: "1",
            name: "prova1",
            price: 50,
            img: "./images/products/prod1.webp"
        },
        {
            id: "2",
            name: "prova2",
            price: 100,
            img: "./images/products/prod2.jpg"
        },
        {
            id: "3",
            name: "prova3",
            price: 150,
            img: "./images/products/prod3.jpg"
        },
        {
            id: "4",
            name: "prova4",
            price: 200,
            img: "./images/products/prod4.png"
        },
        {
            id: "5",
            name: "prova5",
            price: 250,
            img: "./images/products/prod5.jpg"
        },
        {
            id: "6",
            name: "prova6",
            price: 300,
            img: ""
        },
        {
            id: "7",
            name: "prova7",
            price: 350,
            img: ""
        },
        {
            id: "8",
            name: "prova8",
            price: 400,
            img: ""
        },
        {
            id: "9",
            name: "prova9",
            price: 450,
            img: ""
        },
        {
            id: "10",
            name: "prova10",
            price: 500,
            img: ""
        },
    ]
    // TODO FIX
    for (let prod of products) {
        productsDiv.innerHTML += `
        <div class="product">
            <div class="product-img">
                <img src=${prod.img} alt="prod-img">
            </div>
            <div class="product-info">
                <p class="product-info-text">
                    ${prod.name}
                </p>
                 <p class="product-info-text">
                    $${prod.price}
                </p>
            </div>
        </div>
        `
    }
}
// todo switch to class
/**
 * Switch page
 * @param page Page name without url (e.g. "home" for "/pages/home.html")
 */
const switchPage = (page) => {
    router.changePage(page)
    extractHtml(router.getCurrentPagePath(), pageId, getPageFunction(page))
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
        alert("Please fill all required fields");
        return;
    }


    const user = {
        name: fname,
        lastname: lname,
        email: email,
        password: password,
        role_id: user_role ? 2 : 3
    };

    console.log(JSON.stringify(user))

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
                throw new Error(`Server responded with status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Registration successful:", data);
            const token = data.token;
            const user = data.user;

            if (token) {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                switchPage("home");
            } else {
                alert("Registration failed: Missing token");
            }
        })
        .catch(err => {
            console.error("Registration error:", err.message);
            alert(`Registration failed: ${err.message}`);
        });
};

const login = () => {
    // Get form values
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Basic validation
    if (!email || !password) {
        alert("Please fill all required fields");
        return;
    }


    fetch( `http://localhost:900/auth/login`, {
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
                throw new Error(`Server responded with status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Login successful:", data);
            const token = data.token;
            const user = data.user;

            if (token) {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                switchPage("home");
            } else {
                alert("Login failed: Missing token");
            }
        })
        .catch(err => {
            console.error("Login error:", err.message);
            alert(`Login failed: ${err.message}`);
        });
}