const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'chat-app/files';
    let resource_type = 'auto';

    if (file.mimetype.startsWith('image/')) {
      folder = 'chat-app/images';
      resource_type = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'chat-app/videos';
      resource_type = 'video';
    } else {
      folder = 'chat-app/documents';
      resource_type = 'raw';
    }

    return {
      folder,
      resource_type,
      allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx', 'txt', 'zip'],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimetypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/avi',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/zip',
  ];
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images, videos, and documents are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

module.exports = upload;