import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true //iske bare me padhe
}))

app.use(express.json({limit:"16mb"})) // ise bhi jane 
app.use(express.urlencoded({ extended: false, limit: "16mb" }));

app.use(express.static("public"))
app.use(cookieParser())
  

//routes import

import userRouter from './routes/user.routes.js';
import questionRouter from './routes/question.routes.js';
import analyticsRouter from "./routes/analytics.routes.js"

//routs decleration
 app.use("/api/v1/users",userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/analytics",analyticsRouter);



 //http://localhost:8000/api/v1/users/register

 


export {app}