import express from "express";

//fare router, fare endpoint di router(router.get/post), fare query per prodotti (sia inserire (POST) che prenderli(GET) ())

const router = express.Router();



router.post("/add", async (req, res) => {
    const { name, description, price, category_id } = req.body;
    try {
        await db.dbConnection.pool.query(
            //'INSERT INTO products (name, description, price, category_id) VALUES ($1, $2, $3, $4)',
            //[name, description, price, category_id]
        );
        res.status(201).json({ message: "Product added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }

})

router


export default router;