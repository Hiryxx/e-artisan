import express from "express";
const router = express.Router()

router.get("/login", async (req, res) => {
    res.status(200).send("Logged in")
})

router.get("/register", async (req, res) => {
    res.status(200).send("Registered up")
})


export default router;