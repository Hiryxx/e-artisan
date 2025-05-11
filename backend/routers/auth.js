import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import uuid4 from "uuid4";
import {db} from "../lib/server/server.js";
import User from "../lib/models/User.js";

const router = express.Router()

// JWT Token generator
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '1h'});
};

router.post("/login", async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await User.getUserByEmail(email)

        if (user === null) {
            return res.status(401).json({message: "Invalid credentials"});
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
})

router.post("/register", async (req, res) => {
    const {name, lastname, email, password, role_id} = req.body;
    const hashedPassword = User.hashPassword(password)

    try {
        const user = {
            name,
            lastname,
            email,
            hashedPassword,
            role_id
        }
        const userUUid = await User.newUser(user)
        res.json({token: generateToken(userUUid), user: user});
    } catch (error) {
        console.log(error);
        res.status(400).json({message: "User already exists"});
    }
})

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
})

router.get("/user", async (req, res) => {
    const email = req.query.email;
    const user = await User.getUserByEmail(email)

    if (user === null) {
        return res.status(401).json({message: "User not found"});
    }

    res.json({user});

})


export default router;