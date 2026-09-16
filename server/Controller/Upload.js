const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_ROOT = path.join(__dirname, '..', 'public', 'uploads');

// Configure multer for file upload (kept in memory, written to disk in the controller
// so both `folder` and `fileName` form fields are available regardless of field order)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, and WEBP files are allowed.'), false);
    }
  }
});

// Upload file to local disk storage
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const folder = (req.body.folder || 'misc').replace(/[^a-zA-Z0-9_-]/g, '') || 'misc';
    const targetDir = path.join(UPLOADS_ROOT, folder);
    fs.mkdirSync(targetDir, { recursive: true });

    const { fileName } = req.body;
    const fileExtension = req.file.originalname.split('.').pop();
    const timestamp = Date.now();
    const uniqueFileName = fileName && fileName !== 'undefined'
      ? path.basename(fileName)
      : `file_${timestamp}_${uuidv4().substring(0, 8)}.${fileExtension}`;

    fs.writeFileSync(path.join(targetDir, uniqueFileName), req.file.buffer);

    // Prefer the configured public URL (needed behind a proxy/CDN in deployment);
    // fall back to the request's own host for local development.
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${folder}/${uniqueFileName}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      fileName: uniqueFileName
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
};

module.exports = {
  upload,
  uploadFile
};
