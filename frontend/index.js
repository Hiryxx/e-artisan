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

    console.log("Invio segnalazione per prodotto:", productId); // Debug

    fetch("http://localhost:900/admin/reports", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            product_id: parseInt(productId),
            reason: reason.trim()
        })
    })
        .then(res => {
            console.log("Risposta server:", res.status); // Debug
            if (!res.ok) {
                throw new Error(`Il server ha risposto con stato: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Segnalazione creata:", data); // Debug
            alert("Prodotto segnalato con successo");
        })
        .catch(err => {
            console.error("Errore durante la segnalazione:", err);
            alert("Errore durante la segnalazione: " + err.message);
        });
};

const loadAdminPage = () => {
    const user = UserState.getUserInfo();

    if (!user || user.role_id !== 1) {
        alert("Accesso negato: area riservata agli amministratori");
        switchPage("home");
        return;
    }

    // Aggiunto container per switchare tra report pendenti e storico
    const reportedProductsDiv = document.getElementById("reported-products");
    const adminHeader = document.getElementById("admin-header");

    // Aggiorniamo l'header per includere le opzioni di visualizzazione
    adminHeader.innerHTML = `
        <h2>Dashboard Amministratore</h2>
        <p>Gestione prodotti segnalati</p>
        <div class="view-options">
            <button id="view-pending" class="btn btn-primary active">Segnalazioni pendenti</button>
            <button id="view-history" class="btn btn-secondary">Storico segnalazioni</button>
        </div>
    `;

    // Aggiungiamo gli event listener per i nuovi bottoni
    document.getElementById("view-pending").addEventListener("click", () => loadReports());
    document.getElementById("view-history").addEventListener("click", () => loadReportsHistory());

    // Carichiamo le segnalazioni pendenti di default
    loadReports();
};


const loadProductDetails = () => {
    const productDetailsDiv = document.getElementById('product-details');
    const selectedProduct = ProductState.getSelectedProduct();
    const reportBtn = document.getElementById('report-btn');

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

    // Verifica se l'utente è loggato
    const token = localStorage.getItem("token");

    // Nascondi il pulsante di segnalazione se l'utente non è loggato
    if (!token) {
        reportBtn.style.display = "none";
    } else {
        reportBtn.style.display = "inline-block";
        reportBtn.addEventListener('click', () => {
            const selectedProduct = ProductState.getSelectedProduct();
            reportProduct(selectedProduct.product_id);
        });
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
    }
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

function viewReportedProduct(productId) {
    if (!productId) {
        spawnToast("Questo prodotto è stato rimosso", "info");
        return;
    }

    ProductState.fetchProducts({product_id: productId})
        .then(res => res.json())
        .then(products => {
            if (products.length > 0) {
                ProductState.setSelectedProduct(products[0]);
                switchPage('product_details');
            } else {
                spawnToast("Prodotto non più disponibile", "warning");
            }
        })
        .catch(err => {
            console.error("Errore nel caricamento del prodotto:", err);
            spawnToast("Errore nel caricamento del prodotto", "error");
        });
}

function resolveReport(productId) {
    if (!confirm("Sei sicuro di voler risolvere questa segnalazione? Il prodotto non verrà rimosso.")) {
        return;
    }


    const token = localStorage.getItem("token");

    fetch(`http://localhost:900/admin/reports/${productId}/resolve`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Errore: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            spawnToast("Segnalazione risolta con successo", "success");
            // Ricarica la pagina admin
            loadAdminPage();
        })
        .catch(err => {
            console.error("Errore nella risoluzione della segnalazione:", err);
            spawnToast("Errore nella risoluzione della segnalazione", "error");
        });
}

function removeReportedProduct(productId, sellerId) {
    // Chiedi conferma
    const message = prompt("Vuoi inviare un messaggio all'artigiano? (opzionale)");

    if (message === null) {
        // L'utente ha annullato
        return;
    }

    if (!confirm("Sei sicuro di voler rimuovere questo prodotto?")) {
        return;
    }

    const token = localStorage.getItem("token");

    fetch(`http://localhost:900/admin/product/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({message: message || ""})
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Errore: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            spawnToast("Prodotto rimosso con successo", "success");
            // Ricarica la pagina admin
            loadAdminPage();
        })
        .catch(err => {
            console.error("Errore nella rimozione del prodotto:", err);
            spawnToast("Errore nella rimozione del prodotto", "error");
        });
}

const loadReports = () => {
    const reportedProductsDiv = document.getElementById("reported-products");

    // Aggiorna stato visuale dei bottoni
    document.getElementById("view-pending").classList.add("active");
    document.getElementById("view-history").classList.remove("active");

    reportedProductsDiv.innerHTML = '<div class="loading">Caricamento segnalazioni pendenti...</div>';

    const token = localStorage.getItem("token");
    fetch("http://localhost:900/admin/reports", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Il server ha risposto con stato: ${res.status}`);
            }
            return res.json();
        })
        .then(reports => {
            if (reports.length === 0) {
                reportedProductsDiv.innerHTML = `
                <div class="no-reports">
                    <h3>✅ Nessuna segnalazione pendente</h3>
                    <p>Ottimo lavoro! Non ci sono prodotti segnalati al momento.</p>
                </div>
            `;
                return;
            }

            // Aggregazione delle segnalazioni per prodotto
            const aggregatedReports = {};
            reports.forEach(report => {
                if (!aggregatedReports[report.product_id]) {
                    aggregatedReports[report.product_id] = {
                        productInfo: report,
                        count: 1,
                        reasons: [report.reason],
                        reporters: [report.reporter_name ? `${report.reporter_name} ${report.reporter_lastname}` : 'Utente anonimo']
                    };
                } else {
                    aggregatedReports[report.product_id].count++;
                    aggregatedReports[report.product_id].reasons.push(report.reason);
                    aggregatedReports[report.product_id].reporters.push(
                        report.reporter_name ? `${report.reporter_name} ${report.reporter_lastname}` : 'Utente anonimo'
                    );
                }
            });

            reportedProductsDiv.innerHTML = '';
            Object.values(aggregatedReports).forEach(aggregatedReport => {
                const {productInfo, count, reasons, reporters} = aggregatedReport;
                const hasActiveProduct = productInfo.active_product_id !== null;

                const reportDiv = document.createElement("div");
                reportDiv.className = "report-item";

                reportDiv.innerHTML = `
                <div class="report-details">
                    <h3>${productInfo.product_name} <span class="report-count">(${count} segnalazioni)</span></h3>
                    <p><strong>Venditore:</strong> ${productInfo.seller_name || 'N/A'} ${productInfo.seller_lastname || ''}</p>
                    <p><strong>Prima segnalazione:</strong> ${new Date(productInfo.created_at).toLocaleDateString()}</p>
                    <p><strong>Prezzo:</strong> €${productInfo.price}</p>
                    <details>
                        <summary><strong>Motivi della segnalazione (${reasons.length})</strong></summary>
                        <ul>
                            ${reasons.map(reason => `<li>${reason}</li>`).join('')}
                        </ul>
                    </details>
                    <details>
                        <summary><strong>Segnalato da (${reporters.length})</strong></summary>
                        <ul>
                            ${reporters.map(reporter => `<li>${reporter}</li>`).join('')}
                        </ul>
                    </details>
                </div>
                <div class="report-actions">
                    ${hasActiveProduct ?
                    `<button class="btn btn-primary" onclick="viewReportedProduct(${productInfo.product_id})">👁️ Visualizza</button>` :
                    `<button class="btn btn-secondary" disabled>Prodotto già rimosso</button>`
                }
                    <button class="btn btn-success" onclick="resolveReport(${productInfo.product_id})">✓ Risolvi</button>
                    ${hasActiveProduct ?
                    `<button class="btn btn-danger" onclick="removeReportedProduct(${productInfo.product_id}, '${productInfo.seller_id}')">🗑️ Rimuovi</button>` :
                    ''
                }
                </div>
            `;
                reportedProductsDiv.appendChild(reportDiv);
            });
        })
        .catch(err => {
            console.error("Errore nel caricamento dei report:", err);
            reportedProductsDiv.innerHTML = `
            <div class="error-message">
                <strong>Errore:</strong> Impossibile caricare le segnalazioni.
            </div>
        `;
        });
};


const loadReportsHistory = () => {
    const reportedProductsDiv = document.getElementById("reported-products");

    // Aggiorna stato visuale dei bottoni
    document.getElementById("view-pending").classList.remove("active");
    document.getElementById("view-history").classList.add("active");

    reportedProductsDiv.innerHTML = '<div class="loading">Caricamento storico segnalazioni...</div>';

    const token = localStorage.getItem("token");
    fetch("http://localhost:900/admin/reports/history", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Il server ha risposto con stato: ${res.status}`);
            }
            return res.json();
        })
        .then(historyItems => {
            if (historyItems.length === 0) {
                reportedProductsDiv.innerHTML = `
                <div class="no-reports">
                    <h3>📜 Nessuna segnalazione risolta</h3>
                    <p>Non ci sono segnalazioni risolte nella cronologia.</p>
                </div>
            `;
                return;
            }

            reportedProductsDiv.innerHTML = '';
            historyItems.forEach(item => {
                const reportDiv = document.createElement("div");
                reportDiv.className = "report-item history-item";

                reportDiv.innerHTML = `
                <div class="report-details">
                    <h3>${item.product_name || 'Prodotto rimosso'} <span class="report-status ${item.product_status === 'Prodotto attivo' ? 'status-active' : 'status-removed'}">${item.product_status}</span></h3>
                    <p><strong>Motivo segnalazione:</strong> ${item.reason}</p>
                    <p><strong>Data segnalazione:</strong> ${new Date(item.created_at).toLocaleDateString()}</p>
                    <p><strong>Risolta il:</strong> ${new Date(item.resolved_at).toLocaleDateString()} ${new Date(item.resolved_at).toLocaleTimeString()}</p>
                    <p><strong>Segnalato da:</strong> ${item.reporter_name ? `${item.reporter_name} ${item.reporter_lastname}` : 'Utente anonimo'}</p>
                    ${item.resolution_message ? `<p><strong>Messaggio di risoluzione:</strong> "${item.resolution_message}"</p>` : ''}
                </div>
                ${item.product_status === 'Prodotto attivo' ?
                    `<div class="report-actions">
                    <button class="btn btn-primary" onclick="viewReportedProduct(${item.product_id})">👁️ Visualizza prodotto</button>
                </div>` : ''}
            `;
                reportedProductsDiv.appendChild(reportDiv);
            });
        })
        .catch(err => {
            console.error("Errore nel caricamento dello storico:", err);
            reportedProductsDiv.innerHTML = `
            <div class="error-message">
                <strong>Errore:</strong> Impossibile caricare lo storico delle segnalazioni.
            </div>
        `;
        });
};


function acceptReport(productId) {
    if (!confirm("Sei sicuro di voler accettare questo prodotto? La segnalazione verrà archiviata.")) {
        return;
    }

    const token = localStorage.getItem("token");

    // Per ora usiamo l'endpoint di update status
    // Dovrai implementare un endpoint specifico nel backend se necessario
    spawnToast("Segnalazione accettata", "success");

    // Ricarica la pagina admin
    loadAdminPage();
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
window.spawnToast = spawnToast;
window.viewReportedProduct = viewReportedProduct;
window.removeReportedProduct = removeReportedProduct;
window.loadAdminPage = loadAdminPage;
window.createPageChangeEvent = createPageChangeEvent;
window.resolveReport = resolveReport;
window.loadReports = loadReports;
window.loadReportsHistory = loadReportsHistory;
