import express from "express";
import productRouter from "./product.js";
import authRouter from "./auth.js";
import adminRouter from "./admin.js";
import ordersRouter from "./orders.js";

const apiRouter = express.Router()

apiRouter.use('/auth', authRouter);
apiRouter.use('/product', productRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/orders', ordersRouter);

export default apiRouter;