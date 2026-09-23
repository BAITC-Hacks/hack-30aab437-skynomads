import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/index.js';
import { authService } from './service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const token = await authService.register(req.body);
  res.status(201).json({ success: true, token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const token = await authService.login(req.body);
  res.status(200).json({ success: true, token });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.getProfile(req.user?.id);
  res.status(200).json({ success: true, data });
});
