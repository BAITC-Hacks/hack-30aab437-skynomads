import fs from 'fs';
import { ErrorResponse } from '../../shared/index.js';
import { Media, mediaRepository } from './repository.js';

interface UploadMediaInput {
  file?: Express.Multer.File;
  type?: string;
}

const uploadMedia = async ({ file, type }: UploadMediaInput): Promise<Media> => {
  if (!file) {
    throw new ErrorResponse('Please upload a file', 400);
  }

  const media: Media = {
    id: mediaRepository.getLastId() + 1,
    path: file.filename,
    type: type || '',
  };

  await mediaRepository.create(media);

  return media;
};

const deleteMedia = async (filename: string): Promise<void> => {
  const media = mediaRepository.findByPath(filename);

  if (!media) {
    throw new ErrorResponse('Resource not found', 404);
  }

  try {
    await fs.promises.unlink(`public/uploads/media/${media.path}`);
    await mediaRepository.deleteByPath(filename);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete file';
    throw new ErrorResponse(message, 401);
  }
};

export const mediaService = {
  uploadMedia,
  deleteMedia,
};
