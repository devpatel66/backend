import mongoose,{ Schema } from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    username : {
		type : String,
		required : true,
		unique : true,
		lowercase : true,
		trim : true,
		index : true
	},	
	email : {
		type : String,
		required : true,
		unique : true,
		lowercase : true,
		trim : true,
	},
	fullname : {
		type : String,
		required : true,
		unique : true,
		lowercase : true,
		trim : true,
		index : true
	},
	avatar : {
		type : String, // cloudianry url where images is stored.
		required : true,
	},
	coverImage : {
		type : String,
	},
	watchHistory : [
		{
			type : Schema.Types.ObjectId,
			ref : "Video"
		}
	],
	password : {
		type : String,
		required : [true,"Password is required"],
		lowercase : true,
		trim : true,
	},
	refreshToken : {
		type:String
	}

},{timestamps:true});

userSchema.pre("save",function(next){
	if(this.isModified("password")){
		this.password = bcrypt.hash(this.password,10)
	}
})

userSchema.method.isPassword = async function(password){
	return await bcrypt.compare(password,this.password,10)
}

userSchema.methods.genrateAccessToken = function(){
	jwt.sign({
		_id:this._id,
		email:this.email,
		username:this.username,
		fullname:this.fullname
	},
	process.env.ACCESS_TOKEN_SECRET,
	{
		expiresIn:ACCESS_TOKEN_EXPIRY
	})
}
userSchema.methods.genrateRefreshToken = function(){
	jwt.sign({
		_id:this._id
	},
	process.env.REFRESH_TOKEN_SECRET,
	{
		expiresIn:REFRESH_TOKEN_EXPIRY
	})
}

export const User = mongoose.model("User",userSchema);