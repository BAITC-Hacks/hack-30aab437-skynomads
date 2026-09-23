import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/index.js';
import { blogService } from './service.js';

export const getArticles = asyncHandler(async (_req: Request, res: Response) => {
  const articles = await blogService.getArticles();
  res.status(200).json({ success: true, data: articles });
});

export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await blogService.createArticle(req.body);
  res.status(201).json({ success: true, data: article });
});

export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await blogService.updateArticle(String(req.params.id), req.body);
  res.status(200).json({ success: true, data: article });
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  await blogService.deleteArticle(String(req.params.id));
  res.status(200).json({ success: true, data: {} });
});

export const sendQuestion = asyncHandler(async (req: Request, res: Response) => {
  await blogService.sendQuestion(req.body);
  res.status(201).json({ success: true });
});
