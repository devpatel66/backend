import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()


app.use(cors(
   {
    origin:process.env.CORS_ORIGIN,
    credentials : true
   }
))

app.use(express.json({limit:'16kb'}));

app.use(express.urlencoded({extended:true,limit:'16kb'}));

app.use(express.static("public"))

app.use(cookieParser())


//importing routes
import userRouter from './routes/user_routes.js'

//user routes declarations.
app.use('/api/v1/users',userRouter)

export default app;