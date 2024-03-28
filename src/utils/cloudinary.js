import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_API_SCERET,
});

const uploadOnCloudinary = async (localFilePath,folder) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath,{folder});
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // remove the localsaved file as the operation got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const DeleteOnCloudinary = async (publicLink) => {
  try {
    if (!publicLink) return null;
    const response = await cloudinary.uploader.destroy(publicLink);
    return response;
  } catch (error) {
    return error.message;
  }
};

export  {uploadOnCloudinary,DeleteOnCloudinary};

// cloudinary.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );
