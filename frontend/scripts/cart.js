let loadCartPage = () => {
    let cartItems = CartState.getCartItems() // at least always []
    const itemToAdd = CartState.getItemToAdd()

    const storedCartItems = JSON.parse(localStorage.getItem("cartItems"))

    if (storedCartItems && cartItems.length === 0 && !itemToAdd)
        cartItems.push(...storedCartItems)

    if (itemToAdd) {
        // check if the item is already in the cart
        const existingItemIndex = cartItems.findIndex(item => item.product_id === itemToAdd.product_id)
        if (existingItemIndex !== -1) {
            if (cartItems[existingItemIndex].quantity + itemToAdd.quantity > itemToAdd.stock_count) {
                spawnToast("Cannot increase quantity above: " + itemToAdd.stock_count, "error")
                console.warn("Cannot add more than stock count. Max is: " + itemToAdd.stock_count)
            } else {
                cartItems[existingItemIndex].quantity += itemToAdd.quantity
            }
        } else {
            cartItems.push(itemToAdd)
        }

        CartState.setCartItems(cartItems)
        localStorage.setItem("cartItems", JSON.stringify(cartItems))
        CartState.setItemToAdd(null) // reset item to add
    }

    // getting them from local storage

    console.log("Loading cart items from local storage", storedCartItems)

    const cartDiv = document.getElementById("cart-items")

    // Calcola il totale
    let total = 0;

    if (cartItems.length === 0) {
        cartDiv.innerHTML = `
        <div class="cart-empty">
            <p>
                Your cart is empty
            </p>
        </div>
        `
        // Nascondi il footer del carrello se è vuoto
        const cartFooter = document.getElementById("cart-footer")
        if (cartFooter) {
            cartFooter.style.display = 'none'
        }
    } else {
        // Mostra il footer del carrello se ci sono articoli
        const cartFooter = document.getElementById("cart-footer")
        if (cartFooter) {
            cartFooter.style.display = 'block'
        }
    }

    for (let prod of cartItems) {
        if (!prod || !prod.product_id) {
            continue
        }

        // Aggiungi al totale
        total += prod.price * prod.quantity;

        cartDiv.innerHTML += `
           <div class="cart-item">
                <div id="cart-image">
                    <img src="http://localhost:900/images?product_id=${prod.product_id}" alt="">
                </div>
                <div class="cart-info">
                    <div class="cart-title">
                         ${prod.name}
                    </div>
                    <div class="cart-price">
                        €${prod.price}
                    </div>
                    <div onclick="removeProdFromCart(${prod.product_id})" class="cart-remove">
                        Remove
                    </div>
                </div>
                <div class="cart-quantity">
                    <div class="quantity-minus" onclick="modifyQuantity(${prod.product_id}, -1, ${prod.stock_count})">
                     -
                    </div>
                    <p>
                        ${prod.quantity}
                    </p>
                    <div class="quantity-plus" onclick="modifyQuantity(${prod.product_id}, 1, ${prod.stock_count})">
                     +
                    </div>
                </div>
        </div>
        `
    }

    // Aggiorna il totale nel DOM
    updateCartTotal();
}



let modifyQuantity = (productId, quantity, maxQuantity) => {
    let cartItems = localStorage.getItem("cartItems")
    if (!cartItems) {
        console.error("No cart items found in local storage")
        return
    }

    cartItems = JSON.parse(cartItems)
    const itemIndex = cartItems.findIndex(item => item.product_id === productId)

    if (itemIndex === -1) {
        console.error("Product not found in cart")
        return
    }

    // Modify the quantity
    if (quantity < 0 && cartItems[itemIndex].quantity <= 1) {
        console.warn("Cannot reduce quantity below 1")
        spawnToast("Cannot reduce quantity below 1", "error")
        return
    }
    // ensure maximum quantity is not exceeded. Max is product stock count.

    if (quantity > 0 && cartItems[itemIndex].quantity >= maxQuantity) {
        console.warn("Cannot increase quantity above " + maxQuantity)
        spawnToast("Cannot increase quantity above " + maxQuantity, "error")
        return
    }

    cartItems[itemIndex].quantity += quantity

    CartState.setCartItems(cartItems)
    localStorage.setItem("cartItems", JSON.stringify(cartItems))

    document.dispatchEvent(createPageChangeEvent("shopping_cart"));
}


let removeProdFromCart = (productId) => {
    let cartItems = localStorage.getItem("cartItems")
    if (!cartItems) {
        console.error("No cart items found in local storage")
        return
    }

    cartItems = JSON.parse(cartItems)
    const newCartItems = cartItems.filter(item => item.product_id !== productId)
    CartState.setCartItems(newCartItems)
    localStorage.setItem("cartItems", JSON.stringify(newCartItems))

    document.dispatchEvent(createPageChangeEvent("shopping_cart"));
}

/**
 * Go to shopping cart with product
 * @param productId JSON string of product object
 */
let goToShoppingCartWithProduct = (productId) => {
    console.log("Trying to shopping cart with product id: ", productId)

    ProductState.fetchProducts({product_id: productId}).then((res) => {
        if (!res.ok) {
            throw new Error(`Server responded with status: ${res.status}`);
        }
        return res.json();
    }).then(products => {
        if (products.length === 0) {
            console.error("No product found with id: ", productId)
            return null
        }
        let productForCart = products[0]
        productForCart['quantity'] = 1 // default quantity
        console.log("Going to shopping cart with product: ", products[0])
        CartState.setItemToAdd(productForCart)
        document.dispatchEvent(createPageChangeEvent("shopping_cart"));
    })

}

let addProductToCart = (productId) => {
    // todo add to cart
}

window.loadCartPage = loadCartPage;
window.modifyQuantity = modifyQuantity;
window.removeProdFromCart = removeProdFromCart;
window.goToShoppingCartWithProduct = goToShoppingCartWithProduct;
window.addProductToCart = addProductToCart;