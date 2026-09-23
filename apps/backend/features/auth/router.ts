import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getProfile, login, register } from './controller.js';
import { protect } from './middleware.js';

const router = express.Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  next();
};

router.post(
  '/register',
  [
    body('name').trim().escape().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().trim().escape(),
    validate,
  ],
  register,
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login,
);

router.get('/profile', protect, getProfile);

export default router;
