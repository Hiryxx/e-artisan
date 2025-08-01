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
        case "checkout":
            return loadCheckoutPage;
        case "payment":
            return loadPaymentPage;
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
                document.dispatchEvent(createPageChangeEvent("home"))
            }
            return res.json();
        }).then(user => {
            if (user) {
                UserState.seUserInfo(user);
                loadUserReportedProducts().then(() => user);
            }
        }).finally(() => {
            console.log("Loading page ", lastPage)
            document.dispatchEvent(createPageChangeEvent(lastPage))
        })
    } else {
        document.dispatchEvent(createPageChangeEvent(lastPage))
    }

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
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
        const user = UserState.getUserInfo();
        let addToCartBtnContent = "";
        if (user) {
            const role = user.role_id
            addToCartBtnContent = role !== 3 ? `<div class="product-info-button" id="add-cart-${prod.product_id}">
            Add to cart
        </div>` : ""
        } else {
            addToCartBtnContent = `<div class="product-info-button" id="add-cart-${prod.product_id}">
            Add to cart
            </div>`
        }


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
                    ${addToCartBtnContent}
                </div>
        `;

        productDiv.addEventListener('click', () => {
            ProductState.setSelectedProduct(prod);
            switchPage('product_details');
        });

        productsDiv.appendChild(productDiv);

        let goToCartBtn = document.getElementById(`add-cart-${prod.product_id}`)
        if (goToCartBtn) {
            goToCartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                goToShoppingCartWithProduct(prod.product_id);
            });
        }
    }
}

const reportProduct = (productId) => {
    const reason = prompt("Add a report reason:");
    if (!reason || reason.trim() === "") {
        spawnToast("You need to add a reason", "error");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        spawnToast("You need to be logged in to report a product", "error");
        return;
    }
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

    if (!selectedProduct) {
        console.error("Nessun prodotto selezionato");
        switchPage('home');
        return;
    }

    const user = UserState.getUserInfo();

    let addToCartBtnContent = "";

    if (user && user.role_id !== 3) {
        addToCartBtnContent = `<button id="add-to-cart-btn" class="add-to-cart-btn">Add to cart</button>`;
    }



    productDetailsDiv.innerHTML = `
        <div class="product-details-image">
            <img src="http://localhost:900/images?product_id=${selectedProduct.product_id}" alt="${selectedProduct.name}">
        </div>
        <div class="product-details-info">
            <p class="product-name">${selectedProduct.name}</p>
            <p class="product-price">Price: $${selectedProduct.price}</p>
            <p class="product-stock">Stock: ${selectedProduct.stock_count}</p>
            <p class="product-description">Description: ${selectedProduct.description || 'Nessuna descrizione disponibile'}</p>
            <p class="product-category">Category: ${selectedProduct.category_id || selectedProduct.id_category || 'N/A'}</p>
            <p class="product-seller">Seller: ${selectedProduct.seller_name || ''} ${selectedProduct.seller_lastname || ''}</p>
            <div class="actions">
                ${addToCartBtnContent}
                <button id="report-btn" class="back-btn">Report</button>
                <button id="back-btn" class="back-btn" onclick="switchPage('home')">Go back</button>
            </div>
        </div>
    `;

    const reportBtn = document.getElementById('report-btn');
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
        return
    }

    loadCategories()
        .then(categories => {
            const categoriesDiv = document.getElementById("category-filter");
            for (let category of categories) {
                categoriesDiv.innerHTML += `
                        <option value="${category.id_category}">${category.name}</option>
                     `
            }
        })
        .catch(error => {
            console.error("Error loading categories:", error);
        });

    // Initialize search functionality
    initializeSearch()

    // Load all products initially
    loadProducts({})
}

const initializeSearch = () => {
    const searchInput = document.getElementById("search-input")
    const searchButton = document.getElementById("search-button")
    const categoryFilter = document.getElementById("category-filter")
    const clearFiltersBtn = document.getElementById("clear-filters")

    if (!searchInput || !searchButton || !categoryFilter || !clearFiltersBtn) {
        console.error("Search elements not found")
        return
    }

    // Search button click
    searchButton.addEventListener("click", performSearch)

    // Search on Enter key
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            performSearch()
        }
    })

    // Live search with debounce
    let searchTimeout;
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(performSearch, 500) // 500ms delay
    })

    // Category filter change
    categoryFilter.addEventListener("change", performSearch)

    // Clear filters
    clearFiltersBtn.addEventListener("click", () => {
        searchInput.value = ""
        categoryFilter.value = ""
        document.getElementById("active-filters").innerHTML = ""
        document.getElementById("search-results-info").innerHTML = ""
        loadProducts({})
    })
}

const performSearch = () => {
    const searchInput = document.getElementById("search-input")
    const categoryFilter = document.getElementById("category-filter")
    const activeFiltersDiv = document.getElementById("active-filters")

    const searchTerm = searchInput.value.trim()
    const categoryId = categoryFilter.value

    const filters = {}
    const activeFilters = []

    // Add search term to filters
    if (searchTerm) {
        filters.search = searchTerm
        activeFilters.push({
            type: "search",
            value: searchTerm,
            label: `Ricerca: "${searchTerm}"`
        })
    }

    // Add category filter if selected
    if (categoryId) {
        filters.id_category = categoryFilter.options[categoryFilter.selectedIndex].value
        const categoryName = categoryFilter.options[categoryFilter.selectedIndex].text
        activeFilters.push({
            type: "category",
            value: categoryId,
            label: `Categoria: ${categoryName}`
        })
    }

    // Display active filters
    activeFiltersDiv.innerHTML = activeFilters.map(filter => `
        <div class="filter-tag">
            ${filter.label}
            <button onclick="removeFilter('${filter.type}', '${filter.value}')">×</button>
        </div>
    `).join("")

    // Load products with filters
    loadProducts(filters)
}

const removeFilter = (type, value) => {
    if (type === "category") {
        document.getElementById("category-filter").value = ""
    } else if (type === "search") {
        document.getElementById("search-input").value = ""
    }
    performSearch()
}

const loadProducts = (filters = {}) => {
    const productsDiv = document.getElementById("products")
    const loadingDiv = document.getElementById("search-loading")
    const resultsInfoDiv = document.getElementById("search-results-info")

    // Show loading
    if (loadingDiv) loadingDiv.classList.add("active")
    productsDiv.innerHTML = ""

    ProductState.fetchProducts(filters).then(res => {
        if (!res.ok) {
            throw new Error(`Server responded with status: ${res.status}`)
        }
        return res.json()
    }).then(products => {
        // Hide loading
        if (loadingDiv) loadingDiv.classList.remove("active")

        // Update results info
        if (resultsInfoDiv) {
            if (Object.keys(filters).length > 0) {
                resultsInfoDiv.innerHTML = `
                    <p>Found <strong>${products.length}</strong> products</p>
                `
            } else {
                resultsInfoDiv.innerHTML = ""
            }
        }

        // Display products
        if (products.length === 0) {
            productsDiv.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <h3>Nessun prodotto trovato</h3>
                    <p>Prova a modificare i filtri di ricerca</p>
                </div>
            `
        } else {
            ProductState.setAllProducts(products)
            putProds(productsDiv, products)
        }
    }).catch(error => {
        console.error("Error loading products:", error)
        if (loadingDiv) loadingDiv.classList.remove("active")
        spawnToast("Errore nel caricamento dei prodotti", "error")
    })
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
    const user = UserState.getUserInfo()
    let adminOption = "";
    let cartOption = "";
    if (user && user.role_id === 1) {
        adminOption = `<p onclick="switchPage('admin_dashboard')" class="nav-link">Admin</p>`;
    } else if (user && user.role_id !== 3) {
        cartOption = `<p onclick="switchPage('shopping_cart')" class="nav-link">
        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"/>
        </svg>
        </p>`
    }

    if (token) {
        document.getElementById("nav-options").innerHTML = `
        <p onclick="switchPage('home')" class="nav-link">
            Home
        </p>
        <p onclick="switchPage('about')" class="nav-link">
            About
        </p>
        <p onclick="switchPage('account')" class="nav-link">
            Account
        </p>
        ${adminOption || ""}
        <p onclick="logout()" class="nav-link">
            Logout
        </p>
        ${cartOption}
        `
    } else {
        document.getElementById("nav-options").innerHTML = `
        <p onclick="switchPage('home')" class="nav-link">
            Home
        </p>
        <p onclick="switchPage('about')" class="nav-link">
            About
        </p>
        <p onclick="switchPage('login')" class="nav-link">
            Login
        </p>
        <p onclick="switchPage('register')" class="nav-link">
            Register
        </p>
        <p onclick="switchPage('shopping_cart')" class="nav-link">
        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7H7.312"/>
        </svg>
        </p>
        `
    }
}

/**
 * Switch page
 * @param page Page name without url (e.g. "home" for "/pages/home.html")
 * @param page Page name without url (e.g. "home" for "/pages/home.html")
 */
let switchPage = (page) => {
    if(page === "account") {
        document.body.classList.add('is-account');
    }else if(localStorage.getItem("currentPage") === "account") {
        document.body.classList.remove('is-account');
    }
    router.changePage(page)
    localStorage.setItem("currentPage", page)
    extractHtml(router.getCurrentPagePath(), pageId, getPageFunction(page))
}


// needed since now index.js is a module
window.switchPage = switchPage;
window.spawnToast = spawnToast;
window.removeFilter = removeFilter
window.performSearch = performSearch
window.createPageChangeEvent = createPageChangeEvent;

