const fs = require("fs");
const path = require("path");
const multer = require("multer");

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getRuntimeDataDir() {
  if (process.env.DEV_STORE_DATA_PATH) {
    return path.dirname(path.resolve(process.cwd(), process.env.DEV_STORE_DATA_PATH));
  }
  return path.resolve(__dirname, "..", "..", "..");
}

function getEscrowUploadDir() {
  return path.join(getRuntimeDataDir(), "uploads", "escrow-evidence");
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const dir = getEscrowUploadDir();
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename(req, file, callback) {
    const extension = path.extname(String(file.originalname || "")).toLowerCase() || ".jpg";
    const safeExtension = [".jpg", ".jpeg", ".png", ".webp"].includes(extension) ? extension : ".jpg";
    const tradeId = String(req.params?.id || "trade").replace(/[^0-9a-z_-]/gi, "");
    callback(null, `${tradeId}-${Date.now()}-${Math.random().toString(36).slice(2)}${safeExtension}`);
  },
});

const uploadEscrowEvidenceImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(String(file.mimetype || ""))) {
      const error = new Error("evidence_image_type_invalid");
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
}).single("image");

function toPublicEvidenceFile(file) {
  const filename = path.basename(file?.filename || "");
  return {
    url: `/uploads/escrow-evidence/${filename}`,
    original_name: file?.originalname || "",
    mime_type: file?.mimetype || "",
    size: Number(file?.size || 0),
  };
}

module.exports = {
  getRuntimeDataDir,
  uploadEscrowEvidenceImage,
  toPublicEvidenceFile,
};
