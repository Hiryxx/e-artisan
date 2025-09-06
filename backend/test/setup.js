import Database from '../lib/db/database.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export class TestDatabase extends Database {
    constructor() {
        super();
        this._dbConnection = new TestDbConnection();
    }
}

class TestDbConnection {
    _pool;

    constructor() {
        console.log("Connecting to TEST database...");
        this._pool = new Pool({
            host: 'localhost',
            port: +process.env.DB_PORT,
            database: process.env.DATABASE, // eartisan_test
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }

    get client() {
        return this._pool.connect();
    }

    get pool() {
        return this._pool;
    }

    async execute(query, params) {
        return await this._pool.query(query, params);
    }
}