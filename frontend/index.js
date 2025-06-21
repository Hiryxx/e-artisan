let createPageChangeEvent = (page) => new CustomEvent('pageChanged', {detail: {page}});

/**
 * Get the function to call after loading the page
 * @param page Page name without url (e.g. "home" for "/pages/home.html")
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
        case "shopping_cart":
            return loadCartPage
        case "product_details":
            return loadProductDetails
        case "login":
            return loadAuthPages
        case "register":
            return loadAuthPages

        case "admin_dashboard":
            return loadAdminPage;
    }
}


const toastClose = (toastContainer) => {
    toastContainer.innerHTML = "";
}

let spawnToast = (message, type = "info", timeout = 2500) => {
    console.log("Spawning toast with message: ", message, " and type: ", type)
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        console.error("No toast container found")
        return
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    toastContainer.innerHTML = toast.outerHTML;
    toastContainer.onclick = () => {
        toastClose(toastContainer);
    }

    setTimeout(() => {
        toastClose(toastContainer)
    }, timeout);
}


const pageId = "current-page"
const router = new Router("home", "pages/")


document.addEventListener('DOMContentLoaded', function () {
    const lastPage = localStorage.getItem("currentPage")
    if (!lastPage) {
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
            if (user) {
                console.log("User found ", user)
                UserState.seUserInfo(user)
            }
        }).finally(() => {
            console.log("Loading page ", lastPage)
            document.dispatchEvent(createPageChangeEvent(lastPage))
        })
    } else {
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
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.innerHTML = `
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
                    <div class="product-info-button" id="add-cart-${prod.product_id}">
                    Add to cart
                    </div>
                </div>
        `;

        productDiv.addEventListener('click', () => {
            ProductState.setSelectedProduct(prod);
            switchPage('product_details');
        });

        productsDiv.appendChild(productDiv);

        document.getElementById(`add-cart-${prod.product_id}`).addEventListener('click', (e) => {
            e.stopPropagation();
            goToShoppingCartWithProduct(prod.product_id);
        });
    }
}

const reportProduct = (productId) => {
    const reason = prompt("Inserisci il motivo della segnalazione:");
    if (!reason || reason.trim() === "") {
        return;
    }

    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    fetch("http://localhost:900/admin/reports", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({product_id: productId, reason})
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Il server ha risposto con stato: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            UserState.addReportedProduct(productId);
            spawnToast("Prodotto segnalato con successo", "success");

            const reportBtn = document.getElementById('report-btn');
            if (reportBtn) {
                reportBtn.style.display = "none";
            }
        })
        .catch(error => {
            console.error("Errore nella segnalazione:", error);
            spawnToast("Errore durante la segnalazione", "error");
        });
};

const loadUserReportedProducts = () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve([]);

    return fetch("http://localhost:900/admin/user-reports", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) {
                return [];
            }
            return res.json();
        })
        .then(productIds => {
            UserState.setReportedProducts(productIds);
            return productIds;
        })
        .catch(err => {
            console.error("Errore nel caricamento dei prodotti segnalati:", err);
            return [];
        });
};



const loadProductDetails = () => {
    const productDetailsDiv = document.getElementById('product-details');
    const selectedProduct = ProductState.getSelectedProduct();
    const reportBtn = document.getElementById('report-btn');

    // TODO FIX THIS SINCE IT CAUSES UNEXPECTED BEHAVIOR
    // TODO IF product is not found, then i can fetch it from the server
    if (!selectedProduct) {
        console.error("Nessun prodotto selezionato");
        switchPage('home');
        return;
    }

    productDetailsDiv.innerHTML = `
        <div class="product-details-image">
            <img src="http://localhost:900/images?product_id=${selectedProduct.product_id}" alt="${selectedProduct.name}">
        </div>
        <div class="product-details-info">
            <h2>${selectedProduct.name}</h2>
            <p class="product-price">Prezzo: $${selectedProduct.price}</p>
            <p class="product-stock">Disponibilità: ${selectedProduct.stock_count}</p>
            <p class="product-description">Descrizione: ${selectedProduct.description || 'Nessuna descrizione disponibile'}</p>
            <p class="product-category">Categoria: ${selectedProduct.category_id || selectedProduct.id_category || 'N/A'}</p>
            <p class="product-seller">Venditore: ${selectedProduct.seller_name || ''} ${selectedProduct.seller_lastname || ''}</p>
        </div>
    `;
    const token = localStorage.getItem("token");

    if (!token) {
        reportBtn.style.display = "none";
    } else {
        if (UserState.hasReportedProduct(selectedProduct.product_id)) {
            reportBtn.style.display = "none";
        } else {
            reportBtn.addEventListener('click', () => {
                reportProduct(selectedProduct.product_id);
            });
        }
    }

    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
        goToShoppingCartWithProduct(selectedProduct.product_id);
    });
}

const loadComponents = () => {
    const productsDiv = document.getElementById("products")
    if (!productsDiv) {
        console.error("No products div found")
    }
    const stateProducts = ProductState.getAllProducts()
    if (stateProducts.length === 0) {
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
        }).then(products => {
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
            .then(res => res.json())
            .then(user => {
                UserState.seUserInfo(user);
                // Carica i prodotti segnalati dall'utente
                return loadUserReportedProducts().then(() => user);
            });
    }
    return null;
}

const loadNavbarAuth = () => {
    const token = localStorage.getItem("token")
    const user = UserState.getUserInfo()
    let adminOption = "";
    if (user && user.role_id === 1) {
        adminOption = `<p onclick="switchPage('admin_dashboard')">Admin</p>`;
    }

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
        ${adminOption || ""}
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
    const products = ProductState.fetchProducts({seller_id: user.user_uuid}, token)


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
        }).then(products => {
            putProds(accountProductsDiv, products)
        })
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
                    throw new Error(errorData.message);
                });
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

// needed since now index.js is a module
window.switchPage = switchPage;
window.register = register;
window.login = login;
window.logout = logout;
window.spawnToast = spawnToast;

window.createPageChangeEvent = createPageChangeEvent;

