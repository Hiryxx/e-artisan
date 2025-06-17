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

    // NUOVI METODI PER GOOGLE AUTH
    static async newGoogleUser(profile) {
        const uuid = uuid4();
        const nameParts = profile.displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        await db.dbConnection.execute(
            `INSERT INTO users (user_uuid, email, name, lastname, role_id, google_id, avatar_url, auth_provider) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                uuid,
                profile.emails[0].value,
                firstName,
                lastName,
                2, // role_id = 2 per 'user' di default
                profile.id,
                profile.photos[0]?.value || null,
                'google'
            ]
        );
        return uuid;
    }

    static async getUserByGoogleId(googleId) {
        const result = await db.dbConnection.execute(
            'SELECT * FROM users WHERE google_id = $1',
            [googleId]
        );
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }

    static async linkGoogleAccount(email, googleId, avatarUrl) {
        const result = await db.dbConnection.execute(
            `UPDATE users
             SET google_id = $1,
                 avatar_url = $2,
                 auth_provider = $3
             WHERE email = $4 RETURNING *`,
            [googleId, avatarUrl, 'google', email]
        );
        return result.rows[0];
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
            'SELECT user_uuid, email, name, lastname, role_id, avatar_url, auth_provider FROM users WHERE user_uuid = $1',
            [user_uuid]
        );
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }


}