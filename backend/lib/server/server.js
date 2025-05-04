import Database from "../db/database.js";
import express from "express";
import dotenv from "dotenv";
import apiRouter from "../../routers/index.js";
import jwt from "jsonwebtoken";


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

class Server {
    app

    constructor() {
        this.app = express();
        dotenv.config();
    }

    async bootstrap() {
        let db = new Database()

        await db.bootstrap()
    }

    loadServer() {
        // configures dotenv to work in your application
        this.app.use(unless(["/auth/login", "/auth/register"], this.middleware))
        this.app.use(apiRouter) // This has all routers
        this.app.use(express.json())
        this.app.get("/", (request, response) => {
            response.status(200).send("Hello World");
        });
    }

    async startServer() {
        await this.bootstrap()
        this.loadServer()

        const PORT = process.env.SERVER_PORT;

        this.app.listen(PORT, () => {
            console.log("Server running at PORT: ", PORT);
        }).on("error", (error) => {
            // gracefully handle error
            throw new Error(error.message);
        })
    }

    middleware(req, res, next) {
        const token = req.headers.authorization;
        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).send("Unauthorized");
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).send("Forbidden");
            }
            req.user = decoded;
            console.log(decoded);
            next();
        });
    }

}


export default Server;