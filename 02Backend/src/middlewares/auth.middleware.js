import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user_model.js";
import ApiError from "../utils/ApiError.js";

const verifyJWT = asyncHandler(async (req,res,next)=>{
    try {
        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer","")
        console.log(token)
        if(!token.length){
            throw new ApiError(401,"Unauthorized request")
        }

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        console.log(decodedToken)
        const user = User.findById(decodedToken?._id).select("-password -refreshToken");

        console.log(user)
        if(!user){
            throw new ApiError(401,"Unauthorized Access Token");
        }

        req.user = user
        next();

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Access Token")
    }
})


export default verifyJWT;