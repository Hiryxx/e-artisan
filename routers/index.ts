import authRouter from "./auth";
import express from "express";

const apiRouter = express.Router()

apiRouter.use('/auth', authRouter);

export default apiRouter;