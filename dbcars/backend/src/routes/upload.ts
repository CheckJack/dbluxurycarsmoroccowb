import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/vehicles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to sanitize and truncate filename
const sanitizeFilename = (filename: string, maxLength: number = 50): string => {
  // Remove extension
  const ext = path.extname(filename);
  let name = path.basename(filename, ext);
  
  // Remove special characters and replace spaces/special chars with hyphens
  name = name
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Truncate to max length
  if (name.length > maxLength) {
    name = name.substring(0, maxLength);
  }
  
  return name || 'image'; // Fallback to 'image' if name becomes empty
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    try {
      // Generate unique filename: sanitized-name-timestamp-random.ext
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().substring(0, 5); // Limit ext to 5 chars
      
      // Sanitize filename with a very conservative max length (30 chars)
      // uniqueSuffix is ~25 chars, ext is ~5 chars, hyphen is 1 char
      // Total: ~61 chars, well under 255 limit
      let sanitizedName = sanitizeFilename(file.originalname, 30);
      
      // Final safety: ensure total length is safe
      const filename = `${sanitizedName}-${uniqueSuffix}${ext}`;
      
      // Double-check length (should never exceed 100 chars with these limits)
      if (filename.length > 100) {
        // Emergency truncation - this should never happen but just in case
        const maxNameLength = 100 - uniqueSuffix.length - ext.length - 1;
        sanitizedName = sanitizedName.substring(0, Math.max(5, maxNameLength));
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
      } else {
        cb(null, filename);
      }
    } catch (error: any) {
      // If filename generation fails for any reason, use a simple timestamp-based name
      console.error('Error generating filename, using fallback:', error);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().substring(0, 5);
      cb(null, `img-${uniqueSuffix}${ext}`);
    }
  },
});

// File filter - only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit (increased for blog cover/hero images)
  },
  fileFilter: fileFilter,
});

// Wrapper to handle multer errors
const handleUpload = (uploadMiddleware: any) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    uploadMiddleware(req, res, (err: any) => {
      if (err) {
        console.error('Upload error:', {
          message: err.message,
          code: err.code,
          field: err.field,
          name: err.name,
          stack: err.stack
        });
        
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 20MB.' });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unexpected file field name. Please use "image" as the field name.' });
          }
          if (err.code === 'LIMIT_PART_COUNT') {
            return res.status(400).json({ error: 'Too many parts in the request.' });
          }
          return res.status(400).json({ error: err.message || 'File upload error' });
        }
        // Handle filesystem errors (like ENAMETOOLONG)
        if (err.code === 'ENAMETOOLONG' || err.message?.includes('ENAMETOOLONG') || err.message?.includes('name too long')) {
          console.error('Filename too long error:', err);
          return res.status(400).json({ error: 'Filename is too long. Please try uploading again with a shorter filename.' });
        }
        // Handle file filter errors (invalid file type)
        if (err.message?.includes('Only image files are allowed')) {
          return res.status(400).json({ error: 'Invalid file type. Only image files are allowed (jpeg, jpg, png, gif, webp).' });
        }
        // Handle other errors
        console.error('Other upload error:', err);
        return res.status(400).json({ error: err.message || 'File upload error. Please check the file and try again.' });
      }
      next();
    });
  };
};

// Upload single image (admin only)
router.post(
  '/image',
  authenticate,
  requireAdmin,
  handleUpload(upload.single('image')),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        console.error('Upload error: No file received');
        return res.status(400).json({ error: 'No file uploaded. Please select a file.' });
      }

      console.log('File uploaded successfully:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Return the URL path that can be used to access the image
      const imageUrl = `/uploads/vehicles/${req.file.filename}`;
      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage = error.message || 'Failed to upload file';
      console.error('Error details:', {
        message: errorMessage,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Upload multiple images (admin only)
router.post(
  '/images',
  authenticate,
  requireAdmin,
  handleUpload(upload.array('images', 10)), // Max 10 images
  (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map((file) => `/uploads/vehicles/${file.filename}`);

      res.json({ urls: imageUrls, count: files.length });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: error.message || 'Failed to upload files' });
    }
  }
);

export default router;

