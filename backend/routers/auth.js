import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import uuid4 from "uuid4";
import {db} from "../lib/server/server.js";

const router = express.Router()

// JWT Token generator
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.dbConnection.pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user.user_uuid);
        res.json({ token, user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
})

router.post("/register", async (req, res) => {
    const { name, lastname, email, password, role_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const uuid = uuid4();

    try {
        await db.dbConnection.pool.query(
            'INSERT INTO users (user_uuid, password, email, name, lastname, role_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuid, hashedPassword, email, name, lastname, role_id]
        );
        const newUser = {
            uuid,
            name,
            lastname,
            email,
            role_id
        };
        res.json({ token: generateToken(newUser.uuid), user: newUser });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: "User already exists" });
    }
})



export default router;