import {db} from "../server/server.js";

export default class Order {
    static async createOrder(orderData, userId) {
        const client = await db.dbConnection.client;

        try {
            await client.query('BEGIN');

            // 1. Crea le informazioni di spedizione
            const shipmentResult = await client.query(
                `INSERT INTO shipment_infos (street, number, zipcode, city, state) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING shipment_id`,
                [
                    orderData.shippingInfo.street,
                    orderData.shippingInfo.number,
                    orderData.shippingInfo.zipcode,
                    orderData.shippingInfo.city,
                    orderData.shippingInfo.state
                ]
            );
            const shipmentId = shipmentResult.rows[0].shipment_id;

            // 2. Crea le informazioni di pagamento
            const paymentResult = await client.query(
                `INSERT INTO payment_infos (payment_method) 
                 VALUES ($1) 
                 RETURNING payment_id`,
                [orderData.paymentInfo.paymentMethod]
            );
            const paymentId = paymentResult.rows[0].payment_id;

            // 3. Crea l'ordine principale
            const orderResult = await client.query(
                `INSERT INTO orders (user_id, payment_id, shipment_id, total_amount, status) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING order_id`,
                [userId, paymentId, shipmentId, orderData.orderData.totalAmount, 'pending']
            );
            const orderId = orderResult.rows[0].order_id;

            // 4. Crea gli elementi dell'ordine
            for (const item of orderData.orderData.items) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, price) 
                     VALUES ($1, $2, $3, $4)`,
                    [orderId, item.product_id, item.quantity, item.price]
                );

                // 5. Rimuovi gli articoli dallo stock
                const stockItems = await client.query(
                    `SELECT item_id FROM stock 
                     WHERE product_id = $1 
                     LIMIT $2`,
                    [item.product_id, item.quantity]
                );

                if (stockItems.rows.length < item.quantity) {
                    throw new Error(`Stock insufficiente per il prodotto ${item.product_id}`);
                }

                for (const stockItem of stockItems.rows) {
                    await client.query(
                        'DELETE FROM stock WHERE item_id = $1',
                        [stockItem.item_id]
                    );
                }
            }

            await client.query('COMMIT');
            client.release();

            return orderId;

        } catch (error) {
            await client.query('ROLLBACK');
            client.release();
            throw error;
        }
    }

    //Update Order status
    static async updateOrderStatus(orderId, status) {
        const client = await db.dbConnection.client;

        try {
            await client.query('BEGIN');

            const result = await client.query(
                `UPDATE orders 
                 SET status = $1 
                 WHERE order_id = $2 
                 RETURNING *`,
                [status, orderId]
            );

            if (result.rows.length === 0) {
                throw new Error('Order not found');
            }

            await client.query('COMMIT');
            client.release();

            return result.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            client.release();
            throw error;
        }
    }


    static async getOrdersByUser(userId) {
        const result = await db.dbConnection.execute(
            `WITH order_items_info AS (
                SELECT oi.order_id,
                       jsonb_agg(
                               jsonb_build_object(
                                       'name', p.name,
                                       'quantity', oi.quantity,
                                       'price', oi.price,
                                       'product_id', p.product_id
                               )
                       ) as items
                FROM order_items oi
                         JOIN products p ON oi.product_id = p.product_id
                GROUP BY oi.order_id
            )
             SELECT o.*,
                    pi.payment_method,
                    si.street, si.number, si.zipcode, si.city, si.state,
                    COALESCE(oii.items, '[]'::jsonb) as items
             FROM orders o
                      JOIN payment_infos pi ON o.payment_id = pi.payment_id
                      JOIN shipment_infos si ON o.shipment_id = si.shipment_id
                      LEFT JOIN order_items_info oii ON o.order_id = oii.order_id
             WHERE o.user_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );

        return result.rows;
    }

    static async getOrderById(orderId) {
        const orderResult = await db.dbConnection.execute(
            `SELECT o.*, 
                    pi.payment_method,
                    si.street, si.number, si.zipcode, si.city, si.state,
                    u.name as user_name, u.lastname as user_lastname, u.email
             FROM orders o
             JOIN payment_infos pi ON o.payment_id = pi.payment_id
             JOIN shipment_infos si ON o.shipment_id = si.shipment_id
             JOIN users u ON o.user_id = u.user_uuid
             WHERE o.order_id = $1`,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return null;
        }

        const order = orderResult.rows[0];

        // Recupera gli articoli dell'ordine
        const itemsResult = await db.dbConnection.execute(
            `SELECT oi.*, p.name as product_name, p.description, p.image_url
             FROM order_items oi
             JOIN products p ON oi.product_id = p.product_id
             WHERE oi.order_id = $1`,
            [orderId]
        );

        order.items = itemsResult.rows;

        return order;
    }

}