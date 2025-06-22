import express from "express";
import multer from 'multer'
import Product from "../lib/models/product.js";

const router = express.Router();

/*
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/user-images/');
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    }
});


const upload = multer({storage: storage});

 */
const upload = multer({ dest: './public/user-images/' })


router.get("/categories", async (req, res) => {
    try {
        const categories = await Product.getCategories();

        res.status(200).json(categories.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
})

router.post("/", upload.single('photo'), async (req, res) => {
    const {name, description, price, category_id} = req.body;
    console.log("Body received:", req.body);
    console.log("File received:", req.file);
    try {
        const product = {
            name, description, price, category_id, image_url: req.file.path
        }
        await Product.newProduct(product)
        res.status(201).json({message: "Product added successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }

})

router.get("/", async (req, res) => {
    try {
        let params = req.query || {};

        // Convert search parameter to name parameter for the model
        if (params.search) {
            params.name = params.search;
            delete params.search;
        }

        const products = await Product.getProduct(params)
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
})

router.delete("/", async (req, res) => {
    const {product_id} = req.params;
    try {
        await Product.deleteProduct(product_id)
        res.status(200).json({message: "Product deleted successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Server error"});
    }
})


export default router;