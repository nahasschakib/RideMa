import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadToCloudinary(file: Blob): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "partner-docs" }, (error, result) => {
          if (error || !result) {
            console.error("Cloudinary error:", error);
            return reject(error);
          }
          resolve(result.secure_url);
        })
        .end(buffer);
    });
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}
