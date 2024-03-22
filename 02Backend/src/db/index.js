// connecting to database.
import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const coonectDb = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);

        console.log(`MONGODB Connected :: DB Host : ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("MONGODB Connection Error : ",error)
    }
}

export default coonectDb;