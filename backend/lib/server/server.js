import Database, {userImagesPath} from "../db/database.js";
import express from "express";
import dotenv from "dotenv";
import apiRouter from "../../routers/index.js";
import jwt from "jsonwebtoken";
import cors from "cors";
import * as path from "node:path";
import adminRouter from "../../routers/admin.js";
import bodyParser from "body-parser";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "E-Artisan API Swagger",
            version: "0.1.0",
            description:
                "This is a simple CRUD API application made with Express and documented with Swagger",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
        },
        servers: [
            {
                url: "http://localhost:900",
            },
        ],
    },
    // Use absolute path to router files
    apis: [path.join(process.cwd(), "routers/*.js")],
};

const specs = swaggerJsdoc(options);

dotenv.config();
export const db = new Database()

function unless(path, middleware) {
    // do this but with more than one path
    const paths = Array.isArray(path) ? path : [path];

    return function (req, res, next) {
        if (paths.includes(req.path)) {
            return next();
        } else {
            return middleware(req, res, next);
        }
    }
}

export class Server {
    app

    constructor() {
        this.app = express();
    }

    async bootstrap() {
        await db.bootstrap()
    }

    loadServer() {
        this.app.use(cors())

        this.app.use(
            "/docs",
            swaggerUi.serve,
            swaggerUi.setup(specs)
        );

        // configures dotenv to work in your application
        this.app.use(unless(["/", "/images", "/auth/login", "/auth/register", "/product", "/admin/reports:", "/product/categories"], this.middleware))
        this.app.use(express.json())
        this.app.use(apiRouter) // This has all the routers
        this.app.get("/", (request, response) => {
            response.status(200).send("Hello World");
        });
        this.app.use('/admin', adminRouter);
        this.app.get('/images', async (req, res) => {
            const productId = req.query.product_id;
            if (!productId) {
                return res.status(400).send("Bad Request");
            }
            //const product = await Product.getProduct({product_id: productId})
            let product = await db.dbConnection.pool.query("SELECT * FROM products WHERE product_id = " + productId)

            product = product.rows[0]

            if (!product || !product.image_url) {
                return res.status(404).send("Image not found");
            }
            //res.sendFile(product.image_url, { root: '../' });
            const imgPath = path.join(".", product.image_url)
            res.sendFile(path.resolve(imgPath));
        });

    }

    async startServer() {
        await this.bootstrap()
        this.loadServer()

        const PORT = process.env.SERVER_PORT;

        this.app.listen(PORT, () => {
            console.log("Server running at PORT: ", PORT);
            console.log("Swagger docs available at: http://localhost:" + PORT + "/docs");
        }).on("error", (error) => {
            // gracefully handle error
            throw new Error(error.message);
        })
    }

    middleware(req, res, next) {
        let token = req.headers.authorization;
        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).send("Unauthorized");
        }

        // remove the "Bearer " part from the token
        token = token.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).send("Forbidden");
            }
            req.user_uuid = decoded.user_uuid;
            next();
        });
    }

}

