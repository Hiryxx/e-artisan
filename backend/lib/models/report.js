import {db} from "../server/server.js";

export default class Report {
    static async createReport(report) {
        const result = await db.dbConnection.execute(
            'INSERT INTO reports (product_id, reporter_id, reason) VALUES ($1, $2, $3) RETURNING report_id',
            [report.product_id, report.reporter_id, report.reason]
        );
        return result.rows[0].report_id;
    }

    static async getAllReports() {
        const result = await db.dbConnection.execute(`
            SELECT r.*,
                   p.name as product_name,
                   p.price,
                   p.image_url,
                   u.name as seller_name,
                   u.lastname as seller_lastname,
                   u.user_uuid as seller_id,
                   ur.name as reporter_name,
                   ur.lastname as reporter_lastname,
                   p.product_id as active_product_id
            FROM reports r
                     LEFT JOIN products p ON r.product_id = p.product_id
                     LEFT JOIN users u ON p.seller_id = u.user_uuid
                     LEFT JOIN users ur ON r.reporter_id = ur.user_uuid
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        `);
        return result.rows;
    }

    static async getAllReportsHistory() {
        const result = await db.dbConnection.execute(`
        SELECT r.*,
               p.name as product_name,
               p.price,
               p.image_url,
               CASE
                   WHEN p.product_id IS NULL THEN 'Prodotto rimosso'
                   ELSE 'Prodotto attivo'
               END as product_status,
               ur.name as reporter_name,
               ur.lastname as reporter_lastname
        FROM reports r
        LEFT JOIN products p ON r.product_id = p.product_id
        LEFT JOIN users ur ON r.reporter_id = ur.user_uuid
        WHERE r.status = 'resolved'
        ORDER BY r.resolved_at DESC
        LIMIT 50
    `);
        return result.rows;
    }
}