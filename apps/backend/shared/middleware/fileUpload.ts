import { Request } from 'express';
import multer, { StorageEngine } from 'multer';

const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    cb(null, `public/uploads${req.originalUrl}`);
  },
  filename: (_req: Request, file, cb) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().substring(-9);
    const extension = file.originalname.split('.').pop();
    const filename = `doc-${year}-${month}-${day}-${timestamp}.${extension}`;

    cb(null, filename);
  },
});

export const fileUpload = multer({ storage });
