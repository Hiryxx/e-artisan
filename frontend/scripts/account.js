const loadCategories = (token) => {
    let categories = ProductState.getCategories();

    if (categories.length > 0) {
        return Promise.resolve(categories);
    } else {
        return ProductState.fetchCategories(token)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Server responded with status: ${res.status}`);
                }
                return res.json();
            })
            .then(fetchedCategories => {
                ProductState.setCategories(fetchedCategories);
                return fetchedCategories;
            })
            .catch(err => {
                console.error("Error fetching categories:", err);
                throw err; // Re-throwing to allow error handling by caller
            });
    }
}

const loadAccountPage = () => {
    const user = UserState.getUserInfo()

    const userDiv = document.getElementById("user-details")
    const accountNav = document.getElementById("account-nav")
    const accountContent = document.getElementById("account-content")

    if (!userDiv || !accountNav || !accountContent) {
        console.error("No div found")
        return;
    }


    // todo should never happen
    if (!user) {
        console.error("No user found")
        switchPage("home")
        return;
    }
    userDiv.innerHTML = `
             <h2 id="user-name">${user.name} ${user.lastname}</h2>
             <p id="user-email">${user.email}</p>
                `


    // 2 user, 3 artisan
    if (user.role_id === 2) {
        loadContent('dashboard')
        accountNav.innerHTML = `
                    <button id="dashboard" onclick="loadContent('dashboard')" class="nav-btn active" data-tab="dashboard">
                        <i class="fas fa-home"></i>Dashboard
                    </button>
                    <button id="orders" onclick="loadContent('orders')" class="nav-btn" data-tab="orders">
                        <i class="fas fa-shopping-bag"></i>Orders
                    </button>
                      <button id="settings" onclick="loadContent('settings')" class="nav-btn" data-tab="settings">
                        <i class="fas fa-cog"></i>Settings
                    </button>
                `
    } else if (user.role_id === 3) { // or fa-plus-circle
        loadContent('my-products')
        accountNav.innerHTML = `
                     <button id="my-products" onclick="loadContent('my-products')" class="nav-btn" data-tab="products">
                        <i class="fas fa-box"></i>My products
                    </button>
                     <button id="add-product" onclick="loadContent('add-product')" class="nav-btn" data-tab="products">
                        <i class="fas fa-cart-plus"></i>Add product
                    </button>
                    <button id="settings" onclick="loadContent('settings')" class="nav-btn" data-tab="settings">
                        <i class="fas fa-cog"></i>Settings
                    </button>
                   `


    }


    // todo depend on user role, show different options
    /*
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

     */


    // understand how to show both orders and products

}

const addArtisanProduct = () => {
    const name = document.getElementById("prod-name").value;
    const price = document.getElementById("prod-price").value;
    const description = document.getElementById("prod-description").value;
    const category = document.getElementById("category-filter").value;
    const picture = document.getElementById("prod-picture").files[0];


    if (!name || !price || !description || !category || !picture) {
        spawnToast("Please fill all fields", "error");
        return;
    }

    console.log("Adding product with values:", {name, price, description, category, picture});

    const token = localStorage.getItem("token");

    ProductState.addProduct({name, price, description, category, picture}, token)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Server responded with status: ${res.status}`);
            }
            return res.json();
        })
        .then(product => {
            spawnToast("Product added successfully", "success");
            console.log("Product added:", product);
            // Optionally, refresh the product list or redirect
        })
        .catch(err => {
            console.error("Error adding product:", err);
            spawnToast("Cannot add product: " + err, "error");
        });

}
// todo fix
// only changes information that are provided
const changePersonalInfo = () => {
    const name = document.getElementById("edit-name").value;
    const lname = document.getElementById("edit-last-name").value;
    const email = document.getElementById("edit-email").value;
    const password = document.getElementById("edit-password").value;

    const user = UserState.getUserInfo();
    if (!user) {
        spawnToast("No user found", "error");
        return;
    }

    const token = localStorage.getItem("token");

    // Prepare the data to be sent
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.password = password;
    if (lname) data.lastname = lname;

    if (Object.keys(data).length === 0) {
        spawnToast("Please fill at least one field", "error");
        return;
    }

    UserState.updateUserInfo(data, token)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Server responded with status: ${res.status}`);
            }
            return res.json();
        })
        .then(updatedUser => {
            UserState.seUserInfo(updatedUser);
            spawnToast("Personal information updated successfully", "success");
            loadAccountPage(); // Reload the account page to reflect changes
        })
        .catch(err => {
            console.error("Error updating personal info:", err);
            spawnToast("Cannot update personal info: " + err, "error");
        });

}


const loadContent = (type) => {
    const content = document.getElementById("content");
    const token = localStorage.getItem("token")

    if (!content) {
        console.error("No content div found");
        return;
    }

    const buttonType = document.getElementById(type)

    // is this good?
    if (buttonType) {
        const activeButton = document.querySelector(".nav-btn.active");
        if (activeButton) {
            activeButton.classList.remove("active");
        }
        buttonType.classList.add("active");
    }


    switch (type) {
        case "my-products":
            const user = UserState.getUserInfo()
            // todo maybe improve
            const products = ProductState.fetchProducts({seller_id: user.user_uuid}, token)
            products.then(res => {
                if (!res.ok) {
                    throw new Error(`Server responded with status: ${res.status}`);
                }
                return res.json();
            }).then(products => {
                ProductState.setAllProducts(products);
                console.log("Products loaded:", products);
                let productsContent;
                if (products.length === 0) {
                    productsContent = `<p>No products found.</p>`;
                } else {
                    productsContent = products.map(product => `
                    <div class="product-card">
                        <div class="product-img">
                           <img src="http://localhost:900/images?product_id=${product.product_id}" alt="prod-img">
                        </div>
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p>$${product.price}</p>
                    </div>
                `).join("");
                }

                content.innerHTML = `
                    <div class="content-tab active" id="products-tab">
                        <div class="products-management">
                            <h2>My Products</h2>
                            <div class="products-grid">
                                ${productsContent}
                            </div>
                        </div>
                    </div>
                `;
            }).catch(error => {
                console.error("Error loading products:", error);
                spawnToast("Cannot load products: " + error, "error");

            });
            break
        case "add-product":
            loadCategories(token)
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
                    spawnToast("Cannot load categories: " + error, "error");
                    document.dispatchEvent(createPageChangeEvent("home"));
                });

            content.innerHTML = `
              <!-- Add product (only for Artisan) -->
                <div class="content-tab active" id="products-tab">
                    <div class="products-management">
                        <div class="form-group">
                            <label for="name">Name</label>
                            <input type="text" id="prod-name">
                        </div>
                        <div class="form-group">
                            <label for="price">Price ($)</label>
                            <input type="number" id="prod-price">
                        </div>
                        <div class="form-group">
                            <label for="description">Description</label>
                            <input type="email" id="prod-description">
                        </div>
                        <div class="form-group">
                            <label for="categories">Category</label>
                            <select id="category-filter" class="filter-select">
                                <option value="" disabled>Categories</option>
                                 <!-- Categories from db -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="picture">Picture</label>
                            <input type="file" id="prod-picture">
                        </div>
        
                        <button onclick="addArtisanProduct()" class="add-product-btn">
                            <i class="fas fa-plus"></i>Add Product
                        </button>
                    </div>
                </div>
        `;
            break

        case "settings":
            content.innerHTML = `
             <div class="content-tab active" id="settings-tab">
                <div class="settings-form">
                    <h3>Personal information (changes only the provided ones)</h3>
                        <div class="form-group">
                            <label for="edit-name">Name</label>
                            <input type="text" id="edit-name">
                        </div>
                         <div class="form-group">
                            <label for="edit-name">Last Name</label>
                            <input type="text" id="edit-last-name">
                        </div>
                        <div class="form-group">
                            <label for="edit-email">Email</label>
                            <input type="email" id="edit-email">
                        </div>
                        <div class="form-group">
                            <label for="edit-password">New Password</label>
                            <input type="password" id="edit-password">
                        </div>
                        <button onclick="changePersonalInfo()" type="submit" class="save-btn">Save</button>
                </div>
            </div>
            `
            break

        case "dashboard":
            content.innerHTML = `
            <div class="content-tab active" id="dashboard-tab">
                <h2>Dashboard</h2>
                <p>Welcome to your dashboard!</p>
                <!-- Add more dashboard content here -->
            </div>
            `
            break

        case "orders":
            const token = localStorage.getItem("token");
            if (!token) {
                content.innerHTML = `
        <div class="content-tab active" id="orders-tab">
            <h2>Orders</h2>
            <p>Autenticazione richiesta.</p>
        </div>
        `;
                return;
            }

            content.innerHTML = `
    <div class="content-tab active" id="orders-tab">
        <h2>Orders</h2>
        <p>Caricamento ordini...</p>
    </div>
    `;

            OrderState.fetchOrders(token).then(res => {
                if (!res.ok) {
                    throw new Error(`Server responded with status: ${res.status}`);
                }
                return res.json();
            }).then(orders => {
                OrderState.setOrders(orders);
                console.log("Orders loaded:", orders);

                let ordersContent = orders.length > 0 ?
                    orders.map(order => `
                <div class="order-card ${order.status}">
                    <h3>Order #${order.order_id}</h3>
                    <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
                    <p>Total: $${order.total_amount}</p>
                    <p>Items: ${order.items.map(item => `${item.name} (x${item.quantity})`).join(", ")}</p>
                    <p>Status: ${order.status}</p>
                </div>
            `).join("") :
                    "<p>Nessun ordine trovato.</p>";

                content.innerHTML = `
        <div class="content-tab active" id="orders-tab">
            <h2>Orders</h2>
            <div class="orders-management">
                <div class="orders-grid">
                    ${ordersContent}
                </div>
            </div>
        </div>
        `;
            }).catch(error => {
                console.error("Error loading orders:", error);
                spawnToast("Cannot load orders: " + error, "error");

                content.innerHTML = `
        <div class="content-tab active" id="orders-tab">
            <h2>Orders</h2>
            <p>Errore nel caricamento degli ordini.</p>
        </div>
        `;
            });
            break;
    }
}

window.loadCategories = loadCategories;
window.loadAccountPage = loadAccountPage;
window.loadContent = loadContent;
window.addArtisanProduct = addArtisanProduct;
window.changePersonalInfo = changePersonalInfo;
