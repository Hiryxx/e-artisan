import express from "express";
import Report from "../lib/models/report.js";
import Product from "../lib/models/product.js";
import {db} from "../lib/server/server.js";
const router = express.Router();

const requireAdmin = (req, res, next) => {
    //todo verificare se l'utente è un admin
    next();
};

router.get("/reports", requireAdmin, async (req, res) => {
    try {
        const reports = await Report.getAllReports();
        res.status(200).json(reports);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});

router.get("/reports/history", requireAdmin, async (req, res) => {
    try {
        const history = await Report.getAllReportsHistory();
        res.status(200).json(history);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});

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

export default router;