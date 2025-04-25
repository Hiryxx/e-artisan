import Database from "../db/database";
import express, {Express} from "express";
import dotenv from "dotenv";
import apiRouter from "../../routers";



class Server {
    app: Express

    constructor() {
        this.app = express();
        dotenv.config();
    }

    public async bootstrap(){
        let db = new Database()

        await db.bootstrap()
    }

    public loadServer(){
        // configures dotenv to work in your application
        this.app.use(apiRouter) // This has all routers

        this.app.get("/", (request, response) => {
            response.status(200).send("Hello World");
        });
    }

    public async startServer(){
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