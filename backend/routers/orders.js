import express from "express";
import Order from "../lib/models/order.js";
import User from "../lib/models/user.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management APIs
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderData:
 *                 type: object
 *                 required: true
 *                 properties:
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product_id:
 *                           type: string
 *                         quantity:
 *                           type: integer
 *                         price:
 *                           type: number
 *               shippingInfo:
 *                 type: object
 *                 required: true
 *                 properties:
 *                   street:
 *                     type: string
 *                   number:
 *                     type: string
 *                   zipcode:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *               paymentInfo:
 *                 type: object
 *                 required: true
 *                 properties:
 *                   method:
 *                     type: string
 *                   transaction_id:
 *                     type: string
 *             required:
 *               - orderData
 *               - shippingInfo
 *               - paymentInfo
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 order_id:
 *                   type: string
 *       400:
 *         description: Invalid input or missing data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing data
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore del server durante la creazione dell'ordine
 */
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

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Retrieve all orders for the current user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   order_id:
 *                     type: string
 *                   user_id:
 *                     type: string
 *                   total_amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   shipping_info:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                       number:
 *                         type: string
 *                       zipcode:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore del server
 */
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

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Retrieve details of a specific order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_id:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 total_amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       price:
 *                         type: number
 *                 shipping_info:
 *                   type: object
 *                   properties:
 *                     street:
 *                       type: string
 *                     number:
 *                       type: string
 *                     zipcode:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                 payment_info:
 *                   type: object
 *                   properties:
 *                     method:
 *                       type: string
 *                     transaction_id:
 *                       type: string
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Accesso negato
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ordine non trovato
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore del server
 */
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