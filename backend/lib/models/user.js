import bcrypt from "bcrypt";
import {db} from "../server/server.js";
import uuid4 from "uuid4";

export default class User {
    static _salt = 10

    static hashPassword(password) {
        return bcrypt.hashSync(password, User._salt);
    }

    static checkPassword(password, hashedPassword) {
        return bcrypt.compareSync(password, hashedPassword);
    }

    static async newUser(user) {
        const uuid = uuid4();
        await db.dbConnection.execute(
            'INSERT INTO users (user_uuid, password, email, name, lastname, role_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuid, user.hashedPassword, user.email, user.name, user.lastname, user.role_id]
        );

        return uuid;
    }

    static async getUserByEmail(email) {
        const result = await db.dbConnection.execute(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }


    static async getUserById(user_uuid) {
        const result = await db.dbConnection.execute(
            'SELECT user_uuid, email, name, lastname, role_id FROM users WHERE user_uuid = $1',
            [user_uuid]
        );
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }

    static async updateUser(user_uuid, updatedFields) {
        const fields = Object.keys(updatedFields);
        const values = Object.values(updatedFields);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

        console.log("Set clause:", setClause);

        await db.dbConnection.execute(
            `UPDATE users SET ${setClause} WHERE user_uuid = $${fields.length + 1}`,
            [...values, user_uuid]
        );

    }
}