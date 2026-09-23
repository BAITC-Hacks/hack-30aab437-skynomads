import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ErrorResponse } from '../../shared/index.js';
import { authRepository, User } from './repository.js';

interface RegisterInput {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
}

interface LoginInput {
  email?: string;
  password?: string;
}

const generateToken = (id: number): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new ErrorResponse('JWT secret is not configured', 500);
  }

  const expiresIn = (process.env.JWT_EXPIRE ?? '30d') as jwt.SignOptions['expiresIn'];

  return jwt.sign({ id }, jwtSecret, { expiresIn });
};

const register = async ({ name, email, role, password }: RegisterInput): Promise<string> => {
  if (!name || !email || !password) {
    throw new ErrorResponse('Please add required fields', 400);
  }

  const existingUser = authRepository.findByEmail(email);

  if (existingUser) {
    throw new ErrorResponse('The user already exists', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const lastId = authRepository.getLastId();

  const user: User = {
    id: lastId + 1,
    name,
    email,
    role: role || 'user',
    password: hashedPassword,
  };

  await authRepository.create(user);

  return generateToken(user.id);
};

const login = async ({ email, password }: LoginInput): Promise<string> => {
  if (!email || !password) {
    throw new ErrorResponse('Please add required fields', 400);
  }

  const user = authRepository.findByEmail(email);

  if (!user?.password || !(await bcrypt.compare(password, user.password))) {
    throw new ErrorResponse('Invalid credentials', 400);
  }

  return generateToken(user.id);
};

const getProfile = async (userId: string | number | undefined): Promise<User | undefined> => {
  if (!userId) {
    throw new ErrorResponse('Not authorized', 401);
  }

  return authRepository.findById(Number(userId));
};

export const authService = {
  register,
  login,
  getProfile,
};
