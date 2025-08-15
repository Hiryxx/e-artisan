// Funzione per caricare la pagina di pagamento
const loadPaymentPage = () => {
    // Verifica che ci siano dati di spedizione
    const shippingInfo = JSON.parse(localStorage.getItem("shippingInfo"));
    if (!shippingInfo) {
        spawnToast("Devi prima inserire i dati di spedizione", "warning");
        switchPage("checkout");
        return;
    }

    // Carica le informazioni del carrello
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

    // Verifica che il carrello non sia vuoto
    if (cartItems.length === 0) {
        spawnToast("Il carrello è vuoto", "warning");
        switchPage("shopping_cart");
        return;
    }

    // Visualizza indirizzo di spedizione
    document.getElementById("shipping-address").innerHTML = `
        ${shippingInfo.street}, ${shippingInfo.number}<br>
        ${shippingInfo.zipcode} ${shippingInfo.city} (${shippingInfo.state})
    `;

    // Visualizza gli articoli nel carrello
    const orderItemsList = document.getElementById("order-items-list");
    let total = 0;

    orderItemsList.innerHTML = '';
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        orderItemsList.innerHTML += `
            <li>${item.name} x${item.quantity} - €${itemTotal.toFixed(2)}</li>
        `;
    });

    // Aggiorna il totale
    document.getElementById("total-amount").textContent = total.toFixed(2);

    // Aggiungi event listener al form
    document.getElementById("payment-form").addEventListener("submit", handlePaymentSubmit);

    // Formattazione automatica del numero della carta
    document.getElementById("card-number").addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';

        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }

        e.target.value = formattedValue;
    });

    // Formattazione automatica della data di scadenza
    document.getElementById("expiry-date").addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            const month = parseInt(value.substring(0, 2));
            // Controlla che il mese sia valido (1-12)
            if (month < 1 || month > 12) {
                e.target.value = '';
                spawnToast("Il mese deve essere compreso tra 1 e 12", "error");
                return;
            }
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

};

// Funzione per tornare alla pagina di checkout
const goBackToCheckout = () => {
    document.dispatchEvent(createPageChangeEvent("checkout"));
};

const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    // Validazione della data di scadenza
    const expiryDate = document.getElementById("expiry-date").value;
    const [month, year] = expiryDate.split('/').map(num => parseInt(num));

    // Ottieni la data corrente
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Prende le ultime due cifre dell'anno
    const currentMonth = currentDate.getMonth() + 1; // getMonth() restituisce 0-11

    // Validazione del mese e dell'anno
    if (month < 1 || month > 12) {
        spawnToast("Il mese di scadenza non è valido", "error");
        return;
    }

    // Controlla se la carta è scaduta
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        spawnToast("La carta di credito è scaduta", "error");
        return;
    }

    spawnToast("Elaborazione dell'ordine in corso...", "info");

    try {
        // 1. Recupera il token per l'autenticazione
        const token = localStorage.getItem("token");
        if (!token) {
            spawnToast("Sessione scaduta, effettua nuovamente il login", "error");
            switchPage("login");
            return;
        }

        // 2. Recupera i dati di spedizione dal localStorage
        const shippingInfo = JSON.parse(localStorage.getItem("shippingInfo"));
        if (!shippingInfo) {
            spawnToast("Informazioni di spedizione mancanti", "error");
            switchPage("checkout");
            return;
        }

        // 3. Recupera i dati del carrello
        const cartItems = JSON.parse(localStorage.getItem("cartItems"));
        if (!cartItems || cartItems.length === 0) {
            spawnToast("Il carrello è vuoto", "error");
            switchPage("shopping_cart");
            return;
        }

        // 4. Calcola il totale dell'ordine
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 5. Prepara i dati dell'ordine
        const orderData = {
            items: cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: totalAmount
        };

        // 6. Ottieni i dati di pagamento dal form (solo per validazione)
        const formData = new FormData(e.target);
        const paymentInfo = {
            paymentMethod: "credit_card" // Metodo di pagamento fisso
        };

        // 7. Invia i dati al server
        const response = await fetch("http://localhost:900/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                orderData,
                shippingInfo,
                paymentInfo
            })
        });

        // 8. Gestisci la risposta
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Si è verificato un errore durante l'elaborazione dell'ordine");
        }

        const data = await response.json();

        // 9. Ordine completato con successo
        localStorage.removeItem("cartItems");
        CartState.setCartItems([]);
        localStorage.removeItem("shippingInfo");

        spawnToast("Ordine completato con successo!", "success");

        // Mostra un messaggio di conferma
        document.getElementById("payment-section").innerHTML = `
            <div class="order-confirmation">
                <h2>Grazie per il tuo ordine!</h2>
                <p>Il tuo ordine #${data.order_id} è stato ricevuto e verrà elaborato al più presto.</p>
                <button class="btn btn-primary" onclick="switchPage('home')">Torna alla home</button>
            </div>
        `;
    } catch (error) {
        console.error("Errore nel processo di pagamento:", error);
        spawnToast("Errore: " + error.message, "error");
    }
};

window.loadPaymentPage = loadPaymentPage;
window.handlePaymentSubmit = handlePaymentSubmit;
window.goBackToCheckout = goBackToCheckout;