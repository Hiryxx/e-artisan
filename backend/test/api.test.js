import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import Server from '../lib/server/server.js';
import Database from '../lib/db/database.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test environment variables
dotenv.config({ path: '.env.test' });

describe('E-Artisan API Tests', function() {
    let server;
    let app;
    let db;
    let adminToken;
    let artisanToken;
    let userToken;
    let testProductId;
    let testOrderId;
    let testReportId;

    // Test users
    const testAdmin = {
        email: 'test_admin@test.com',
        password: 'TestAdmin123!',
        name: 'Test',
        lastname: 'Admin',
        role_id: 1
    };

    const testArtisan = {
        email: 'test_artisan@test.com',
        password: 'TestArtisan123!',
        name: 'Test',
        lastname: 'Artisan',
        role_id: 3
    };

    const testUser = {
        email: 'test_user@test.com',
        password: 'TestUser123!',
        name: 'Test',
        lastname: 'User',
        role_id: 2
    };

    before(async function() {
        this.timeout(10000);

        // Initialize server with test database
        server = new Server();
        db = new Database();
        await db.bootstrap();
        server.loadServer();
        app = server.app;

        // Wait for database to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    after(async function() {
        this.timeout(10000);

        // Clean up test data
        if (db && db.dbConnection) {
            const client = await db.dbConnection.client;
            try {
                // Delete test data in reverse order of foreign key dependencies
                await client.query("DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id LIKE 'test_%')");
                await client.query("DELETE FROM reports WHERE reporter_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%')");
                await client.query("DELETE FROM stock WHERE product_id IN (SELECT product_id FROM products WHERE seller_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%'))");
                await client.query("DELETE FROM orders WHERE user_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%')");
                await client.query("DELETE FROM products WHERE seller_id IN (SELECT user_uuid FROM users WHERE email LIKE 'test_%')");
                await client.query("DELETE FROM users WHERE email LIKE 'test_%'");
                await client.query("DELETE FROM payment_infos WHERE payment_id NOT IN (SELECT payment_id FROM orders)");
                await client.query("DELETE FROM shipment_infos WHERE shipment_id NOT IN (SELECT shipment_id FROM orders)");
            } finally {
                client.release();
            }

            // Close database connection
            await db.dbConnection.pool.end();
        }
    });

    describe('Authentication Endpoints', function() {

        describe('POST /auth/register', function() {
            it('should register a new user', async function() {
                const res = await request(app)
                    .post('/auth/register')
                    .send(testUser)
                    .expect(200);

                expect(res.body).to.have.property('token');
                expect(res.body).to.have.property('user');
                expect(res.body.user.email).to.equal(testUser.email);
                userToken = res.body.token;
            });

            it('should register an artisan', async function() {
                const res = await request(app)
                    .post('/auth/register')
                    .send(testArtisan)
                    .expect(200);

                expect(res.body).to.have.property('token');
                artisanToken = res.body.token;
            });

            it('should register an admin', async function() {
                const res = await request(app)
                    .post('/auth/register')
                    .send(testAdmin)
                    .expect(200);

                expect(res.body).to.have.property('token');
                adminToken = res.body.token;
            });

            it('should not register duplicate user', async function() {
                const res = await request(app)
                    .post('/auth/register')
                    .send(testUser)
                    .expect(400);

                expect(res.body.message).to.include('already exists');
            });
        });

        describe('POST /auth/login', function() {
            it('should login with valid credentials', async function() {
                const res = await request(app)
                    .post('/auth/login')
                    .send({
                        email: testUser.email,
                        password: testUser.password
                    })
                    .expect(200);

                expect(res.body).to.have.property('token');
                expect(res.body.user.email).to.equal(testUser.email);
            });

            it('should fail with invalid credentials', async function() {
                const res = await request(app)
                    .post('/auth/login')
                    .send({
                        email: testUser.email,
                        password: 'wrongpassword'
                    })
                    .expect(401);

                expect(res.body.message).to.exist;
            });
        });

        describe('GET /auth/token/validate', function() {
            it('should validate a valid token', async function() {
                const res = await request(app)
                    .get('/auth/token/validate')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);

                expect(res.body.valid).to.be.true;
            });

            it('should reject invalid token', async function() {
                const res = await request(app)
                    .get('/auth/token/validate')
                    .set('Authorization', 'Bearer invalidtoken')
                    .expect(403);
            });
        });

        describe('GET /auth/user', function() {
            it('should get current user info', async function() {
                const res = await request(app)
                    .get('/auth/user')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);

                expect(res.body.email).to.equal(testUser.email);
                expect(res.body.name).to.equal(testUser.name);
            });
        });

        describe('PATCH /auth/user', function() {
            it('should update user information', async function() {
                const res = await request(app)
                    .patch('/auth/user')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        name: 'UpdatedName'
                    })
                    .expect(200);

                expect(res.body.name).to.equal('UpdatedName');
            });
        });
    });

    describe('Product Endpoints', function() {

        describe('GET /product/categories', function() {
            it('should retrieve all categories', async function() {
                const res = await request(app)
                    .get('/product/categories')
                    .expect(200);

                expect(res.body).to.be.an('array');
                expect(res.body.length).to.be.greaterThan(0);
                expect(res.body[0]).to.have.property('id');
                expect(res.body[0]).to.have.property('name');
            });
        });

        describe('POST /product/with-img', function() {
            it('should create product with image (artisan only)', async function() {
                // Create a test image file
                const testImagePath = path.join(__dirname, 'test-image.jpg');
                fs.writeFileSync(testImagePath, Buffer.from('fake-image-data'));

                const res = await request(app)
                    .post('/product/with-img')
                    .set('Authorization', `Bearer ${artisanToken}`)
                    .field('name', 'Test Product')
                    .field('description', 'Test Description')
                    .field('price', 99.99)
                    .field('id_category', 1)
                    .field('stock', 10)
                    .attach('photo', testImagePath)
                    .expect(201);

                expect(res.body.message).to.include('successfully');

                // Clean up test image
                fs.unlinkSync(testImagePath);
            });
        });

        describe('GET /product', function() {
            it('should get all products', async function() {
                const res = await request(app)
                    .get('/product')
                    .expect(200);

                expect(res.body).to.be.an('array');
                if (res.body.length > 0) {
                    testProductId = res.body[0].id;
                    expect(res.body[0]).to.have.property('name');
                    expect(res.body[0]).to.have.property('price');
                }
            });

            it('should filter products by category', async function() {
                const res = await request(app)
                    .get('/product?id_category=1')
                    .expect(200);

                expect(res.body).to.be.an('array');
            });

            it('should filter products by price range', async function() {
                const res = await request(app)
                    .get('/product?min_price=10&max_price=100')
                    .expect(200);

                expect(res.body).to.be.an('array');
            });

            it('should search products by name', async function() {
                const res = await request(app)
                    .get('/product?search=Test')
                    .expect(200);

                expect(res.body).to.be.an('array');
            });
        });

        describe('POST /product/:product_id/stock/:stock_number', function() {
            it('should add stock to product', async function() {
                if (!testProductId) this.skip();

                const res = await request(app)
                    .post(`/product/${testProductId}/stock/5`)
                    .set('Authorization', `Bearer ${artisanToken}`)
                    .expect(200);

                expect(res.body.message).to.include('successfully');
            });
        });

        describe('PUT /product/:product_id', function() {
            it('should update product without image', async function() {
                if (!testProductId) this.skip();

                const res = await request(app)
                    .put(`/product/${testProductId}`)
                    .set('Authorization', `Bearer ${artisanToken}`)
                    .send({
                        name: 'Updated Product Name',
                        price: 149.99
                    })
                    .expect(200);

                expect(res.body.message).to.include('aggiornato');
            });
        });
    });

    describe('Order Endpoints', function() {

        describe('POST /orders', function() {
            it('should create a new order', async function() {
                if (!testProductId) this.skip();

                const orderData = {
                    orderData: {
                        items: [{
                            product_id: testProductId,
                            quantity: 2,
                            price: 99.99
                        }]
                    },
                    shippingInfo: {
                        street: 'Test Street',
                        number: '123',
                        zipcode: '12345',
                        city: 'Test City',
                        state: 'Test State'
                    },
                    paymentInfo: {
                        method: 'credit_card',
                        transaction_id: 'test_transaction_123'
                    }
                };

                const res = await request(app)
                    .post('/orders')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(orderData)
                    .expect(201);

                expect(res.body.message).to.include('successfully');
                expect(res.body).to.have.property('order_id');
                testOrderId = res.body.order_id;
            });

            it('should fail without required data', async function() {
                const res = await request(app)
                    .post('/orders')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({})
                    .expect(400);

                expect(res.body.message).to.include('Missing data');
            });
        });

        describe('GET /orders', function() {
            it('should get user orders', async function() {
                const res = await request(app)
                    .get('/orders')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);

                expect(res.body).to.be.an('array');
                if (res.body.length > 0) {
                    expect(res.body[0]).to.have.property('order_id');
                    expect(res.body[0]).to.have.property('total_amount');
                    expect(res.body[0]).to.have.property('status');
                }
            });
        });

        describe('GET /orders/:orderId', function() {
            it('should get specific order details', async function() {
                if (!testOrderId) this.skip();

                const res = await request(app)
                    .get(`/orders/${testOrderId}`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);

                expect(res.body).to.have.property('order_id');
                expect(res.body).to.have.property('items');
                expect(res.body).to.have.property('shipping_info');
                expect(res.body).to.have.property('payment_info');
            });

            it('should not access other user orders', async function() {
                if (!testOrderId) this.skip();

                const res = await request(app)
                    .get(`/orders/${testOrderId}`)
                    .set('Authorization', `Bearer ${artisanToken}`)
                    .expect(403);

                expect(res.body.message).to.include('Accesso negato');
            });
        });
    });

    describe('Admin Endpoints', function() {

        describe('POST /admin/reports', function() {
            it('should create a report', async function() {
                if (!testProductId) this.skip();

                const res = await request(app)
                    .post('/admin/reports')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        product_id: testProductId,
                        reason: 'Test report reason'
                    })
                    .expect(201);

                expect(res.body.message).to.include('creata');
                expect(res.body).to.have.property('report_id');
                testReportId = res.body.report_id;
            });
        });

        describe('GET /admin/reports', function() {
            it('should get all reports (admin only)', async function() {
                const res = await request(app)
                    .get('/admin/reports')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(res.body).to.be.an('array');
            });

            it('should deny access to non-admin', async function() {
                const res = await request(app)
                    .get('/admin/reports')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(403);
            });
        });

        describe('GET /admin/user-reports', function() {
            it('should get reports by current user', async function() {
                const res = await request(app)
                    .get('/admin/user-reports')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);

                expect(res.body).to.be.an('array');
            });
        });

        describe('PUT /admin/reports/:productId/resolve', function() {
            it('should resolve reports (admin only)', async function() {
                if (!testProductId) this.skip();

                const res = await request(app)
                    .put(`/admin/reports/${testProductId}/resolve`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        message: 'Resolved for testing'
                    })
                    .expect(200);

                expect(res.body.message).to.include('risolta');
            });
        });

        describe('GET /admin/reports/history', function() {
            it('should get reports history (admin only)', async function() {
                const res = await request(app)
                    .get('/admin/reports/history')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(res.body).to.be.an('array');
            });
        });

        describe('GET /admin/orders', function() {
            it('should get all orders (admin only)', async function() {
                const res = await request(app)
                    .get('/admin/orders')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(res.body).to.be.an('array');
            });
        });

        describe('GET /admin/orders/pending', function() {
            it('should get pending orders (admin only)', async function() {
                const res = await request(app)
                    .get('/admin/orders/pending')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(res.body).to.be.an('array');
            });
        });

        describe('PUT /admin/orders/:orderId/status', function() {
            it('should update order status (admin only)', async function() {
                if (!testOrderId) this.skip();

                const res = await request(app)
                    .put(`/admin/orders/${testOrderId}/status`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'shipped'
                    })
                    .expect(200);

                expect(res.body.status).to.equal('shipped');
            });

            it('should reject invalid status', async function() {
                if (!testOrderId) this.skip();

                const res = await request(app)
                    .put(`/admin/orders/${testOrderId}/status`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'invalid_status'
                    })
                    .expect(400);
            });
        });

        describe('DELETE /admin/product/:productId', function() {
            it('should delete product (admin only)', async function() {
                if (!testProductId) this.skip();

                const res = await request(app)
                    .delete(`/admin/product/${testProductId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        message: 'Product violated terms'
                    })
                    .expect(200);

                expect(res.body.message).to.include('rimosso');
            });
        });
    });

    describe('Edge Cases and Error Handling', function() {

        it('should handle unauthorized access', async function() {
            const res = await request(app)
                .get('/orders')
                .expect(401);

            expect(res.text).to.equal('Unauthorized');
        });

        it('should handle malformed JSON', async function() {
            const res = await request(app)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send('{"invalid json}')
                .expect(400);
        });

        it('should validate token format', async function() {
            const res = await request(app)
                .get('/orders')
                .set('Authorization', 'InvalidTokenFormat')
                .expect(401);
        });

        it('should handle non-existent endpoints', async function() {
            const res = await request(app)
                .get('/non-existent-endpoint')
                .expect(404);
        });
    });

    describe('Performance Tests', function() {

        it('should handle concurrent requests', async function() {
            this.timeout(5000);

            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(
                    request(app)
                        .get('/product/categories')
                        .expect(200)
                );
            }

            const results = await Promise.all(promises);
            expect(results).to.have.lengthOf(10);
        });
    });
});
