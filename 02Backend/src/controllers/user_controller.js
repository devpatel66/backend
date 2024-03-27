import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user_model.js';
import uploadCloudinary from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js';

const registerUser = asyncHandler( async (req,res)=>{
    const {username,email,password,fullname} = req.body;
    // console.log("name : ",name)

    //Validation
    if(username === ""){
        throw new ApiError(400, "username can't be empty");
    }
    if(fullname === ""){
        throw new ApiError(400, "fullname can't be empty");
    }
    if(email === ""){
        throw new ApiError(400, "email can't be empty");
    }
    if(password === ""){
        throw new ApiError(400, "password can't be empty");
    }

    //other ways for Validation
    // if([fullname,email,password,username].some((feild)=> feild?.trim()=== "")){
    //     throw new ApiError(400, "All feilds are required");
    // }

    //checking if user is already exists by email or username
    const existedUser = User.findOne({ //afterwards i need to sperate the username and email validation.
        $or:[{username},{email}]
    })
    
    if(existedUser){
        throw new ApiError(409,"Username is already exists")
    }


    const avatarLocalPath = await req.files?.avatar[0]?.path;
    const coverImageLocalPath = await req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    //uploading images to cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar was unable to upload");
    }


    //entring data into mongoDB
    const user = await User.create({
        fullname,
        email,
        username,
        password,
        avatar : avatar.url,
        coverImage : coverImage?.url || ""

    })


    // fetching data from database except password and refreshToken
    const createdUser = await User.findOne(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(200).json(
        new ApiResponse(201,"User Registered Successfully",createdUser)
    )
    
    
})

export default registerUser;