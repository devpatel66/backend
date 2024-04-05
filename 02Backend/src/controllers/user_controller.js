import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user_model.js';
import uploadCloudinary from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js';
import e from 'cors';
import jwt, { decode } from 'jsonwebtoken';




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

    // //uploading images to cloudinary
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
        refreshToken:"",
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
    // console.log(user)
     const accessToken = await user.genrateAccessToken();
     const refreshToken = await user.genrateRefreshToken();
     await User.findOneAndUpdate(user._id,{
        $set:{
            refreshToken : refreshToken
        }},
        {
            new : true
        }
    )
     return {accessToken,refreshToken};
}

const loginUser = asyncHandler(async(req,res)=>{
    // destucting the data from req body
    const {username,password,email} = req.body;
    
    
    if(!(username || email)){
        throw new ApiError(404,"Username or email is required");
    }

    //retreving data from database.
    const user = await User.findOne({
    $or: [
        { username: username },
        { email: email }
    ]
});
    // console.log(user);
    if(!user){
        throw new ApiError(404,"User doest not exists");
    }
    const encryptedPassword = user.password;
    // checking the password
    const isPasswordVaild = await user.isPasswordCorrect(password)
    console.log(isPasswordVaild)
    
    if(!isPasswordVaild){
        throw new ApiError(401,"Invalid User Crendiatial")
    }


    // getting accesstoken and RefreshToken
    const {accessToken,refreshToken} = await genrateAccessAndRefreshToken(user._id)
    
    // getting user details
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    console.log(loggedInUser)
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
            refreshToken : ""
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


const refreshAccessToken =asyncHandler(async(req,res)=>{
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incommingRefreshToken){
        throw new ApiError(401,"unauthorized user")
    }

    const decodedToken = await jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401,"Invalid Refresh Token")
    }


    if(incommingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh Token is expired or used")
    }


    const options = {
        httpOnly : true,
        secure : true
    }

    const {accessToken,newRefreshToken} = await genrateAccessAndRefreshToken(user._id)


    return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",newRefreshToken,options)
.json(
    new ApiResponse(200,{accessToken,newRefreshToken},"Access Token Refreshed")
)

})





const  changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect =  await isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    
    await user.save({validateBeforeSave : false})

    return res.status(200).json( new ApiResponse(200,{},"Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json( new ApiResponse(200,req.user,"Current User Fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All feild are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullname,
            email
        }
    },{new : true}).select("-password -refreshToken")


    return res.status(200).json( new ApiResponse(200,user,"Account Details updated Successfully"))


})


const updateAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.files?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatra is required")
    }

    const avatar = await uploadCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(400,"Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set : {
            avatar : avatar.url
        }
    },{new : true}).select("-password -refreshToken")


    return res.status(200).json( new ApiResponse(200,user,"Avatar updated Successfully"))
})


const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.files?.path

    if(!coverImageLocalPathLocalPath){
        throw new ApiError(400,"Cover image is required")
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if(!coverImage){
        throw new ApiError(400,"Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set : {
            coverImage : coverImage.url
        }
    },{new : true}).select("-password -refreshToken")


    return res.status(200).json( new ApiResponse(200,user,"Cover image updated Successfully"))


})





export {registerUser,loginUser,logoutUser,refreshAccessToken,changePassword};