import express, { RequestHandler } from 'express';
import { body, param, validationResult } from 'express-validator';
import { fileUpload } from '../../shared/index.js';
import { protect } from '../auth/middleware.js';
import { deleteMedia, uploadMedia } from './controller.js';

const router = express.Router();

const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  next();
};

router
  .route('/')
  .post(
    protect,
    fileUpload.single('docs'),
    [body('type').optional().trim().escape(), validate],
    uploadMedia,
  );

router
  .route('/:filename')
  .delete(
    protect,
    [param('filename').notEmpty().withMessage('Filename is required').trim(), validate],
    deleteMedia,
  );

export default router;
