import bcrypt from "bcrypt";
import {db} from "../server/server.js";
import uuid4 from "uuid4";

export default class User {
    static _salt = 10
    static hashPassword(password) {
        return bcrypt.hash(password, User._salt);
    }
    static checkPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
     static async newUser(user) {
        const uuid = uuid4();
        await db.dbConnection.pool.query(
            'INSERT INTO users (user_uuid, password, email, name, lastname, role_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuid, user.hashedPassword, user.email, user.name, user.lastname, user.role_id]
        );

        return uuid;
    }

     static async getUserByEmail(email) {
        const result = await db.dbConnection.pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }


}