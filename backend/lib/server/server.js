import Database from "../db/database.js";
import express from "express";
import dotenv from "dotenv";
import apiRouter from "../../routers/index.js";



class Server {
    app

    constructor() {
        this.app = express();
        dotenv.config();
    }

    async bootstrap(){
        let db = new Database()

        await db.bootstrap()
    }

    loadServer(){
        // configures dotenv to work in your application
        this.app.use(apiRouter) // This has all routers

        this.app.get("/", (request, response) => {
            response.status(200).send("Hello World");
        });
    }

    async startServer(){
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
}

export default Server;