import fs from 'fs';
import path from 'path';

export interface Media {
  id: number;
  path: string;
  type: string;
}

const mediaFilePath = path.join(process.cwd(), 'models/media/model.json');

const readMediaItems = (): Media[] => {
  try {
    return JSON.parse(fs.readFileSync(mediaFilePath, 'utf8')) as Media[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

export const mediaRepository = {
  findByPath: (filePath: string): Media | undefined =>
    readMediaItems().find((media) => media.path === filePath),
  getLastId: (): number => {
    const mediaItems = readMediaItems();
    return mediaItems.length === 0 ? 0 : mediaItems[mediaItems.length - 1].id;
  },
  create: async (media: Media): Promise<void> => {
    const mediaItems = readMediaItems();
    mediaItems.push(media);
    await fs.promises.writeFile(mediaFilePath, JSON.stringify(mediaItems));
  },
  deleteByPath: async (filePath: string): Promise<boolean> => {
    const mediaItems = readMediaItems();
    const index = mediaItems.findIndex((media) => media.path === filePath);

    if (index === -1) {
      return false;
    }

    mediaItems.splice(index, 1);
    await fs.promises.writeFile(mediaFilePath, JSON.stringify(mediaItems));

    return true;
  },
};
