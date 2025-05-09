import {db} from "../server/server.js";

export default class Product {
    static async newProduct(product) {
        const result = await db.dbConnection.pool.query(
            'INSERT INTO products (productName, price, id_category, description, seller_id, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id',
            [product.productName, product.price, product.id_category, product.description, product.seller_id, product.image_url]
        );

        return result.rows[0].product_id;
    }

    static async getAllProducts() {
        const result = await db.dbConnection.pool.query('SELECT * FROM products');

        return result.rows;
    }

    /**
     *
     * @param filter Object containing the filter to apply to the where query (e.g., { id_category: 1 })
     * @returns {Promise<void>}
     */
    static async getProduct(filter) {
        let whereClause = '';
        let index = 1;
        for (const key in filter) {
            if (whereClause.length > 0) {
                whereClause += ' AND ';
            }
            whereClause += `${key} = ${"$"+index}`;
            index++;
        }

        if (whereClause.length === 0) {
            whereClause = '1=1'; // No filter, select all
        }

        const query = `SELECT * FROM products WHERE ${whereClause}`;
        console.log(query);
        const values = Object.values(filter);
        console.log(values);

        const result = await db.dbConnection.pool.query(query, values);

        return result.rows;
    }
    static async deleteProduct(productId) {
        await db.dbConnection.pool.query(
            'DELETE FROM products WHERE product_id = $1',
            [productId]
        );
    }

    static async addToStock(productId) {
        const result = await db.dbConnection.pool.query(
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
}