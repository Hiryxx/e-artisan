import {db} from "../server/server.js";

export default class Product {
    static async newProduct(product) {
        const result = await db.dbConnection.execute(
            'INSERT INTO products (name, price, id_category, description, seller_id, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id',
            [product.name, product.price, product.id_category, product.description, product.seller_id, product.image_url]
        );

        return result.rows[0].product_id;
    }

    static async getAllProducts() {
        const result = await db.dbConnection.execute('SELECT * FROM products');

        return result.rows;
    }

    static async getProduct(filter) {
        let whereClause = '';
        let index = 1;
        for (const key in filter) {
            if (whereClause.length > 0) {
                whereClause += ' AND ';
            }
            if (key === 'name') {
                // For name, we want to use a LIKE clause for partial matches
                whereClause += `LOWER(p.${key}) LIKE LOWER($${index})`;
                filter[key] = `%${filter[key]}%`; // Add wildcards for LIKE
            } else if (key === 'min_price') {
                whereClause += `p.price >= ${"$" + index}`;
            } else if (key === 'max_price') {
                whereClause += `p.price <= ${"$" + index}`;
            } else {
                whereClause += `p.${key} = ${"$" + index}`;
            }
            index++;
        }

        if (whereClause.length === 0) {
            whereClause = '1=1'; // No filter, select all
        }


        const query = `SELECT p.*,
                              COUNT(s.item_id) as stock_count,
                              u.name           as seller_name,
                              u.lastname       as seller_lastname,
                              c.name           as category_name
                       FROM products p
                                LEFT JOIN stock s ON p.product_id = s.product_id
                                LEFT JOIN users u ON p.seller_id = u.user_uuid
                                LEFT JOIN categories c ON p.id_category = c.id_category
                       WHERE ${whereClause}
                       GROUP BY p.product_id, u.name, u.lastname, c.name
                       ORDER BY p.product_id DESC`;

        const values = Object.values(filter);
        const result = await db.dbConnection.execute(query, values);
        return result.rows;
    }


    static async deleteProduct(productId) {
        await db.dbConnection.execute(
            'DELETE FROM products WHERE product_id = $1',
            [productId]
        );
    }

    static async updateProduct(productId, updates) {
        // Costruisce dinamicamente la query di aggiornamento
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined && value !== null) {
                setClauses.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClauses.length === 0) {
            return null; // Nessun campo da aggiornare
        }

        values.push(productId);

        const query = `
            UPDATE products
            SET ${setClauses.join(', ')}
            WHERE product_id = $${paramIndex} RETURNING product_id
        `;

        const result = await db.dbConnection.execute(query, values);
        return result.rows[0].product_id;
    }

    static async removeStockByQuantity(productId, quantity) {
        // Ottieni i più recenti item di stock per questo prodotto
        const result = await db.dbConnection.execute(
            'SELECT item_id FROM stock WHERE product_id = $1 ORDER BY item_id DESC LIMIT $2',
            [productId, quantity]
        );

        // Rimuovi ogni item di stock
        for (const row of result.rows) {
            await db.dbConnection.execute(
                'DELETE FROM stock WHERE item_id = $1',
                [row.item_id]
            );
        }

        return result.rows.length; // Restituisci il numero di item effettivamente rimossi
    }

    static async addToStock(productId) {
        const result = await db.dbConnection.execute(
            'INSERT INTO stock (product_id) VALUES ($1) RETURNING item_id',
            [productId]
        );

        return result.rows[0].item_id;
    }


    static async removeFromStock(itemId) {
        await db.dbConnection.pool.query(
            'DELETE FROM stock WHERE item_id = $1',
            [itemId]
        );
    }

    static async getCategories() {
        return await db.dbConnection.execute(
            'SELECT * FROM categories'
        );
    }
}