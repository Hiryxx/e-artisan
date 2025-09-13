import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import Server from '../lib/server/server.js';
import { TestHelpers } from './helpers.js';

describe('Integration Tests', function() {
    let server;
    let app;
    let tokens = {};

    before(async function() {
        this.timeout(10000);

        server = new Server();
        await server.bootstrap();
        server.loadServer();
        app = server.app;

        const { db } = await import('../lib/server/server.js');

        const users = await TestHelpers.setupTestUsers(db);
        for (const [role, user] of Object.entries(users)) {
            tokens[role] = TestHelpers.generateToken(user);
        }
    });

    after(async function() {
        this.timeout(15000);

        const { db } = await import('../lib/server/server.js');

        if (db) {
            try {
                await TestHelpers.cleanupTestData(db);
            } catch (error) {
                console.error('Error in integration test cleanup:', error);
            }
        }
    });

    describe('Complete User Flow', function() {
        let productId;
        let orderId;

        it('should complete full purchase flow', async function() {
            const registerRes = await request(app)
                .post('/auth/register')
                .send({
                    email: 'test_buyer@test.com',
                    password: 'BuyerPass123!',
                    name: 'Test',
                    lastname: 'Buyer',
                    role_id: 2
                })
                .expect(200);

            const buyerToken = registerRes.body.token;

            const imagePath = TestHelpers.createTestImage();
            const productRes = await request(app)
                .post('/product/with-img')
                .set('Authorization', `Bearer ${tokens.artisan}`)
                .field('name', 'Integration Test Product')
                .field('price', 150)
                .field('id_category', 1)
                .field('stock', 5)
                .attach('photo', imagePath)
                .expect(201);

            TestHelpers.deleteTestImage(imagePath);

            const productsRes = await request(app)
                .get('/product')
                .expect(200);

            productId = productsRes.body.find(p => p.name === 'Integration Test Product').product_id;

            const orderRes = await request(app)
                .post('/orders')
                .set('Authorization', `Bearer ${buyerToken}`)
                .send({
                    orderData: {
                        items: [{
                            product_id: productId,
                            quantity: 1,
                            price: 150
                        }],
                        totalAmount: 150
                    },
                    shippingInfo: {
                        street: 'Test St',
                        number: '1',
                        zipcode: '12345',
                        city: 'Test City',
                        state: 'TS'
                    },
                    paymentInfo: {
                        paymentMethod: 'credit_card',
                    }
                })
                .expect(201);

            orderId = orderRes.body.order_id;

            const statusRes = await request(app)
                .put(`/admin/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${tokens.admin}`)
                .send({ status: 'shipped' })
                .expect(200);

            expect(statusRes.body.status).to.equal('shipped');
        });
    });
});