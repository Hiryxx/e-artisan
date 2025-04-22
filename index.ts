import express from "express";
import dotenv from "dotenv";

import authRouter from "./routers/auth";

// configures dotenv to work in your application
dotenv.config();
const app = express();

const PORT = process.env.PORT;

app.use('/auth', authRouter);

app.get("/", (request, response) => { 
  response.status(200).send("Hello World");
}); 

app.listen(PORT, () => { 
  console.log("Server running at PORT: ", PORT); 
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
})