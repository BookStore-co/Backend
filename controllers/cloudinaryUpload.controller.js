const fs = require("fs");
const cloudinary = require("../utils/cloudinaryUtils.utils");

const cloudinaryUpload = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedFile = await cloudinary.uploader.upload(req.file.path, {
      folder: "images",
    });

    // remove temp file if exists
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      // non-fatal
      console.warn("Failed to remove temp file:", err.message);
    }

    res.json({
      message: "File uploaded successfully",
      url: uploadedFile.secure_url,
    });
  } catch (error) {
    console.error("cloudinaryUpload error:", error);
    res
      .status(500)
      .json({ error: "File upload failed", details: error.message });
  }
};

module.exports = { cloudinaryUpload };
