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
        case "account":
            return loadAccountPage
    }
}

const createPageChangeEvent = (page) => new CustomEvent('pageChanged', { detail: { page } });


const pageId = "current-page"
const router = new Router("home", "pages/")


document.addEventListener('DOMContentLoaded', function () {
    const lastPage = localStorage.getItem("currentPage")
    if(!lastPage) {
        localStorage.setItem("currentPage", "home")
    }
    const res = checkUserAuth()
    if (res) {
        res.then(res => {
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem("token")
                UserState.removeUserInfo()
                window.location.reload()
            }
            return res.json();
        }).then(user => {
            if(user) {
                console.log("User found ", user)
                UserState.seUserInfo(user)
            }
        }).finally(()=>{
            console.log("Loading page ", lastPage)
            document.dispatchEvent(createPageChangeEvent(lastPage))
        })
    } else{
        document.dispatchEvent(createPageChangeEvent(lastPage))
    }
});


document.addEventListener('pageChanged', function (e) {
    const page = e.detail.page;
    if (!page) {
        console.error("No page found")
        return
    }
    switchPage(page);
    //extractHtml(router.getCurrentPagePath(), pageId, getPageFunction(page))
    loadNavbarAuth()
});



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

const putProds = (productsDiv, products) => {
    productsDiv.innerText = ""

    for (let prod of products) {
        productsDiv.innerHTML += `
                <div class="product">
                    <div class="product-img">
                        <img src="http://localhost:900/images?product_id=${prod.product_id}" alt="prod-img">
                    </div>
                    <div class="product-info">
                        <p class="product-info-text">
                            ${prod.name}
                        </p>
                          <p class="product-info-text">
                            Disponibilità: ${prod.stock_count}
                        </p>
                         <p class="product-info-text">
                            $${prod.price}
                        </p>
                   
                    </div>
                </div>
            `
    }
}

const loadComponents = () => {
    const productsDiv = document.getElementById("products")
    if (!productsDiv) {
        console.error("No products div found")
    }
    const stateProducts = ProductState.getAllProducts()
    if (stateProducts.length === 0){
        console.log("Loading products from server")
        fetch("http://localhost:900/product", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        }).then(res => {
            if (!res.ok) {
                throw new Error(`Server responded with status: ${res.status}`);
            }
            return res.json();
        }).then(products =>{
            ProductState.setAllProducts(products)
            putProds(productsDiv, products)
        })
    } else {
        console.log("Loading products from state")
        putProds(productsDiv, stateProducts)
    }

}

const checkUserAuth = () => {
    let token = localStorage.getItem("token")

    if (token) {
        return fetch("http://localhost:900/auth/user", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
    }
}

const loadNavbarAuth = () => {
    const token = localStorage.getItem("token")


    if (token) {
        document.getElementById("nav-options").innerHTML = `
        <p onclick="switchPage('home')">
            Home
        </p>
        <p onclick="switchPage('about')">
            About
        </p>
        <p onclick="switchPage('account')">
        Account
        </p>
        <p onclick="logout()">
        Logout
        </p>
    <p onclick="switchPage('shopping_cart')">
        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"/>
        </svg>
    </p>`

    } else {
        document.getElementById("nav-options").innerHTML = `
        <p onclick="switchPage('home')">
            Home
        </p>
        <p onclick="switchPage('about')">
            About
        </p>
        <p onclick="switchPage('login')">
            Login
        </p>
        <p onclick="switchPage('register')">
            Register
        </p>
    <p onclick="switchPage('shopping_cart')">
        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"/>
        </svg>
    </p>`
    }
}

const loadAccountPage = () => {
    const user = UserState.getUserInfo()
    const userDiv = document.getElementById("user-info")
    if (!userDiv) {
        console.error("No user div found")
    }
    const token = localStorage.getItem("token")
    //todo optimize
    const products = ProductState.fetchProducts({seller_id:user.user_uuid}, token)


    if (user) {
        userDiv.innerHTML = `
            <p>
                Name: ${user.name}
            </p>
            <p>
                Lastname: ${user.lastname}
            </p>
            <p>
                Email: ${user.email}
            </p>
        `
    }

    const accountProductsDiv = document.getElementById("account-products")

    if (!accountProductsDiv) {
        console.error("No orders div found")
    }


    if (products) {
        products.then(res => {
            if (!res.ok) {
                throw new Error(`Server responded with status: ${res.status}`);
            }
            return res.json();
        } ).then(products => {
            putProds(accountProductsDiv, products)
        } )
    }




    // understand how to show both orders and products

}


/**
 * Switch page
 * @param page Page name without url (e.g. "home" for "/pages/home.html")
 */
let switchPage = (page) => {
    router.changePage(page)
    localStorage.setItem("currentPage", page)
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

    //console.log(JSON.stringify(user))

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

            if (token) {
                localStorage.setItem("token", token);
                UserState.seUserInfo(data.user)
                document.dispatchEvent(createPageChangeEvent("home"));
            } else {
                alert("Registration failed:");
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
                UserState.seUserInfo(data.user)
                document.dispatchEvent(createPageChangeEvent("home"));
            } else {
                alert("Login failed: Missing token");
            }
        })
        .catch(err => {
            console.error("Login error:", err.message);
            alert(`Login failed: ${err.message}`);
        });
}


const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    UserState.removeUserInfo()
    document.dispatchEvent(createPageChangeEvent("home"));
}

// needed since now index.js is a module
window.switchPage = switchPage;
window.register = register;
window.login = login;
window.logout = logout;