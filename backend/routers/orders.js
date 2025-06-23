import express from "express";
import Order from "../lib/models/order.js";
import User from "../lib/models/user.js";

const router = express.Router();


// POST /orders - Crea un nuovo ordine
router.post("/", async (req, res) => {
    try {
        const userId = req.user_uuid;
        console.log(userId);
        const { orderData, shippingInfo, paymentInfo } = req.body;

        // Validazione dati
        if (!orderData || !shippingInfo || !paymentInfo) {
            return res.status(400).json({ message: "Missing data" });
        }

        if (!orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ message: "The chart is empty" });
        }

        // Validazione campi spedizione
        const requiredShippingFields = ['street', 'number', 'zipcode', 'city', 'state'];
        for (const field of requiredShippingFields) {
            if (!shippingInfo[field]) {
                return res.status(400).json({ message: `Missing field: ${field}` });
            }
        }

        // Crea l'ordine
        const orderId = await Order.createOrder({
            orderData,
            shippingInfo,
            paymentInfo
        }, userId);

        res.status(201).json({
            message: "Order created successfully",
            order_id: orderId
        });

    } catch (error) {
        console.error("Errore nella creazione dell'ordine:", error);

        if (error.message.includes("Stock insufficiente")) {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({
            message: "Errore del server durante la creazione dell'ordine"
        });
    }
});

// GET /orders - Ottieni tutti gli ordini dell'utente corrente
router.get("/", async (req, res) => {
    try {
        const userId = req.user_uuid;
        const orders = await Order.getOrdersByUser(userId);

        res.status(200).json(orders);

    } catch (error) {
        console.error("Errore nel recupero ordini:", error);
        res.status(500).json({ message: "Errore del server" });
    }
});

// GET /orders/:orderId - Ottieni dettagli di un ordine specifico
router.get("/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user_uuid;

        const order = await Order.getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Ordine non trovato" });
        }

        // Verifica che l'ordine appartenga all'utente corrente (a meno che non sia admin)
        const user = await User.getUserById(userId);
        if (order.user_id !== userId && user.role_id !== 1) {
            return res.status(403).json({ message: "Accesso negato" });
        }

        res.status(200).json(order);

    } catch (error) {
        console.error("Errore nel recupero dell'ordine:", error);
        res.status(500).json({ message: "Errore del server" });
    }
});



export default router;