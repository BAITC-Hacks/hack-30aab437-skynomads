import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/index.js';
import { mediaService } from './service.js';

export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  const media = await mediaService.uploadMedia({
    file: req.file,
    type: req.body.type,
  });

  res.status(201).json({ success: true, data: media });
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  await mediaService.deleteMedia(String(req.params.filename));
  res.status(200).json({ success: true, data: {} });
});
