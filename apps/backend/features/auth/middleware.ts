import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { ErrorResponse, asyncHandler } from '../../shared/index.js';
import { authRepository } from './repository.js';

interface JwtUserPayload extends JwtPayload {
  id: number | string;
}

const isJwtUserPayload = (payload: string | JwtPayload): payload is JwtUserPayload => {
  if (typeof payload === 'string') {
    return false;
  }

  return typeof payload.id === 'number' || typeof payload.id === 'string';
};

export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return next(new ErrorResponse('JWT secret is not configured', 500));
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, jwtSecret);

      if (!isJwtUserPayload(decoded)) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
      }

      req.user = authRepository.findById(Number(decoded.id));

      next();
    } catch {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `The user role ${req.user?.role || 'unknown'} does not have access rights to this route`,
          403,
        ),
      );
    }

    next();
  };
};
