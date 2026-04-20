const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = req.uploadSubDir || '';
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp, svg) are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Wrapper that catches Multer errors and returns a proper JSON response
// instead of letting them fall through to the global error handler as 500
upload.handleErrors = (fieldName) => {
  return (req, res, next) => {
    const multerUpload = upload.single(fieldName);
    multerUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const messages = {
          LIMIT_FILE_SIZE: 'File is too large. Maximum size is 10MB.',
          LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
          LIMIT_FILE_COUNT: 'Too many files uploaded.',
        };
        return res.status(400).json({
          success: false,
          message: messages[err.code] || err.message,
        });
      }
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed.',
        });
      }
      next();
    });
  };
};

upload.handleFieldsErrors = (fields) => {
  return (req, res, next) => {
    const multerUpload = upload.fields(fields);
    multerUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const messages = {
          LIMIT_FILE_SIZE: 'File is too large. Maximum size is 10MB.',
          LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
          LIMIT_FILE_COUNT: 'Too many files uploaded.',
        };
        return res.status(400).json({
          success: false,
          message: messages[err.code] || err.message,
        });
      }
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed.',
        });
      }
      next();
    });
  };
};

module.exports = upload;
