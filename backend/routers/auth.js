
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import uuid4 from "uuid4";
import { db } from "../lib/server/server.js";
import User from "../lib/models/user.js";

const router = express.Router();

// JWT Token generator
const generateToken = (id) => {
  return jwt.sign({ user_uuid: id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.getUserByEmail(email);

    if (user === null) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const isMatch = await User.checkPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = generateToken(user.user_uuid);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.status(500).json({ message: "Errore del server" });
  }
});

router.post("/register", async (req, res) => {
  const { name, lastname, email, password, role } = req.body;

  try {
    // Verifica se l'utente esiste già
    const existingUser = await User.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email già registrata" });
    }

    // Mappa il ruolo al role_id
    const roleMap = { 'user': 2, 'artisan': 3, 'admin': 1 };
    const role_id = roleMap[role] || 2; // Default a user se il ruolo non è specificato

    const hashedPassword = await User.hashPassword(password);

    const user = {
      name,
      lastname,
      email,
      hashedPassword,
      role_id,
    };

    const userUuid = await User.newUser(user);
    const { hashedPassword: _, ...userWithoutPassword } = user;

    res.status(201).json({
      token: generateToken(userUuid),
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    if (error.code === '23505') { // Codice PostgreSQL per violazione unique constraint
      res.status(400).json({ message: "Email già registrata" });
    } else {
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  }
});

router.get("/token/validate", (req, res) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith("Bearer ")) {
    return res.json({ valid: false });
  }

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.json({ valid: false });
    }
    res.json({ valid: true, user_uuid: decoded.user_uuid });
  });
});

router.get("/user", async (req, res) => {
  try {
    const user_uuid = req.user_uuid;
    const user = await User.getUserById(user_uuid);

    if (user === null) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Errore nel recupero dell'utente:", error);
    res.status(500).json({ message: "Errore del server" });
  }
});

export default router;