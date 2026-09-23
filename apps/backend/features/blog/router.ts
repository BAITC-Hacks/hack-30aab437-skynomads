import apicache from 'apicache';
import express, { Request, RequestHandler } from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../auth/middleware.js';
import {
  createArticle,
  deleteArticle,
  getArticles,
  sendQuestion,
  updateArticle,
} from './controller.js';

const router = express.Router();
const cache = apicache.middleware;

type CacheableRequest = Request & { apicacheGroup?: string };

const setBlogCacheGroup: RequestHandler = (req, _res, next) => {
  (req as CacheableRequest).apicacheGroup = 'blog';
  next();
};

const clearBlogCacheOnSuccess: RequestHandler = (_req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400) {
      apicache.clear('blog');
    }
  });

  next();
};

const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  next();
};

router.route('/').get(setBlogCacheGroup, cache('5 minutes'), getArticles);

router
  .route('/create')
  .post(
    protect,
    [
      body('question').trim().escape().notEmpty().withMessage('Question is required'),
      body('answer').trim().escape().notEmpty().withMessage('Answer is required'),
      body('received').isISO8601().withMessage('Valid start date required'),
      body('responded').isISO8601().withMessage('Valid end date required'),
      validate,
    ],
    clearBlogCacheOnSuccess,
    createArticle,
  );

router
  .route('/:id')
  .put(
    protect,
    [
      body('question').optional().trim().escape(),
      body('answer').optional().trim().escape(),
      body('received').optional().isISO8601(),
      body('responded').optional().isISO8601(),
      validate,
    ],
    clearBlogCacheOnSuccess,
    updateArticle,
  )
  .delete(protect, clearBlogCacheOnSuccess, deleteArticle);

router
  .route('/sendmail')
  .post(
    [
      body('name').trim().escape().notEmpty(),
      body('phone').trim().escape().notEmpty(),
      body('question').trim().escape().notEmpty(),
      validate,
    ],
    sendQuestion,
  );

export default router;
