import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Database from "../lib/db/database.js";
import uuid4 from "uuid4";

const router = express.Router()
const db = new Database()

// JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

router.get("/login", async (req, res) => {
    res.status(200).send("Logged in")
})

router.get("/register", async (req, res) => {
    const { name, lastname, email, password, role_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const uuid = uuid4();

    try {
        const result = await db.dbConnection.pool.query(
            //calcolare uuid,email,password,nome,cognome, ruolo
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