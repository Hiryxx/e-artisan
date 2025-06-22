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
                console.log("Categories loaded:", fetchedCategories);
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
                    <button id="statistics" onclick="loadContent('statistics')" class="nav-btn" data-tab="statistics">
                        <i class="fas fa-chart-line"></i>Statistics
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
    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;
    const description = document.getElementById("description").value;
    const category = document.getElementById("categories").value;
    const picture = document.getElementById("picture").files[0];


    if (!name || !price || !description || !category || !picture) {
        spawnToast("Please fill all fields", "error");
        return;
    }

    console.log("Adding product with values:", {name, price, description, category, picture});
    /*
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

     */
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
                    const categoriesDiv = document.getElementById("categories");
                    console.log("Categories aaa: ", categories)
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
                            <input type="text" id="name">
                        </div>
                        <div class="form-group">
                            <label for="price">Price ($)</label>
                            <input type="number" id="price">
                        </div>
                        <div class="form-group">
                            <label for="description">Description</label>
                            <input type="email" id="description">
                        </div>
                        <div class="form-group">
                            <label for="categories">Category</label>
                            <select id="categories" name="category">
                                <option value="" disabled>Categories</option>
                                <!-- Categories from db -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="picture">Picture</label>
                            <input type="file" id="picture">
                        </div>
        
                        <button onclick="addArtisanProduct()" class="add-product-btn">
                            <i class="fas fa-plus"></i>Add Product
                        </button>
                        <div class="products-grid">
                            <!-- I prodotti verranno inseriti dinamicamente qui -->
                        </div>
                    </div>
                </div>
        `;
            break

        case "statistics":
            content.innerHTML = `
            `
            break

        case "settings":
            content.innerHTML = `
             <div class="content-tab active" id="settings-tab">
                <div class="settings-form">
                    <h3>Personal information</h3>
                    <form id="personal-info-form">
                        <div class="form-group">
                            <label for="edit-name">Name</label>
                            <input type="text" id="edit-name">
                        </div>
                        <div class="form-group">
                            <label for="edit-email">Email</label>
                            <input type="email" id="edit-email">
                        </div>
                        <div class="form-group">
                            <label for="edit-password">New Password</label>
                            <input type="password" id="edit-password">
                        </div>
                        <button type="submit" class="save-btn">Save</button>
                    </form>
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
            content.innerHTML = `
            <div class="content-tab active" id="orders-tab">
                <h2>Orders</h2>
                <p>Your orders will be displayed here.</p>
                <!-- Orders will be dynamically loaded here -->
            </div>
            `
            break
    }
}

window.loadCategories = loadCategories;
window.loadAccountPage = loadAccountPage;
window.loadContent = loadContent;
window.addArtisanProduct = addArtisanProduct;
