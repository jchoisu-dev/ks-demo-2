const services = require("./r2.service");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { r2 } = require("../../config");
exports.createUploadUrl = async (req, res, next) => {
  try {
    const { fileName, contentType, employeeId } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({
        message: "fileName and contentType are required"
      });
    }
    const key = `employees/${employeeId}.jpg`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 60,
    });

    res.status(200).json({
      uploadUrl,
      key
    });
  } catch (error) {
    next(error);
  }
};