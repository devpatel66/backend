import coonectDb from "./db/index.js";
import dotenv from 'dotenv'

dotenv.config({
    path:"./env"
})



coonectDb()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log("Server is running on Port : ",process.env.PORT)
    })
})
.catch((error)=>{
    console.log("MongoDB connection failer !! ".error)
})