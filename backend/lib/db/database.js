import {Pool} from 'pg'
import User from "../models/user.js";
import * as fs from "node:fs";
import Product from "../models/product.js";

export const userImagesPath = "/public/user-images"

class Database {
    _dbConnection
    createUserRoles = `CREATE TABLE IF NOT EXISTS user_roles (role_id INT PRIMARY KEY,name VARCHAR(50) NOT NULL);`

    createShipmentInfos = `CREATE TABLE IF NOT EXISTS shipment_infos (shipment_id SERIAL PRIMARY KEY,street VARCHAR(100) NOT NULL,number VARCHAR(10) NOT NULL,zipcode VARCHAR(10) NOT NULL,city VARCHAR(50) NOT NULL,state VARCHAR(50) NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;

    createPaymentInfos = `CREATE TABLE IF NOT EXISTS payment_infos (payment_id SERIAL PRIMARY KEY,payment_method VARCHAR(50) NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`

    createOrders = `CREATE TABLE IF NOT EXISTS orders (order_id SERIAL PRIMARY KEY,user_id VARCHAR(36) REFERENCES users(user_uuid),payment_id INTEGER REFERENCES payment_infos(payment_id),shipment_id INTEGER REFERENCES shipment_infos(shipment_id),total_amount DECIMAL(10,2) NOT NULL,status VARCHAR(20) DEFAULT 'pending',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`

    createUsers = `CREATE TABLE IF NOT EXISTS users (user_uuid CHAR(36) PRIMARY KEY,password VARCHAR(255) NOT NULL,email VARCHAR(100) UNIQUE NOT NULL,name VARCHAR(50) NOT NULL,lastname VARCHAR(50) NOT NULL,role_id INT NOT NULL,info_id INT,FOREIGN KEY (role_id) REFERENCES user_roles(role_id));`

    createCategories = `CREATE TABLE IF NOT EXISTS categories (id_category INT PRIMARY KEY,name VARCHAR(50) NOT NULL);`

    createProducts = `CREATE TABLE IF NOT EXISTS products (product_id SERIAL PRIMARY KEY,name VARCHAR(256) NOT NULL,price NUMERIC(10, 2) NOT NULL,id_category INT NOT NULL,description TEXT,seller_id CHAR(36) NOT NULL,image_url TEXT,FOREIGN KEY (id_category) REFERENCES categories(id_category),FOREIGN KEY (seller_id) REFERENCES users(user_uuid));`

    createOrderItems = `CREATE TABLE IF NOT EXISTS order_items (item_id SERIAL PRIMARY KEY,order_id INTEGER REFERENCES orders(order_id),product_id INTEGER REFERENCES products(product_id),quantity INTEGER NOT NULL,price DECIMAL(10,2) NOT NULL);`

    createStock = `CREATE TABLE IF NOT EXISTS stock(item_id SERIAL PRIMARY KEY,product_id INT NOT NULL,FOREIGN KEY (product_id) REFERENCES products(product_id));`

    createReports = `CREATE TABLE IF NOT EXISTS reports (report_id SERIAL PRIMARY KEY,product_id INT,reporter_id CHAR(36),reason TEXT NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'pending',created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,resolved_at TIMESTAMP,resolution_message TEXT,FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,FOREIGN KEY (reporter_id) REFERENCES users(user_uuid));`

    insertRoles = "INSERT INTO user_roles (role_id, name) VALUES (1, 'admin'), (2, 'user'), (3, 'artisan')"

    insertCategory = "INSERT INTO categories (id_category, name) VALUES (1, 'Ceramica'),(2, 'Gioielli Artigianali'),(3, 'Lavorazione del Legno'),(4, 'Tessuti e Ricami'),(5, 'Candele e Saponi'),(6, 'Pittura e Illustrazione'),(7, 'Accessori in Cuoio'),(8, 'Decorazioni per la Casa'),(9, 'Articoli in Vetro Soffiato'),(10, 'Oggettistica in Metallo');"

    constructor() {
        this._dbConnection = new DbConnection();
    }

    get dbConnection() {
        return this._dbConnection
    }

    async bootstrap() {
        try {
            // create the files for storing user images
            if (!fs.existsSync("." + userImagesPath)) {
                fs.mkdirSync("." + userImagesPath, {recursive: true});
            }
            // create tables if not exists
            let client = await this.dbConnection.client

            await client.query(this.createUserRoles);
            await client.query(this.createCategories);
            await client.query(this.createUsers);
            await client.query(this.createShipmentInfos);
            await client.query(this.createPaymentInfos);
            await client.query(this.createProducts);
            await client.query(this.createOrders);
            await client.query(this.createReports);
            await client.query(this.createStock);
            await client.query(this.createOrderItems);

            const role = await client.query("SELECT role_id FROM user_roles");
            if (role.rows.length === 0) {
                await client.query(this.insertRoles);
            }
            const category = await client.query("SELECT id_category FROM categories");
            if (category.rows.length === 0) {
                await client.query(this.insertCategory);
            }

            const artisan = {
                name: "Franco",
                lastname: "Rossi",
                email: "franco.rossi@gmail.com",
                password: "franco",
                role_id: 3
            }
            const admin = {
                name: "admin",
                lastname: "admin",
                email: "admin@gmail.com",
                password: "admin",
                role_id: 1
            }
            const dbAdmin = await User.getUserByEmail(admin.email)
            if (dbAdmin === null) {
                const hashedPassword = await User.hashPassword(admin.password)
                await User.newUser({hashedPassword: hashedPassword, ...admin})
            }

            const dbArtisan = await User.getUserByEmail(artisan.email)
            let artisanId;
            if (dbArtisan === null) {
                const hashedPassword = await User.hashPassword(artisan.password)
                artisanId = await User.newUser({hashedPassword: hashedPassword, ...artisan})
            } else{
                artisanId = dbArtisan.user_uuid
            }
            const product = await client.query("SELECT * FROM products LIMIT 1;")
            if (product.rows.length === 0) {
                const products = [
                    {
                        name: "Vaso a calice in gesso",
                        price: 50,
                        id_category: 1,
                        description: "prova1",
                        seller_id: artisanId,
                        image_url: userImagesPath + "/vaso_gesso.webp"
                    },
                    {
                        name: "Vaso ceramica colorato",
                        price: 100,
                        id_category: 9,
                        description: "prova2",
                        seller_id: artisanId,
                        image_url: userImagesPath + "/vaso_ceramica_col.png"
                    },
                    {
                        name: "Vaso cristallo oceano",
                        price: 150,
                        id_category: 9,
                        description: "prova3",
                        seller_id: artisanId,
                        image_url: userImagesPath + "/vaso_oceano.jpg"
                    },
                    {
                        name: "Set 6 bicchieri vetro",
                        price: 200,
                        id_category: 8,
                        description: "prova4",
                        seller_id: artisanId,
                        image_url: userImagesPath + "/bicchieri.jpg"
                    }
                ]

                for (const product of products) {
                    await Product.newProduct(product)
                }
                for (const product of products) {
                    const productId = await Product.getProduct({name: product.name})
                    for (let i = 0; i < 3; i++) {
                        await Product.addToStock(productId[0].product_id)
                    }
                }

                client.release()
                console.log("Database tables created successfully");
            }
        } catch (err) {
            console.error(err);
        }
    }
}

// for now a pool is fine but i need to acquire a client in the future
class DbConnection {
    _pool

    constructor() {
        console.log("Connecting to database...");
        this._pool = new Pool({
            host: 'localhost',
            port: +process.env.DB_PORT,
            database: process.env.DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })
    }

    get client() {
        return this._pool.connect()
    }

    get pool() {
        return this._pool
    }

    async execute(query, params) {
        return await this._pool.query(query, params)
    }
}

export default Database;