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
    if (!user) {
        console.error("No user found")
        switchPage("home")
        return;
    }

    const userDiv = document.getElementById("user-details")
    const accountNav = document.getElementById("account-nav")
    const accountContent = document.getElementById("account-content")

    if (!userDiv || !accountNav || !accountContent) {
        console.error("No div found")
        return;
    }


    userDiv.innerHTML = `
             <h2 id="user-name">${user.name} ${user.lastname}</h2>
             <p id="user-email">${user.email}</p>
                `


    // 2 user, 3 artisan
    if (user.role_id === 2) {
        accountNav.innerHTML = `
                    <button id="orders" onclick="loadContent('orders')" class="nav-btn" data-tab="orders">
                        <i class="fas fa-shopping-bag"></i>Orders
                    </button>
                      <button id="settings" onclick="loadContent('settings')" class="nav-btn" data-tab="settings">
                        <i class="fas fa-cog"></i>Settings
                    </button>
                `
        loadContent('orders')
    } else if (user.role_id === 3) { // or fa-plus-circle
        accountNav.innerHTML = `
                     <button id="my-products" onclick="loadContent('my-products')" class="nav-btn" data-tab="products">
                        <i class="fas fa-box"></i>I miei prodotti
                    </button>
                     <button id="add-product" onclick="loadContent('add-product')" class="nav-btn" data-tab="products">
                        <i class="fas fa-cart-plus"></i>Aggiungi prodotto
                    </button>
                    <button id="settings" onclick="loadContent('settings')" class="nav-btn" data-tab="settings">
                        <i class="fas fa-cog"></i>Impostazioni
                    </button>
                   `
        loadContent('my-products')

    }

}

const addArtisanProduct = () => {
    const name = document.getElementById("prod-name").value;
    const price = document.getElementById("prod-price").value;
    const description = document.getElementById("prod-description").value;
    const category = document.getElementById("category-filter").value;
    const stock = document.getElementById("prod-stock").value;
    const picture = document.getElementById("prod-picture").files[0];


    if (!name || !price || !description || !category || !stock || !picture) {
        spawnToast("Please fill all fields", "error");
        return;
    }

    if (isNaN(price) || price <= 0) {
        spawnToast("Price must be a valid number greater than 0", "error");
        return;
    }

    if (isNaN(stock) || stock <= 0) {
        spawnToast("Stock must be a valid number greater than 0", "error");
        return;
    }

    console.log("Adding product with values:", {name, price, description, category, picture});

    const token = localStorage.getItem("token");

    ProductState.addProduct({name, price, description, category, stock, picture}, token)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Server responded with status: ${res.status}`);
            }
            return res.json();
        })
        .then(product => {
            spawnToast("Product added successfully", "success");
            loadContent("my-products"); // Reload the products page
            // Optionally, refresh the product list or redirect
        })
        .catch(err => {
            console.error("Error adding product:", err);
            spawnToast("Cannot add product: " + err, "error");
        });

}
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
            spawnToast("Informazioni personali aggiornate con successo", "success");
            loadAccountPage(); // Reload the account page to reflect changes
        })
        .catch(err => {
            console.error("Error updating personal info:", err);
            spawnToast("Cannot update personal info: " + err, "error");
        });

}

const editProduct = (productId) => {
    productId = Number(productId);
    const product = ProductState.getAllProducts().find(p => p.product_id.toString() === productId.toString());

    if (!product) {
        spawnToast("Prodotto non trovato", "error");
        return;
    }

    ProductState.selectedProduct = product;

    const content = document.getElementById("content");
    content.innerHTML = `
        <div class="edit-product-container">
            <h2>Modifica Prodotto</h2>
            <div class="product-edit-grid">
                <div class="product-image-section">
                    <div class="current-image">
                        <img src="http://localhost:900/images?product_id=${product.product_id}" alt="Immagine Prodotto">
                    </div>
                    <div class="image-upload">
                        <label for="edit-prod-picture">Cambia Immagine</label>
                        <input type="file" id="edit-prod-picture" accept="image/*">
                    </div>
                </div>

                <div class="product-details-section">
                    <div class="form-group">
                        <label for="edit-prod-name">Nome Prodotto</label>
                        <input type="text" id="edit-prod-name" value="${product.name}" required>
                    </div>

                    <div class="form-group">
                        <label for="edit-prod-price">Prezzo</label>
                        <input type="number" id="edit-prod-price" value="${product.price}" step="0.01" min="0" required>
                    </div>

                    <div class="form-group">
                        <label for="edit-prod-description">Descrizione Prodotto</label>
                        <textarea id="edit-prod-description" required>${product.description}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="edit-category-filter">Categoria</label>
                        <select id="edit-category-filter" class="filter-select" required>
                            <option value="" disabled>Caricamento categorie...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="edit-prod-stock">Disponibilità</label>
                        <input type="number" id="edit-prod-stock" value="${product.stock_count}" min="0">
                    </div>

                    <div class="form-actions">
                        <button onclick="saveProductChanges()" class="save-btn">
                            Salva Modifiche
                        </button>
                        <button onclick="loadContent('my-products')" class="cancel-btn">
                            Annulla
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Carica le categorie
    const token = localStorage.getItem("token");
    loadCategories(token)
        .then(categories => {
            const categorySelect = document.getElementById("edit-category-filter");
            categorySelect.innerHTML = "";

            for (let category of categories) {
                const option = document.createElement("option");
                option.value = category.id_category;
                option.textContent = category.name;
                option.selected = (category.id_category === product.id_category);
                categorySelect.appendChild(option);
            }
        })
        .catch(error => {
            console.error("Errore nel caricamento delle categorie:", error);
            spawnToast("Impossibile caricare le categorie: " + error, "error");
        });
};


const saveProductChanges = () => {
    // Recupera il prodotto selezionato
    const product = ProductState.selectedProduct;
    if (!product) {
        spawnToast("Nessun prodotto selezionato", "error");
        return;
    }

    // Recupera i dati dal form
    const name = document.getElementById("edit-prod-name").value;
    const price = document.getElementById("edit-prod-price").value;
    const description = document.getElementById("edit-prod-description").value;
    const id_category = document.getElementById("edit-category-filter").value;
    const newStockCount = parseInt(document.getElementById("edit-prod-stock").value);
    const photoInput = document.getElementById("edit-prod-picture");

    // Validazione dei dati
    if (!name || !price || !description || !id_category || newStockCount < 0) {
        spawnToast("Completa tutti i campi obbligatori correttamente", "error");
        return;
    }

    if (isNaN(price) || price <= 0) {
        spawnToast("Il prezzo deve essere un numero valido maggiore di zero", "error");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        spawnToast("Devi essere autenticato per modificare un prodotto", "error");
        return;
    }

    // Calcola la variazione di stock
    const stockDifference = newStockCount - product.stock_count;

    // Funzione per aggiornare le info del prodotto (senza lo stock)
    const updateProductInfo = () => {
        // Controllo se c'è una nuova immagine
        if (photoInput.files && photoInput.files[0]) {
            // Aggiornamento con nuova immagine
            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', price);
            formData.append('description', description);
            formData.append('id_category', id_category);
            formData.append('photo', photoInput.files[0]);

            return fetch(`http://localhost:900/product/${product.product_id}/with-img`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
        } else {
            // Aggiornamento senza immagine
            const updates = {
                name,
                price,
                description,
                id_category
            };

            return fetch(`http://localhost:900/product/${product.product_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
        }
    };

// Prima aggiorniamo le informazioni del prodotto
    updateProductInfo()
        .then(res => {
            if (!res.ok) {
                throw new Error(`Il server ha risposto con status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            // Se c'è una variazione di stock, la gestiamo
            if (stockDifference !== 0) {
                if (stockDifference > 0) {
                    // Aggiungiamo stock
                    return fetch(`http://localhost:900/product/${product.product_id}/stock/${stockDifference}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } else if (stockDifference < 0) {
                    // Rimuoviamo stock (valore assoluto della differenza)
                    const quantityToRemove = Math.abs(stockDifference);
                    return fetch(`http://localhost:900/product/${product.product_id}/stock/remove/${quantityToRemove}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
            }
            return Promise.resolve();
        })
        .then(() => {
            spawnToast("Prodotto aggiornato con successo", "success");
            loadContent('my-products');
        })
        .catch(err => {
            console.error("Errore nell'aggiornamento del prodotto:", err);
            spawnToast("Impossibile aggiornare il prodotto: " + err.message, "error");
        });
}


const addStockToProduct = (productId, quantity) => {
    const token = localStorage.getItem("token");
    ProductState.addStockToProduct(productId, token, quantity).then(res => {
        if (!res.ok) {
            throw new Error(`Server responded with status: ${res.status}`);
        }
        return res.json();
    }).then(data => {
        spawnToast("Stock added successfully", "success");
        loadContent("my-products"); // Reload the products page
    }).catch(err => {
        console.error("Error adding stock to product:", err);
        spawnToast("Cannot add stock to product: " + err, "error");
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
            const products = ProductState.fetchProducts({seller_id: user.user_uuid}, token)
            products.then(res => {
                if (!res.ok) {
                    throw new Error(`Server responded with status: ${res.status}`);
                }
                return res.json();
            }).then(products => {
                ProductState.setAllProducts(products);
                let productsContent;
                if (products.length === 0) {
                    productsContent = `<p>No products found.</p>`;
                } else {
                    productsContent = products.map(product => `
                <div class="product-card">
                    <div class="product-img" onclick="editProduct('${product.product_id}')">
                       <img src="http://localhost:900/images?product_id=${product.product_id}" alt="prod-img">
                    </div>
                    <h3>${product.name}</h3>
                    
                    <p>${product.description.length > 30 ? product.description.substring(0, 30) + '...' : product.description}</p>

                    <p>$${product.price}</p>
                    <p>Stock: ${product.stock_count}</p>
                    <div class="add-stock-container">
                        <input type="number" id="stock-input-${product.product_id}" min="1" value="1" class="add-stock-input">
                        <button onclick="addStockToProduct('${product.product_id}', document.getElementById('stock-input-${product.product_id}').value)" class="add-stock-btn">Aggiungi Stock</button>
                        <button onclick="deleteProduct('${product.product_id}')" class="remove-all-stock-btn">Elimina Prodotto</button>
                    </div>
                </div>
                `)
                        .join('');
                }

                content.innerHTML = `
                    <div class="content-tab active" id="products-tab">
                        <div class="products-management">
                            <h2>I miei prodotti</h2>
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
                            <label for="name">Nome</label>
                            <input type="text" id="prod-name">
                        </div>
                        <div class="form-group">
                            <label for="price">Prezzo ($)</label>
                            <input type="number" id="prod-price">
                        </div>
                        <div class="form-group">
                            <label for="description">Descrizione</label>
                            <input type="text" id="prod-description">
                        </div>
                        <div class="form-group">
                            <label for="categories">Categoria</label>
                            <select id="category-filter" class="filter-select">
                                <option value="" disabled>Categories</option>
                                 <!-- Categories from db -->
                            </select>
                        </div>
                         <div class="form-group">
                            <label for="description">Stock</label>
                            <input type="number" id="prod-stock" min=1 value=1>
                        </div>
                        <div class="form-group">
                            <label for="picture">Immagine</label>
                            <input type="file" id="prod-picture">
                        </div>
        
                        <button onclick="addArtisanProduct()" class="add-product-btn">
                            <i class="fas fa-plus"></i>Aggiungi prodotto
                        </button>
                    </div>
                </div>
        `;
            break

        case "settings":
            content.innerHTML = `
             <div class="content-tab active" id="settings-tab">
                <div class="settings-form">
                    <h3 id="settings-title">Infomazioni personali (cambia solo quelle inserite)</h3>
                        <div class="form-group">
                            <label for="edit-name">Nome</label>
                            <input type="text" id="edit-name">
                        </div>
                         <div class="form-group">
                            <label for="edit-name">Cognome</label>
                            <input type="text" id="edit-last-name">
                        </div>
                        <div class="form-group">
                            <label for="edit-email">Email</label>
                            <input type="email" id="edit-email">
                        </div>
                        <div class="form-group">
                            <label for="edit-password">Nuova Password</label>
                            <input type="password" id="edit-password">
                        </div>
                        <button onclick="changePersonalInfo()" type="submit" class="save-btn">Save</button>
                </div>
            </div>
            `
            break

        case "orders":
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
const deleteProduct = (productId) => {
    if (!confirm("Sei sicuro di voler eliminare questo prodotto? Questa azione non può essere annullata.")) {
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        spawnToast("Devi essere autenticato per eliminare un prodotto", "error");
        return;
    }

    fetch(`http://localhost:900/product?product_id=${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Il server ha risposto con status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            spawnToast("Prodotto eliminato con successo", "success");
            loadContent('my-products'); // Ricarica la lista dei prodotti
        })
        .catch(err => {
            console.error("Errore nell'eliminazione del prodotto:", err);
            spawnToast("Impossibile eliminare il prodotto: " + err.message, "error");
        });
};

window.saveProductChanges = saveProductChanges;
window.editProduct = editProduct;
window.loadCategories = loadCategories;
window.loadAccountPage = loadAccountPage;
window.loadContent = loadContent;
window.addArtisanProduct = addArtisanProduct;
window.changePersonalInfo = changePersonalInfo;
window.addStockToProduct = addStockToProduct;
window.deleteProduct = deleteProduct;