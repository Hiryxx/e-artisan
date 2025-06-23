import express from "express";
import Report from "../lib/models/report.js";
import Product from "../lib/models/product.js";
import {db} from "../lib/server/server.js";
import Order from "../lib/models/order.js";
import User from "../lib/models/user.js";
const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management APIs
 */

const requireAdmin = (req, res, next) => {
    if (!req.user_uuid) {
        return res.status(403).json({ message: "Only for admins" });
    }
    const user = User.getUserById(req.user_uuid)
    if (!user || user.role_id !== 1) {
        return res.status(403).json({ message: "Accesso negato: solo per amministratori" });
    }
    next();
};

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Retrieve all reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   report_id:
 *                     type: string
 *                   product_id:
 *                     type: string
 *                   reporter_id:
 *                     type: string
 *                   reason:
 *                     type: string
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
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
router.get("/reports", requireAdmin, async (req, res) => {
    try {
        const reports = await Report.getAllReports();
        res.status(200).json(reports);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});

/**
 * @swagger
 * /admin/reports/history:
 *   get:
 *     summary: Retrieve history of all reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History of all reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   report_id:
 *                     type: string
 *                   product_id:
 *                     type: string
 *                   reporter_id:
 *                     type: string
 *                   reason:
 *                     type: string
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   resolved_at:
 *                     type: string
 *                     format: date-time
 *                   resolution_message:
 *                     type: string
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
router.get("/reports/history", requireAdmin, async (req, res) => {
    try {
        const history = await Report.getAllReportsHistory();
        res.status(200).json(history);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});

/**
 * @swagger
 * /admin/reports/{productId}/resolve:
 *   put:
 *     summary: Resolve reports for a specific product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Resolution message
 *     responses:
 *       200:
 *         description: Reports resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Segnalazione risolta con successo
 *                 resolved_count:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: No pending reports found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Nessun report pendente trovato per questo prodotto
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
router.put("/reports/:productId/resolve", requireAdmin, async (req, res) => {
    const { productId } = req.params;
    const { message } = req.body;

    try {
        const currentTime = new Date();

        const result = await db.dbConnection.execute(
            `UPDATE reports 
             SET status = 'resolved',
                 resolved_at = $1,
                 resolution_message = $2
             WHERE product_id = $3 AND status = 'pending'`,
            [currentTime, message || 'Risolto dall\'amministratore', productId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Nessun report pendente trovato per questo prodotto" });
        }

        res.status(200).json({
            message: "Segnalazione risolta con successo",
            resolved_count: result.rowCount
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});

/**
 * @swagger
 * /admin/product/{productId}:
 *   delete:
 *     summary: Delete a product and related data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to delete
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Message about the deletion
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prodotto rimosso con successo
 *                 archived_product:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prodotto non trovato
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
router.delete("/product/:productId", requireAdmin, async (req, res) => {
    const { productId } = req.params;
    const { message } = req.body;

    const client = await db.dbConnection.client;

    try {
        await client.query('BEGIN');

        const product = await Product.getProduct({product_id: productId});
        if (!product || product.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: "Prodotto non trovato" });
        }

        const productInfo = product[0];
        const currentTime = new Date();

        await client.query(
            `UPDATE reports
             SET status = 'resolved',
                 resolved_at = $1,
                 resolution_message = $2
             WHERE product_id = $3 AND status = 'pending'`,
            [currentTime, message || 'Prodotto rimosso dall\'amministratore', productId]
        );

        await client.query(
            'DELETE FROM orders WHERE item_id IN (SELECT item_id FROM stock WHERE product_id = $1)',
            [productId]
        );

        await client.query(
            'DELETE FROM stock WHERE product_id = $1',
            [productId]
        );


        await client.query(
            'DELETE FROM products WHERE product_id = $1',
            [productId]
        );

        await client.query('COMMIT');
        client.release();

        console.log(`Messaggio per l'artigiano ${productInfo.seller_id}: ${message}`);

        res.status(200).json({
            message: "Prodotto rimosso con successo",
            archived_product: {
                name: productInfo.name,
                price: productInfo.price
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        console.log(error);
        res.status(500).json({ message: "Errore del server: " + error.message });
    }
});

/**
 * @swagger
 * /admin/reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *               reason:
 *                 type: string
 *             required:
 *               - product_id
 *               - reason
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Segnalazione creata con successo
 *                 report_id:
 *                   type: string
 *       400:
 *         description: Missing data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dati mancanti
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
router.post("/reports", async (req, res) => {
    const { product_id, reason } = req.body;
    const reporter_id = req.user_uuid || null;

    try {
        if (!product_id || !reason) {
            return res.status(400).json({ message: "Dati mancanti" });
        }

        const reportId = await Report.createReport({
            product_id,
            reporter_id,
            reason
        });

        res.status(201).json({
            message: "Segnalazione creata con successo",
            report_id: reportId
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});

/**
 * @swagger
 * /admin/user-reports:
 *   get:
 *     summary: Get reports created by the authenticated user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of product IDs reported by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utente non autenticato
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
router.get("/user-reports", async (req, res) => {
    try {
        const reporter_id = req.user_uuid;
        if (!reporter_id) {
            return res.status(401).json({ message: "Utente non autenticato" });
        }

        const result = await db.dbConnection.execute(
            `SELECT product_id FROM reports
             WHERE reporter_id = $1 AND status = 'pending'`,
            [reporter_id]
        );

        res.status(200).json(result.rows.map(row => row.product_id));
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});


/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders with basic information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
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
 *                   user_name:
 *                     type: string
 *                   user_lastname:
 *                     type: string
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
router.get("/orders", async (req, res) => {
    try {
        const orders = await db.dbConnection.execute(
            `SELECT o.order_id, o.user_id, o.total_amount, o.status, o.created_at,
                    u.name as user_name, u.lastname as user_lastname
             FROM orders o
             JOIN users u ON o.user_id = u.user_uuid
             ORDER BY o.created_at DESC`
        );

        res.status(200).json(orders.rows);
    } catch (error) {
        console.error("Errore nel recupero ordini:", error);
        res.status(500).json({ message: "Errore del server" });
    }
});

/**
 * @swagger
 * /admin/orders/pending:
 *   get:
 *     summary: Get pending and shipped orders with detailed information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending orders with items details
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
 *                   user_name:
 *                     type: string
 *                   user_lastname:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product_id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         quantity:
 *                           type: integer
 *                         price:
 *                           type: number
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
router.get("/orders/pending", requireAdmin, async (req, res) => {
    try {
        const orders = await db.dbConnection.execute(
            `SELECT o.order_id, o.user_id, o.total_amount, o.status, o.created_at,
                    u.name as user_name, u.lastname as user_lastname,
                    json_agg(
                        json_build_object(
                            'product_id', oi.product_id,
                            'name', p.name,
                            'quantity', oi.quantity,
                            'price', oi.price
                        )
                    ) as items
             FROM orders o
             JOIN users u ON o.user_id = u.user_uuid
             LEFT JOIN order_items oi ON o.order_id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.product_id
             WHERE o.status = 'pending' OR o.status = 'shipped'
             GROUP BY o.order_id, o.user_id, o.total_amount, o.status, o.created_at, u.name, u.lastname
             ORDER BY o.created_at DESC`
        );

        res.status(200).json(orders.rows);
    } catch (error) {
        console.error("Errore nel recupero ordini pendenti:", error);
        res.status(500).json({ message: "Errore del server" });
    }
});

/**
 * @swagger
 * /admin/orders/{orderId}/status:
 *   put:
 *     summary: Update the status of an order
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stato dell'ordine aggiornato con successo
 *                 order_id:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Invalid or missing status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stato non valido
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
router.put("/orders/:orderId/status", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Stato mancante" });
        }

        // Valida lo stato
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Stato non valido" });
        }

        await Order.updateOrderStatus(orderId, status);

        res.status(200).json({
            message: "Stato dell'ordine aggiornato con successo",
            order_id: orderId,
            status: status
        });
    } catch (error) {
        console.error("Errore nell'aggiornamento dello stato:", error);
        res.status(500).json({ message: "Errore del server" });
    }
});

export default router;