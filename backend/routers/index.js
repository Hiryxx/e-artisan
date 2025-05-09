import express from "express";
import productRouter from "./product.js";
import authRouter from "./auth.js";

const apiRouter = express.Router()

apiRouter.use('/auth', authRouter);
apiRouter.use('/product', productRouter);

export default apiRouter;