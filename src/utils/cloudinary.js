import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        // Check if the file exists
        if (!localFilePath) return;
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // File uploaded successfully
        // Delete the file from the local storage
        fs.unlinkSync(localFilePath || "");
        // Return the url of the uploaded file
        return response.url;
    } catch (error) {
        // An error occurred while uploading the file to Cloudinary
        fs.unlinkSync(localFilePath || "");
        throw new Error(error);
    }
};

export default uploadToCloudinary;