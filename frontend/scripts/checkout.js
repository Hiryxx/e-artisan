// Funzione per verificare se l'utente è loggato
const checkUserAuthentication = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return false;
    }

    try {
        const response = await fetch("http://localhost:900/auth/token/validate", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        return data.valid;
    } catch (error) {
        console.error("Errore nella validazione del token:", error);
        return false;
    }
};

const proceedToCheckout = async () => {
    const cartItems = CartState.getCartItems();
    const storedCartItems = JSON.parse(localStorage.getItem("cartItems"));

    if ((!cartItems || cartItems.length === 0) && (!storedCartItems || storedCartItems.length === 0)) {
        spawnToast("Il carrello è vuoto", "warning");
        return;
    }

    const isAuthenticated = await checkUserAuthentication();

    if (!isAuthenticated) {
        spawnToast("Devi effettuare il login per continuare", "error");
        return;
    }

    document.dispatchEvent(createPageChangeEvent("checkout"));
};

const loadCheckoutPage = () => {
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const orderItemsDiv = document.getElementById("order-items");
    const totalAmountSpan = document.getElementById("total-amount");

    if (cartItems.length === 0) {
        orderItemsDiv.innerHTML = '<p>Nessun articolo nel carrello</p>';
        totalAmountSpan.textContent = "0.00";
        return;
    }

    let total = 0;
    orderItemsDiv.innerHTML = '';

    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        orderItemsDiv.innerHTML += `
            <div class="order-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                </div>
                <div class="item-price">€${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });

    totalAmountSpan.textContent = total.toFixed(2);

    // Gestisci il submit del form
    const shippingForm = document.getElementById("shipping-form");
    shippingForm.addEventListener("submit", handleShippingSubmit);
};

const handleShippingSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const shippingInfo = {
        street: formData.get("street"),
        number: formData.get("number"),
        zipcode: formData.get("zipcode"),
        city: formData.get("city"),
        state: formData.get("state")
    };

    // Salva le informazioni di spedizione nel localStorage
    localStorage.setItem("shippingInfo", JSON.stringify(shippingInfo));

    // Vai alla pagina di pagamento
    document.dispatchEvent(createPageChangeEvent("payment"));
};

// Funzione per tornare al carrello
const goBackToCart = () => {
    document.dispatchEvent(createPageChangeEvent("shopping_cart"));
};

// Funzione per calcolare e mostrare il totale nel carrello
const updateCartTotal = () => {
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const totalAmountSpan = document.getElementById("cart-total-amount");

    if (totalAmountSpan) {
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalAmountSpan.textContent = total.toFixed(2);
    }
};

// Esporta le funzioni
window.proceedToCheckout = proceedToCheckout;
window.loadCheckoutPage = loadCheckoutPage;
window.goBackToCart = goBackToCart;
window.updateCartTotal = updateCartTotal;