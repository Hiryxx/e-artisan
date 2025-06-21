import express from "express";
import Order from "../lib/models/order.js";
import User from "../lib/models/user.js";

const router = express.Router();

// Middleware per verificare che l'utente sia admin
const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.getUserById(req.user_uuid);
        if (!user || user.role_id !== 1) {
            return res.status(403).json({ message: "Accesso negato" });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore del server" });
    }
};

// POST /orders - Crea un nuovo ordine
router.post("/", async (req, res) => {
    try {
        const userId = req.user_uuid;
        const { orderData, shippingInfo, paymentInfo } = req.body;

        // Validazione dati
        if (!orderData || !shippingInfo || !paymentInfo) {
            return res.status(400).json({ message: "Dati mancanti" });
        }

        if (!orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ message: "Il carrello è vuoto" });
        }

        // Validazione campi spedizione
        const requiredShippingFields = ['street', 'number', 'zipcode', 'city', 'state'];
        for (const field of requiredShippingFields) {
            if (!shippingInfo[field]) {
                return res.status(400).json({ message: `Campo mancante: ${field}` });
            }
        }

        // Crea l'ordine
        const orderId = await Order.createOrder({
            orderData,
            shippingInfo,
            paymentInfo
        }, userId);

        res.status(201).json({
            message: "Ordine creato con successo",
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

// ADMIN ROUTES

// GET /orders/admin/all - Ottieni tutti gli ordini (solo admin)
router.get("/admin/all", requireAdmin, async (req, res) => {
    try {
        const orders = await Order.getAllOrders();
        res.status(200).json(orders);

    } catch (error) {
        console.error("Errore nel recupero ordini:", error);
        res.status(500).json({ message: "Errore del server" });
    }
});

// GET /orders/admin/status/:status - Ottieni ordini per stato (solo admin)
router.get("/admin/status/:status", requireAdmin, async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Stato non valido. Stati validi: " + validStatuses.join(", ")
            });
        }

        const orders = await Order.getOrdersByStatus(status);
        res.status(200).json(orders);

    } catch (error) {
        console.error("Errore nel recupero ordini:", error);
        res.status(500).json({ message: "Errore del server" });
    }
});

// PUT /orders/:orderId/status - Aggiorna lo stato di un ordine (solo admin)
router.put("/:orderId/status", requireAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Stato non valido. Stati validi: " + validStatuses.join(", ")
            });
        }

        const updatedOrder = await Order.updateOrderStatus(orderId, status);

        if (!updatedOrder) {
            return res.status(404).json({ message: "Ordine non trovato" });
        }

        res.status(200).json({
            message: "Stato ordine aggiornato con successo",
            order: updatedOrder
        });

    } catch (error) {
        console.error("Errore nell'aggiornamento dello stato:", error);
        res.status(500).json({ message: "Errore del server" });
    }
});

export default router;