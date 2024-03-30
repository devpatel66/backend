import { v2 as cloudinary } from 'cloudinary'
import { log } from 'console';
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uplaodCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;

        //uploading file to cloudinary
        const resposne = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })

        // console.log("File Uploaded to Cloudinary successfully", resposne.url);
        fs.unlinkSync(localFilePath)

        return resposne;
    } catch (error) {
        //remove the locally saved temporary file as the uplaod operation got failed.
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export default uplaodCloudinary 
