import express from "express";
import multer from 'multer'
import Product from "../lib/models/product.js";
import {db} from "../lib/server/server.js";

const router = express.Router();


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/user-images/');
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({storage: storage});

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management APIs
 */

/**
 * @swagger
 * /product/categories:
 *   get:
 *     summary: Retrieve a list of product categories
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
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
 *                   example: Server error
 */
router.get("/categories", async (req, res) => {
    try {
        const categories = await Product.getCategories();

        res.status(200).json(categories.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
})

/**
 * @swagger
 * /product/with-img:
 *   post:
 *     summary: Add a new product with image
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               id_category:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               photo:
 *                 type: string
 *                 format: binary
 *             required:
 *               - name
 *               - price
 *               - id_category
 *               - photo
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product added successfully
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
router.post("/with-img", express.urlencoded({extended: true}), upload.single('photo'), async (req, res) => {
    const {name, description, price, id_category, stock} = req.body;

    try {
        const product = {
            name, description, price, id_category, image_url: req.file.path, seller_id: req.user_uuid
        }
        const product_id = await Product.newProduct(product)
        for (let i = 0; i < stock; i++) {
            await Product.addToStock(product_id);
        }
        res.status(201).json({message: "Product added successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }

})



/**
 * @swagger
 * /product/{product_id}/stock/{stock_number}:
 *   post:
 *     summary: Add stock to existing product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: stock_number
 *         required: true
 *         schema:
 *           type: integer
 *         description: Number of stock items to add
 *     responses:
 *       200:
 *         description: Stock added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stock added successfully
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
router.post("/:product_id/stock/:stock_number", async (req, res) => {
    const {product_id, stock_number} = req.params;

    try {
        for (let i = 0; i < stock_number; i++) {
            await Product.addToStock(product_id);
        }
        res.status(200).json({message: "Stock added successfully"});
    } catch
        (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }

})

/**
 * @swagger
 * /product/{product_id}:
 *   put:
 *     summary: Aggiorna un prodotto senza immagine
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del prodotto da modificare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               id_category:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Prodotto aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prodotto aggiornato con successo
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore del server
 */
router.put("/:product_id", async (req, res) => {
    const { product_id } = req.params;
    const updates = req.body;

    try {
        await Product.updateProduct(product_id, updates);
        res.status(200).json({ message: "Prodotto aggiornato con successo" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});

/**
 * @swagger
 * /product/{product_id}/with-img:
 *   put:
 *     summary: Aggiorna un prodotto con immagine
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del prodotto da modificare
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               id_category:
 *                 type: integer
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Prodotto aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prodotto aggiornato con successo
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore del server
 */
router.put("/:product_id/with-img", express.urlencoded({extended: true}), upload.single('photo'), async (req, res) => {
    const { product_id } = req.params;
    const { name, description, price, id_category } = req.body;

    try {
        const updates = {
            name,
            description,
            price,
            id_category
        };

        if (req.file) {
            updates.image_url = req.file.path;
        }

        await Product.updateProduct(product_id, updates);
        res.status(200).json({ message: "Prodotto aggiornato con successo" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Errore del server" });
    }
});


/**
 * @swagger
 * /product/{product_id}/stock/remove/{stock_number}:
 *   post:
 *     summary: Rimuove stock da un prodotto esistente
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del prodotto
 *       - in: path
 *         name: stock_number
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quantità di stock da rimuovere
 *     responses:
 *       200:
 *         description: Stock rimosso con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stock rimosso con successo
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore del server
 */
router.post("/:product_id/stock/remove/:stock_number", async (req, res) => {
    const {product_id, stock_number} = req.params;

    try {
        await Product.removeStockByQuantity(product_id, stock_number);
        res.status(200).json({message: "Stock rimosso con successo"});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Errore del server"});
    }
});


/**
 * @swagger
 * /product:
 *   get:
 *     summary: Get products with optional filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *       - in: query
 *         name: id_category
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   image_url:
 *                     type: string
 *                   id_category:
 *                     type: integer
 *                   seller_id:
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
 *                   example: Server error
 */


router.get("/", async (req, res) => {
    try {
        let params = req.query || {};

        // Convert search parameter to name parameter for the model
        if (params.search) {
            params.name = params.search;
            delete params.search;
        }

        const products = await Product.getProduct(params)
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
})

/**
 * @swagger
 * /product:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to delete
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
 *                   example: Product deleted successfully
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
router.delete("/", async (req, res) => {
    const { product_id } = req.query;
    const client = await db.dbConnection.client;

    try {
        await client.query('BEGIN');

        // Verifica che il prodotto esista
        const product = await Product.getProduct({product_id});
        if (!product || product.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: "Prodotto non trovato" });
        }

        // Elimina prima i riferimenti in stock
        await client.query(
            'DELETE FROM stock WHERE product_id = $1',
            [product_id]
        );

        // Elimina i riferimenti in order_items se necessario
        await client.query(
            'DELETE FROM order_items WHERE product_id = $1',
            [product_id]
        );

        // Infine elimina il prodotto
        await client.query(
            'DELETE FROM products WHERE product_id = $1',
            [product_id]
        );

        await client.query('COMMIT');
        client.release();

        res.status(200).json({ message: "Prodotto eliminato con successo" });
    } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        console.log(error);
        res.status(500).json({ message: "Errore del server: " + error.message });
    }
});


export default router;