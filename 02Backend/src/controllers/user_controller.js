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
    const existedUser = await User.findOne({ //afterwards i need to sperate the username and email validation.
        $or:[{username},{email}]
    })
    
    if(existedUser){
        throw new ApiError(409,"Username is already exists")
    }


    const avatarLocalPath = await req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = await req.files?.coverImage[0]?.path;
    }

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

    console.log(user);
    
    
    // fetching data from database except password and refreshToken
    const createdUser = await User.findOne(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(200).json(
        new ApiResponse(201,"User Registered Successfully",createdUser)
    )
    
    
})

const genrateAccessAndRefreshToken = async (userId)=>{
     const user = await User.findById(userId);

     const accessToken = user.genrateAccessToken();
     const refreshToken = await user.genrateRefreshToken();

     return {accessToken,refreshToken};
}

const loginUser = asyncHandler(async(req,res)=>{
    // destucting the data from req body
    const {username,email,password} = req.body;

    if(!username || !email){
        throw new ApiError(404,"Username or email is required");
    }

    //retreving data from database.
    const user = User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User doest not exists");
    }

    // checking the password
    const isPasswordVaild = await user.isPasswordVaild(password)

    //
    if(!isPasswordVaild){
        throw new ApiError(401,"Invalid User Crendiatial")
    }


    // getting accesstoken and RefreshToken
    const {accessToken,refreshToken} = await genrateAccessAndRefreshToken()

    // getting user details
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    

    //cookies options.
    const options = {
        httpOnly : true,
        secure : true
    }

    // return a response
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{user : loggedInUser,accessToken,refreshToken},"User Logged In Successfully")
    )

})


const logoutUser = asyncHandler(async(req,res,next)=>{
    await User.findOneAndUpdate(req.user._id,{
        $set:{
            refreshToken : undefined
        }},
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken",options)
    .cookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"Logout Successfully")
    )
})

export {registerUser,loginUser,logoutUser};