import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

export class TestHelpers {
    static generateToken(userData) {
        return jwt.sign(
            { user_uuid: userData.user_uuid },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    }

    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    static createTestImage(filename = 'test-image.jpg') {
        const testImagePath = path.join(process.cwd(), 'test', filename);
        fs.writeFileSync(testImagePath, Buffer.from('fake-image-data'));
        return testImagePath;
    }

    static deleteTestImage(filepath) {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    }

    static async cleanupTestData(db) {
        const client = await db.dbConnection.client;
        try {
            // Clean in reverse order of dependencies
            const cleanupQueries = [
                "DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%'))",
                "DELETE FROM reports WHERE reporter_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%')",
                "DELETE FROM stock WHERE product_id IN (SELECT product_id FROM products WHERE seller_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%'))",
                "DELETE FROM orders WHERE user_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%')",
                "DELETE FROM products WHERE seller_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%')",
                "DELETE FROM products WHERE name LIKE 'Test%'",
                "DELETE FROM users WHERE email LIKE 'test_%'",
                "DELETE FROM payment_infos WHERE payment_id NOT IN (SELECT payment_id FROM orders)",
                "DELETE FROM shipment_infos WHERE shipment_id NOT IN (SELECT shipment_id FROM orders)"
            ];

            for (const query of cleanupQueries) {
                await client.query(query);
            }
        } finally {
            client.release();
        }
    }

    static async setupTestUsers(db) {
        const users = {
            admin: {
                user_uuid: 'test_admin_uuid',
                email: 'test_admin@test.com',
                password: await this.hashPassword('TestAdmin123!'),
                name: 'Test',
                lastname: 'Admin',
                role_id: 1
            },
            artisan: {
                user_uuid: 'test_artisan_uuid',
                email: 'test_artisan@test.com',
                password: await this.hashPassword('TestArtisan123!'),
                name: 'Test',
                lastname: 'Artisan',
                role_id: 3
            },
            user: {
                user_uuid: 'test_user_uuid',
                email: 'test_user@test.com',
                password: await this.hashPassword('TestUser123!'),
                name: 'Test',
                lastname: 'User',
                role_id: 2
            }
        };

        const client = await db.dbConnection.client;
        try {
            for (const [key, user] of Object.entries(users)) {
                await client.query(
                    `INSERT INTO users (user_uuid, email, password, name, lastname, role_id) 
                     VALUES ($1, $2, $3, $4, $5, $6) 
                     ON CONFLICT (email) DO NOTHING`,
                    [user.user_uuid, user.email, user.password, user.name, user.lastname, user.role_id]
                );
            }
        } finally {
            client.release();
        }

        return users;
    }

    static async createTestProduct(db, sellerId) {
        const client = await db.dbConnection.client;
        try {
            const result = await client.query(
                `INSERT INTO products (name, price, id_category, description, seller_id, image_url) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING product_id`,
                ['Test Product', 99.99, 1, 'Test Description', sellerId, '/test/image.jpg']
            );
            return result.rows[0].product_id;
        } finally {
            client.release();
        }
    }
}