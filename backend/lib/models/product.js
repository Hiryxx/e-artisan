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
            whereClause += `p.${key} = ${"$" + index}`;
            index++;
        }

        if (whereClause.length === 0) {
            whereClause = '1=1'; // No filter, select all
        }

        const query = `SELECT p.*, COUNT(s.item_id) as stock_count, u.name as seller_name, u.lastname as seller_lastname
                       FROM products p
                                LEFT JOIN stock s ON p.product_id = s.product_id
                                LEFT JOIN users u ON p.seller_id = u.user_uuid
                       WHERE ${whereClause}
                       GROUP BY p.product_id, u.name, u.lastname`;
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
}