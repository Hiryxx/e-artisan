import authRouter from "./auth.js";
import express from "express";

const apiRouter = express.Router()

apiRouter.use('/auth', authRouter);

export default apiRouter;