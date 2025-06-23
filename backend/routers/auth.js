import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import uuid4 from "uuid4";
import {db} from "../lib/server/server.js";
import User from "../lib/models/user.js";

const router = express.Router();

// JWT Token generator
const generateToken = (id) => {
    return jwt.sign({user_uuid: id}, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
};

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and management APIs
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_uuid:
 *                       type: string
 *                     name:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role_id:
 *                       type: integer
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
router.post("/login", async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await User.getUserByEmail(email);

        if (user === null) {
            return res.status(401).json({message: "User not found"});
        }

        const isMatch = User.checkPassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({message: "Invalid credentials"});
        }

        const token = generateToken(user.user_uuid);
        res.json({token, user});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
});
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role_id:
 *                 type: integer
 *             required:
 *               - name
 *               - lastname
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     lastname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role_id:
 *                       type: integer
 *       400:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already exists
 */
router.post("/register", async (req, res) => {
    const {name, lastname, email, password, role_id} = req.body;
    const hashedPassword = User.hashPassword(password);

    try {
        const user = {
            name, lastname, email, hashedPassword, role_id,
        };
        const userUUid = await User.newUser(user);
        res.json({token: generateToken(userUUid), user: user});
    } catch (error) {
        console.log(error);
        res.status(400).json({message: "User already exists"});
    }
});

/**
 * @swagger
 * /auth/token/validate:
 *   get:
 *     summary: Validate JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 */
router.get("/token/validate", (req, res) => {
    const token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
        //return res.status(401).send("Unauthorized");
        res.json({valid: false});
    }

    jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            //return res.status(403).send("Forbidden");
            res.json({valid: false});
        }
        res.json({valid: true});
    });
});
/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_uuid:
 *                   type: string
 *                 name:
 *                   type: string
 *                 lastname:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role_id:
 *                   type: integer
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 */
router.get("/user", async (req, res) => {
    const user_uuid = req.user_uuid
    const user = await User.getUserById(user_uuid)

    if (user === null) {
        return res.status(404).json({message: "User not found"});
    }

    res.json(user);
});
// Update only provided user fields
/**
 * @swagger
 * /auth/user:
 *   patch:
 *     summary: Update user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_uuid:
 *                   type: string
 *                 name:
 *                   type: string
 *                 lastname:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role_id:
 *                   type: integer
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
router.patch("/user", async (req, res) => {
    const user_uuid = req.user_uuid;
    const {name, lastname, email, password} = req.body;

    try {
        const user = await User.getUserById(user_uuid);

        if (user === null) {
            return res.status(404).json({message: "User not found"});
        }


        // Update only provided fields
        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (lastname) updatedFields.lastname = lastname;
        if (email) updatedFields.email = email;
        if (password) updatedFields.password = User.hashPassword(password);

        await User.updateUser(user_uuid, updatedFields);

        const updatedUser = await User.getUserById(user_uuid);

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({message: "Server error"});
    }
});

export default router;