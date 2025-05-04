import {Pool} from 'pg'

class Database {
    _dbConnection
    createUserRoles = `CREATE TABLE IF NOT EXISTS user_roles (role_id INT PRIMARY KEY,name VARCHAR(50) NOT NULL);`

    createShipmentInfos = `CREATE TABLE IF NOT EXISTS shipment_infos (info_id INT PRIMARY KEY,street VARCHAR(100) NOT NULL,number VARCHAR(10) NOT NULL,zipcode VARCHAR(10) NOT NULL,state VARCHAR(50) NOT NULL,city VARCHAR(50) NOT NULL);`

    createUsers = `CREATE TABLE IF NOT EXISTS users (user_uuid CHAR(32) PRIMARY KEY,password VARCHAR(255) NOT NULL,email VARCHAR(100) UNIQUE NOT NULL,name VARCHAR(50) NOT NULL,lastname VARCHAR(50) NOT NULL,role_id INT NOT NULL,info_id INT,FOREIGN KEY (role_id) REFERENCES user_roles(role_id),FOREIGN KEY (info_id) REFERENCES shipment_infos(info_id));`

    createPaymentInfos = `CREATE TABLE IF NOT EXISTS payment_infos (payment_id INT PRIMARY KEY,payment_method VARCHAR(50) NOT NULL);`

    createCategories = `CREATE TABLE IF NOT EXISTS categories (id_category INT PRIMARY KEY,name VARCHAR(50) NOT NULL);`

    createProducts = `CREATE TABLE IF NOT EXISTS products (product_id INT PRIMARY KEY,price NUMERIC(10, 2) NOT NULL,id_category INT NOT NULL,description TEXT,seller_id CHAR(32) NOT NULL,image_url TEXT,stock INT NOT NULL CHECK (stock >= 0),FOREIGN KEY (id_category) REFERENCES categories(id_category),FOREIGN KEY (seller_id) REFERENCES users(user_uuid));`
    createOrders = `CREATE TABLE IF NOT EXISTS orders (order_id INT PRIMARY KEY,payment_id INT NOT NULL,user_uuid CHAR(32) NOT NULL,product_id INT NOT NULL,date DATE NOT NULL,status VARCHAR(50) NOT NULL,received_date DATE,FOREIGN KEY (payment_id) REFERENCES payment_infos(payment_id),FOREIGN KEY (user_uuid) REFERENCES users(user_uuid),FOREIGN KEY (product_id) REFERENCES products(product_id));`

    insertRoles = "INSERT INTO user_roles (role_id, name) VALUES (1, 'admin'), (2, 'user'), (3, 'artisan')"

    constructor() {
        this._dbConnection = new DbConnection();
    }

    get dbConnection(){
        return this._dbConnection
    }

    async bootstrap() {

        try {
            let client = await this.dbConnection.client
            await client.query(this.createUserRoles);
            await client.query(this.createShipmentInfos);
            await client.query(this.createUsers);
            await client.query(this.createPaymentInfos);
            await client.query(this.createCategories);
            await client.query(this.createProducts);
            await client.query(this.createOrders);
            await client.query(this.insertRoles);

            client.release()
            console.log("Database tables created successfully");

        } catch (err) {
            console.error(err);
        }
    }
}

// for now a pool is fine but i need to acquire a client in the future
class DbConnection {
    _pool

    constructor() {
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



    get client(){
        return this._pool.connect()
    }

    get pool(){
        return this._pool
    }

    async execute(query) {
        return await this._pool.query(query)
    }

}

export default Database;




