import multer from 'multer';

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/html',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
    files: 10, // max 10 files per request
  },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (
      allowedMimeTypes.includes(file.mimetype) ||
      ['pdf', 'txt', 'md', 'html', 'htm', 'docx'].includes(ext || '')
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}. Only PDF, TXT, MD, HTML, and DOCX are allowed.`));
    }
  },
});
