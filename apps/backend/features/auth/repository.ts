import fs from 'fs';
import path from 'path';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  password?: string;
}

const usersFilePath = path.join(process.cwd(), 'models/user/model.json');

const readUsers = (): User[] => {
  try {
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf8')) as User[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

const persistUsers = async (): Promise<void> => {
  const users = readUsers();
  await fs.promises.writeFile(usersFilePath, JSON.stringify(users));
};

export const authRepository = {
  findByEmail: (email: string): User | undefined => readUsers().find((user) => user.email === email),
  findById: (id: number): User | undefined => readUsers().find((user) => user.id === id),
  getLastId: (): number => {
    const users = readUsers();
    return users.length === 0 ? 0 : users[users.length - 1].id;
  },
  create: async (user: User): Promise<void> => {
    const users = readUsers();
    users.push(user);
    await fs.promises.writeFile(usersFilePath, JSON.stringify(users));
  },
};
